import { pgTable, text, serial, integer, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  points: integer("points").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // basura, contaminación de agua, deforestación, contaminación del aire
  location: text("location").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  imageUrl: text("image_url"),
  status: text("status").default('pending').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ecoPoints = pgTable("eco_points", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  points: integer("points").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// relations
export const usersRelations = relations(users, ({ many }) => ({
  reports: many(reports),
  comments: many(comments),
  ecoPoints: many(ecoPoints),
}));

export const reportsRelations = relations(reports, ({ one, many }) => ({
  author: one(users, {
    fields: [reports.userId],
    references: [users.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  report: one(reports, {
    fields: [comments.reportId],
    references: [reports.id],
  }),
  author: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true, points: true, createdAt: true });
export const insertReportSchema = createInsertSchema(reports).omit({ id: true, userId: true, status: true, createdAt: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, userId: true, createdAt: true });
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  category: text("category").notNull(), // limpieza, clasificacion, compostaje, reciclaje
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
}));

export const insertPostSchema = createInsertSchema(posts).omit({ id: true, userId: true, createdAt: true });
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type PostWithAuthor = Post & { author: Pick<User, "id" | "name" | "points"> };

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type ReportWithAuthor = Report & { author: Pick<User, "id" | "name" | "points"> };
export type CommentWithAuthor = Comment & { author: Pick<User, "id" | "name"> };
export type ReportDetails = ReportWithAuthor & { comments: CommentWithAuthor[] };
