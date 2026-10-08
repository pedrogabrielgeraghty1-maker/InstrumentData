import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

import type { ItemRecord } from "@/lib/db";

let database: Database.Database | undefined;

function getDatabase() {
  if (database) {
    return database;
  }

  const databasePath =
    process.env.SQLITE_DB_PATH ??
    path.join(process.cwd(), "data", "instrumentdata.sqlite");
  mkdirSync(path.dirname(databasePath), { recursive: true });

  database = new Database(databasePath);
  database.pragma("journal_mode = WAL");
  database.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_name TEXT NOT NULL,
      instrument_name TEXT NOT NULL,
      part_number TEXT NOT NULL,
      serial_number TEXT NOT NULL UNIQUE,
      photo_url TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_items_created_at
    ON items (created_at DESC);
  `);

  return database;
}

export function getLocalItems(): ItemRecord[] {
  return getDatabase()
    .prepare(
      `SELECT id, user_name, instrument_name, part_number, serial_number, photo_url, created_at
       FROM items
       ORDER BY created_at DESC, id DESC`,
    )
    .all() as ItemRecord[];
}

export function createLocalItem(input: {
  user_name: string;
  instrument_name: string;
  part_number: string;
  serial_number: string;
  photo_url: string | null;
}): ItemRecord {
  const result = getDatabase()
    .prepare(
      `INSERT INTO items (user_name, instrument_name, part_number, serial_number, photo_url)
       VALUES (@user_name, @instrument_name, @part_number, @serial_number, @photo_url)`,
    )
    .run(input);

  return getDatabase()
    .prepare(
      `SELECT id, user_name, instrument_name, part_number, serial_number, photo_url, created_at
       FROM items WHERE id = ?`,
    )
    .get(result.lastInsertRowid) as ItemRecord;
}

export function deleteLocalItem(id: number) {
  return getDatabase().prepare("DELETE FROM items WHERE id = ?").run(id)
    .changes > 0;
}