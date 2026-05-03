import { pgTable, text, serial, integer, timestamp, doublePrecision, uniqueIndex, boolean, date } from "drizzle-orm/pg-core";
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
  avatar: text("avatar"),
  bio: text("bio"),
  city: text("city"),
  country: text("country"),
  dateOfBirth: date("date_of_birth"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
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
  chatConversations: many(chatConversations),
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
  editedAt: timestamp("edited_at"),
});

// Comments on posts
export const postComments = pgTable("post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  editedAt: timestamp("edited_at"),
});

// Reactions on posts (Facebook-style types stored as text)
export const postReactions = pgTable("post_reactions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // like, love, care, haha, wow, sad, angry
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserPost: uniqueIndex("post_reactions_user_post_unique").on(table.userId, table.postId),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  comments: many(postComments),
  reactions: many(postReactions),
}));

export const postCommentsRelations = relations(postComments, ({ one }) => ({
  post: one(posts, {
    fields: [postComments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [postComments.userId],
    references: [users.id],
  }),
}));

export const postReactionsRelations = relations(postReactions, ({ one }) => ({
  post: one(posts, {
    fields: [postReactions.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [postReactions.userId],
    references: [users.id],
  }),
}));

export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  userNickname: text("user_nickname"), // para usuarios no registrados
  sessionId: text("session_id").notNull(), // para agrupar mensajes de la misma sesión
  messages: text("messages").notNull(), // JSON stringificado con el historial
  title: text("title"), // titulo de la conversación
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatConversationsRelations = relations(chatConversations, ({ one }) => ({
  author: one(users, {
    fields: [chatConversations.userId],
    references: [users.id],
  }),
}));

// ────────────────────────────────────────────────────────────────────────────────
// NUEVAS TABLAS PARA NUEVAS FUNCIONALIDADES
// ────────────────────────────────────────────────────────────────────────────────

// Badges/Rangos basados en puntos
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  badgeId: text("badge_id").notNull(),
  badgeName: text("badge_name").notNull(), // ej: "Ecologista Pro", "Guardián Verde"
  description: text("description"),
  icon: text("icon"),
  pointsRequired: integer("points_required").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserBadge: uniqueIndex("user_badges_user_id_badge_id").on(table.userId, table.badgeId),
}));

// Sistema de amigos
export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  friendId: integer("friend_id").notNull(),
  status: text("status").default('pending').notNull(), // pending, accepted, blocked
  createdAt: timestamp("created_at").defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at"),
}, (table) => ({
  uniqueFriendship: uniqueIndex("friendships_order").on(table.userId, table.friendId),
}));

// Huella de carbono
export const carbonFootprint = pgTable("carbon_footprint", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  transportCo2: doublePrecision("transport_co2").default(0), // kg CO2 por mes
  energyCo2: doublePrecision("energy_co2").default(0),
  dietCo2: doublePrecision("diet_co2").default(0),
  wasteCo2: doublePrecision("waste_co2").default(0),
  totalCo2: doublePrecision("total_co2").default(0),
  monthYear: text("month_year").notNull(),
  city: text("city"),
  climate: text("climate"), // tropical, temperate, arid, etc
  airQuality: text("air_quality"), // good, moderate, poor, etc
  airQualityIndex: integer("air_quality_index"),
  thermalSensation: text("thermal_sensation"), // hot, warm, mild, cold
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserMonth: uniqueIndex("carbon_footprint_user_month").on(table.userId, table.monthYear),
}));

// Marketplace - Productos
export const marketplaceProducts = pgTable("marketplace_products", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // abono, semillas, composteras, botellas reutilizables, etc
  price: doublePrecision("price").notNull(),
  currency: text("currency").default("USD"),
  imageUrl: text("image_url"),
  quantity: integer("quantity"),
  status: text("status").default('available').notNull(), // available, sold, inactive
  rating: doublePrecision("rating").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

// Reels/Videos tipo TikTok
export const reels = pgTable("reels", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title"),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  category: text("category").notNull(), // limpieza, reciclaje, compostaje, etc
  duration: integer("duration"), // en segundos
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  editedAt: timestamp("edited_at"),
});

