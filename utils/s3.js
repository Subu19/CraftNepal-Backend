const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");

// Configure AWS SDK for Cloudflare R2
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_S3_REGION || "auto",
});

// Create S3 client with R2 endpoint
const s3 = new AWS.S3({
  endpoint: process.env.AWS_S3_ENDPOINT || `https://${process.env.AWS_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  s3ForcePathStyle: true,
  signatureVersion: "v4",
});

const bucketName = process.env.AWS_S3_BUCKET_NAME;
const assetsDomain = process.env.AWS_ASSETS_DOMAIN || "assets.example.com";

/**
 * Generate a safe S3 key for file uploads
 * @param {string} folder - The folder/prefix in S3 bucket
 * @param {object} file - The multer file object
 * @returns {string} - The S3 key
 */
function generateS3Key(folder, file) {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = file.originalname.split(".").pop();
  return `${folder}/${timestamp}-${randomStr}.${extension}`;
}

/**
 * Create multer S3 uploader for posts
 */
const uploadPostToS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: bucketName,
    acl: "public-read",
    key: (req, file, cb) => {
      const key = generateS3Key("posts", file);
      cb(null, key);
    },
    contentType: (req, file, cb) => {
      cb(null, file.mimetype);
    },
  }),
  fileFilter: (req, file, cb) => {
    // Validate file type - only images
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/jpg",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * Create multer S3 uploader for gallery
 */
const uploadGalleryToS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: bucketName,
    acl: "public-read",
    key: (req, file, cb) => {
      const season = req.params.season || "general";
      const key = generateS3Key(`gallery/${season}`, file);
      cb(null, key);
    },
    contentType: (req, file, cb) => {
      cb(null, file.mimetype);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/jpg",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit for gallery
  },
});

/**
 * Create multer S3 uploader for guides
 */
const uploadGuideToS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: bucketName,
    acl: "public-read",
    key: (req, file, cb) => {
      const key = generateS3Key("guides", file);
      cb(null, key);
    },
    contentType: (req, file, cb) => {
      cb(null, file.mimetype);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/jpg",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * Delete a file from S3 by key
 * @param {string} key - The S3 key of the file to delete
 * @returns {Promise}
 */
async function deleteFromS3(key) {
  return new Promise((resolve, reject) => {
    s3.deleteObject(
      {
        Bucket: bucketName,
        Key: key,
      },
      (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      }
    );
  });
}

/**
 * Extract S3 key from full S3 URL (supports both AWS and Cloudflare R2)
 * @param {string} url - Full S3 URL
 * @returns {string} - S3 key
 */
function extractKeyFromUrl(url) {
  if (!url) return null;
  
  // Try to extract from Cloudflare R2 URL format: https://accountid.r2.cloudflarestorage.com/key
  let urlParts = url.split(".r2.cloudflarestorage.com/");
  if (urlParts.length === 2) {
    return urlParts[1];
  }
  
  // Try to extract from custom domain URL format: https://domain/key
  // This handles our custom domain: website.assets.craftnepal.net/key
  const urlObj = new URL(url);
  const pathname = urlObj.pathname.substring(1); // Remove leading slash
  if (pathname) {
    return pathname;
  }
  
  // Fallback: try AWS S3 format
  urlParts = url.split(".amazonaws.com/");
  if (urlParts.length === 2) {
    return urlParts[1];
  }
  
  return null;
}

/**
 * Get S3 URL from file object (multer-s3 provides location property)
 * @param {object} file - Multer file object
 * @returns {string} - Custom domain URL
 */
function getFileUrl(file) {
  if (!file) return null;
  // multer-s3 provides key property with the S3 key
  return getCustomDomainUrl(file.key);
}

/**
 * Transform S3 key to custom domain URL
 * @param {string} key - S3 key (e.g., "gallery/Season-3/1776362295616-r5550b.png")
 * @returns {string} - Custom domain URL
 */
function getCustomDomainUrl(key) {
  if (!key) return null;
  return `https://${assetsDomain}/${key}`;
}

module.exports = {
  s3,
  uploadPostToS3,
  uploadGalleryToS3,
  uploadGuideToS3,
  deleteFromS3,
  extractKeyFromUrl,
  getFileUrl,
  getCustomDomainUrl,
  generateS3Key,
};
