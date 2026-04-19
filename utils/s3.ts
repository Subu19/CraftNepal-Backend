import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import { Request } from "express";

// Create S3 client with R2 endpoint
export const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
  region: process.env.AWS_S3_REGION || "auto",
  endpoint: process.env.AWS_S3_ENDPOINT || `https://${process.env.AWS_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
});

const bucketName = process.env.AWS_S3_BUCKET_NAME as string;
const assetsDomain = process.env.AWS_ASSETS_DOMAIN || "assets.example.com";

export function generateS3Key(folder: string, file: Express.Multer.File) {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = file.originalname.split(".").pop();
  return `${folder}/${timestamp}-${randomStr}.${extension}`;
}

export const uploadPostToS3 = multer({
  storage: multerS3({
    s3: s3 as any,
    bucket: bucketName,
    acl: "public-read",
    key: (req: Request, file: Express.Multer.File, cb: any) => {
      const key = generateS3Key("posts", file);
      cb(null, key);
    },
    contentType: (req: Request, file: Express.Multer.File, cb: any) => {
      cb(null, file.mimetype);
    },
  }),
  fileFilter: (req: Request, file: Express.Multer.File, cb: any) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export const uploadGalleryToS3 = multer({
  storage: multerS3({
    s3: s3 as any,
    bucket: bucketName,
    acl: "public-read",
    key: (req: Request, file: Express.Multer.File, cb: any) => {
      const season = req.params.season || "general";
      const key = generateS3Key(`gallery/${season}`, file);
      cb(null, key);
    },
    contentType: (req: Request, file: Express.Multer.File, cb: any) => {
      cb(null, file.mimetype);
    },
  }),
  fileFilter: (req: Request, file: Express.Multer.File, cb: any) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

export const uploadGuideToS3 = multer({
  storage: multerS3({
    s3: s3 as any,
    bucket: bucketName,
    acl: "public-read",
    key: (req: Request, file: Express.Multer.File, cb: any) => {
      const key = generateS3Key("guides", file);
      cb(null, key);
    },
    contentType: (req: Request, file: Express.Multer.File, cb: any) => {
      cb(null, file.mimetype);
    },
  }),
  fileFilter: (req: Request, file: Express.Multer.File, cb: any) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export async function deleteFromS3(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  return s3.send(command);
}

export function extractKeyFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  let urlParts = url.split(".r2.cloudflarestorage.com/");
  if (urlParts.length === 2) {
    return urlParts[1];
  }
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.substring(1);
    if (pathname) {
      return pathname;
    }
  } catch (e) {}
  
  urlParts = url.split(".amazonaws.com/");
  if (urlParts.length === 2) {
    return urlParts[1];
  }
  
  return null;
}

export function getFileUrl(file: Express.Multer.File & { key?: string }) {
  if (!file) return null;
  return getCustomDomainUrl(file.key as string);
}

export function getCustomDomainUrl(key: string) {
  if (!key) return null;
  return `https://${assetsDomain}/${key}`;
}
