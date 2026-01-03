import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error('TURSO_DATABASE_URL environment variable is not defined');
}

export const db = createClient({
  url,
  authToken,
});

// Helper for type safety
export interface Database {
  execute(sql: string, args?: any[]): Promise<any>;
  transaction(queries: string[]): Promise<any>;
}

export async function initDB() {
  const tableCreationQueries = [
    `CREATE TABLE IF NOT EXISTS personnel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sicil INTEGER UNIQUE,
      ad_soyad TEXT,
      gorev TEXT,
      grup TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS monthly_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sicil INTEGER,
      ay TEXT, -- YYYY-MM format
      kontrol_edilen_bagaj INTEGER DEFAULT 0,
      atilan_tip_sayisi INTEGER DEFAULT 0,
      yakalanan_tip INTEGER DEFAULT 0, -- Yeşil
      yanlis_alarm INTEGER DEFAULT 0, -- Sarı
      kacirilan_tip INTEGER DEFAULT 0, -- Kırmızı
      basari_orani REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(sicil) REFERENCES personnel(sicil),
      UNIQUE(sicil, ay)
    )`,
    `CREATE TABLE IF NOT EXISTS loaded_months (
      ay TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS group_summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ay TEXT,
      grup TEXT,
      toplam_personel INTEGER DEFAULT 0,
      toplam_bagaj INTEGER DEFAULT 0,
      toplam_test INTEGER DEFAULT 0,
      toplam_yesil INTEGER DEFAULT 0,
      toplam_sari INTEGER DEFAULT 0,
      toplam_kirmizi INTEGER DEFAULT 0,
      basari_orani REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(ay, grup)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_monthly_stats_ay ON monthly_stats(ay)`,
    `CREATE INDEX IF NOT EXISTS idx_personnel_grup ON personnel(grup)`,
    `CREATE INDEX IF NOT EXISTS idx_group_summaries_ay ON group_summaries(ay)`,

    // Phase 2: Exam System Tables
    // Phase 2: Exam System Tables (Updated Schema)
    `CREATE TABLE IF NOT EXISTS tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url TEXT NOT NULL,
      has_threat BOOLEAN DEFAULT 0,
      threat_type TEXT, -- 'knife', 'gun', etc. (NULL if clean)
      coordinate_x REAL, -- Normalized 0-1
      coordinate_y REAL, -- Normalized 0-1
      threat_polygon TEXT, -- JSON string of normalized points [{x,y}, ...]
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS test_packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      difficulty_level TEXT, -- 'easy', 'medium', 'hard'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS package_tests (
      package_id INTEGER,
      test_id INTEGER,
      order_index INTEGER,
      PRIMARY KEY (package_id, test_id),
      FOREIGN KEY(package_id) REFERENCES test_packages(id),
      FOREIGN KEY(test_id) REFERENCES tests(id)
    )`,

    `CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_sicil INTEGER,
      package_id INTEGER,
      assigned_by TEXT,
      type TEXT, -- 'mandatory', 'suggested'
      status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'expired'
      due_date DATETIME,
      completed_at DATETIME,
      score REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_sicil) REFERENCES personnel(sicil),
      FOREIGN KEY(package_id) REFERENCES test_packages(id)
    )`,

    `CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER,
      test_id INTEGER,
      user_click_x REAL,
      user_click_y REAL,
      user_choice TEXT, -- 'clean' or threat type
      is_correct BOOLEAN,
      distance_score REAL,
      duration_seconds INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(assignment_id) REFERENCES assignments(id),
      FOREIGN KEY(test_id) REFERENCES tests(id)
    )`,

    `CREATE TABLE IF NOT EXISTS login_tokens (
      code TEXT PRIMARY KEY,
      user_sicil INTEGER,
      expires_at DATETIME,
      is_used BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_sicil) REFERENCES personnel(sicil)
    )`,

    `CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_sicil INTEGER,
      message TEXT,
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const query of tableCreationQueries) {
    await db.execute(query);
  }

  console.log('Database initialized successfully with Turso');
}

// Auto-initialize when imported (best effort, or call explicitly in server startup)
// Note: In Serverless functions, we might want to ensure this runs once.
initDB().catch(console.error);
