'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Party } from '@/types'

const TYPE_LABELS: Record<string, string> = {
  supplier: 'Supplier',
  receiver: 'Receiver',
  both: 'Both',
}

const TYPE_COLORS: Record<string, string> = {
  supplier: 'bg-blue-100 text-blue-700',
  receiver: 'bg-purple-100 text-purple-700',
  both: 'bg-green-100 text-green-700',
}

export default function PartiesPage() {
  const supabase = createClient()
  const [parties, setParties] = useState<Party[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Party | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', address: '', type: 'supplier' })

  async function load() {
    const { data } = await supabase.from('parties').select('*').order('name')
    if (data) setParties(data)
  }

  useEffect(() => { load() }, [])

  function resetForm() {
    setForm({ name: '', phone: '', address: '', type: 'supplier' })
    setEditItem(null)
    setShowForm(false)
  }

  async function handleSubmit() {
    if (!form.name.trim()) { toast.error('Name is required!'); return }

    if (editItem) {
      const { error } = await supabase.from('parties').update(form).eq('id', editItem.id)
      if (error) toast.error(error.message)
      else { toast.success('Updated!'); resetForm(); load() }
    } else {
      const { error } = await supabase.from('parties').insert(form)
      if (error) toast.error(error.message)
      else { toast.success('Party added!'); resetForm(); load() }
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete?')) return
    const { error } = await supabase.from('parties').delete().eq('id', id)
    if (error) toast.error('Delete failed: ' + error.message)
    else { toast.success('Deleted!'); load() }
  }

  const filtered = filter === 'all' ? parties : parties.filter((p) => p.type === filter || p.type === 'both')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Parties</h1>
        <Button onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Party
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 border-green-200">
          <CardHeader>
            <CardTitle className="text-base">{editItem ? 'Edit Party' : 'Add New Party'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input placeholder="Party name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="Mobile number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v ?? 'supplier' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supplier">Supplier (Sends timber)</SelectItem>
                    <SelectItem value="receiver">Receiver (Receives timber)</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">Save</Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['all', 'supplier', 'receiver'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'All' : TYPE_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Phone</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Address</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Type</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((party) => (
              <tr key={party.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{party.name}</td>
                <td className="px-4 py-3 text-gray-500">{party.phone || '—'}</td>
                <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{party.address || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[party.type]}`}>
                    {TYPE_LABELS[party.type]}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditItem(party); setForm({ name: party.name, phone: party.phone || '', address: party.address || '', type: party.type }); setShowForm(true) }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(party.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No parties yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
