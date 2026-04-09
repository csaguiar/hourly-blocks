import express from 'express'
import cors from 'cors'
import db from './db.js'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const distDir = join(rootDir, 'dist')

const app = express()
app.use(cors())
app.use(express.json())

// --- Migrations ---

const columns = db.prepare("PRAGMA table_info(categories)").all() as { name: string }[]
const columnNames = columns.map(c => c.name)
if (!columnNames.includes('rate_type')) {
  db.exec("ALTER TABLE categories ADD COLUMN rate_type TEXT DEFAULT NULL")
}
if (!columnNames.includes('rate')) {
  db.exec("ALTER TABLE categories ADD COLUMN rate REAL DEFAULT NULL")
}

// --- Categories ---

app.get('/api/categories', (_req, res) => {
  const rows = db.prepare('SELECT * FROM categories ORDER BY sort_order, id').all()
  res.json(rows)
})

app.post('/api/categories', (req, res) => {
  const { name, color, sort_order, rate_type, rate } = req.body
  const result = db.prepare(
    'INSERT INTO categories (name, color, sort_order, rate_type, rate) VALUES (?, ?, ?, ?, ?)'
  ).run(name, color || '#3B82F6', sort_order ?? 0, rate_type ?? null, rate ?? null)
  const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(row)
})

app.put('/api/categories/:id', (req, res) => {
  const { name, color, sort_order, rate_type, rate } = req.body
  // For rate_type and rate, we need to distinguish between "not provided" (undefined) and "clear it" (null)
  const hasRateType = 'rate_type' in req.body
  const hasRate = 'rate' in req.body
  const result = db.prepare(
    `UPDATE categories SET
      name = COALESCE(?, name),
      color = COALESCE(?, color),
      sort_order = COALESCE(?, sort_order),
      rate_type = CASE WHEN ? THEN ? ELSE rate_type END,
      rate = CASE WHEN ? THEN ? ELSE rate END
    WHERE id = ?`
  ).run(name, color, sort_order, hasRateType ? 1 : 0, rate_type ?? null, hasRate ? 1 : 0, rate ?? null, req.params.id)
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' })
  const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id)
  res.json(row)
})

app.delete('/api/categories/:id', (req, res) => {
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id)
  res.status(204).end()
})

// --- Blocks ---

app.get('/api/blocks', (req, res) => {
  const { start, end } = req.query
  if (!start || !end) return res.status(400).json({ error: 'start and end query params required' })
  const rows = db.prepare(
    `SELECT b.id, b.date, b.hour, b.category_id, b.is_prep, c.name as category_name, c.color as category_color
     FROM blocks b
     LEFT JOIN categories c ON b.category_id = c.id
     WHERE b.date >= ? AND b.date <= ?
     ORDER BY b.date, b.hour`
  ).all(start, end)
  // Convert is_prep from 0/1 to boolean
  res.json((rows as any[]).map(r => ({ ...r, is_prep: !!r.is_prep })))
})

app.put('/api/blocks', (req, res) => {
  const { date, hour, category_id, is_prep } = req.body
  if (category_id === null) {
    db.prepare('DELETE FROM blocks WHERE date = ? AND hour = ?').run(date, hour)
    return res.status(204).end()
  }
  const result = db.prepare(
    `INSERT INTO blocks (date, hour, category_id, is_prep)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (date, hour)
     DO UPDATE SET category_id = excluded.category_id, is_prep = excluded.is_prep`
  ).run(date, hour, category_id, is_prep ? 1 : 0)
  const row = db.prepare('SELECT * FROM blocks WHERE id = ?').get(result.lastInsertRowid)
  res.json(row)
})

// --- Report ---

app.get('/api/report', (req, res) => {
  const { start, end } = req.query
  if (!start || !end) return res.status(400).json({ error: 'start and end query params required' })
  const rows = db.prepare(
    `SELECT
       category_id,
       COUNT(*) AS hours,
       COUNT(DISTINCT date) AS days
     FROM blocks
     WHERE date >= ? AND date <= ?
       AND is_prep = 0
       AND category_id IS NOT NULL
     GROUP BY category_id`
  ).all(start, end)
  res.json(rows)
})

// --- Daily Report ---

app.get('/api/report/daily', (req, res) => {
  const { start, end, category_id } = req.query
  if (!start || !end || !category_id) return res.status(400).json({ error: 'start, end, and category_id query params required' })
  const rows = db.prepare(
    `SELECT date, COUNT(*) AS hours
     FROM blocks
     WHERE date >= ? AND date <= ?
       AND category_id = ?
       AND is_prep = 0
     GROUP BY date
     ORDER BY date`
  ).all(start, end, category_id)
  res.json(rows)
})

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(join(distDir, 'index.html'))
  })
}

const PORT = Number(process.env.PORT || process.env.API_PORT || 3001)
const HOST = process.env.HOST || '0.0.0.0'
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`)
})
