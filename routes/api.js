const fs = require("fs/promises");
const { getDamageLeaderboard } = require("../Controllers/leaderboard/damage");
const { getDeathsLeaderboard } = require("../Controllers/leaderboard/deaths");
const { getHungryLeaderboard } = require("../Controllers/leaderboard/eaten");
const { getMobkillLeaderboard } = require("../Controllers/leaderboard/mobkills");
const { getPlayerKillsLeaderboard } = require("../Controllers/leaderboard/playerkills");
const { getPlaytimeLeaderboard } = require("../Controllers/leaderboard/playtime");
const { getSleepingLeaderboard } = require("../Controllers/leaderboard/slept");
const { getTop10 } = require("../Controllers/leaderboard/top");
const { getTradingLeaderboard } = require("../Controllers/leaderboard/trades");
const {
    submitPort,
    getFeed,
    handlePostLike,
    handlePostUnLike,
    getPost,
    handlePostComment,
    handleGetComments,
    handlePostDelete,
} = require("../Controllers/post");
const { getStatz } = require("../Controllers/statz");

const { verify } = require("./auth");

const multer = require("multer");
const path = require("path");
const { getGallery, handleGalleryDelete, handleGalleryAdd } = require("../Controllers/gallery");
const { handleGetGuide, handleGetGuideList, handleGuidePost, handleGuideFetch } = require("../Controllers/guide");
const { getBalanceLeaderboard } = require("../Controllers/leaderboard/balance");
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads");
    },
    filename: (req, file, cb) => {
        cb(null, "" + Date.now().toString() + file.originalname.toString());
    },
});
var galleryStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/Gallery/" + req.params.season);
    },
    filename: (req, file, cb) => {
        cb(null, "" + Date.now().toString() + file.originalname.toString());
    },
});
const upload = multer({ storage: storage });
const uploadGallery = multer({ storage: galleryStorage });

const router = require("express").Router();

router.get("/statz/:username", getStatz);
router.get("/leaderboard/playtime", getPlaytimeLeaderboard);
router.get("/leaderboard/mobkills", getMobkillLeaderboard);
router.get("/leaderboard/playerkills", getPlayerKillsLeaderboard);
router.get("/leaderboard/deaths", getDeathsLeaderboard);
router.get("/leaderboard/slept", getSleepingLeaderboard);
router.get("/leaderboard/hungry", getHungryLeaderboard);
router.get("/leaderboard/damage", getDamageLeaderboard);
router.get("/leaderboard/trades", getTradingLeaderboard);
router.get("/leaderboard/top", getTop10);
router.get("/leaderboard/balance", getBalanceLeaderboard);

router.post("/post", verify, upload.single("image"), submitPort);
router.get("/post/:id", verify, upload.single("image"), getPost);

router.post("/post/like", verify, handlePostLike);
router.post("/post/unlike", verify, handlePostUnLike);
router.post("/post/comment", verify, handlePostComment);
router.get("/post/comments/:id", verify, handleGetComments);
router.post("/post/delete/:id", verify, handlePostDelete);

router.get("/guide/:name", handleGetGuide);
router.get("/guide", handleGetGuideList);
router.post("/guide/:name", verify, upload.single("image"), handleGuidePost);
router.get("/guides", handleGuideFetch);
router.get("/feed/:limit", getFeed);
router.get("/gallery", getGallery);
router.post("/delete/gallery/:season/:photo", verify, handleGalleryDelete);

router.post("/add/gallery/:season", verify, uploadGallery.array("photos"), handleGalleryAdd);

module.exports = router;
