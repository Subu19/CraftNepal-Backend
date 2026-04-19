import express from "express";
import {
    submitPort,
    getFeed,
    handlePostLike,
    handlePostUnLike,
    getPost,
    handlePostComment,
    handleGetComments,
    handlePostDelete,
} from "../Controllers/post";
import { verify } from "./auth";
import { getGallery, handleGalleryDelete, handleGalleryAdd } from "../Controllers/gallery";
import { handleGetGuide, handleGetGuideList, handleGuidePost, handleGuideFetch } from "../Controllers/guide";
import {
    getSupporters,
    getSupportersByTier,
    getSupporter,
    addSupporter,
    updateSupporter,
    removeSupporter,
    bulkImportSupporters,
} from "../Controllers/supporter";
import { uploadPostToS3, uploadGalleryToS3, uploadGuideToS3 } from "../utils/s3";

// S3 uploaders
const upload = uploadPostToS3;
const uploadGallery = uploadGalleryToS3;
const uploadGuide = uploadGuideToS3;

export const apiRouter = express.Router();

apiRouter.post("/post", verify, upload.single("image"), submitPort);
apiRouter.get("/post/:id", verify, upload.single("image"), getPost);

apiRouter.post("/post/like", verify, handlePostLike);
apiRouter.post("/post/unlike", verify, handlePostUnLike);
apiRouter.post("/post/comment", verify, handlePostComment);
apiRouter.get("/post/comments/:id", verify, handleGetComments);
apiRouter.post("/post/delete/:id", verify, handlePostDelete);

apiRouter.get("/guide/:name", handleGetGuide);
apiRouter.get("/guide", handleGetGuideList);
apiRouter.post("/guide/:name", verify, uploadGuide.single("image"), handleGuidePost);
apiRouter.get("/guides", handleGuideFetch);
apiRouter.get("/feed/:limit", getFeed);
apiRouter.get("/gallery", getGallery);
apiRouter.post("/delete/gallery/:season/:photo", verify, handleGalleryDelete);

apiRouter.post("/add/gallery/:season", verify, uploadGallery.array("photos"), handleGalleryAdd);

// Supporter routes
apiRouter.get("/supporters", getSupporters);
apiRouter.get("/supporters/tier/:tier", getSupportersByTier);
apiRouter.get("/supporters/:name", getSupporter);
apiRouter.post("/supporters", verify, addSupporter);
apiRouter.put("/supporters/:name", verify, updateSupporter);
apiRouter.delete("/supporters/:name", verify, removeSupporter);
apiRouter.post("/supporters/bulk/import", verify, bulkImportSupporters);

export default apiRouter;
