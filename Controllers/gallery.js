const fs = require("fs/promises");
const { deleteFromS3, extractKeyFromUrl } = require("../utils/s3");

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
 * Note: This now requires manually configured seasons since S3 listing would be less efficient
 * You may want to create a MongoDB model to track gallery seasons
 */
exports.getGallery = async (req, res, next) => {
  try {
    // For S3, we should store gallery metadata in MongoDB
    // This is a simple response structure - you'll want to implement MongoDB storage
    const gallery = [
      {
        title: "Season-3",
        cover: SEASON_COVERS["Season-3"],
        photos: [],
        s3Prefix: "gallery/Season-3",
      },
      {
        title: "Season-4",
        cover: SEASON_COVERS["Season-4"],
        photos: [],
        s3Prefix: "gallery/Season-4",
      },
      {
        title: "Season-5",
        cover: SEASON_COVERS["Season-5"],
        photos: [],
        s3Prefix: "gallery/Season-5",
      },
      {
        title: "CraftNepal",
        cover: SEASON_COVERS["CraftNepal"],
        photos: [],
        s3Prefix: "gallery/CraftNepal",
      },
    ];

    res.json({
      err: false,
      data: gallery,
      note: "Photo URLs are generated on upload and stored in S3. Use the s3Prefix to construct S3 URLs.",
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
exports.handleGalleryDelete = async (req, res, next) => {
  try {
    if (!req.user?.isAdmin) {
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

    await deleteFromS3(s3Key);

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
 * Files are uploaded to S3 via multer-s3
 */
exports.handleGalleryAdd = async (req, res, next) => {
  try {
    if (!req.user?.isAdmin) {
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

    // Extract URLs from uploaded files
    const uploadedPhotos = req.files.map((file) => ({
      url: file.location,
      key: file.key,
      name: file.originalname,
      size: file.size,
      uploadedAt: new Date(),
    }));

    res.json({
      err: false,
      message: `Successfully uploaded ${uploadedPhotos.length} photo(s) to S3`,
      data: uploadedPhotos,
    });
  } catch (err) {
    console.error("Error adding gallery photos:", err);
    res.status(500).json({
      err: true,
      message: "Failed to add gallery photos",
    });
  }
};
