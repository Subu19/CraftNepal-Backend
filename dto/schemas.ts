import { z } from "zod";

export const CreatePostDTO = z.object({
  caption: z.string().min(1, "Caption is required"),
});

export const PostIdDTO = z.object({
  postId: z.string().min(1, "Post ID is required"),
});

export const CommentDTO = z.object({
  postId: z.string().min(1, "Post ID is required"),
  comment: z.string().min(1, "Comment is required"),
});

export const SupporterDTO = z.object({
  name: z.string().min(1, "Name is required"),
  tier: z.enum(["bronze", "silver", "gold", "diamond"]).optional().default("bronze"),
  discordId: z.string().optional(),
  description: z.string().optional(),
  profileUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});
