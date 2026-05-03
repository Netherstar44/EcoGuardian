import { z } from 'zod';
import { insertReportSchema, insertCommentSchema, insertUserSchema, reports, users, comments, insertPostCommentSchema, postReactionTypeSchema, insertFriendshipSchema, insertCarbonFootprintSchema, insertMarketplaceProductSchema, insertReelSchema, insertReelCommentSchema, insertReelReactionSchema, insertMinigameSchema, insertGameHistorySchema, reelReactionTypeSchema } from './schema';

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
    },
    comments: {
      list: {
        method: 'GET' as const,
        path: '/api/posts/:id/comments' as const,
        responses: {
          200: z.array(z.custom<any>()), // PostComment with author
          404: errorSchemas.notFound,
        }
      },
      create: {
        method: 'POST' as const,
        path: '/api/posts/:id/comments' as const,
        input: z.object({ content: z.string(), imageBase64: z.string().optional() }),
        responses: {
          201: z.custom<any>(),
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
        }
      }
    },
    reactions: {
      get: {
        method: 'GET' as const,
        path: '/api/posts/:id/reactions' as const,
        responses: {
          200: z.object({
            counts: z.record(z.string(), z.number()),
            userReaction: z.string().nullable(),
          }),
          404: errorSchemas.notFound,
        }
      },
      set: {
        method: 'POST' as const,
        path: '/api/posts/:id/reactions' as const,
        input: z.object({ type: postReactionTypeSchema }),
        responses: {
          200: z.object({ success: z.boolean() }),
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
        }
      },
      remove: {
        method: 'DELETE' as const,
        path: '/api/posts/:id/reactions' as const,
        responses: {
          200: z.object({ success: z.boolean() }),
          401: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
        }
      }
    }
  },
  users: {
    getProfile: {
      method: 'GET' as const,
      path: '/api/users/:id' as const,
      responses: {
        200: z.custom<any>(),
        404: errorSchemas.notFound,
      }
    },
    updateProfile: {
      method: 'PATCH' as const,
      path: '/api/users/:id' as const,
      input: z.object({
        name: z.string().optional(),
        bio: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        avatar: z.string().optional(),
      }),
      responses: {
        200: z.custom<any>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      }
    },
  },
  carbon: {
    calculate: {
      method: 'POST' as const,
      path: '/api/carbon/calculate' as const,
      input: insertCarbonFootprintSchema,
      responses: {
        201: z.custom<any>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    },
    getHistory: {
      method: 'GET' as const,
      path: '/api/carbon/history' as const,
      responses: {
        200: z.array(z.custom<any>()),
      }
    },
    getCurrent: {
      method: 'GET' as const,
      path: '/api/carbon/current' as const,
      responses: {
        200: z.custom<any>(),
      }
    },
  },
  badges: {
    list: {
      method: 'GET' as const,
      path: '/api/badges/:userId' as const,
      responses: {
        200: z.array(z.custom<any>()),
      }
    },
  },
  friends: {
    list: {
      method: 'GET' as const,
      path: '/api/friends' as const,
      responses: {
        200: z.array(z.custom<any>()),
      }
    },
    add: {
      method: 'POST' as const,
      path: '/api/friends/add' as const,
      input: z.object({ friendId: z.number() }),
      responses: {
        201: z.custom<any>(),
        401: errorSchemas.unauthorized,
      }
    },
    accept: {
      method: 'PATCH' as const,
      path: '/api/friends/:id/accept' as const,
      responses: {
        200: z.custom<any>(),
        401: errorSchemas.unauthorized,
      }
    },
    remove: {
      method: 'DELETE' as const,
      path: '/api/friends/:id' as const,
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.unauthorized,
      }
    },
  },
  marketplace: {
    list: {
      method: 'GET' as const,
      path: '/api/marketplace/products' as const,
      responses: {
        200: z.array(z.custom<any>()),
      }
    },
    search: {
      method: 'GET' as const,
      path: '/api/marketplace/search' as const,
      responses: {
        200: z.array(z.custom<any>()),
      }
    },
    getCategories: {
      method: 'GET' as const,
      path: '/api/marketplace/categories' as const,
      responses: {
        200: z.array(z.string()),
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/marketplace/products' as const,
      input: insertMarketplaceProductSchema,
      responses: {
        201: z.custom<any>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/marketplace/products/:id' as const,
      input: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        price: z.number().optional(),
        quantity: z.number().optional(),
        status: z.string().optional(),
      }),
      responses: {
        200: z.custom<any>(),
        401: errorSchemas.unauthorized,
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/marketplace/products/:id' as const,
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.unauthorized,
      }
    },
  },
  reels: {
    list: {
      method: 'GET' as const,
      path: '/api/reels' as const,
      responses: {
        200: z.array(z.custom<any>()),
      }
    },
    get: {
      method: 'GET' as const,
      path: '/api/reels/:id' as const,
      responses: {
        200: z.custom<any>(),
        404: errorSchemas.notFound,
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/reels' as const,
      input: insertReelSchema,
      responses: {
        201: z.custom<any>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/reels/:id' as const,
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.unauthorized,
      }
    },
    comments: {
      list: {
        method: 'GET' as const,
        path: '/api/reels/:id/comments' as const,
        responses: {
          200: z.array(z.custom<any>()),
        }
      },
      create: {
        method: 'POST' as const,
        path: '/api/reels/:id/comments' as const,
        input: insertReelCommentSchema,
        responses: {
          201: z.custom<any>(),
          401: errorSchemas.unauthorized,
        }
      },
    },
    reactions: {
      get: {
        method: 'GET' as const,
        path: '/api/reels/:id/reactions' as const,
        responses: {
          200: z.object({
            counts: z.record(z.string(), z.number()),
            userReaction: z.string().nullable(),
          }),
        }
      },
      set: {
        method: 'POST' as const,
        path: '/api/reels/:id/reactions' as const,
        input: z.object({ type: reelReactionTypeSchema }),
        responses: {
          200: z.object({ success: z.boolean() }),
          401: errorSchemas.unauthorized,
        }
      },
      remove: {
        method: 'DELETE' as const,
        path: '/api/reels/:id/reactions' as const,
        responses: {
          200: z.object({ success: z.boolean() }),
          401: errorSchemas.unauthorized,
        }
      }
    }
  },
  minigames: {
    getDaily: {
      method: 'GET' as const,
      path: '/api/minigames/daily' as const,
      responses: {
        200: z.custom<any>(),
      }
    },
    submit: {
      method: 'POST' as const,
      path: '/api/minigames/submit' as const,
      input: z.object({ gameId: z.number(), answer: z.string() }),
      responses: {
        201: z.object({ isCorrect: z.boolean(), points: z.number(), message: z.string() }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    },
    getHistory: {
      method: 'GET' as const,
      path: '/api/minigames/history' as const,
      responses: {
        200: z.array(z.custom<any>()),
      }
    },
  },
  search: {
    global: {
      method: 'GET' as const,
      path: '/api/search' as const,
      responses: {
        200: z.object({
          users: z.array(z.custom<any>()),
          posts: z.array(z.custom<any>()),
        }),
      }
    },
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