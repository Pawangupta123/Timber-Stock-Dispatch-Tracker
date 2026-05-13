import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Eye } from 'lucide-react'
import { format } from 'date-fns'

export default async function InwardListPage() {
  const supabase = await createServerSupabaseClient()

  const { data: entries } = await supabase
    .from('inward_entries')
    .select(`
      *,
      supplier:parties(name),
      category:categories(name),
      wood_type:wood_types(name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inward Entries</h1>
          <p className="text-sm text-gray-500 mt-1">All inward stock entries</p>
        </div>
        <Link href="/inward/new">
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            New Inward Entry
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Supplier</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Vehicle</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Wood</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Thickness</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">Total CFT</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {entries?.map((entry, i) => (
              <tr key={entry.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3">{format(new Date(entry.date), 'dd/MM/yyyy')}</td>
                <td className="px-4 py-3 font-medium">{(entry.supplier as any)?.name}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{entry.vehicle_number}</Badge>
                </td>
                <td className="px-4 py-3">{(entry.category as any)?.name}</td>
                <td className="px-4 py-3">{(entry.wood_type as any)?.name}</td>
                <td className="px-4 py-3">{entry.thickness}"</td>
                <td className="px-4 py-3 text-right font-semibold text-green-700">
                  {entry.total_cft} CFT
                </td>
                <td className="px-4 py-3 text-center">
                  <Link href={`/inward/${entry.id}`}>
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
            {(!entries || entries.length === 0) && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-gray-400">
                  No inward entries yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
