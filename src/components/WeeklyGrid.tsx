import { useMemo } from 'react'
import { format, addDays, startOfWeek } from 'date-fns'
import type { Category, BlockMap } from '../types'
import BlockCell from './BlockCell'

interface Props {
  weekStart: Date
  blocks: BlockMap
  categories: Category[]
  onBlockChange: (date: string, hour: number, categoryId: number | null, isPrep: boolean) => void
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 5) // 5:00 - 19:00
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function WeeklyGrid({ weekStart, blocks, categories, onBlockChange }: Props) {
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i)
      return {
        label: DAY_LABELS[i],
        date: format(date, 'yyyy-MM-dd'),
        shortDate: format(date, 'MM/dd'),
        isToday: format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
      }
    })
  }, [weekStart])

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-[900px] table-fixed">
        <thead>
          <tr>
            <th className="w-28 p-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider" />
            {days.map((day) => (
              <th key={day.date} className="p-2 text-center">
                <div className={`text-sm font-semibold ${day.isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                  {day.label}
                </div>
                <div className={`text-xs ${day.isToday ? 'text-blue-500 font-medium' : 'text-gray-400'}`}>
                  {day.shortDate}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map((hour) => (
            <tr key={hour} className="border-t border-gray-100">
              <td className="p-2 text-right text-sm font-medium text-gray-400 whitespace-nowrap">
                {hour}:00 – {hour + 1}:00
              </td>
              {days.map((day) => {
                const block = blocks[day.date]?.[hour]
                return (
                  <td key={day.date} className="p-1">
                    <BlockCell
                      categoryId={block?.category_id ?? null}
                      isPrep={block?.is_prep ?? false}
                      categories={categories}
                      onChange={(catId, prep) => onBlockChange(day.date, hour, catId, prep)}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
