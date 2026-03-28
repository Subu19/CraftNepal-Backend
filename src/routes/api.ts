import { Router, Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';

import {
    getDamageLeaderboard,
    getDeathsLeaderboard,
    getHungryLeaderboard,
    getMobkillLeaderboard,
    getPlayerKillsLeaderboard,
    getPlaytimeLeaderboard,
    getSleepingLeaderboard,
    getTop15,
    getTradingLeaderboard,
    getBalanceLeaderboard
} from '../Controllers/leaderboard';

import {
    submitPort,
    getFeed,
    handlePostLike,
    handlePostUnLike,
    getPost,
    handlePostComment,
    handleGetComments,
    handlePostDelete,
} from '../Controllers/post';

import { getStatz } from '../Controllers/statz';
import { verify } from './auth';
import { getGallery, handleGalleryDelete, handleGalleryAdd } from '../Controllers/gallery';
import { handleGetGuide, handleGetGuideList, handleGuidePost, handleGuideFetch } from '../Controllers/guide';

const router = Router();

// Multer Config
const sanitizeFilename = (name: string) => name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = "public/uploads";
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        cb(null, `${Date.now()}-${sanitizeFilename(file.originalname)}`);
    },
});

const galleryStorage = multer.diskStorage({
    destination: (req, _file, cb) => {
        const season = req.params.season?.replace(/[^a-z0-9]/gi, '') || 'misc';
        const dir = `public/Gallery/${season}`;
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        cb(null, `${Date.now()}-${sanitizeFilename(file.originalname)}`);
    },
});

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit
const uploadGallery = multer({ storage: galleryStorage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// Statz Routes
router.get("/statz/:username", getStatz);
router.get("/leaderboard/playtime", getPlaytimeLeaderboard);
router.get("/leaderboard/mobkills", getMobkillLeaderboard);
router.get("/leaderboard/playerkills", getPlayerKillsLeaderboard);
router.get("/leaderboard/deaths", getDeathsLeaderboard);
router.get("/leaderboard/slept", getSleepingLeaderboard);
router.get("/leaderboard/hungry", getHungryLeaderboard);
router.get("/leaderboard/damage", getDamageLeaderboard);
router.get("/leaderboard/trades", getTradingLeaderboard);
router.get("/leaderboard/top", getTop15);
router.get("/leaderboard/balance", getBalanceLeaderboard);

// Post Routes
router.post("/post", verify, upload.single("image"), submitPort);
router.get("/post/:id", verify, getPost); // Removed upload middleware
router.post("/post/like", verify, handlePostLike);
router.post("/post/unlike", verify, handlePostUnLike);
router.post("/post/comment", verify, handlePostComment);
router.get("/post/comments/:id", verify, handleGetComments);
router.post("/post/delete/:id", verify, handlePostDelete);

// Guide Routes
router.get("/guide/:name", handleGetGuide);
router.get("/guide", handleGetGuideList);
router.post("/guide/:name", verify, upload.single("image"), handleGuidePost);
router.get("/guides", handleGuideFetch);

// Gallery Routes
router.get("/feed/:limit", getFeed);
router.get("/gallery", getGallery);
router.post("/delete/gallery/:season/:photo", verify, handleGalleryDelete);
router.post("/add/gallery/:season", verify, uploadGallery.array("photos"), handleGalleryAdd);

export default router;
