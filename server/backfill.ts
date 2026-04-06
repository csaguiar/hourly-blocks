import db from './db.js'
import { execSync } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const xlsxPath = process.argv[2] || '/Users/cristiano/Downloads/Hourly plan (1).xlsx'
const pyScript = join(__dirname, 'extract_xlsx.py')
const result = execSync(`python3 "${pyScript}" "${xlsxPath}"`, { encoding: 'utf-8' })
const blocks: { date: string; hour: number; category: string; is_prep: boolean }[] = JSON.parse(result)

console.log(`Found ${blocks.length} blocks to import`)

// Get existing categories
const catRows = db.prepare('SELECT id, name FROM categories').all() as { id: number; name: string }[]
const catMap = new Map<string, number>(catRows.map(r => [r.name, r.id]))

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

const insertCat = db.prepare(
  'INSERT INTO categories (name, color, sort_order) VALUES (?, ?, (SELECT COALESCE(MAX(sort_order),0)+1 FROM categories))'
)

for (const name of missing) {
  const color = colors[name] || '#6B7280'
  const r = insertCat.run(name, color)
  catMap.set(name, Number(r.lastInsertRowid))
  console.log(`Created category: ${name}`)
}

// Insert blocks (upsert) in a transaction
const upsertBlock = db.prepare(
  `INSERT INTO blocks (date, hour, category_id, is_prep)
   VALUES (?, ?, ?, ?)
   ON CONFLICT (date, hour) DO UPDATE SET category_id = excluded.category_id, is_prep = excluded.is_prep`
)

let inserted = 0
const importAll = db.transaction(() => {
  for (const b of blocks) {
    const catId = catMap.get(b.category)
    if (!catId) continue
    upsertBlock.run(b.date, b.hour, catId, b.is_prep ? 1 : 0)
    inserted++
  }
})
importAll()

console.log(`Imported ${inserted} blocks`)
db.close()
