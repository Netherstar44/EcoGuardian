import { db } from "./db";
import { eq, desc, and, or, lte, gte, like, ilike, sql, SQL } from "drizzle-orm";
import {
  users, reports, comments, ecoPoints, posts, chatConversations,
  postComments, postReactions, userBadges, friendships, carbonFootprint,
  marketplaceProducts, reels, reelComments, reelReactions, minigames,
  gameHistory, triviaQuestions,
  type User, type InsertUser,
  type Report, type InsertReport,
  type Comment, type InsertComment,
  type ReportWithAuthor, type ReportDetails,
  type Post, type InsertPost, type PostWithAuthor,
  type ChatConversation, type InsertChatConversation,
  type UserBadge, type Friendship, type CarbonFootprint,
  type MarketplaceProduct, type Reel, type ReelWithAuthor,
  type ReelComment, type ReelCommentWithAuthor, type ReelReaction,
  type Minigame, type GameHistory
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

  // Post comments
  getPostComments(postId: number): Promise<(Comment & { author: Pick<User, 'id' | 'name'> })[]>;
  createPostComment(postId: number, data: { content: string; userId: number; imageUrl?: string }): Promise<any>;

  // Post reactions
  getPostReactionsByPost(postId: number, userId?: number): Promise<{ counts: Record<string, number>; userReaction: string | null }>;
  upsertPostReaction(userId: number, postId: number, type: string): Promise<void>;
  removePostReaction(userId: number, postId: number): Promise<void>;

  // Post CRUD
  getPostById(id: number): Promise<Post | undefined>;
  deletePost(id: number): Promise<void>;
  updatePost(id: number, data: { content: string; imageUrl?: string | null }): Promise<Post>;

  // Post comment CRUD
  deletePostComment(commentId: number, userId: number): Promise<void>;
  updatePostComment(commentId: number, userId: number, content: string): Promise<any>;

  // Chat conversation methods
  saveChatConversation(conversation: InsertChatConversation): Promise<ChatConversation>;
  getChatHistory(userId: number | null, sessionId: string): Promise<ChatConversation | undefined>;
  getChatConversationsByUser(userId: number): Promise<ChatConversation[]>;
  getChatConversationsBySessionId(sessionId: string): Promise<ChatConversation | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async getLeaderboard(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.points)).limit(10);
  }

  async updateUserPoints(id: number, points: number): Promise<void> {
    const user = await this.getUser(id);
    if (user) {
      await db.update(users).set({ points: user.points + points }).where(eq(users.id, id));
    }
  }

  async getReports(): Promise<ReportWithAuthor[]> {
    const allReports = await db.select().from(reports).orderBy(reports.createdAt);
    const result = await Promise.all(allReports.map(async (r) => {
      const author = await this.getUser(r.userId);
      return {
        ...r,
        author: { id: author!.id, name: author!.name, points: author!.points }
      };
    }));
    return result.reverse();
  }

  async getReport(id: number): Promise<ReportDetails | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
    if (!report) return undefined;

    const author = await this.getUser(report.userId);
    const allComments = await db.select().from(comments).where(eq(comments.reportId, id));
    const commentWithAuthors = await Promise.all(allComments.map(async (c) => {
      const authorData = await this.getUser(c.userId);
      return {
        ...c,
        author: { id: authorData!.id, name: authorData!.name }
      };
    }));

    return {
      ...report,
      author: { id: author!.id, name: author!.name, points: author!.points },
      comments: commentWithAuthors
    };
  }

  async createReport(report: InsertReport & { userId: number }): Promise<Report> {
    const [created] = await db.insert(reports).values(report).returning();
    return created;
  }

  async createComment(comment: InsertComment & { userId: number }): Promise<Comment> {
    const [created] = await db.insert(comments).values(comment).returning();
    return created;
  }

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

  // Post comments
  async getPostComments(postId: number): Promise<(Comment & { author: Pick<User, 'id' | 'name'> })[]> {
    const rows = await db.select().from(postComments).where(eq(postComments.postId, postId)).orderBy(postComments.createdAt);
    const result = await Promise.all(rows.map(async (c: any) => {
      const author = await this.getUser(c.userId);
      return { ...c, author: { id: author!.id, name: author!.name } };
    }));
    return result;
  }

  async createPostComment(postId: number, data: { content: string; userId: number; imageUrl?: string }): Promise<any> {
    const [created] = await db.insert(postComments).values({
      postId,
      userId: data.userId,
      content: data.content,
      imageUrl: data.imageUrl,
    }).returning();
    return created;
  }

  // Post reactions
  async getPostReactionsByPost(postId: number, userId?: number): Promise<{ counts: Record<string, number>; userReaction: string | null }> {
    const rows = await db.select().from(postReactions).where(eq(postReactions.postId, postId));
    const counts: Record<string, number> = {};
    let userReaction: string | null = null;
    for (const r of rows as any[]) {
      counts[r.type] = (counts[r.type] || 0) + 1;
      if (userId && r.userId === userId) userReaction = r.type;
    }
    return { counts, userReaction };
  }

  async upsertPostReaction(userId: number, postId: number, type: string): Promise<void> {
    // El usuario solo puede tener una reacción por post. Si ya existe, actualizar; si no, crear.
    const existing = await db.select().from(postReactions).where(and(eq(postReactions.postId, postId), eq(postReactions.userId, userId)));
    if (existing.length > 0) {
      await db.update(postReactions).set({ type }).where(and(eq(postReactions.postId, postId), eq(postReactions.userId, userId)));
    } else {
      await db.insert(postReactions).values({ postId, userId, type });
    }
  }

  async removePostReaction(userId: number, postId: number): Promise<void> {
    await db.delete(postReactions).where(and(eq(postReactions.postId, postId), eq(postReactions.userId, userId)));
  }

  // Post CRUD
  async getPostById(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    return post;
  }

  async deletePost(id: number): Promise<void> {
    // Delete reactions and comments first
    await db.delete(postReactions).where(eq(postReactions.postId, id));
    await db.delete(postComments).where(eq(postComments.postId, id));
    await db.delete(posts).where(eq(posts.id, id));
  }

  async updatePost(id: number, data: { content: string; imageUrl?: string | null }): Promise<Post> {
    const setData: any = { content: data.content, editedAt: new Date() };
    if (data.imageUrl !== undefined) setData.imageUrl = data.imageUrl;
    const [updated] = await db
      .update(posts)
      .set(setData)
      .where(eq(posts.id, id))
      .returning();
    return updated;
  }

  // Post comment CRUD
  async deletePostComment(commentId: number, userId: number): Promise<void> {
    await db.delete(postComments).where(and(eq(postComments.id, commentId), eq(postComments.userId, userId)));
  }

  async updatePostComment(commentId: number, userId: number, content: string): Promise<any> {
    const [updated] = await db
      .update(postComments)
      .set({ content, editedAt: new Date() })
      .where(and(eq(postComments.id, commentId), eq(postComments.userId, userId)))
      .returning();
    const author = await this.getUser(updated.userId);
    return { ...updated, author: { id: author!.id, name: author!.name } };
  }

  // Chat conversation methods
  async saveChatConversation(conversation: InsertChatConversation): Promise<ChatConversation> {
    const existing = await this.getChatConversationsBySessionId(conversation.sessionId);
    
    if (existing) {
      // Actualizar conversación existente
      const [updated] = await db
        .update(chatConversations)
        .set({
          messages: conversation.messages,
          title: conversation.title,
          updatedAt: new Date()
        })
        .where(eq(chatConversations.sessionId, conversation.sessionId))
        .returning();
      return updated;
    } else {
      // Crear nueva conversación
      const [created] = await db
        .insert(chatConversations)
        .values(conversation)
        .returning();
      return created;
    }
  }

  async getChatHistory(userId: number | null, sessionId: string): Promise<ChatConversation | undefined> {
    if (userId) {
      const [result] = await db
        .select()
        .from(chatConversations)
        .where(and(eq(chatConversations.userId, userId), eq(chatConversations.sessionId, sessionId)))
        .limit(1);
      return result;
    } else {
      const [result] = await db
        .select()
        .from(chatConversations)
        .where(eq(chatConversations.sessionId, sessionId))
        .limit(1);
      return result;
    }
  }

  async getChatConversationsByUser(userId: number): Promise<ChatConversation[]> {
    return await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.userId, userId))
      .orderBy(desc(chatConversations.updatedAt));
  }

  async getChatConversationsBySessionId(sessionId: string): Promise<ChatConversation | undefined> {
    const [result] = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.sessionId, sessionId))
      .limit(1);
    return result;
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // NUEVOS MÉTODOS PARA NUEVAS FUNCIONALIDADES
  // ────────────────────────────────────────────────────────────────────────────────

  // User Profile
  async updateUserProfile(userId: number, data: any): Promise<User> {
    const [updated] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  // Carbon Footprint
  async createCarbonFootprint(data: any): Promise<any> {
    const [created] = await db
      .insert(carbonFootprint)
      .values(data)
      .returning();
    return created;
  }

  async getCarbonHistory(userId: number): Promise<CarbonFootprint[]> {
    return await db
      .select()
      .from(carbonFootprint)
      .where(eq(carbonFootprint.userId, userId))
      .orderBy(desc(carbonFootprint.createdAt));
  }

  async getCurrentCarbonFootprint(userId: number): Promise<CarbonFootprint | undefined> {
    const today = new Date().toISOString().substring(0, 7); // YYYY-MM formato
    const [result] = await db
      .select()
      .from(carbonFootprint)
      .where(and(eq(carbonFootprint.userId, userId), eq(carbonFootprint.monthYear, today)))
      .limit(1);
    return result;
  }

  // Badges
  async getUserBadges(userId: number): Promise<UserBadge[]> {
    return await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId));
  }

  // Friends
  async getFriends(userId: number): Promise<any[]> {
    const friendshipRecords = await db
      .select()
      .from(friendships)
      .where(and(
        or(
          eq(friendships.userId, userId),
          eq(friendships.friendId, userId)
        ),
        eq(friendships.status, 'accepted')
      ));

    const friends = await Promise.all(friendshipRecords.map(async (f) => {
      const friendId = f.userId === userId ? f.friendId : f.userId;
      const friend = await this.getUser(friendId);
      return { ...f, friend };
    }));

    return friends;
  }

  async addFriend(userId: number, friendId: number): Promise<Friendship> {
    const [created] = await db
      .insert(friendships)
      .values({ userId, friendId, status: 'pending' })
      .returning();
    return created;
  }

  async acceptFriendRequest(friendshipId: number, userId: number): Promise<Friendship> {
    const [updated] = await db
      .update(friendships)
      .set({ status: 'accepted', acceptedAt: new Date() })
      .where(eq(friendships.id, friendshipId))
      .returning();
    return updated;
  }

  async removeFriend(friendshipId: number, userId: number): Promise<void> {
    await db.delete(friendships).where(eq(friendships.id, friendshipId));
  }

  async getFriendRequests(userId: number): Promise<any[]> {
    const requests = await db
      .select()
      .from(friendships)
      .where(and(
        eq(friendships.friendId, userId),
        eq(friendships.status, 'pending')
      ))
      .orderBy(desc(friendships.createdAt));

    const requestsWithUsers = await Promise.all(requests.map(async (req) => {
      const requester = await this.getUser(req.userId);
      return { ...req, requester };
    }));

    return requestsWithUsers;
  }

  // Marketplace
  async createMarketplaceProduct(data: any): Promise<MarketplaceProduct> {
    const [created] = await db
      .insert(marketplaceProducts)
      .values(data)
      .returning();
    return created;
  }

  async getMarketplaceProducts(): Promise<MarketplaceProduct[]> {
    return await db
      .select()
      .from(marketplaceProducts)
      .where(eq(marketplaceProducts.status, 'available'))
      .orderBy(desc(marketplaceProducts.createdAt));
  }

  async searchMarketplaceProducts(filters: any): Promise<MarketplaceProduct[]> {
    let whereConditions: SQL<unknown> = eq(marketplaceProducts.status, 'available');

    if (filters.query) {
      whereConditions = and(whereConditions, or(
        like(marketplaceProducts.title, `%${filters.query}%`),
        like(marketplaceProducts.description, `%${filters.query}%`)
      ))!;
    }

    if (filters.category) {
      whereConditions = and(whereConditions, eq(marketplaceProducts.category, filters.category))!;
    }

    if (filters.minPrice !== undefined) {
      whereConditions = and(whereConditions, gte(marketplaceProducts.price, filters.minPrice))!;
    }

    if (filters.maxPrice !== undefined) {
      whereConditions = and(whereConditions, lte(marketplaceProducts.price, filters.maxPrice))!;
    }

    return await db
      .select()
      .from(marketplaceProducts)
      .where(whereConditions)
      .orderBy(desc(marketplaceProducts.createdAt));
  }

  async getMarketplaceCategories(): Promise<string[]> {
    const results = await db
      .selectDistinct({ category: marketplaceProducts.category })
      .from(marketplaceProducts)
      .where(eq(marketplaceProducts.status, 'available'));
    
    return results.map(r => r.category);
  }

  async updateMarketplaceProduct(productId: number, data: any, userId: number): Promise<MarketplaceProduct> {
    const [updated] = await db
      .update(marketplaceProducts)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(marketplaceProducts.id, productId), eq(marketplaceProducts.sellerId, userId)))
      .returning();
    return updated;
  }

  async deleteMarketplaceProduct(productId: number, userId: number): Promise<void> {
    await db
      .delete(marketplaceProducts)
      .where(and(eq(marketplaceProducts.id, productId), eq(marketplaceProducts.sellerId, userId)));
  }

  // Reels
  async createReel(data: any): Promise<Reel> {
    const [created] = await db
      .insert(reels)
      .values(data)
      .returning();
    return created;
  }

  async getReels(): Promise<ReelWithAuthor[]> {
    const allReels = await db
      .select()
      .from(reels)
      .orderBy(desc(reels.createdAt));

    return await Promise.all(allReels.map(async (reel) => {
      const author = await this.getUser(reel.userId);
      return { ...reel, author: { id: author!.id, name: author!.name } };
    }));
  }

  async getReel(reelId: number): Promise<ReelWithAuthor | undefined> {
    const [reel] = await db.select().from(reels).where(eq(reels.id, reelId));
    if (!reel) return undefined;

    const author = await this.getUser(reel.userId);
    return { ...reel, author: { id: author!.id, name: author!.name } };
  }

  async deleteReel(reelId: number, userId: number): Promise<void> {
    await db.delete(reels).where(and(eq(reels.id, reelId), eq(reels.userId, userId)));
  }

  // Reel Comments
  async createReelComment(reelId: number, data: any): Promise<ReelComment> {
    const [created] = await db
      .insert(reelComments)
      .values({ ...data, reelId })
      .returning();
    return created;
  }

  async getReelComments(reelId: number): Promise<ReelCommentWithAuthor[]> {
    const comments = await db
      .select()
      .from(reelComments)
      .where(eq(reelComments.reelId, reelId));

    return await Promise.all(comments.map(async (comment) => {
      const author = await this.getUser(comment.userId);
      return { ...comment, author: { id: author!.id, name: author!.name } };
    }));
  }

  // Reel Reactions
  async getReelReactions(reelId: number, userId?: number): Promise<any> {
    const reactions = await db
      .select()
      .from(reelReactions)
      .where(eq(reelReactions.reelId, reelId));

    const counts: Record<string, number> = {};
    reactions.forEach(r => {
      counts[r.type] = (counts[r.type] || 0) + 1;
    });

    let userReaction = null;
    if (userId) {
      const [userReact] = reactions.filter(r => r.userId === userId);
      userReaction = userReact?.type || null;
    }

    return { counts, userReaction };
  }

  async upsertReelReaction(userId: number, reelId: number, type: string): Promise<void> {
    await db
      .insert(reelReactions)
      .values({ userId, reelId, type })
      .onConflictDoUpdate({
        target: [reelReactions.userId, reelReactions.reelId],
        set: { type },
      });
  }

  async removeReelReaction(userId: number, reelId: number): Promise<void> {
    await db
      .delete(reelReactions)
      .where(and(eq(reelReactions.userId, userId), eq(reelReactions.reelId, reelId)));
  }

  // Minigames
  async getDailyMinigame(dateStr: string): Promise<Minigame | undefined> {
    const [game] = await db
      .select()
      .from(minigames)
      .where(eq(minigames.dayDate, dateStr));
    return game;
  }

  async generateDailyMinigame(dateStr: string): Promise<Minigame> {
    // Obtener una trivia aleatoria
    const trivia = await db
      .select()
      .from(triviaQuestions)
      .orderBy(sql`RANDOM()`)
      .limit(1);

    const question = trivia[0];
    const [created] = await db
      .insert(minigames)
      .values({
        type: 'trivia',
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
        difficulty: question.difficulty,
        imageUrl: question.imageUrl,
        points: 10,
        dayDate: dateStr,
      })
      .returning();

    return created;
  }

  async submitGameAnswer(userId: number, gameId: number, answer: string): Promise<any> {
    const game = await db.select().from(minigames).where(eq(minigames.id, gameId));
    if (!game.length) throw new Error("Game not found");

    const isCorrect = game[0].correctAnswer === answer;
    const points = isCorrect ? game[0].points : 0;

    await db
      .insert(gameHistory)
      .values({
        userId,
        gameId,
        answer,
        isCorrect,
        pointsEarned: points,
      });

    return {
      isCorrect,
      points,
      message: isCorrect ? "¡Respuesta correcta!" : "Respuesta incorrecta",
    };
  }

  async getGameHistory(userId: number): Promise<GameHistory[]> {
    return await db
      .select()
      .from(gameHistory)
      .where(eq(gameHistory.userId, userId))
      .orderBy(desc(gameHistory.completedAt));
  }

  // Global Search
  async globalSearch(query: string): Promise<any> {
    // sanitize and prepare query
    const q = query.trim();
    const searchPattern = `%${q}%`;

    console.log("Searching for:", q, "pattern:", searchPattern);

    try {
      // use case‑insensitive `ilike` so lowercase/uppercase doesn't matter
      const userResults = await db
        .select()
        .from(users)
        .where(ilike(users.name, searchPattern))
        .limit(10);

      console.log("User results:", userResults.length);

      const postResultsRaw = await db
        .select()
        .from(posts)
        .where(ilike(posts.content, searchPattern))
        .limit(10);

      console.log("Post results:", postResultsRaw.length);

      // Add author info to posts, like getPosts()
      const postResults = await Promise.all(postResultsRaw.map(async (p) => {
        const author = await this.getUser(p.userId);
        return {
          ...p,
          author: { id: author!.id, name: author!.name, points: author!.points }
        };
      }));

      return { users: userResults, posts: postResults };
    } catch (error) {
      console.error("Error in globalSearch:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();