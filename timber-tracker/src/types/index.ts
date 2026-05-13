export interface Category {
  id: number
  name: string
  created_at: string
}

export interface WoodType {
  id: number
  name: string
  created_at: string
}

export interface Party {
  id: number
  name: string
  phone: string | null
  address: string | null
  type: 'supplier' | 'receiver' | 'both'
  created_at: string
}

export interface UserProfile {
  id: string
  name: string
  role: 'admin' | 'yard_operator'
  is_active: boolean
  created_at: string
}

export interface InwardEntry {
  id: number
  date: string
  supplier_id: number
  vehicle_number: string
  category_id: number
  wood_type_id: number
  thickness: number
  total_cft: number
  created_by: string
  created_at: string
  // joined
  supplier?: Party
  category?: Category
  wood_type?: WoodType
  items?: InwardEntryItem[]
}

export interface InwardEntryItem {
  id: number
  inward_entry_id: number
  width_inch: number
  length_feet: number
  pieces: number
  cft: number
}

export interface OutwardEntry {
  id: number
  challan_number: string
  date: string
  receiver_id: number
  vehicle_number: string
  category_id: number
  wood_type_id: number
  thickness: number
  total_cft: number
  created_by: string
  created_at: string
  // joined
  receiver?: Party
  category?: Category
  wood_type?: WoodType
  items?: OutwardEntryItem[]
}

export interface OutwardEntryItem {
  id: number
  outward_entry_id: number
  width_inch: number
  length_feet: number
  pieces: number
  cft: number
}

// CFT Table cell state: [width_inch][length_feet] = pieces
export type CFTTableData = Record<string, Record<number, number>>

export interface CFTTableRow {
  widthInch: number
  lengths: Record<number, { pieces: number; cft: number }>
  rowTotalCft: number
}
