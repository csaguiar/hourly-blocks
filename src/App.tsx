import { useState, useEffect, useCallback } from 'react'
import { format, addDays, addWeeks, subWeeks, startOfWeek } from 'date-fns'
import type { Category, BlockMap } from './types'
import * as api from './api'
import WeeklyGrid from './components/WeeklyGrid'
import CategoryManager from './components/CategoryManager'
import ReportModal from './components/ReportModal'
import DailyReportModal from './components/DailyReportModal'
import EarningsConfigModal from './components/EarningsConfigModal'
import WeeklySummary from './components/WeeklySummary'

function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 }) // Monday
}

function getWeekEnd(weekStart: Date): string {
  return format(addDays(weekStart, 6), 'yyyy-MM-dd')
}

export default function App() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [categories, setCategories] = useState<Category[]>([])
  const [blocks, setBlocks] = useState<BlockMap>({})

  const weekStartStr = format(weekStart, 'yyyy-MM-dd')
  const weekEndStr = getWeekEnd(weekStart)

  const loadCategories = useCallback(async () => {
    const cats = await api.fetchCategories()
    setCategories(cats)
  }, [])

  const loadBlocks = useCallback(async () => {
    const data = await api.fetchBlocks(weekStartStr, weekEndStr)
    const map: BlockMap = {}
    for (const block of data) {
      const dateKey = block.date.split('T')[0]
      if (!map[dateKey]) map[dateKey] = {}
      map[dateKey][block.hour] = { ...block, date: dateKey }
    }
    setBlocks(map)
  }, [weekStartStr, weekEndStr])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    loadBlocks()
  }, [loadBlocks])

  async function handleBlockChange(date: string, hour: number, categoryId: number | null, isPrep: boolean) {
    setBlocks((prev) => {
      const next = { ...prev }
      if (!next[date]) next[date] = {}
      if (categoryId === null) {
        delete next[date][hour]
      } else {
        const cat = categories.find((c) => c.id === categoryId)
        next[date] = {
          ...next[date],
          [hour]: {
            id: 0,
            date,
            hour,
            category_id: categoryId,
            category_name: cat?.name ?? null,
            category_color: cat?.color ?? null,
            is_prep: isPrep,
          },
        }
      }
      return next
    })
    await api.setBlock(date, hour, categoryId, isPrep)
  }

  const weekLabel = `${format(weekStart, 'MMM d')} – ${format(addWeeks(weekStart, -1 / 7 * 0 + 1), 'MMM d, yyyy')}`

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hourly Blocks</h1>
          <p className="text-sm text-gray-400 mt-0.5">Weekly time tracker</p>
        </div>
        <div className="flex items-center gap-3">
          <ReportModal categories={categories} />
          <DailyReportModal categories={categories} />
          <EarningsConfigModal categories={categories} onUpdate={loadCategories} />
          <CategoryManager categories={categories} onUpdate={loadCategories} />
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => setWeekStart((d) => subWeeks(d, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <span className="text-lg font-semibold text-gray-700">
            {format(weekStart, 'MMMM d')} – {format(addDays(weekStart, 6), 'MMMM d, yyyy')}
          </span>
        </div>
        <button
          onClick={() => setWeekStart((d) => addWeeks(d, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          onClick={() => setWeekStart(getWeekStart(new Date()))}
          className="ml-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          Today
        </button>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <WeeklyGrid
          weekStart={weekStart}
          blocks={blocks}
          categories={categories}
          onBlockChange={handleBlockChange}
        />
        <WeeklySummary blocks={blocks} categories={categories} />
      </div>
    </div>
  )
}
