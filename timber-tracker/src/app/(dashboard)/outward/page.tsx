import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Eye, Printer } from 'lucide-react'
import { format } from 'date-fns'
import DeleteEntryButton from '@/components/DeleteEntryButton'

export default async function OutwardListPage() {
  const supabase = await createServerSupabaseClient()

  const { data: entries } = await supabase
    .from('outward_entries')
    .select(`*, receiver:parties(name), category:categories(name), wood_type:wood_types(name)`)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outward / Dispatch</h1>
          <p className="text-sm text-gray-500 mt-1">All dispatch entries</p>
        </div>
        <Link href="/outward/new">
          <Button className="bg-orange-600 hover:bg-orange-700">
            <Plus className="w-4 h-4 mr-2" />
            New Dispatch
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Challan #</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Receiver</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Vehicle</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Wood</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">Total CFT</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries?.map((entry) => (
              <tr key={entry.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200">#{entry.challan_number}</Badge>
                </td>
                <td className="px-4 py-3">{format(new Date(entry.date), 'dd/MM/yyyy')}</td>
                <td className="px-4 py-3 font-medium">{(entry.receiver as any)?.name}</td>
                <td className="px-4 py-3"><Badge variant="outline">{entry.vehicle_number}</Badge></td>
                <td className="px-4 py-3">{(entry.category as any)?.name}</td>
                <td className="px-4 py-3">{(entry.wood_type as any)?.name}</td>
                <td className="px-4 py-3 text-right font-semibold text-orange-700">{entry.total_cft} CFT</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-1">
                    <Link href={`/outward/${entry.id}`}>
                      <Button size="sm" variant="ghost"><Eye className="w-4 h-4" /></Button>
                    </Link>
                    <Link href={`/challan/${entry.id}`}>
                      <Button size="sm" variant="ghost"><Printer className="w-4 h-4" /></Button>
                    </Link>
                    <DeleteEntryButton id={entry.id} table="outward_entries" />
                  </div>
                </td>
              </tr>
            ))}
            {(!entries || entries.length === 0) && (
              <tr><td colSpan={8} className="px-4 py-16 text-center text-gray-400">No dispatch entries yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
