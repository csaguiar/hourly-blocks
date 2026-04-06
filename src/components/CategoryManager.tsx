import { useState } from 'react'
import type { Category } from '../types'
import * as api from '../api'

interface Props {
  categories: Category[]
  onUpdate: () => void
}

export default function CategoryManager({ categories, onUpdate }: Props) {
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#3B82F6')

  async function handleAdd() {
    if (!newName.trim()) return
    await api.createCategory({ name: newName.trim(), color: newColor, sort_order: categories.length })
    setNewName('')
    setNewColor('#3B82F6')
    onUpdate()
  }

  async function handleDelete(id: number) {
    await api.deleteCategory(id)
    onUpdate()
  }

  async function handleColorChange(id: number, color: string) {
    await api.updateCategory(id, { color })
    onUpdate()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Categories
      </button>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 w-80">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-700 text-sm">Manage Categories</h3>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-2 mb-3">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-2">
            <input
              type="color"
              value={cat.color}
              onChange={(e) => handleColorChange(cat.id, e.target.value)}
              className="w-7 h-7 rounded cursor-pointer border-0 p-0"
            />
            <span className="text-sm flex-1">{cat.name}</span>
            <button
              onClick={() => handleDelete(cat.id)}
              className="text-gray-300 hover:text-red-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border-0 p-0"
        />
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="New category..."
          className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400"
        />
        <button
          onClick={handleAdd}
          className="text-blue-500 hover:text-blue-700 text-sm font-medium"
        >
          Add
        </button>
      </div>
    </div>
  )
}
