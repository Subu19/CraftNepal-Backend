import { Request, Response, NextFunction } from "express";
import { Comment } from "../utils/models/Comments";
import { Post } from "../utils/models/Post";
import { deleteFromS3, extractKeyFromUrl, getCustomDomainUrl } from "../utils/s3";

export const submitPort = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        err: true,
        message: "Image file is required",
      });
    }

    const newPost = new Post();
    newPost.id = Date.now();
    newPost.caption = req.body.caption;
    // Store S3 URL and key from multer-s3
    newPost.postImage = (req.file as any).location;
    newPost.postImageKey = (req.file as any).key;
    newPost.author = {
      profilePic: (req.user as any).avatar,
      username: (req.user as any).username,
      id: (req.user as any).discordId,
    };

    await newPost.save();

    // Transform URL for response
    const postData = newPost.toObject();
    postData.postImage = getCustomDomainUrl(postData.postImageKey as string) as string;

    res.status(201).json({
      err: false,
      message: "Post uploaded successfully",
      data: postData,
    });
  } catch (err) {
    console.error("Error during posting:", err);
    res.status(500).json({
      err: true,
      message: "Failed to upload post",
    });
  }
};

export const getFeed = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.params.limit) || 20;
    const results = await Post.find({})
      .sort({ _id: -1 })
      .limit(limit)
      .populate("comments");

    // Transform URLs for response
    const transformedResults = results.map((post) => {
      const postData = post.toObject();
      postData.postImage = getCustomDomainUrl(postData.postImageKey as string) as string;
      return postData;
    });

    res.json({
      err: false,
      data: transformedResults,
    });
  } catch (err) {
    console.error("Error fetching feed:", err);
    res.status(500).json({
      err: true,
      message: "Failed to fetch feed",
    });
  }
};

export const getPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        err: true,
        message: "Post ID is required",
      });
    }

    const post = await Post.findById(req.params.id).populate("comments");

    if (!post) {
      return res.status(404).json({
        err: true,
        message: "Post not found",
      });
    }

    // Transform URL for response
    const postData = post.toObject();
    postData.postImage = getCustomDomainUrl(postData.postImageKey as string) as string;

    res.json({
      err: false,
      data: postData,
    });
  } catch (err) {
    console.error("Error fetching post:", err);
    res.status(500).json({
      err: true,
      message: "Failed to fetch post",
    });
  }
};

export const handlePostLike = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body.postId) {
      return res.status(400).json({
        err: true,
        message: "Post ID is required",
      });
    }

    const post = await Post.findById(req.body.postId);

    if (!post) {
      return res.status(404).json({
        err: true,
        message: "Post not found",
      });
    }

    const userAlreadyLiked = post.likes!.find(
      (user: any) => user.userId == (req.user as any).discordId
    );

    if (userAlreadyLiked) {
      return res.status(409).json({
        err: true,
        message: "User already liked this post",
      });
    }

    await (post as any).likes.push({
      username: (req.user as any).username,
      userId: (req.user as any).discordId,
      profilePic: (req.user as any).avatar,
    });

    await post.save();

    // Transform URL for response
    const postData = post.toObject();
    postData.postImage = getCustomDomainUrl(postData.postImageKey as string) as string;

    res.json({
      err: false,
      message: "Post liked successfully",
      data: postData,
    });
  } catch (err) {
    console.error("Error liking post:", err);
    res.status(500).json({
      err: true,
      message: "Failed to like post",
    });
  }
};

export const handlePostUnLike = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body.postId) {
      return res.status(400).json({
        err: true,
        message: "Post ID is required",
      });
    }

    const post = await Post.findById(req.body.postId);

    if (!post) {
      return res.status(404).json({
        err: true,
        message: "Post not found",
      });
    }

    const userHasLiked = post.likes!.find(
      (user: any) => user.userId == (req.user as any).discordId
    );

    if (!userHasLiked) {
      return res.status(409).json({
        err: true,
        message: "User hasn't liked this post",
      });
    }

    (post as any).likes = post.likes!.filter((user: any) => user.userId !== (req.user as any).discordId);

    await post.save();

    // Transform URL for response
    const postData = post.toObject();
    postData.postImage = getCustomDomainUrl(postData.postImageKey as string) as string;

    res.json({
      err: false,
      message: "Post unliked successfully",
      data: postData,
    });
  } catch (err) {
    console.error("Error unliking post:", err);
    res.status(500).json({
      err: true,
      message: "Failed to unlike post",
    });
  }
};

export const handlePostComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body.comment || !req.body.postId) {
      return res.status(400).json({
        err: true,
        message: "Comment text and post ID are required",
      });
    }

    const post = await Post.findById(req.body.postId);

    if (!post) {
      return res.status(404).json({
        err: true,
        message: "Post not found",
      });
    }

    const newComment = new Comment();
    newComment.username = (req.user as any).username;
    newComment.profilePic = (req.user as any).avatar;
    newComment.comment = req.body.comment;
    newComment.discordId = (req.user as any).discordId;
    newComment.id = Date.now();
    newComment.isReply = false;

    await newComment.save();
    await (post as any).comments.push(newComment._id);
    await post.save();

    res.status(201).json({
      err: false,
      message: "Comment added successfully",
      data: newComment,
    });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({
      err: true,
      message: "Failed to add comment",
    });
  }
};

export const handleGetComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        err: true,
        message: "Post ID is required",
      });
    }

    const post = await Post.findById(req.params.id).populate("comments");

    if (!post) {
      return res.status(404).json({
        err: true,
        message: "Post not found",
      });
    }

    res.json({
      err: false,
      data: post.comments,
    });
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({
      err: true,
      message: "Failed to fetch comments",
    });
  }
};

export const handlePostDelete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        err: true,
        message: "Post ID is required",
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        err: true,
        message: "Post not found",
      });
    }

    // Check if user is author or admin
    if (post.author.id !== (req.user as any).discordId && !(req.user as any).isAdmin) {
      return res.status(403).json({
        err: true,
        message: "You don't have permission to delete this post",
      });
    }

    // Delete image from S3 if it exists
    if (post.postImage) {
      try {
        const s3Key = extractKeyFromUrl(post.postImage) || post.postImage;
        await deleteFromS3(s3Key);
      } catch (error) {
        console.warn("Warning: Failed to delete post image from S3:", error);
        // Continue anyway, don't fail the deletion
      }
    }

    await Post.deleteOne({ _id: req.params.id });

    res.json({
      err: false,
      message: "Post deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({
      err: true,
      message: "Failed to delete post",
    });
  }
};
