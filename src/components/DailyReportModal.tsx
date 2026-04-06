import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { format, startOfWeek, addDays } from 'date-fns'
import type { Category } from '../types'

interface DailyRow {
  date: string
  hours: number
}

interface WeeklyRow {
  weekStart: string
  weekEnd: string
  hours: number
}

type Tab = 'daily' | 'weekly'

interface Props {
  categories: Category[]
}

export default function DailyReportModal({ categories }: Props) {
  const [open, setOpen] = useState(false)
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [report, setReport] = useState<DailyRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<Tab>('daily')
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      setReport(null)
      setCopied(false)
      setTab('daily')
    }
  }, [open])

  function formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-')
    return `${month}/${day}/${year}`
  }

  const weeklyReport = useMemo<WeeklyRow[]>(() => {
    if (!report || report.length === 0) return []
    const weekMap = new Map<string, number>()
    const weekEnds = new Map<string, string>()
    for (const row of report) {
      const d = new Date(row.date + 'T00:00:00')
      const ws = startOfWeek(d, { weekStartsOn: 1 })
      const we = addDays(ws, 6)
      const key = format(ws, 'yyyy-MM-dd')
      weekMap.set(key, (weekMap.get(key) || 0) + row.hours)
      weekEnds.set(key, format(we, 'yyyy-MM-dd'))
    }
    return Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekStart, hours]) => ({
        weekStart,
        weekEnd: weekEnds.get(weekStart)!,
        hours,
      }))
  }, [report])

  async function generate() {
    if (!categoryId) return
    setLoading(true)
    setCopied(false)
    try {
      const res = await fetch(`/api/report/daily?start=${startDate}&end=${endDate}&category_id=${categoryId}`)
      const data: { date: string; hours: number }[] = await res.json()
      const rows: DailyRow[] = data.map((d) => ({
        date: d.date.split('T')[0],
        hours: d.hours,
      }))
      setReport(rows)
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard() {
    if (!report) return
    setCopied(false)
    let csv: string
    if (tab === 'daily') {
      const lines = ['Date,Hours']
      for (const row of report) {
        lines.push(`${formatDate(row.date)},${row.hours}`)
      }
      csv = lines.join('\n')
    } else {
      const lines = ['Week,Hours']
      for (const row of weeklyReport) {
        lines.push(`${formatDate(row.weekStart)} - ${formatDate(row.weekEnd)},${row.hours}`)
      }
      csv = lines.join('\n')
    }
    navigator.clipboard.writeText(csv)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Generate Daily
      </button>
    )
  }

  const totalHours = report?.reduce((s, r) => s + r.hours, 0) ?? 0
  const selectedCat = categories.find((c) => c.id === categoryId)

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
    >
      <div ref={modalRef} className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg p-6 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-800">Generate Daily</h2>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex items-end gap-3 mb-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-600 mb-1">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-600 mb-1">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
          </div>
        </div>

        <div className="flex items-end gap-3 mb-5">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white"
            >
              <option value="">Select category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={generate}
            disabled={loading || !categoryId}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Generate'}
          </button>
        </div>

        {report && (
          <div className="border-t border-gray-100 pt-4 flex-1 overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                {selectedCat && (
                  <span className="flex items-center gap-2 mr-3">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: selectedCat.color }} />
                    <span className="text-sm font-medium text-gray-700">{selectedCat.name}</span>
                  </span>
                )}
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => { setTab('daily'); setCopied(false) }}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      tab === 'daily'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => { setTab('weekly'); setCopied(false) }}
                    className={`px-3 py-1 text-xs font-medium border-l border-gray-200 transition-colors ${
                      tab === 'weekly'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Weekly
                  </button>
                </div>
              </div>
              <button
                onClick={copyToClipboard}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  copied
                    ? 'text-green-700 bg-green-50 border border-green-200'
                    : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {copied ? 'Copied!' : 'Copy to clipboard'}
              </button>
            </div>

            {tab === 'daily' ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wider">
                    <th className="pb-2 font-semibold">Date</th>
                    <th className="pb-2 font-semibold text-right">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map((row) => (
                    <tr key={row.date} className="border-t border-gray-50">
                      <td className="py-2 text-gray-700">{formatDate(row.date)}</td>
                      <td className="py-2 text-right font-medium text-gray-700">{row.hours}</td>
                    </tr>
                  ))}
                  {report.length === 0 && (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-gray-400 text-sm">No hours found for this period</td>
                    </tr>
                  )}
                  {report.length > 0 && (
                    <tr className="border-t border-gray-200 font-semibold text-gray-800">
                      <td className="py-2">Total</td>
                      <td className="py-2 text-right">{totalHours}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wider">
                    <th className="pb-2 font-semibold">Week</th>
                    <th className="pb-2 font-semibold text-right">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyReport.map((row) => (
                    <tr key={row.weekStart} className="border-t border-gray-50">
                      <td className="py-2 text-gray-700">{formatDate(row.weekStart)} - {formatDate(row.weekEnd)}</td>
                      <td className="py-2 text-right font-medium text-gray-700">{row.hours}</td>
                    </tr>
                  ))}
                  {weeklyReport.length === 0 && (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-gray-400 text-sm">No hours found for this period</td>
                    </tr>
                  )}
                  {weeklyReport.length > 0 && (
                    <tr className="border-t border-gray-200 font-semibold text-gray-800">
                      <td className="py-2">Total</td>
                      <td className="py-2 text-right">{totalHours}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
