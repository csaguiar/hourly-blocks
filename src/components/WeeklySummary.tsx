import { useMemo } from 'react'
import type { Category, BlockMap } from '../types'

interface Props {
  blocks: BlockMap
  categories: Category[]
}

export default function WeeklySummary({ blocks, categories }: Props) {
  const summary = useMemo(() => {
    const counts = new Map<number, number>()

    for (const dateBlocks of Object.values(blocks)) {
      for (const block of Object.values(dateBlocks)) {
        if (block.category_id !== null && !block.is_prep) {
          counts.set(block.category_id, (counts.get(block.category_id) || 0) + 1)
        }
      }
    }

    return categories
      .map((cat) => ({ ...cat, hours: counts.get(cat.id) || 0 }))
      .filter((cat) => cat.hours > 0)
      .sort((a, b) => b.hours - a.hours)
  }, [blocks, categories])

  const total = summary.reduce((sum, cat) => sum + cat.hours, 0)

  if (summary.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-4 mt-4 px-2">
      {summary.map((cat) => (
        <div key={cat.id} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: cat.color }}
          />
          <span className="text-sm text-gray-600">
            {cat.name}: <span className="font-semibold text-gray-800">{cat.hours}h</span>
          </span>
        </div>
      ))}
      <div className="border-l border-gray-200 pl-4 ml-1">
        <span className="text-sm text-gray-500">
          Total: <span className="font-semibold text-gray-800">{total}h</span>
        </span>
      </div>
    </div>
  )
}
