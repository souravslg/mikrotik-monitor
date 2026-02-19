
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'routers.db');
const db = new Database(dbPath);

// Initialize the database with the routers table
db.exec(`
  CREATE TABLE IF NOT EXISTS routers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    host TEXT NOT NULL,
    port INTEGER DEFAULT 8728,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export default db;
