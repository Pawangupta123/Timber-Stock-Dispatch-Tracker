'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { WoodType } from '@/types'

export default function WoodTypesPage() {
  const supabase = createClient()
  const [items, setItems] = useState<WoodType[]>([])
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')

  async function load() {
    const { data } = await supabase.from('wood_types').select('*').order('name')
    if (data) setItems(data)
  }

  useEffect(() => { load() }, [])

  async function handleAdd() {
    if (!newName.trim()) return
    const { error } = await supabase.from('wood_types').insert({ name: newName.trim() })
    if (error) toast.error(error.message)
    else { toast.success('Wood type added!'); setNewName(''); load() }
  }

  async function handleUpdate(id: number) {
    if (!editName.trim()) return
    const { error } = await supabase.from('wood_types').update({ name: editName.trim() }).eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Updated!'); setEditId(null); load() }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete?')) return
    const { error } = await supabase.from('wood_types').delete().eq('id', id)
    if (error) toast.error('Delete failed: ' + error.message)
    else { toast.success('Deleted!'); load() }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Wood Types</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Add New Wood Type</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Teak, Sagwan, Normal..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <Button onClick={handleAdd} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">All Wood Types ({items.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg border bg-gray-50">
                {editId === item.id ? (
                  <>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" autoFocus />
                    <Button size="sm" variant="ghost" onClick={() => handleUpdate(item.id)}>
                      <Check className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium">{item.name}</span>
                    <Button size="sm" variant="ghost" onClick={() => { setEditId(item.id); setEditName(item.name) }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </>
                )}
              </div>
            ))}
            {items.length === 0 && <p className="text-gray-400 text-center py-4">No wood types yet</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
