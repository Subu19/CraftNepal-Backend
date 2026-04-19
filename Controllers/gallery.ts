import { Request, Response, NextFunction } from "express";
import fs from "fs/promises";
import { deleteFromS3, extractKeyFromUrl, getCustomDomainUrl } from "../utils/s3";
import { Gallery } from "../utils/models/Gallery";

const SEASON_COVERS = {
  "Season-3":
    "https://img.republicworld.com/republic-prod/stories/promolarge/xhdpi/zh0dhksi2zg8cbac_1623049692.jpeg",
  "Season-4":
    "https://cdn.mos.cms.futurecdn.net/6Di69wBziu5SDtHQZvkfdg-1200-80.jpg.webp",
  "Season-5":
    "https://www.minecraft.net/content/dam/games/minecraft/key-art/Xbox_Minecraft_WildUpdate_Main_.Net_1170x500.jpg",
  CraftNepal:
    "https://scontent.fktm8-1.fna.fbcdn.net/v/t39.30808-6/305803149_181069747821977_252386477056147190_n.png?_nc_cat=106&ccb=1-7&_nc_sid=09cbfe&_nc_ohc=SIAVWQdCHYYAX-PvtlB&_nc_ht=scontent.fktm8-1.fna&oh=00_AfB1ysW3z75FxocAM2SOTrQC3NwSI5MDVmnb56ZT5dHHoQ&oe=645FB512",
};

const DEFAULT_COVER =
  "https://scontent.fktm8-1.fna.fbcdn.net/v/t39.30808-6/305803149_181069747821977_252386477056147190_n.png?_nc_cat=106&ccb=1-7&_nc_sid=09cbfe&_nc_ohc=SIAVWQdCHYYAX-PvtlB&_nc_ht=scontent.fktm8-1.fna&oh=00_AfB1ysW3z75FxocAM2SOTrQC3NwSI5MDVmnb56ZT5dHHoQ&oe=645FB512";

/**
 * Get all gallery folders organized by season
 * Fetches gallery data from MongoDB
 */
export const getGallery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gallery = await Gallery.find({});

    // If no galleries exist, create default seasons
    if (gallery.length === 0) {
      const defaultSeasons = [
        {
          season: "Season-3",
          cover: SEASON_COVERS["Season-3"],
          photos: [],
        },
        {
          season: "Season-4",
          cover: SEASON_COVERS["Season-4"],
          photos: [],
        },
        {
          season: "Season-5",
          cover: SEASON_COVERS["Season-5"],
          photos: [],
        },
        {
          season: "CraftNepal",
          cover: SEASON_COVERS["CraftNepal"],
          photos: [],
        },
      ];

      await Gallery.insertMany(defaultSeasons);
      return res.json({
        err: false,
        data: defaultSeasons,
      });
    }

    // Transform to response format with custom domain URLs
    const formattedGallery = gallery.map((g) => ({
      title: g.season,
      cover: g.cover,
      photos: g.photos.map((photo: any) => ({
        ...photo.toObject ? photo.toObject() : photo,
        url: getCustomDomainUrl(photo.key),
      })),
      s3Prefix: `gallery/${g.season}`,
    }));

    res.json({
      err: false,
      data: formattedGallery,
    });
  } catch (err) {
    console.error("Error fetching gallery:", err);
    res.status(500).json({
      err: true,
      message: "Failed to fetch gallery",
    });
  }
};

/**
 * Delete a photo from the gallery
 * Note: Expects the photo parameter to be the full S3 URL or the S3 key
 */
export const handleGalleryDelete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!(req.user as any)?.isAdmin) {
      return res.status(403).json({
        err: true,
        message: "Only admins can delete gallery photos",
      });
    }

    const { season, photo } = req.params;

    // Extract S3 key from the photo parameter
    // It could be a full URL or just the key
    let s3Key;
    if (photo.includes("/")) {
      s3Key = extractKeyFromUrl(photo) || photo;
    } else {
      s3Key = `gallery/${season}/${photo}`;
    }

    // Delete from S3
    await deleteFromS3(s3Key);

    // Delete from MongoDB
    await Gallery.updateOne(
      { season: season },
      { $pull: { photos: { key: s3Key } } }
    );

    res.json({
      err: false,
      message: "Photo deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting gallery photo:", err);
    res.status(500).json({
      err: true,
      message: "Failed to delete photo",
    });
  }
};

/**
 * Add photos to the gallery
 * Files are uploaded to S3 via multer-s3, metadata is saved to MongoDB
 */
export const handleGalleryAdd = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!(req.user as any)?.isAdmin) {
      return res.status(403).json({
        err: true,
        message: "Only admins can add gallery photos",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        err: true,
        message: "No files uploaded",
      });
    }

    const season = req.params.season || "general";

    // Extract URLs from uploaded files and transform to custom domain
    const uploadedPhotos = (req.files as any[]).map((file: any) => ({
      url: file.location, // Store original S3 URL in DB
      key: file.key,
      name: file.originalname,
      size: file.size,
      uploadedAt: new Date(),
    }));

    // Save to MongoDB
    const gallery = await Gallery.findOneAndUpdate(
      { season: season },
      {
        $push: { photos: { $each: uploadedPhotos } },
        $set: { updatedAt: new Date() },
      },
      { upsert: true, new: true }
    );

    // Transform URLs for response
    const responsePhotos = uploadedPhotos.map((photo: any) => ({
      ...photo,
      url: getCustomDomainUrl(photo.key),
    }));

    res.json({
      err: false,
      message: `Successfully uploaded ${uploadedPhotos.length} photo(s) to S3 and saved to database`,
      data: responsePhotos,
    });
  } catch (err) {
    console.error("Error adding gallery photos:", err);
    res.status(500).json({
      err: true,
      message: "Failed to add gallery photos",
    });
  }
};
