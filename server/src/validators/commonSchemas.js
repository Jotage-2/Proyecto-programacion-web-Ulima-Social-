/**
 * Define validaciones reutilizables para perfiles, posts, mensajes y grupos.
 */

import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  lastName: z.string().trim().min(2).max(60).optional(),
  career: z.string().trim().min(2).max(100).optional(),
  cycle: z.coerce
    .string()
    .regex(/^(?:[1-9]|1[0-2])$/)
    .optional(),
  bio: z.string().trim().max(500).optional(),
  profilePicture: z.string().url().or(z.literal("")).optional(),
});

export const postSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  visibility: z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]).default("PUBLIC"),
});

export const commentSchema = z.object({
  content: z.string().trim().min(1).max(1000),
});

export const groupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional(),
  career: z.string().trim().max(100).optional(),
  emoji: z.string().max(10).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
});

export const conversationSchema = z.object({
  memberIds: z.array(z.string()).min(1),
  type: z.enum(["DIRECT", "GROUP"]).default("DIRECT"),
  name: z.string().trim().max(100).optional(),
});

export const messageSchema = z.object({
  content: z.string().trim().min(1).max(5000),
});
