import { db } from "./db";
import { eq } from "drizzle-orm";
import {
  users, reports, comments, ecoPoints,
  type User, type InsertUser,
  type Report, type InsertReport,
  type Comment, type InsertComment,
  type ReportWithAuthor, type ReportDetails
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
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getLeaderboard(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.points); // should be desc, simple mock for now
  }

  async updateUserPoints(id: number, points: number): Promise<void> {
    const user = await this.getUser(id);
    if (user) {
      await db.update(users).set({ points: user.points + points }).where(eq(users.id, id));
    }
  }

  async getReports(): Promise<ReportWithAuthor[]> {
    const allReports = await db.select().from(reports);
    // Fetch authors
    const result = await Promise.all(allReports.map(async (r) => {
      const author = await this.getUser(r.userId);
      return {
        ...r,
        author: { id: author!.id, name: author!.name, points: author!.points }
      };
    }));
    return result;
  }

  async getReport(id: number): Promise<ReportDetails | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    if (!report) return undefined;

    const author = await this.getUser(report.userId);
    const reportComments = await db.select().from(comments).where(eq(comments.reportId, id));
    
    const commentsWithAuthors = await Promise.all(reportComments.map(async (c) => {
      const commentAuthor = await this.getUser(c.userId);
      return {
        ...c,
        author: { id: commentAuthor!.id, name: commentAuthor!.name }
      };
    }));

    return {
      ...report,
      author: { id: author!.id, name: author!.name, points: author!.points },
      comments: commentsWithAuthors
    };
  }

  async createReport(insertReport: InsertReport & { userId: number }): Promise<Report> {
    const [report] = await db.insert(reports).values(insertReport).returning();
    return report;
  }

  async createComment(insertComment: InsertComment & { userId: number }): Promise<Comment> {
    const [comment] = await db.insert(comments).values(insertComment).returning();
    return comment;
  }
}

export const storage = new DatabaseStorage();
