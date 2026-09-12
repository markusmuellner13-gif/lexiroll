import { createClient, type Client } from "@libsql/client";

let client: Client | null = null;
let schemaReady: Promise<void> | null = null;

/**
 * The libSQL/Turso handle, or null when no database is configured.
 * Solo play never touches this - only multiplayer needs it.
 */
export function db(): Client | null {
  if (client) return client;
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) return null;
  client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  return client;
}

export function isDbConfigured(): boolean {
  return !!process.env.TURSO_DATABASE_URL;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS rooms (
     code TEXT PRIMARY KEY,
     host_id TEXT NOT NULL,
     settings TEXT NOT NULL,
     phase TEXT NOT NULL,
     round_no INTEGER NOT NULL DEFAULT 0,
     used_letters TEXT NOT NULL DEFAULT '[]',
     phase_at INTEGER NOT NULL DEFAULT 0,
     created_at INTEGER NOT NULL,
     updated_at INTEGER NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS players (
     room_code TEXT NOT NULL,
     id TEXT NOT NULL,
     name TEXT NOT NULL,
     emoji TEXT NOT NULL,
     kind TEXT NOT NULL DEFAULT 'human',
     skill REAL,
     pace REAL,
     score INTEGER NOT NULL DEFAULT 0,
     is_host INTEGER NOT NULL DEFAULT 0,
     joined_at INTEGER NOT NULL,
     last_seen INTEGER NOT NULL,
     PRIMARY KEY (room_code, id)
   )`,
  `CREATE TABLE IF NOT EXISTS rounds (
     room_code TEXT NOT NULL,
     round_no INTEGER NOT NULL,
     letter TEXT NOT NULL,
     started_at INTEGER NOT NULL,
     ends_at INTEGER,
     stopped_at INTEGER,
     stopped_by TEXT,
     bot_plans TEXT NOT NULL DEFAULT '[]',
     result TEXT,
     PRIMARY KEY (room_code, round_no)
   )`,
  `CREATE TABLE IF NOT EXISTS submissions (
     room_code TEXT NOT NULL,
     round_no INTEGER NOT NULL,
     player_id TEXT NOT NULL,
     answers TEXT NOT NULL,
     submitted_at INTEGER NOT NULL,
     PRIMARY KEY (room_code, round_no, player_id)
   )`,
  `CREATE TABLE IF NOT EXISTS vetoes (
     room_code TEXT NOT NULL,
     round_no INTEGER NOT NULL,
     voter_id TEXT NOT NULL,
     target TEXT NOT NULL,
     PRIMARY KEY (room_code, round_no, voter_id, target)
   )`,
  `CREATE TABLE IF NOT EXISTS word_banks (
     key TEXT PRIMARY KEY,
     label TEXT NOT NULL,
     bank TEXT NOT NULL,
     created_at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_rooms_updated ON rooms (updated_at)`,
];

/** Creates the tables once per warm instance. Cheap and idempotent. */
export async function ensureSchema(): Promise<Client | null> {
  const c = db();
  if (!c) return null;
  if (!schemaReady) {
    schemaReady = (async () => {
      for (const statement of SCHEMA) await c.execute(statement);
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  await schemaReady;
  return c;
}

export async function getBankCache(lang: string, key: string): Promise<Record<string, string[]> | null> {
  const c = await ensureSchema().catch(() => null);
  if (!c || !key) return null;
  try {
    const res = await c.execute({ sql: "SELECT bank FROM word_banks WHERE key = ?", args: [`${lang}:${key}`] });
    const row = res.rows[0];
    return row ? (JSON.parse(String(row.bank)) as Record<string, string[]>) : null;
  } catch {
    return null;
  }
}

export async function putBankCache(lang: string, key: string, label: string, bank: Record<string, string[]>) {
  const c = await ensureSchema().catch(() => null);
  if (!c || !key) return;
  try {
    await c.execute({
      sql: "INSERT OR REPLACE INTO word_banks (key, label, bank, created_at) VALUES (?, ?, ?, ?)",
      args: [`${lang}:${key}`, label, JSON.stringify(bank), Date.now()],
    });
  } catch {
    /* caching is best effort */
  }
}
