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
    const gallery = await Gallery.find({ deletedAt: null }).sort({ createdAt: -1 });

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
 * Create a new gallery season
 */
export const handleCreateSeason = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!(req.user as any)?.isAdmin) {
      return res.status(403).json({
        err: true,
        message: "Only admins can create gallery seasons",
      });
    }

    const { season } = req.body;
    if (!season) {
      return res.status(400).json({
        err: true,
        message: "Season name is required",
      });
    }

    // Check if season already exists
    const existingSeason = await Gallery.findOne({ season });
    if (existingSeason) {
      return res.status(400).json({
        err: true,
        message: "Season already exists",
      });
    }

    let coverUrl = DEFAULT_COVER;
    if (req.file) {
      coverUrl = getCustomDomainUrl((req.file as any).key) || DEFAULT_COVER;
    }

    const newSeason = new Gallery({
      season,
      cover: coverUrl,
      photos: [],
    });

    await newSeason.save();

    res.json({
      err: false,
      message: "Season created successfully",
      data: {
        title: newSeason.season,
        cover: newSeason.cover,
        photos: [],
      },
    });
  } catch (err) {
    console.error("Error creating season:", err);
    res.status(500).json({
      err: true,
      message: "Failed to create season",
    });
  }
};

/**
 * Delete a gallery season and all its photos
 */
export const handleDeleteSeason = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!(req.user as any)?.isAdmin) {
      return res.status(403).json({
        err: true,
        message: "Only admins can delete gallery seasons",
      });
    }

    const { season } = req.params;

    const gallery = await Gallery.findOne({ season });
    if (!gallery) {
      return res.status(404).json({
        err: true,
        message: "Season not found",
      });
    }

    // Soft delete: just set deletedAt
    gallery.deletedAt = new Date();
    await gallery.save();

    res.json({
      err: false,
      message: "Season deleted successfully (moved to archive)",
    });
  } catch (err) {
    console.error("Error deleting season:", err);
    res.status(500).json({
      err: true,
      message: "Failed to delete season",
    });
  }
};

/**
 * Update a gallery season
 */
export const handleUpdateSeason = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!(req.user as any)?.isAdmin) {
      return res.status(403).json({
        err: true,
        message: "Only admins can update gallery seasons",
      });
    }

    const { season: oldSeasonName } = req.params;
    const { season: newSeasonName } = req.body;

    const gallery = await Gallery.findOne({ season: oldSeasonName });
    if (!gallery) {
      return res.status(404).json({
        err: true,
        message: "Season not found",
      });
    }

    const updates: any = { updatedAt: new Date() };

    // Update season name if provided and different
    if (newSeasonName && newSeasonName !== oldSeasonName) {
      // Check if new name already exists
      const existing = await Gallery.findOne({ season: newSeasonName });
      if (existing) {
        return res.status(400).json({
          err: true,
          message: "A season with this name already exists",
        });
      }
      updates.season = newSeasonName;
    }

    // Update cover photo if provided
    if (req.file) {
      // Delete old cover from S3 if it's not the default one
      if (gallery.cover && gallery.cover !== DEFAULT_COVER) {
        const oldCoverKey = extractKeyFromUrl(gallery.cover);
        if (oldCoverKey) {
          try {
            await deleteFromS3(oldCoverKey);
          } catch (err) {
            console.error(`Failed to delete old cover ${oldCoverKey} from S3:`, err);
          }
        }
      }
      updates.cover = getCustomDomainUrl((req.file as any).key);
    }

    const updatedGallery = await Gallery.findOneAndUpdate(
      { season: oldSeasonName },
      { $set: updates },
      { new: true }
    );

    res.json({
      err: false,
      message: "Season updated successfully",
      data: {
        title: updatedGallery?.season,
        cover: updatedGallery?.cover,
      },
    });
  } catch (err) {
    console.error("Error updating season:", err);
    res.status(500).json({
      err: true,
      message: "Failed to update season",
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

    if (!req.files || (req.files as any[]).length === 0) {
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
