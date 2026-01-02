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
    `CREATE INDEX IF NOT EXISTS idx_group_summaries_ay ON group_summaries(ay)`
  ];

  for (const query of tableCreationQueries) {
    await db.execute(query);
  }

  console.log('Database initialized successfully with Turso');
}

// Auto-initialize when imported (best effort, or call explicitly in server startup)
// Note: In Serverless functions, we might want to ensure this runs once.
initDB().catch(console.error);
