import { z } from 'zod';
import { insertReportSchema, insertCommentSchema, insertUserSchema, reports, users, comments } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({ email: z.string().email(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ message: z.string() })
      }
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    }
  },
  reports: {
    list: {
      method: 'GET' as const,
      path: '/api/reports' as const,
      responses: {
        200: z.array(z.custom<any>()), // ReportWithAuthor
      }
    },
    get: {
      method: 'GET' as const,
      path: '/api/reports/:id' as const,
      responses: {
        200: z.custom<any>(), // ReportDetails
        404: errorSchemas.notFound,
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/reports' as const,
      input: insertReportSchema.extend({ imageBase64: z.string().optional() }),
      responses: {
        201: z.custom<typeof reports.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    },
  },
  comments: {
    create: {
      method: 'POST' as const,
      path: '/api/comments' as const,
      input: insertCommentSchema,
      responses: {
        201: z.custom<typeof comments.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    }
  },
  leaderboard: {
    list: {
      method: 'GET' as const,
      path: '/api/leaderboard' as const,
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      }
    }
  },
  posts: {
    list: {
      method: 'GET' as const,
      path: '/api/posts' as const,
      responses: {
        200: z.array(z.custom<any>()), // PostWithAuthor
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/posts' as const,
      input: z.object({
        content: z.string(),
        category: z.string(),
        imageBase64: z.string().optional(),
      }),
      responses: {
        201: z.custom<any>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
