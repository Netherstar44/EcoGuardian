import app from "../server/index.js";
import { runStartupMigrations } from "../server/db.js";

export default async function handler(req: any, res: any) {
  try {
    await runStartupMigrations();
  } catch (err) {
    console.error("[vercel api handler migration]", err);
  }
  return app(req, res);
}

