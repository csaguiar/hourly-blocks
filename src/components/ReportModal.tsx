import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { format } from 'date-fns'
import type { Category } from '../types'

interface ReportRow {
  category: Category
  hours: number
  days: number
}

interface Props {
  categories: Category[]
}

export default function ReportModal({ categories }: Props) {
  const [open, setOpen] = useState(false)
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [report, setReport] = useState<ReportRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      setReport(null)
    }
  }, [open])

  async function generate() {
    setLoading(true)
    try {
      const res = await fetch(`/api/report?start=${startDate}&end=${endDate}`)
      const data: { category_id: number; hours: number; days: number }[] = await res.json()

      const rows: ReportRow[] = data
        .map((d) => {
          const cat = categories.find((c) => c.id === d.category_id)
          if (!cat) return null
          return { category: cat, hours: d.hours, days: d.days }
        })
        .filter((r): r is ReportRow => r !== null)
        .sort((a, b) => b.hours - a.hours)

      setReport(rows)
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Generate Total
      </button>
    )
  }

  const totalHours = report?.reduce((s, r) => s + r.hours, 0) ?? 0
  const totalDays = report?.reduce((s, r) => s + r.days, 0) ?? 0

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
    >
      <div ref={modalRef} className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-800">Generate Total</h2>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex items-end gap-3 mb-5">
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
          <button
            onClick={generate}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Generate'}
          </button>
        </div>

        {report && (
          <div className="border-t border-gray-100 pt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs uppercase tracking-wider">
                  <th className="pb-2 font-semibold">Category</th>
                  <th className="pb-2 font-semibold text-right">Hours worked</th>
                  <th className="pb-2 font-semibold text-right">Days worked</th>
                </tr>
              </thead>
              <tbody>
                {report.map((row) => (
                  <tr key={row.category.id} className="border-t border-gray-50">
                    <td className="py-2 flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: row.category.color }}
                      />
                      {row.category.name}
                    </td>
                    <td className="py-2 text-right font-medium text-gray-700">{row.hours}</td>
                    <td className="py-2 text-right font-medium text-gray-700">{row.days}</td>
                  </tr>
                ))}
                <tr className="border-t border-gray-200 font-semibold text-gray-800">
                  <td className="py-2">Total</td>
                  <td className="py-2 text-right">{totalHours}</td>
                  <td className="py-2 text-right">{totalDays}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
