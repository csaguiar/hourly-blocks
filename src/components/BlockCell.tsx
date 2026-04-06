import { useRef, useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { Category } from '../types'

interface Props {
  categoryId: number | null
  isPrep: boolean
  categories: Category[]
  onChange: (categoryId: number | null, isPrep: boolean) => void
}

function computePosition(buttonEl: HTMLElement, dropdownEl: HTMLElement) {
  const rect = buttonEl.getBoundingClientRect()
  const dropdownHeight = dropdownEl.offsetHeight
  const spaceBelow = window.innerHeight - rect.bottom
  if (spaceBelow < dropdownHeight + 8) {
    return { top: rect.top - dropdownHeight - 4, left: rect.left }
  }
  return { top: rect.bottom + 4, left: rect.left }
}

export default function BlockCell({ categoryId, isPrep, categories, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [localPrep, setLocalPrep] = useState(isPrep)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Sync local prep with prop when dropdown opens
  useEffect(() => {
    if (open) setLocalPrep(isPrep)
  }, [open, isPrep])

  const selected = categories.find((c) => c.id === categoryId)

  const repositionDropdown = useCallback(() => {
    if (buttonRef.current && dropdownRef.current) {
      const pos = computePosition(buttonRef.current, dropdownRef.current)
      dropdownRef.current.style.top = `${pos.top}px`
      dropdownRef.current.style.left = `${pos.left}px`
      dropdownRef.current.style.visibility = 'visible'
    }
  }, [])

  // Ref callback: fires when the portal div mounts
  const dropdownCallbackRef = useCallback((node: HTMLDivElement | null) => {
    (dropdownRef as React.MutableRefObject<HTMLDivElement | null>).current = node
    if (node && buttonRef.current) {
      const pos = computePosition(buttonRef.current, node)
      node.style.top = `${pos.top}px`
      node.style.left = `${pos.left}px`
      node.style.visibility = 'visible'
    }
  }, [])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    window.addEventListener('scroll', repositionDropdown, true)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      window.removeEventListener('scroll', repositionDropdown, true)
    }
  }, [open, repositionDropdown])

  function handlePrepToggle(checked: boolean) {
    setLocalPrep(checked)
    // If a category is already selected, save immediately
    if (categoryId !== null) {
      onChange(categoryId, checked)
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="w-full h-9 rounded-md text-sm font-medium flex items-center justify-between px-2.5 border border-transparent hover:border-gray-300 transition-colors cursor-pointer"
        style={{
          backgroundColor: selected ? `${selected.color}20` : '#F1F5F9',
          color: selected ? selected.color : '#94A3B8',
          borderColor: selected ? `${selected.color}40` : 'transparent',
        }}
      >
        <span className="truncate">
          {selected ? `${isPrep ? 'P: ' : ''}${selected.name}` : '—'}
        </span>
        <svg className="w-3 h-3 ml-1 flex-shrink-0 opacity-50" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 8L1 3h10z" />
        </svg>
      </button>

      {open && createPortal(
        <div
          ref={dropdownCallbackRef}
          className="fixed z-[9999] w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-64 overflow-y-auto"
          style={{ top: 0, left: 0, visibility: 'hidden' }}
        >
          {/* Prep toggle */}
          <label
            className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-100 mb-1"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={localPrep}
              onChange={(e) => handlePrepToggle(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500 cursor-pointer"
            />
            <span className="text-gray-600 font-medium">Prep</span>
          </label>

          <button
            onClick={() => { onChange(null, false); setOpen(false) }}
            className="w-full text-left px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-50"
          >
            — None
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { onChange(cat.id, localPrep); setOpen(false) }}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <span
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className={categoryId === cat.id ? 'font-semibold' : ''}>
                {cat.name}
              </span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}
