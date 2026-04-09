export interface Category {
  id: number
  name: string
  color: string
  sort_order: number
  rate_type: 'hourly' | 'daily' | null
  rate: number | null
}

export interface Block {
  id: number
  date: string
  hour: number
  category_id: number | null
  category_name: string | null
  category_color: string | null
  is_prep: boolean
}

export type BlockMap = Record<string, Record<number, Block>>
