import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage.js";
import { api } from "../shared/routes.js";
import { z } from "zod";
import type { User } from "../shared/schema.js";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy, type Profile } from "passport-google-oauth20";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db.js";
import multer from "multer";
import cloudinary from "./cloudinary.js";
import { uploadToCloudinary } from "./cloudinary.js";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

import { productsSeed } from "./products_seed.js";
import { db } from "./db.js";
import { users } from "../shared/schema.js";

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  const PgSession = connectPg(session);
  
  app.use(
    session({
      store: new PgSession({ pool, createTableIfMissing: true }),
      secret: process.env.SESSION_SECRET || "fallback_secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: true, // required for sameSite: "none"
        sameSite: "none", // required for Capacitor cross-origin
      },
    })
  );

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const callbackURL =
      process.env.GOOGLE_CALLBACK_URL ||
      "http://localhost:3000/api/auth/google/callback";

    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL,
        },
        async (
          _accessToken: string,
          _refreshToken: string,
          profile: Profile,
          done
        ) => {
          try {
            const email = profile.emails?.[0]?.value;
            const name =
              profile.displayName ||
              profile.name?.givenName ||
              profile.name?.familyName ||
              "Usuario EcoGuardián";

            if (!email) {
              return done(null, false, {
                message: "No se pudo obtener el email de Google",
              });
            }

            let user = await storage.getUserByEmail(email);

            if (!user) {
              const randomPassword = randomBytes(32).toString("hex");
              const hashedPassword = await hashPassword(randomPassword);

              user = await storage.createUser({
                name,
                email,
                password: hashedPassword,
              });
            }

            return done(null, user);
          } catch (err) {
            return done(err as any);
          }
        }
      )
    );
  } else {
    console.warn(
      "[auth] GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET no configurados; login con Google deshabilitado."
    );
  }

  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid credentials" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.use(passport.initialize());
  app.use(passport.session());

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existing = await storage.getUserByEmail(input.email);
      if (existing) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const hashedPassword = await hashPassword(input.password);
      const user = await storage.createUser({ ...input, password: hashedPassword });
      req.login(user, (err) => {
        if (err) throw err;
        res.status(201).json(user);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.get(
    "/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/auth?error=google",
      session: true,
    }),
    (_req, res) => {
      res.redirect("/dashboard");
    }
  );

  app.post("/api/auth/google/native", async (req, res, next) => {
    try {
      const { email, name } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      let user = await storage.getUserByEmail(email);

      if (!user) {
        const randomPassword = randomBytes(32).toString("hex");
        const hashedPassword = await hashPassword(randomPassword);

        user = await storage.createUser({
          name: name || "Usuario EcoGuardián",
          email,
          password: hashedPassword,
        });
      }

      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(200).json(user);
      });
    } catch (err) {
      console.error("[NATIVE GOOGLE AUTH ERROR]", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out" });
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.status(200).json(req.user);
  });

  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    next();
  };

  app.get(api.reports.list.path, async (req, res) => {
    const reports = await storage.getReports();
    res.status(200).json(reports);
  });

  app.get(api.reports.get.path, async (req, res) => {
    const report = await storage.getReport(Number(req.params.id));
    if (!report) return res.status(404).json({ message: "Report not found" });
    res.status(200).json(report);
  });

  app.post(api.reports.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.reports.create.input.parse(req.body);
      const user = req.user as any;
      
      let imageUrl: string | undefined;
      if (input.imageBase64) {
        const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${input.imageBase64}`);
        imageUrl = result.secure_url;
      }
      
      const report = await storage.createReport({
        ...input,
        imageUrl,
        userId: user.id
      });
      
      await storage.updateUserPoints(user.id, 10);
      res.status(201).json(report);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.comments.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.comments.create.input.parse(req.body);
      const user = req.user as any;
      const comment = await storage.createComment({
        ...input,
        userId: user.id
      });
      res.status(201).json(comment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.leaderboard.list.path, async (req, res) => {
    const leaderboard = await storage.getLeaderboard();
    res.status(200).json(leaderboard.sort((a, b) => b.points - a.points));
  });

  app.get(api.posts.list.path, async (req, res) => {
    const posts = await storage.getPosts();
    res.status(200).json(posts);
  });

  // ─── Image upload endpoint ────────────────────────────────────────────────────
  // Receives base64 image as JSON { imageBase64: "..." } and uploads to Cloudinary.
  app.post('/api/upload', requireAuth, async (req: any, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ message: 'No file provided' });
      }
      const dataUri = imageBase64.startsWith('data:')
        ? imageBase64
        : `data:image/jpeg;base64,${imageBase64}`;
      const uploadResult = await cloudinary.uploader.upload(dataUri, { resource_type: 'image' });
      res.json({ url: uploadResult.secure_url });
    } catch (err) {
      console.error('[UPLOAD ERROR]', err);
      res.status(500).json({ message: 'Upload failed' });
    }
  });

  app.post(api.posts.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.posts.create.input.parse(req.body);
      const user = req.user as any;

      // imageUrls: array of already-uploaded Cloudinary URLs (uploaded via /api/upload)
      const imageUrls: string[] = Array.isArray(req.body.imageUrls)
        ? req.body.imageUrls.filter((u: any) => typeof u === 'string' && u.length > 0)
        : [];

      const imageUrl: string | undefined = imageUrls.length === 0
        ? undefined
        : imageUrls.length === 1
          ? imageUrls[0]
          : JSON.stringify(imageUrls);

      const post = await storage.createPost({
        content: input.content,
        category: input.category,
        imageUrl,
        userId: user.id
      });
      
      await storage.updateUserPoints(user.id, 5);
      res.status(201).json(post);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.posts.comments.list.path, async (req, res) => {
    try {
      const postId = Number(req.params.id);
      const comments = await storage.getPostComments(postId);
      res.status(200).json(comments);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.posts.comments.create.path, requireAuth, async (req, res) => {
    try {
      const postId = Number(req.params.id);
      const user = req.user as any;

      // Allow empty content when a GIF/image is present
      const content: string = req.body.content ?? "";
      const imageBase64: string | undefined = req.body.imageBase64;

      // Must have at least content or an image
      if (!content.trim() && !imageBase64) {
        return res.status(400).json({ message: "Debes escribir algo o adjuntar una imagen" });
      }

      let imageUrl: string | undefined;
      if (imageBase64) {
        // If it's already a URL (GIF from Giphy), use directly; otherwise upload base64 to Cloudinary
        const isUrl = imageBase64.startsWith('http://') || imageBase64.startsWith('https://');
        if (isUrl) {
          imageUrl = imageBase64;
        } else {
          const dataUri = imageBase64.startsWith('data:')
            ? imageBase64
            : `data:image/jpeg;base64,${imageBase64}`;
          const result = await cloudinary.uploader.upload(dataUri);
          imageUrl = result.secure_url;
        }
      }

      const created = await storage.createPostComment(postId, {
        content,
        userId: user.id,
        imageUrl,
      });
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.posts.reactions.get.path, async (req, res) => {
    try {
      const postId = Number(req.params.id);
      const userId = (req.user as any)?.id;
      const result = await storage.getPostReactionsByPost(postId, userId);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.posts.reactions.set.path, requireAuth, async (req, res) => {
    try {
      const postId = Number(req.params.id);
      const input = api.posts.reactions.set.input.parse(req.body);
      const user = req.user as any;
      await storage.upsertPostReaction(user.id, postId, input.type);
      res.status(200).json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.posts.reactions.remove.path, requireAuth, async (req, res) => {
    try {
      const postId = Number(req.params.id);
      const user = req.user as any;
      await storage.removePostReaction(user.id, postId);
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GIF search proxy (avoids CORS issues)
  app.get('/api/gifs/search', async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) return res.status(400).json({ error: 'q required' });
      const apiKey = process.env.GIPHY_API_KEY || '46n3IfAfwKg7Y79uj9qOnk8u4D9S2AyV';
      const url = `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(q)}&limit=24&rating=g&lang=es`;
      const r = await fetch(url);
      const data = await r.json() as any;
      const gifs = (data.data || []).map((g: any) => ({
        id: g.id,
        url: g.images?.downsized?.url || g.images?.fixed_height?.url,
        preview: g.images?.fixed_height_small?.url || g.images?.downsized_small?.mp4,
        title: g.title,
      })).filter((g: any) => g.url);
      res.json({ gifs });
    } catch (err) {
      res.status(500).json({ error: 'GIF search failed' });
    }
  });

  // GIF trending
  app.get('/api/gifs/trending', async (req, res) => {
    try {
      const apiKey = process.env.GIPHY_API_KEY || '46n3IfAfwKg7Y79uj9qOnk8u4D9S2AyV';
      const url = `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=24&rating=g`;
      const r = await fetch(url);
      const data = await r.json() as any;
      const gifs = (data.data || []).map((g: any) => ({
        id: g.id,
        url: g.images?.downsized?.url || g.images?.fixed_height?.url,
        preview: g.images?.fixed_height_small?.url,
        title: g.title,
      })).filter((g: any) => g.url);
      res.json({ gifs });
    } catch (err) {
      res.status(500).json({ error: 'Trending GIFs failed' });
    }
  });

  // GIF by category (uses search with preset terms)
  app.get('/api/gifs/category', async (req, res) => {
    try {
      const cat = req.query.cat as string;
      if (!cat) return res.status(400).json({ error: 'cat required' });
      const apiKey = process.env.GIPHY_API_KEY || '46n3IfAfwKg7Y79uj9qOnk8u4D9S2AyV';
      const url = `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(cat)}&limit=24&rating=g&lang=es`;
      const r = await fetch(url);
      const data = await r.json() as any;
      const gifs = (data.data || []).map((g: any) => ({
        id: g.id,
        url: g.images?.downsized?.url || g.images?.fixed_height?.url,
        preview: g.images?.fixed_height_small?.url,
        title: g.title,
      })).filter((g: any) => g.url);
      res.json({ gifs });
    } catch (err) {
      res.status(500).json({ error: 'Category GIFs failed' });
    }
  });

  app.get('/api/test', (req, res) => {
    res.json({ 
      status: 'ok', 
      message: 'Server is running',
      timestamp: new Date().toISOString()
    });
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, userName } = req.body;
      
      console.log('[CHAT] Received request:', { messagesCount: messages?.length, userName });

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages array is required' });
      }

      if (messages.length === 0) {
        return res.status(400).json({ error: 'At least one message is required' });
      }

      const systemMessage = userName 
        ? `Eres Gaia, la diosa ambientalista de la Tierra y guardiana de EcoGuardian. Eres apasionada por proteger nuestro planeta y ayudar a los usuarios a tomar decisiones sostenibles. Siempre dirígete al usuario por su nombre: ${userName}. Mantén el contexto de los mensajes anteriores para proporcionar respuestas precisas y personalizadas. Si esta es la primera interacción, preséntate cálidamente como Gaia. Mantén tus respuestas concisas y útiles. Responde SIEMPRE en español.`
        : `Eres Gaia, la diosa ambientalista de la Tierra y guardiana de EcoGuardian. Eres apasionada por proteger nuestro planeta y ayudar a los usuarios a tomar decisiones sostenibles. Mantén el contexto de los mensajes anteriores para proporcionar respuestas precisas. Si esta es la primera interacción, preséntate cálidamente como Gaia. Mantén tus respuestas concisas y útiles. Responde SIEMPRE en español.`;

      const grokMessages = [
        { role: 'system', content: systemMessage },
        ...messages
      ];

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      let grokResponse;
      try {
        grokResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: grokMessages,
            model: 'llama-3.1-8b-instant',
            temperature: 0.7,
            max_tokens: 500
          })
        });
      } catch (fetchError: any) {
        clearTimeout(timeout);
        throw fetchError;
      }

      clearTimeout(timeout);

      if (!grokResponse.ok) {
        const errorText = await grokResponse.text();
        console.error(`[CHAT ERROR] Groq API error ${grokResponse.status}:`, errorText);
        return res.json({ 
          response: `¡Hola! Soy Gaia. Actualmente hay un problema técnico con mi conexión a la red, pero estoy aquí para ayudarte con tus dudas ambientales. ${userName ? `¿Cómo puedo ayudarte hoy, ${userName}?` : '¿En qué puedo ayudarte?'}` 
        });
      }

      const grokData = await grokResponse.json();
      const assistantMessage = grokData.choices?.[0]?.message?.content;

      if (!assistantMessage) {
        return res.json({ response: 'Lo siento, recibí una respuesta vacía. Por favor, intenta de nuevo.' });
      }

      res.json({ response: assistantMessage });

    } catch (error: any) {
      console.error('[CHAT ERROR]:', error.message);
      if (error.name === 'AbortError') {
        return res.json({ response: 'La solicitud tardó demasiado. Por favor, intenta de nuevo con un mensaje más corto.' });
      }
      res.json({ response: 'Disculpa, estoy experimentando dificultades técnicas. Por favor, intenta de nuevo en un momento.' });
    }
  });

  app.post('/api/chat/save', async (req, res) => {
    try {
      const { userId, userNickname, sessionId, messages, title } = req.body;
      if (!sessionId || !messages) {
        return res.status(400).json({ error: 'sessionId and messages are required' });
      }
      const conversation = await storage.saveChatConversation({
        userId: userId || null,
        userNickname: userNickname || null,
        sessionId,
        messages: JSON.stringify(messages),
        title: title || `Conversación ${new Date().toLocaleDateString('es-ES')}`
      });
      res.json({ success: true, conversation });
    } catch (error: any) {
      console.error('[CHAT SAVE ERROR]:', error.message);
      res.status(500).json({ error: 'Failed to save conversation' });
    }
  });

  app.get('/api/chat/history/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = (req.user as any)?.id;
      if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
      }
      const conversation = await storage.getChatHistory(userId || null, sessionId);
      if (!conversation) {
        return res.json({ messages: [] });
      }
      if (conversation.userId && userId && conversation.userId !== userId) {
        return res.status(403).json({ error: 'Unauthorized access to this conversation' });
      }
      const messages = JSON.parse(conversation.messages);
      res.json({ messages, title: conversation.title });
    } catch (error: any) {
      console.error('[CHAT HISTORY ERROR]:', error.message);
      res.status(500).json({ error: 'Failed to fetch conversation history' });
    }
  });

  app.get('/api/chat/sessions', (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  }, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const conversations = await storage.getChatConversationsByUser(userId);
      const sessionsData = conversations.map(conv => ({
        sessionId: conv.sessionId,
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messageCount: (JSON.parse(conv.messages) as any[]).length
      }));
      res.json({ sessions: sessionsData });
    } catch (error: any) {
      console.error('[CHAT SESSIONS ERROR]:', error.message);
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  });


  // ─── Delete post ─────────────────────────────────────────────────────────────
  app.delete('/api/posts/:id', requireAuth, async (req, res) => {
    try {
      const postId = Number(req.params.id);
      const user = req.user as any;
      const post = await storage.getPostById(postId);
      if (!post) return res.status(404).json({ message: "Post not found" });
      if (post.userId !== user.id) return res.status(403).json({ message: "Forbidden" });
      await storage.deletePost(postId);
      await storage.updateUserPoints(user.id, -5);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Edit post ────────────────────────────────────────────────────────────────
  app.patch('/api/posts/:id', requireAuth, async (req, res) => {
    try {
      const postId = Number(req.params.id);
      const user = req.user as any;
      const post = await storage.getPostById(postId);
      if (!post) return res.status(404).json({ message: "Post not found" });
      if (post.userId !== user.id) return res.status(403).json({ message: "Forbidden" });

      // imageUrls: final array of Cloudinary URLs after edit (pre-uploaded via /api/upload)
      const incomingUrls: string[] | undefined = Array.isArray(req.body.imageUrls)
        ? req.body.imageUrls.filter((u: any) => typeof u === 'string' && u.length > 0)
        : undefined;

      let imageUrl: string | undefined | null = undefined;
      if (incomingUrls !== undefined) {
        // Frontend sent explicit list — use it (may be empty = remove all)
        imageUrl = incomingUrls.length === 0
          ? null
          : incomingUrls.length === 1
            ? incomingUrls[0]
            : JSON.stringify(incomingUrls);
      }
      // if incomingUrls is undefined, imageUrl stays undefined → storage won't touch it

      const updated = await storage.updatePost(postId, { content: req.body.content, imageUrl });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Delete comment ───────────────────────────────────────────────────────────
  app.delete('/api/posts/:postId/comments/:commentId', requireAuth, async (req, res) => {
    try {
      const commentId = Number(req.params.commentId);
      const user = req.user as any;
      await storage.deletePostComment(commentId, user.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Edit comment ─────────────────────────────────────────────────────────────
  app.patch('/api/posts/:postId/comments/:commentId', requireAuth, async (req, res) => {
    try {
      const commentId = Number(req.params.commentId);
      const user = req.user as any;
      const updated = await storage.updatePostComment(commentId, user.id, req.body.content);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────────
  // NUEVOS ENDPOINTS PARA NUEVAS FUNCIONALIDADES
  // ────────────────────────────────────────────────────────────────────────────────

  // ─── User Profile ─────────────────────────────────────────────────────────────
  app.get('/api/users/:id', async (req, res) => {
    try {
      const userId = Number(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuario inválido" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      res.json(user);
    } catch (err: any) {
      console.error("Error en /api/users/:id:", err.message);
      res.status(500).json({ message: "Error al obtener usuario", error: err.message });
    }
  });

  app.patch('/api/users/:id', requireAuth, async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const user = req.user as any;
      
      if (user.id !== userId) {
        return res.status(401).json({ message: "No autorizado" });
      }

      const { name, bio, city, country, dateOfBirth, latitude, longitude, avatar } = req.body;
      const updatedUser = await storage.updateUserProfile(userId, {
        name,
        bio,
        city,
        country,
        dateOfBirth,
        latitude,
        longitude,
        avatar,
      });

      res.json(updatedUser);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Carbon Footprint ─────────────────────────────────────────────────────────
  app.post('/api/carbon/calculate', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const carbon = await storage.createCarbonFootprint({
        ...req.body,
        userId: user.id,
      });
      res.status(201).json(carbon);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/carbon/history', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const history = await storage.getCarbonHistory(user.id);
      res.json(history);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/carbon/current', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const current = await storage.getCurrentCarbonFootprint(user.id);
      res.json(current || {});
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Badges ───────────────────────────────────────────────────────────────────
  app.get('/api/badges/:userId', async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const badges = await storage.getUserBadges(userId);
      res.json(badges);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Friends ──────────────────────────────────────────────────────────────────
  app.get('/api/friends', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const friends = await storage.getFriends(user.id);
      res.json(friends);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/friends/add', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { friendId } = req.body;
      
      const friendship = await storage.addFriend(user.id, friendId);
      res.status(201).json(friendship);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch('/api/friends/:id/accept', requireAuth, async (req, res) => {
    try {
      const friendshipId = Number(req.params.id);
      const user = req.user as any;
      
      const friendship = await storage.acceptFriendRequest(friendshipId, user.id);
      res.json(friendship);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/friends/:id', requireAuth, async (req, res) => {
    try {
      const friendshipId = Number(req.params.id);
      const user = req.user as any;
      
      await storage.removeFriend(friendshipId, user.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/friends/requests', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const requests = await storage.getFriendRequests(user.id);
      res.json(requests);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Marketplace ──────────────────────────────────────────────────────────────
  app.get('/api/marketplace/products', async (req, res) => {
    try {
      const products = await storage.getMarketplaceProducts();
      res.json(products);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/marketplace/seed', async (req, res) => {
    try {
      const existing = await storage.getMarketplaceProducts();

      // get first user
      const allUsers = await db.select().from(users).limit(1);
      const sellerId = allUsers.length > 0 ? allUsers[0].id : 1;
      
      let count = 0;
      for (const prod of productsSeed) {
        await storage.createMarketplaceProduct({
          sellerId,
          title: prod.title,
          description: prod.description,
          category: prod.category,
          price: prod.price,
          quantity: prod.quantity,
          imageUrl: prod.imageUrl,
          status: 'available'
        });
        count++;
      }
      res.json({ message: "Successfully seeded marketplace", count });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Internal server error", error: err.message });
    }
  });

  app.get('/api/marketplace/search', async (req, res) => {
    try {
      const { q, category, minPrice, maxPrice } = req.query;
      const products = await storage.searchMarketplaceProducts({
        query: q as string,
        category: category as string,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      });
      res.json(products);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/marketplace/categories', async (req, res) => {
    try {
      const categories = await storage.getMarketplaceCategories();
      res.json(categories);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/marketplace/products', async (req, res) => {
    try {
      const user = req.user || { id: 1 };
      let imageUrl = req.body.imageUrl;

      if (req.body.imageBase64) {
        const uploadedUrl = await uploadToCloudinary(req.body.imageBase64);
        imageUrl = uploadedUrl;
      }

      const product = await storage.createMarketplaceProduct({
        ...req.body,
        imageUrl,
        sellerId: user.id,
      });

      res.status(201).json(product);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch('/api/marketplace/products/:id', requireAuth, async (req, res) => {
    try {
      const productId = Number(req.params.id);
      const user = req.user as any;
      
      const product = await storage.updateMarketplaceProduct(productId, req.body, user.id);
      res.json(product);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/marketplace/products/:id', requireAuth, async (req, res) => {
    try {
      const productId = Number(req.params.id);
      const user = req.user as any;
      
      await storage.deleteMarketplaceProduct(productId, user.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Reels ────────────────────────────────────────────────────────────────────
  app.get('/api/reels', async (req, res) => {
    try {
      const reels = await storage.getReels();
      res.json(reels);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/reels/:id', async (req, res) => {
    try {
      const reelId = Number(req.params.id);
      const reel = await storage.getReel(reelId);
      if (!reel) {
        return res.status(404).json({ message: "Reel no encontrado" });
      }
      res.json(reel);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/reels', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      let videoUrl = req.body.videoUrl;
      let thumbnailUrl = req.body.thumbnailUrl;

      if (req.body.videoBase64) {
        videoUrl = await uploadToCloudinary(req.body.videoBase64);
      }
      if (req.body.thumbnailBase64) {
        thumbnailUrl = await uploadToCloudinary(req.body.thumbnailBase64);
      }

      const reel = await storage.createReel({
        ...req.body,
        videoUrl,
        thumbnailUrl,
        userId: user.id,
      });

      res.status(201).json(reel);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/reels/:id', requireAuth, async (req, res) => {
    try {
      const reelId = Number(req.params.id);
      const user = req.user as any;
      
      await storage.deleteReel(reelId, user.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Reel Comments ────────────────────────────────────────────────────────────
  app.get('/api/reels/:id/comments', async (req, res) => {
    try {
      const reelId = Number(req.params.id);
      const comments = await storage.getReelComments(reelId);
      res.json(comments);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/reels/:id/comments', requireAuth, async (req, res) => {
    try {
      const reelId = Number(req.params.id);
      const user = req.user as any;
      
      const comment = await storage.createReelComment(reelId, {
        content: req.body.content,
        userId: user.id,
      });

      res.status(201).json(comment);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Reel Reactions ───────────────────────────────────────────────────────────
  app.get('/api/reels/:id/reactions', async (req, res) => {
    try {
      const reelId = Number(req.params.id);
      const userId = (req.user as any)?.id;
      
      const reactions = await storage.getReelReactions(reelId, userId);
      res.json(reactions);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/reels/:id/reactions', requireAuth, async (req, res) => {
    try {
      const reelId = Number(req.params.id);
      const user = req.user as any;
      const { type } = req.body;

      await storage.upsertReelReaction(user.id, reelId, type);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/reels/:id/reactions', requireAuth, async (req, res) => {
    try {
      const reelId = Number(req.params.id);
      const user = req.user as any;

      await storage.removeReelReaction(user.id, reelId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Minigames ────────────────────────────────────────────────────────────────
  app.get('/api/minigames/daily', async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      let game = await storage.getDailyMinigame(today);
      
      if (!game) {
        // Generar un nuevo juego para hoy
        game = await storage.generateDailyMinigame(today);
        if (!game) {
          return res.status(404).json({ message: "No se pudo generar el juego diario" });
        }
      }

      res.json(game);
    } catch (err: any) {
      console.error("Error en /api/minigames/daily:", err.message);
      res.status(500).json({ message: "Error al cargar el desafío diario", error: err.message });
    }
  });

  app.post('/api/minigames/submit', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { gameId, answer } = req.body;

      if (!gameId || !answer) {
        return res.status(400).json({ message: "gameId y answer son requeridos" });
      }

      const result = await storage.submitGameAnswer(user.id, gameId, answer);
      
      if (result.isCorrect) {
        await storage.updateUserPoints(user.id, result.points);
      }

      res.status(201).json(result);
    } catch (err: any) {
      console.error("Error en /api/minigames/submit:", err.message);
      res.status(500).json({ message: "Error al enviar respuesta", error: err.message });
    }
  });

  app.get('/api/minigames/history', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user || !user.id) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      const history = await storage.getGameHistory(user.id);
      res.json(history || []);
    } catch (err: any) {
      console.error("Error en /api/minigames/history:", err.message);
      res.status(500).json({ message: "Error al obtener historial", error: err.message });
    }
  });

  // ─── Search (Global) ──────────────────────────────────────────────────────────
  app.get('/api/search', async (req, res) => {
    try {
      const queryRaw = (req.query.q as string) || "";
      const query = queryRaw.trim();

      if (query.length < 2) {
        return res.json({ users: [], posts: [] });
      }

      const results = await storage.globalSearch(query);
      res.json(results);
    } catch (err) {
      console.error("Error in /api/search", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}