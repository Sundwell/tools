import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'

const dbPath = resolve(process.cwd(), 'data/db.sqlite')
mkdirSync(dirname(dbPath), { recursive: true })

export const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')

export const db = drizzle(sqlite, { schema })

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    template TEXT NOT NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    invoice_date TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    hours REAL NOT NULL,
    rate REAL NOT NULL DEFAULT 28.0,
    status TEXT NOT NULL DEFAULT 'draft',
    pdf_path TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`)
