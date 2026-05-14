import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import CFTTableReadOnly from '@/components/cft/CFTTableReadOnly'
import InwardActions from './InwardActions'
import DeleteEntryButton from '@/components/DeleteEntryButton'

interface Props {
  params: Promise<{ id: string }>
}

export default async function InwardDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: entry } = await supabase
    .from('inward_entries')
    .select(`*, supplier:parties(name, phone), category:categories(name), wood_type:wood_types(name), items:inward_entry_items(*)`)
    .eq('id', id)
    .single()

  if (!entry) notFound()

  // Group items by thickness
  const sectionMap: Record<number, Record<number, Record<number, number>>> = {}
  for (const item of (entry.items as any[]) || []) {
    const t = item.thickness
    if (!sectionMap[t]) sectionMap[t] = {}
    if (!sectionMap[t][item.width_inch]) sectionMap[t][item.width_inch] = {}
    sectionMap[t][item.width_inch][item.length_feet] = item.pieces
  }
  const thicknesses = Object.keys(sectionMap).map(Number).sort((a, b) => a - b)

  return (
    <div>
      <div className="flex items-center gap-4 mb-6 print:hidden">
        <Link href="/inward"><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Inward Entry #{entry.id}</h1>
          <p className="text-sm text-gray-500">{format(new Date(entry.date), 'dd MMMM yyyy')}</p>
        </div>
        <div className="flex gap-2">
          <InwardActions
            entry={{ id: entry.id, date: entry.date, vehicle_number: entry.vehicle_number, total_cft: entry.total_cft, supplier: (entry.supplier as any), category: (entry.category as any), wood_type: (entry.wood_type as any) }}
            sectionMap={sectionMap}
            thicknesses={thicknesses}
          />
          <DeleteEntryButton id={entry.id} table="inward_entries" redirectTo="/inward" variant="button" label="Delete Entry" />
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><p className="text-xs text-gray-500 uppercase tracking-wide">Supplier</p><p className="font-semibold mt-1">{(entry.supplier as any)?.name}</p></div>
            <div><p className="text-xs text-gray-500 uppercase tracking-wide">Vehicle</p><Badge variant="outline" className="mt-1">{entry.vehicle_number}</Badge></div>
            <div><p className="text-xs text-gray-500 uppercase tracking-wide">Category</p><p className="font-semibold mt-1">{(entry.category as any)?.name}</p></div>
            <div><p className="text-xs text-gray-500 uppercase tracking-wide">Wood Type</p><p className="font-semibold mt-1">{(entry.wood_type as any)?.name}</p></div>
            <div><p className="text-xs text-gray-500 uppercase tracking-wide">Total CFT</p><p className="font-bold text-green-700 text-lg mt-1">{entry.total_cft} CFT</p></div>
            <div><p className="text-xs text-gray-500 uppercase tracking-wide">Sections</p><p className="font-semibold mt-1">{thicknesses.length} thickness(es)</p></div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {thicknesses.map((t, idx) => (
          <div key={t} className="border rounded-xl p-4 bg-white shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">Section {idx + 1}</span>
              <span className="font-semibold text-gray-800">Thickness: {t}"</span>
            </div>
            <CFTTableReadOnly thickness={t} data={sectionMap[t]} />
          </div>
        ))}
      </div>
    </div>
  )
}
