import 'dotenv/config';
import { pool } from "./db.js";

async function migrate() {
  try {
    // Migraciones existentes
    await pool.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP`);
    await pool.query(`ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP`);

    // Nuevas migraciones para posts, reels y datos extendidos de usuarios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_badges (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        badge_id TEXT NOT NULL,
        badge_name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        points_required INTEGER NOT NULL,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, badge_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS friendships (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'pending' NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        accepted_at TIMESTAMP,
        UNIQUE(user_id, friend_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS carbon_footprint (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        transport_co2 DOUBLE PRECISION DEFAULT 0,
        energy_co2 DOUBLE PRECISION DEFAULT 0,
        diet_co2 DOUBLE PRECISION DEFAULT 0,
        waste_co2 DOUBLE PRECISION DEFAULT 0,
        total_co2 DOUBLE PRECISION DEFAULT 0,
        month_year TEXT NOT NULL,
        city TEXT,
        climate TEXT,
        air_quality TEXT,
        air_quality_index INTEGER,
        thermal_sensation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, month_year)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketplace_products (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        currency TEXT DEFAULT 'USD',
        image_url TEXT,
        quantity INTEGER,
        status TEXT DEFAULT 'available' NOT NULL,
        rating DOUBLE PRECISION DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reels (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT,
        description TEXT,
        video_url TEXT NOT NULL,
        thumbnail_url TEXT,
        category TEXT NOT NULL,
        duration INTEGER,
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        edited_at TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reel_comments (
        id SERIAL PRIMARY KEY,
        reel_id INTEGER NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        edited_at TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reel_reactions (
        id SERIAL PRIMARY KEY,
        reel_id INTEGER NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, reel_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS minigames (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        question TEXT,
        options TEXT,
        correct_answer TEXT,
        difficulty TEXT DEFAULT 'medium',
        image_url TEXT,
        points INTEGER DEFAULT 10,
        day_date TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(day_date)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        game_id INTEGER NOT NULL REFERENCES minigames(id) ON DELETE CASCADE,
        answer TEXT,
        is_correct BOOLEAN DEFAULT false,
        points_earned INTEGER DEFAULT 0,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, game_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS trivia_questions (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        options TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        explanation TEXT,
        category TEXT NOT NULL,
        difficulty TEXT DEFAULT 'medium',
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Actualizar tabla users con nuevas columnas
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION`);

    console.log("✅ Todas las migraciones completadas exitosamente");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en migraciones:", error);
    process.exit(1);
  }
}

migrate().catch(console.error);
