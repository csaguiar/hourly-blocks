import pg from 'pg'

const DB_NAME = process.env.DB_NAME || 'hourly_blocks'

async function setup() {
  // Connect to default 'postgres' database to create our database
  const adminPool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: 'postgres',
    user: process.env.DB_USER || process.env.USER,
    password: process.env.DB_PASSWORD || '',
  })

  try {
    const existing = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [DB_NAME]
    )
    if (existing.rowCount === 0) {
      await adminPool.query(`CREATE DATABASE ${DB_NAME}`)
      console.log(`Database "${DB_NAME}" created.`)
    } else {
      console.log(`Database "${DB_NAME}" already exists.`)
    }
  } finally {
    await adminPool.end()
  }

  // Connect to our database to create tables
  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: DB_NAME,
    user: process.env.DB_USER || process.env.USER,
    password: process.env.DB_PASSWORD || '',
  })

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS blocks (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        is_prep BOOLEAN NOT NULL DEFAULT false,
        UNIQUE(date, hour)
      );

      CREATE INDEX IF NOT EXISTS idx_blocks_date ON blocks(date);
    `)

    // Seed default categories if empty
    const count = await pool.query('SELECT COUNT(*) FROM categories')
    if (parseInt(count.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO categories (name, color, sort_order) VALUES
          ('Personal',   '#94A3B8', 0),
          ('Admin',      '#3B82F6', 1),
          ('Neural',     '#60A5FA', 2),
          ('Oncoustics', '#34D399', 3),
          ('Myant',      '#A78BFA', 4),
          ('Jaku',       '#10B981', 5),
          ('Course',     '#F59E0B', 6)
      `)
      console.log('Default categories seeded.')
    }

    console.log('Tables created successfully.')
  } finally {
    await pool.end()
  }
}

setup().catch((err) => {
  console.error('Setup failed:', err)
  process.exit(1)
})