// Comentarios en Reels
export const reelComments = pgTable("reel_comments", {
  id: serial("id").primaryKey(),
  reelId: integer("reel_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  editedAt: timestamp("edited_at"),
});

// Reacciones en Reels
export const reelReactions = pgTable("reel_reactions", {
  id: serial("id").primaryKey(),
  reelId: integer("reel_id").notNull(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // like, love, care, haha, wow, sad, angry
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserReel: uniqueIndex("reel_reactions_user_reel_unique").on(table.userId, table.reelId),
}));

// Minijuegos diarios
export const minigames = pgTable("minigames", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // trivia, memory, puzzle, match, etc
  question: text("question"),
  options: text("options"), // JSON array
  correctAnswer: text("correct_answer"),
  difficulty: text("difficulty").default('medium'), // easy, medium, hard
  imageUrl: text("image_url"),
  points: integer("points").default(10),
  dayDate: text("day_date").notNull(), // YYYY-MM-DD para generar uno por día
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueDayGame: uniqueIndex("minigames_day_unique").on(table.dayDate),
}));

// Historial de juegos del usuario
export const gameHistory = pgTable("game_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  gameId: integer("game_id").notNull(),
  answer: text("answer"),
  isCorrect: boolean("is_correct").default(false),
  pointsEarned: integer("points_earned").default(0),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserGame: uniqueIndex("game_history_user_game").on(table.userId, table.gameId),
}));

// Preguntas de trivia para juegos
export const triviaQuestions = pgTable("trivia_questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  options: text("options").notNull(), // JSON array con opciones
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"), // explicación de la respuesta correcta
  category: text("category").notNull(), // climate, biodiversity, pollution, energy, water, etc
  difficulty: text("difficulty").default('medium'),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ────────────────────────────────────────────────────────────────────────────────
// RELACIONES PARA LAS NUEVAS TABLAS
// ────────────────────────────────────────────────────────────────────────────────

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  user: one(users, {
    fields: [friendships.userId],
    references: [users.id],
  }),
  friend: one(users, {
    fields: [friendships.friendId],
    references: [users.id],
  }),
}));

export const carbonFootprintRelations = relations(carbonFootprint, ({ one }) => ({
  user: one(users, {
    fields: [carbonFootprint.userId],
    references: [users.id],
  }),
}));

export const marketplaceProductsRelations = relations(marketplaceProducts, ({ one, many }) => ({
  seller: one(users, {
    fields: [marketplaceProducts.sellerId],
    references: [users.id],
  }),
}));

export const reelsRelations = relations(reels, ({ one, many }) => ({
  author: one(users, {
    fields: [reels.userId],
    references: [users.id],
  }),
  comments: many(reelComments),
  reactions: many(reelReactions),
}));

export const reelCommentsRelations = relations(reelComments, ({ one }) => ({
  reel: one(reels, {
    fields: [reelComments.reelId],
    references: [reels.id],
  }),
  author: one(users, {
    fields: [reelComments.userId],
    references: [users.id],
  }),
}));

export const reelReactionsRelations = relations(reelReactions, ({ one }) => ({
  reel: one(reels, {
    fields: [reelReactions.reelId],
    references: [reels.id],
  }),
  user: one(users, {
    fields: [reelReactions.userId],
    references: [users.id],
  }),
}));

export const minigamesRelations = relations(minigames, ({ many }) => ({
  history: many(gameHistory),
}));

export const gameHistoryRelations = relations(gameHistory, ({ one }) => ({
  game: one(minigames, {
    fields: [gameHistory.gameId],
    references: [minigames.id],
  }),
  user: one(users, {
    fields: [gameHistory.userId],
    references: [users.id],
  }),
}));

export const insertPostSchema = createInsertSchema(posts).omit({ id: true, userId: true, createdAt: true });

