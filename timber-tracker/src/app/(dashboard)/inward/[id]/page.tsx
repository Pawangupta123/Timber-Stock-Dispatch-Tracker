import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import CFTTableReadOnly from '@/components/cft/CFTTableReadOnly'

interface Props {
  params: Promise<{ id: string }>
}

export default async function InwardDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: entry } = await supabase
    .from('inward_entries')
    .select(`
      *,
      supplier:parties(name, phone),
      category:categories(name),
      wood_type:wood_types(name),
      items:inward_entry_items(*)
    `)
    .eq('id', id)
    .single()

  if (!entry) notFound()

  // Build table data from items
  const tableData: Record<number, Record<number, number>> = {}
  for (const item of (entry.items as any[]) || []) {
    if (!tableData[item.width_inch]) tableData[item.width_inch] = {}
    tableData[item.width_inch][item.length_feet] = item.pieces
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/inward">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inward Entry #{entry.id}</h1>
          <p className="text-sm text-gray-500">{format(new Date(entry.date), 'dd MMMM yyyy')}</p>
        </div>
      </div>

      {/* Details */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Supplier</p>
              <p className="font-semibold mt-1">{(entry.supplier as any)?.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Vehicle</p>
              <Badge variant="outline" className="mt-1">{entry.vehicle_number}</Badge>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Category</p>
              <p className="font-semibold mt-1">{(entry.category as any)?.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Wood Type</p>
              <p className="font-semibold mt-1">{(entry.wood_type as any)?.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Thickness</p>
              <p className="font-semibold mt-1">{entry.thickness}"</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total CFT</p>
              <p className="font-bold text-green-700 text-lg mt-1">{entry.total_cft} CFT</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <h2 className="text-lg font-semibold mb-3">Entry Details</h2>
      <CFTTableReadOnly
        thickness={entry.thickness}
        data={tableData}
      />
    </div>
  )
}
