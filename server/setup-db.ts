import db from './db.js'

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#3B82F6',
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    is_prep INTEGER NOT NULL DEFAULT 0,
    UNIQUE(date, hour)
  );

  CREATE INDEX IF NOT EXISTS idx_blocks_date ON blocks(date);
`)

// Seed default categories if empty
const count = db.prepare('SELECT COUNT(*) as cnt FROM categories').get() as { cnt: number }
if (count.cnt === 0) {
  const insert = db.prepare('INSERT INTO categories (name, color, sort_order) VALUES (?, ?, ?)')
  const seed = db.transaction(() => {
    insert.run('Personal', '#94A3B8', 0)
    insert.run('Admin', '#3B82F6', 1)
    insert.run('Neural', '#60A5FA', 2)
    insert.run('Oncoustics', '#34D399', 3)
    insert.run('Myant', '#A78BFA', 4)
    insert.run('Jaku', '#10B981', 5)
    insert.run('Course', '#F59E0B', 6)
  })
  seed()
  console.log('Default categories seeded.')
}

console.log('Database setup complete.')
db.close()
