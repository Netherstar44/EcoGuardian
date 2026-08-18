import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Run lightweight startup migrations to add columns that may not yet exist
export async function runStartupMigrations() {
  const migrations = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number TEXT`,
  ];
  for (const sql of migrations) {
    try {
      await pool.query(sql);
    } catch (err: any) {
      // Non-fatal: log and continue
      console.warn("[migration] Skipped:", sql, "→", err.message);
    }
  }
}
