'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { Category, WoodType, Party } from '@/types'
import CFTTable, { CFTData } from '@/components/cft/CFTTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LENGTH_COLS, WIDTH_ROWS, calculateCFT, roundCFT } from '@/utils/cftCalculator'
import { Loader2, Save } from 'lucide-react'

export default function NewInwardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [categories, setCategories] = useState<Category[]>([])
  const [woodTypes, setWoodTypes] = useState<WoodType[]>([])
  const [suppliers, setSuppliers] = useState<Party[]>([])
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    supplier_id: '',
    vehicle_number: '',
    category_id: '',
    wood_type_id: '',
    thickness: '',
  })

  const [tableData, setTableData] = useState<CFTData>({})

  useEffect(() => {
    async function loadMasterData() {
      const [catRes, woodRes, partyRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('wood_types').select('*').order('name'),
        supabase.from('parties').select('*').in('type', ['supplier', 'both']).order('name'),
      ])
      if (catRes.error) toast.error('Failed to load categories: ' + catRes.error.message)
      if (woodRes.error) toast.error('Failed to load wood types: ' + woodRes.error.message)
      if (partyRes.error) toast.error('Failed to load suppliers: ' + partyRes.error.message)
      if (catRes.data) setCategories(catRes.data)
      if (woodRes.data) setWoodTypes(woodRes.data)
      if (partyRes.data) setSuppliers(partyRes.data)
      if (!catRes.error && !catRes.data?.length) toast.error('Categories table is empty!')
      if (!woodRes.error && !woodRes.data?.length) toast.error('Wood types table is empty!')
    }
    loadMasterData()
  }, [])

  const thickness = parseFloat(form.thickness) || 0

  const grandTotal = (() => {
    let total = 0
    for (const w of WIDTH_ROWS) {
      for (const l of LENGTH_COLS) {
        const pieces = tableData[w]?.[l] || 0
        total += calculateCFT(w, thickness, l, pieces)
      }
    }
    return roundCFT(total)
  })()

  async function handleSave() {
    if (!form.date || !form.supplier_id || !form.vehicle_number ||
        !form.category_id || !form.wood_type_id || !form.thickness) {
      toast.error('Please fill all required fields!')
      return
    }
    if (grandTotal === 0) {
      toast.error('No pieces entered in table!')
      return
    }

    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { data: entry, error: entryError } = await supabase
      .from('inward_entries')
      .insert({
        date: form.date,
        supplier_id: parseInt(form.supplier_id),
        vehicle_number: form.vehicle_number.toUpperCase(),
        category_id: parseInt(form.category_id),
        wood_type_id: parseInt(form.wood_type_id),
        thickness: parseFloat(form.thickness),
        total_cft: grandTotal,
        created_by: user?.id,
      })
      .select()
      .single()

    if (entryError || !entry) {
      toast.error('Failed to save entry: ' + entryError?.message)
      setSaving(false)
      return
    }

    // Save items (only cells with pieces > 0)
    const items = []
    for (const w of WIDTH_ROWS) {
      for (const l of LENGTH_COLS) {
        const pieces = tableData[w]?.[l] || 0
        if (pieces > 0) {
          items.push({
            inward_entry_id: entry.id,
            width_inch: w,
            length_feet: l,
            pieces,
            cft: roundCFT(calculateCFT(w, thickness, l, pieces)),
          })
        }
      }
    }

    const { error: itemsError } = await supabase.from('inward_entry_items').insert(items)

    if (itemsError) {
      toast.error('Failed to save items: ' + itemsError.message)
      setSaving(false)
      return
    }

    toast.success(`Inward entry saved! Total: ${grandTotal} CFT`)
    router.push('/inward')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Inward Entry</h1>
          <p className="text-sm text-gray-500 mt-1">New stock inward entry</p>
        </div>
        <div className="flex items-center gap-3">
          {grandTotal > 0 && (
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold">
              Total: {grandTotal} CFT
            </div>
          )}
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Entry
          </Button>
        </div>
      </div>

      {/* Header Form */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v ?? '' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Supplier">
                    {suppliers.find(s => String(s.id) === form.supplier_id)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vehicle Number *</Label>
              <Input
                placeholder="MH-04-1234"
                value={form.vehicle_number}
                onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v ?? '' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category">
                    {categories.find(c => String(c.id) === form.category_id)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Wood Type *</Label>
              <Select value={form.wood_type_id} onValueChange={(v) => setForm({ ...form, wood_type_id: v ?? '' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Wood Type">
                    {woodTypes.find(w => String(w.id) === form.wood_type_id)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {woodTypes.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Thickness (inches) *</Label>
              <Input
                type="number"
                step="0.25"
                min="0.25"
                placeholder="e.g. 2.5"
                value={form.thickness}
                onChange={(e) => setForm({ ...form, thickness: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CFT Table */}
      {thickness > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Entry Table</h2>
            <span className="text-sm text-gray-500">(Enter pieces — CFT auto calculates)</span>
          </div>
          <CFTTable
            thickness={thickness}
            data={tableData}
            onChange={setTableData}
            categoryName={categories.find(c => String(c.id) === form.category_id)?.name}
          />
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-gray-400">
            <p className="text-lg">Enter Thickness above to show table</p>
            <p className="text-sm mt-1">Table will appear automatically</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
