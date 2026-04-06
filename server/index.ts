import express from 'express'
import cors from 'cors'
import pool from './db.js'

const app = express()
app.use(cors())
app.use(express.json())

// --- Categories ---

app.get('/api/categories', async (_req, res) => {
  const result = await pool.query('SELECT * FROM categories ORDER BY sort_order, id')
  res.json(result.rows)
})

app.post('/api/categories', async (req, res) => {
  const { name, color, sort_order } = req.body
  const result = await pool.query(
    'INSERT INTO categories (name, color, sort_order) VALUES ($1, $2, $3) RETURNING *',
    [name, color || '#3B82F6', sort_order ?? 0]
  )
  res.status(201).json(result.rows[0])
})

app.put('/api/categories/:id', async (req, res) => {
  const { name, color, sort_order } = req.body
  const result = await pool.query(
    'UPDATE categories SET name = COALESCE($1, name), color = COALESCE($2, color), sort_order = COALESCE($3, sort_order) WHERE id = $4 RETURNING *',
    [name, color, sort_order, req.params.id]
  )
  if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' })
  res.json(result.rows[0])
})

app.delete('/api/categories/:id', async (req, res) => {
  await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id])
  res.status(204).end()
})

// --- Blocks ---

// Get blocks for a date range
app.get('/api/blocks', async (req, res) => {
  const { start, end } = req.query
  if (!start || !end) return res.status(400).json({ error: 'start and end query params required' })
  const result = await pool.query(
    `SELECT b.id, b.date, b.hour, b.category_id, b.is_prep, c.name as category_name, c.color as category_color
     FROM blocks b
     LEFT JOIN categories c ON b.category_id = c.id
     WHERE b.date >= $1 AND b.date <= $2
     ORDER BY b.date, b.hour`,
    [start, end]
  )
  res.json(result.rows)
})

// Set a block (upsert)
app.put('/api/blocks', async (req, res) => {
  const { date, hour, category_id, is_prep } = req.body
  if (category_id === null) {
    // Clear the block
    await pool.query('DELETE FROM blocks WHERE date = $1 AND hour = $2', [date, hour])
    return res.status(204).end()
  }
  const result = await pool.query(
    `INSERT INTO blocks (date, hour, category_id, is_prep)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (date, hour)
     DO UPDATE SET category_id = $3, is_prep = $4
     RETURNING *`,
    [date, hour, category_id, is_prep ?? false]
  )
  res.json(result.rows[0])
})

// --- Report ---

app.get('/api/report', async (req, res) => {
  const { start, end } = req.query
  if (!start || !end) return res.status(400).json({ error: 'start and end query params required' })
  const result = await pool.query(
    `SELECT
       category_id,
       COUNT(*)::int AS hours,
       COUNT(DISTINCT date)::int AS days
     FROM blocks
     WHERE date >= $1 AND date <= $2
       AND is_prep = false
       AND category_id IS NOT NULL
     GROUP BY category_id`,
    [start, end]
  )
  res.json(result.rows)
})

// --- Daily Report ---

app.get('/api/report/daily', async (req, res) => {
  const { start, end, category_id } = req.query
  if (!start || !end || !category_id) return res.status(400).json({ error: 'start, end, and category_id query params required' })
  const result = await pool.query(
    `SELECT date, COUNT(*)::int AS hours
     FROM blocks
     WHERE date >= $1 AND date <= $2
       AND category_id = $3
       AND is_prep = false
     GROUP BY date
     ORDER BY date`,
    [start, end, category_id]
  )
  res.json(result.rows)
})

const PORT = process.env.API_PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