// Zod schemas for post comments and reactions
export const insertPostCommentSchema = createInsertSchema(postComments).omit({ id: true, userId: true, createdAt: true, imageUrl: true }).extend({
  imageBase64: z.string().optional(),
});
export const insertPostReactionSchema = createInsertSchema(postReactions).omit({ id: true, userId: true, createdAt: true });

// Reaction type whitelist for frontend/backend validation
export const postReactionTypeSchema = z.enum(["like", "love", "care", "haha", "wow", "sad", "angry"]);
export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({ id: true, createdAt: true, updatedAt: true });

// ────────────────────────────────────────────────────────────────────────────────
// ESQUEMAS ZOD PARA NUEVAS FUNCIONALIDADES
// ────────────────────────────────────────────────────────────────────────────────

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({ id: true, unlockedAt: true });
export const insertFriendshipSchema = createInsertSchema(friendships).omit({ id: true, createdAt: true, acceptedAt: true });
export const insertCarbonFootprintSchema = createInsertSchema(carbonFootprint).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMarketplaceProductSchema = createInsertSchema(marketplaceProducts).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  imageBase64: z.string().optional(),
});
export const insertReelSchema = createInsertSchema(reels).omit({ id: true, createdAt: true, editedAt: true, viewCount: true }).extend({
  videoBase64: z.string().optional(),
  thumbnailBase64: z.string().optional(),
});
export const insertReelCommentSchema = createInsertSchema(reelComments).omit({ id: true, createdAt: true, editedAt: true });
export const insertReelReactionSchema = createInsertSchema(reelReactions).omit({ id: true, createdAt: true });
export const insertMinigameSchema = createInsertSchema(minigames).omit({ id: true, createdAt: true });
export const insertGameHistorySchema = createInsertSchema(gameHistory).omit({ id: true, completedAt: true });
export const insertTriviaQuestionSchema = createInsertSchema(triviaQuestions).omit({ id: true, createdAt: true });

export const reelReactionTypeSchema = z.enum(["like", "love", "care", "haha", "wow", "sad", "angry"]);

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;

export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;

export type CarbonFootprint = typeof carbonFootprint.$inferSelect;
export type InsertCarbonFootprint = z.infer<typeof insertCarbonFootprintSchema>;

export type MarketplaceProduct = typeof marketplaceProducts.$inferSelect;
export type InsertMarketplaceProduct = z.infer<typeof insertMarketplaceProductSchema>;

export type Reel = typeof reels.$inferSelect;
export type InsertReel = z.infer<typeof insertReelSchema>;
export type ReelWithAuthor = Reel & { author: Pick<User, "id" | "name"> };
export type ReelComment = typeof reelComments.$inferSelect;
export type ReelCommentWithAuthor = ReelComment & { author: Pick<User, "id" | "name"> };
export type InsertReelComment = z.infer<typeof insertReelCommentSchema>;
export type ReelReaction = typeof reelReactions.$inferSelect;
export type InsertReelReaction = z.infer<typeof insertReelReactionSchema>;

export type Minigame = typeof minigames.$inferSelect;
export type InsertMinigame = z.infer<typeof insertMinigameSchema>;
export type GameHistory = typeof gameHistory.$inferSelect;
export type InsertGameHistory = z.infer<typeof insertGameHistorySchema>;

export type TriviaQuestion = typeof triviaQuestions.$inferSelect;
export type InsertTriviaQuestion = z.infer<typeof insertTriviaQuestionSchema>;

export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type PostWithAuthor = Post & { author: Pick<User, "id" | "name" | "points"> };

export type PostComment = typeof postComments.$inferSelect;
export type PostCommentWithAuthor = PostComment & { author: Pick<User, "id" | "name"> };
export type InsertPostComment = z.infer<typeof insertPostCommentSchema>;
export type PostReaction = typeof postReactions.$inferSelect;
export type InsertPostReaction = z.infer<typeof insertPostReactionSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;

export type ReportWithAuthor = Report & { author: Pick<User, "id" | "name" | "points"> };
export type CommentWithAuthor = Comment & { author: Pick<User, "id" | "name"> };
export type ReportDetails = ReportWithAuthor & { comments: CommentWithAuthor[] };