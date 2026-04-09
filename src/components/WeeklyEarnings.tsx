import { useMemo } from 'react'
import type { Category, BlockMap } from '../types'

interface Props {
  blocks: BlockMap
  categories: Category[]
}

interface EarningsRow {
  category: Category
  hours: number
  days: number
  earnings: number
}

export default function WeeklyEarnings({ blocks, categories }: Props) {
  const rows = useMemo(() => {
    const billableCategories = categories.filter((c) => c.rate_type && c.rate)

    if (billableCategories.length === 0) return []

    // Count hours and distinct days per category (non-prep only)
    const hourCounts = new Map<number, number>()
    const daySets = new Map<number, Set<string>>()

    for (const [date, dateBlocks] of Object.entries(blocks)) {
      for (const block of Object.values(dateBlocks)) {
        if (block.category_id !== null && !block.is_prep) {
          hourCounts.set(block.category_id, (hourCounts.get(block.category_id) || 0) + 1)
          if (!daySets.has(block.category_id)) daySets.set(block.category_id, new Set())
          daySets.get(block.category_id)!.add(date)
        }
      }
    }

    return billableCategories
      .map((cat): EarningsRow | null => {
        const hours = hourCounts.get(cat.id) || 0
        const days = daySets.get(cat.id)?.size || 0
        if (hours === 0) return null

        const earnings =
          cat.rate_type === 'hourly'
            ? hours * cat.rate!
            : days * cat.rate! // daily: charge per distinct day

        return { category: cat, hours, days, earnings }
      })
      .filter((r): r is EarningsRow => r !== null)
      .sort((a, b) => b.earnings - a.earnings)
  }, [blocks, categories])

  if (rows.length === 0) return null

  const totalEarnings = rows.reduce((sum, r) => sum + r.earnings, 0)

  return (
    <div className="mt-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-5">
      <h3 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Weekly Earnings
      </h3>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.category.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: row.category.color }}
              />
              <span className="text-sm text-gray-700 truncate">{row.category.name}</span>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {row.category.rate_type === 'hourly'
                  ? `${row.hours}h x $${row.category.rate}`
                  : `${row.days}d x $${row.category.rate}`}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-800 ml-4">
              ${row.earnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-emerald-200">
        <span className="text-sm font-semibold text-emerald-800">Total</span>
        <span className="text-lg font-bold text-emerald-700">
          ${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  )
}
