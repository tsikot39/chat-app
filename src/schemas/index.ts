import { z } from "zod";

// User schemas
export const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  image: z.string().url().optional(),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z.string().url().optional(),
});

// Message schemas
export const messageSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1).max(1000),
  messageType: z.enum(["text", "image", "file"]).default("text"),
});

export const messageUpdateSchema = z.object({
  content: z.string().min(1).max(1000).optional(),
  isRead: z.boolean().optional(),
});

// Conversation schemas
export const conversationSchema = z.object({
  participants: z.array(z.string()).min(1).max(1), // Client sends 1 participant, server adds current user
});

// Search schemas
export const userSearchSchema = z.object({
  query: z.string().min(1).max(100),
  limit: z.number().min(1).max(50).default(10),
});

// Pagination schemas
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
  cursor: z.string().optional().nullable(),
});

// Message pagination
export const messagesPaginationSchema = z.object({
  conversationId: z.string(),
  cursor: z.string().optional().nullable(),
  limit: z.number().min(1).max(50).default(20),
});

// Types
export type User = z.infer<typeof userSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type Message = z.infer<typeof messageSchema>;
export type MessageUpdate = z.infer<typeof messageUpdateSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type UserSearch = z.infer<typeof userSearchSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type MessagesPagination = z.infer<typeof messagesPaginationSchema>;
