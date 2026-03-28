import { Request, Response } from 'express';
import Post from '../utils/models/Post';
import Comment from '../utils/models/Comment';
import { IUser } from '../utils/models/User';

export const submitPort = async (req: Request, res: Response) => {
    try {
        const user = req.user as IUser;
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const newPost = new Post({
            id: Date.now(),
            caption: req.body.caption,
            postImage: req.file ? req.file.filename : undefined,
            author: {
                profilePic: user.avatar || "",
                username: user.username,
                id: user.discordId,
            }
        });

        await newPost.save();
        res.status(201).json({ message: "Uploaded successfully" });
    } catch (err) {
        res.status(500).json({ error: "Upload failed" });
    }
};

export const getFeed = async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.params.limit) || 10;
        const results = await Post.find({}).sort({ _id: -1 }).limit(limit);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch feed" });
    }
};

export const getPost = async (req: Request, res: Response) => {
    try {
        if (!req.params.id) return res.status(400).json({ error: "Missing Post ID" });
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: "Post not found" });
        res.json(post);
    } catch (e) {
        res.status(500).json({ error: "Error fetching post" });
    }
};

export const handlePostLike = async (req: Request, res: Response) => {
    try {
        if (!req.body.postId) return res.status(400).json({ error: "Missing Post ID" });

        const post = await Post.findById(req.body.postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        const user = req.user as IUser;
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        if (post.likes.find((u) => u.userId == user.discordId)) {
            return res.status(409).json({ error: "Already liked" });
        }

        post.likes.push({
            username: user.username,
            userId: user.discordId,
            profilePic: user.avatar || "",
        });
        await post.save();
        res.json({ message: "Liked" });
    } catch (err) {
        res.status(500).json({ error: "Like failed" });
    }
};

export const handlePostUnLike = async (req: Request, res: Response) => {
    try {
        if (!req.body.postId) return res.status(400).json({ error: "Missing Post ID" });

        const post = await Post.findById(req.body.postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        const user = req.user as IUser;
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const index = post.likes.findIndex((u) => u.userId == user.discordId);
        if (index === -1) return res.status(400).json({ error: "Not liked yet" });

        post.likes.splice(index, 1);
        await post.save();
        res.json({ message: "Unliked" });
    } catch (err) {
        res.status(500).json({ error: "Unlike failed" });
    }
};

export const handlePostComment = async (req: Request, res: Response) => {
    try {
        if (!req.body.comment || !req.body.postId) return res.status(400).json({ error: "Missing data" });

        const post = await Post.findById(req.body.postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        const user = req.user as IUser;
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const newComment = new Comment({
            username: user.username,
            profilePic: user.avatar || "",
            comment: req.body.comment,
            discordId: user.discordId,
            id: Date.now(),
            isReply: false
        });
        await newComment.save();

        // Mongoose push with strict typing might need casting or proper model definition
        (post.comments as any).push(newComment._id);
        await post.save();

        res.json({ message: "Commented successfully" });
    } catch (e) {
        res.status(500).json({ error: "Comment failed" });
    }
};

export const handleGetComments = async (req: Request, res: Response) => {
    try {
        if (!req.params.id) return res.status(400).json({ error: "Missing ID" });
        const post = await Post.findOne({ _id: req.params.id }).populate({ path: "comments" });
        if (!post) return res.status(404).json({ error: "Post not found" });
        res.json(post);
    } catch (e) {
        res.status(500).json({ error: "Fetch Error" });
    }
};

export const handlePostDelete = async (req: Request, res: Response) => {
    try {
        if (!req.params.id) return res.status(400).json({ error: "Missing ID" });

        const post = await Post.findOne({ _id: req.params.id });
        if (!post) return res.status(404).json({ error: "Post not found" });

        const user = req.user as IUser;
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        if (post.author.id == user.discordId || user.isAdmin) {
            await Post.deleteOne({ _id: req.params.id });
            res.json({ message: "Deleted successfully" });
        } else {
            res.status(403).json({ error: "Forbidden" });
        }
    } catch (err) {
        res.status(500).json({ error: "Delete failed" });
    }
};
