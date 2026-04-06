import type { Category, Block } from './types'

const BASE = '/api'

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${BASE}/categories`)
  return res.json()
}

export async function createCategory(data: Partial<Category>): Promise<Category> {
  const res = await fetch(`${BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function updateCategory(id: number, data: Partial<Category>): Promise<Category> {
  const res = await fetch(`${BASE}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function deleteCategory(id: number): Promise<void> {
  await fetch(`${BASE}/categories/${id}`, { method: 'DELETE' })
}

export async function fetchBlocks(start: string, end: string): Promise<Block[]> {
  const res = await fetch(`${BASE}/blocks?start=${start}&end=${end}`)
  return res.json()
}

export async function setBlock(date: string, hour: number, category_id: number | null, is_prep?: boolean): Promise<void> {
  await fetch(`${BASE}/blocks`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, hour, category_id, is_prep: is_prep ?? false }),
  })
}
