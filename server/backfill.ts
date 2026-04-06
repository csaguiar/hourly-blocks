import pg from 'pg'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'hourly_blocks',
  user: process.env.DB_USER || process.env.USER,
  password: process.env.DB_PASSWORD || '',
})

async function backfill() {
  const xlsxPath = process.argv[2] || '/Users/cristiano/Downloads/Hourly plan (1).xlsx'
  const pyScript = join(__dirname, 'extract_xlsx.py')
  const result = execSync(`python3 "${pyScript}" "${xlsxPath}"`, { encoding: 'utf-8' })
  const blocks: { date: string; hour: number; category: string; is_prep: boolean }[] = JSON.parse(result)

  console.log(`Found ${blocks.length} blocks to import`)

  // Get existing categories
  const catResult = await pool.query('SELECT id, name FROM categories')
  const catMap = new Map<string, number>(catResult.rows.map((r: any) => [r.name, r.id]))

  // Find and create missing categories
  const missing = new Set<string>()
  for (const b of blocks) {
    if (!catMap.has(b.category)) missing.add(b.category)
  }

  const colors: Record<string, string> = {
    'Course': '#F59E0B',
    'Prep course': '#FBBF24',
    'Torpedo': '#EF4444',
  }

  for (const name of missing) {
    const color = colors[name] || '#6B7280'
    const r = await pool.query(
      'INSERT INTO categories (name, color, sort_order) VALUES ($1, $2, (SELECT COALESCE(MAX(sort_order),0)+1 FROM categories)) RETURNING id',
      [name, color]
    )
    catMap.set(name, r.rows[0].id)
    console.log(`Created category: ${name}`)
  }

  // Insert blocks (upsert)
  let inserted = 0
  for (const b of blocks) {
    const catId = catMap.get(b.category)
    if (!catId) continue
    await pool.query(
      `INSERT INTO blocks (date, hour, category_id, is_prep)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (date, hour) DO UPDATE SET category_id = $3, is_prep = $4`,
      [b.date, b.hour, catId, b.is_prep]
    )
    inserted++
  }

  console.log(`Imported ${inserted} blocks`)
  await pool.end()
}

backfill().catch((err) => {
  console.error('Backfill failed:', err)
  process.exit(1)
})
