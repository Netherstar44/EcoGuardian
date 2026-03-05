import { db } from "./db";
import { eq } from "drizzle-orm";
import {
  users, reports, comments, ecoPoints, posts,
  type User, type InsertUser,
  type Report, type InsertReport,
  type Comment, type InsertComment,
  type ReportWithAuthor, type ReportDetails,
  type Post, type InsertPost, type PostWithAuthor
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getLeaderboard(): Promise<User[]>;
  updateUserPoints(id: number, points: number): Promise<void>;

  getReports(): Promise<ReportWithAuthor[]>;
  getReport(id: number): Promise<ReportDetails | undefined>;
  createReport(report: InsertReport & { userId: number }): Promise<Report>;
  
  createComment(comment: InsertComment & { userId: number }): Promise<Comment>;

  getPosts(): Promise<PostWithAuthor[]>;
  createPost(post: InsertPost & { userId: number }): Promise<Post>;
}

export class DatabaseStorage implements IStorage {
  // ... existing methods
  async getPosts(): Promise<PostWithAuthor[]> {
    const allPosts = await db.select().from(posts).orderBy(posts.createdAt);
    const result = await Promise.all(allPosts.map(async (p) => {
      const author = await this.getUser(p.userId);
      return {
        ...p,
        author: { id: author!.id, name: author!.name, points: author!.points }
      };
    }));
    return result.reverse();
  }

  async createPost(insertPost: InsertPost & { userId: number }): Promise<Post> {
    const [post] = await db.insert(posts).values(insertPost).returning();
    return post;
  }
}

export const storage = new DatabaseStorage();
