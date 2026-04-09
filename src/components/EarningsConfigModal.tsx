import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Category } from '../types'
import * as api from '../api'

interface Props {
  categories: Category[]
  onUpdate: () => void
}

interface RateConfig {
  rate_type: 'hourly' | 'daily' | null
  rate: number | null
}

export default function EarningsConfigModal({ categories, onUpdate }: Props) {
  const [open, setOpen] = useState(false)
  const [configs, setConfigs] = useState<Record<number, RateConfig>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      const initial: Record<number, RateConfig> = {}
      for (const cat of categories) {
        initial[cat.id] = { rate_type: cat.rate_type, rate: cat.rate }
      }
      setConfigs(initial)
    }
  }, [open, categories])

  function handleRateTypeChange(catId: number, value: string) {
    setConfigs((prev) => ({
      ...prev,
      [catId]: {
        ...prev[catId],
        rate_type: value === '' ? null : (value as 'hourly' | 'daily'),
        rate: value === '' ? null : prev[catId]?.rate,
      },
    }))
  }

  function handleRateChange(catId: number, value: string) {
    const num = value === '' ? null : parseFloat(value)
    setConfigs((prev) => ({
      ...prev,
      [catId]: { ...prev[catId], rate: num },
    }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const updates = categories
        .filter((cat) => {
          const cfg = configs[cat.id]
          return cfg && (cfg.rate_type !== cat.rate_type || cfg.rate !== cat.rate)
        })
        .map((cat) => {
          const cfg = configs[cat.id]
          return api.updateCategory(cat.id, { rate_type: cfg.rate_type, rate: cfg.rate })
        })
      await Promise.all(updates)
      onUpdate()
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Earnings
      </button>
    )
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
    >
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-800">Earnings Configuration</h2>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Set billing type and rate for each category. <strong>Hourly</strong> charges per hour worked.{' '}
          <strong>Daily</strong> charges a full day if any hours are logged that day.
        </p>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {categories.map((cat) => {
            const cfg = configs[cat.id] ?? { rate_type: null, rate: null }
            return (
              <div key={cat.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-sm font-medium text-gray-700 w-28 truncate flex-shrink-0">{cat.name}</span>
                <select
                  value={cfg.rate_type ?? ''}
                  onChange={(e) => handleRateTypeChange(cat.id, e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 bg-white"
                >
                  <option value="">No billing</option>
                  <option value="hourly">Per hour</option>
                  <option value="daily">Per day</option>
                </select>
                {cfg.rate_type && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-400">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={cfg.rate ?? ''}
                      onChange={(e) => handleRateChange(cat.id, e.target.value)}
                      placeholder="0.00"
                      className="w-24 text-sm border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400"
                    />
                    <span className="text-xs text-gray-400">/{cfg.rate_type === 'hourly' ? 'hr' : 'day'}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
