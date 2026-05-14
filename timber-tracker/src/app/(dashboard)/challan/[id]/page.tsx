import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { WIDTH_ROWS, LENGTH_COLS, calculateCFT, formatWidth, roundCFT } from '@/utils/cftCalculator'
import ChallanPrintButton from './ChallanPrintButton'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ChallanPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: entry } = await supabase
    .from('outward_entries')
    .select(`*, receiver:parties(name, phone, address), category:categories(name), wood_type:wood_types(name), items:outward_entry_items(*)`)
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

  const receiver = entry.receiver as any
  const category = entry.category as any
  const woodType = entry.wood_type as any

  return (
    <div>
      <div className="flex items-center gap-4 mb-4 print:hidden">
        <Link href="/outward"><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>
        <ChallanPrintButton />
      </div>

      <div id="challan-print" className="bg-white p-8 max-w-4xl mx-auto shadow-sm border rounded-lg print:shadow-none print:border-none">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-gray-900">NIRVANA LIVING</h1>
            <p className="text-sm text-gray-500 mt-1">Timber Stock & Dispatch</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600">Challan No.</p>
            <p className="text-3xl font-bold text-gray-900">#{entry.challan_number}</p>
          </div>
        </div>

        {/* Entry Details */}
        <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
          <div><p className="text-gray-500">Date</p><p className="font-semibold mt-0.5">{format(new Date(entry.date), 'dd/MM/yyyy')}</p></div>
          <div><p className="text-gray-500">Vehicle Number</p><p className="font-semibold mt-0.5">{entry.vehicle_number}</p></div>
          <div>
            <p className="text-gray-500">Receiver / Party</p>
            <p className="font-semibold mt-0.5">{receiver?.name}</p>
            {receiver?.phone && <p className="text-gray-400 text-xs">{receiver.phone}</p>}
          </div>
          <div><p className="text-gray-500">Category</p><p className="font-semibold mt-0.5">{category?.name}</p></div>
          <div><p className="text-gray-500">Wood Type</p><p className="font-semibold mt-0.5">{woodType?.name}</p></div>
          <div><p className="text-gray-500">Total Sections</p><p className="font-semibold mt-0.5">{thicknesses.length}</p></div>
        </div>

        {/* One table per thickness section */}
        {thicknesses.map((thickness, idx) => {
          const tableData = sectionMap[thickness]
          const activeRows = WIDTH_ROWS.filter(w => LENGTH_COLS.some(l => (tableData[w]?.[l] || 0) > 0))
          const sectionTotal = roundCFT(activeRows.reduce((sum, w) =>
            sum + LENGTH_COLS.reduce((s, l) => s + calculateCFT(w, thickness, l, tableData[w]?.[l] || 0), 0), 0))

          return (
            <div key={thickness} className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded text-gray-600">Section {idx + 1}</span>
                <span className="text-sm font-bold text-gray-800">Thickness: {thickness}"</span>
                <span className="ml-auto text-sm font-semibold text-green-700">Section CFT: {sectionTotal}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse border border-gray-400">
                  <thead>
                    <tr className="bg-gray-800 text-white">
                      <th className="border border-gray-600 px-2 py-2 text-left">{category?.name}=</th>
                      {LENGTH_COLS.map(l => <th key={l} className="border border-gray-600 px-2 py-2 text-center">{l}</th>)}
                      <th className="border border-gray-600 px-2 py-2 text-center bg-green-800">CFT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRows.map(w => {
                      const rowTotal = roundCFT(LENGTH_COLS.reduce((s, l) => s + calculateCFT(w, thickness, l, tableData[w]?.[l] || 0), 0))
                      return (
                        <tr key={w}>
                          <td className="border border-gray-300 px-2 py-1.5 font-medium text-center">{formatWidth(w)}</td>
                          {LENGTH_COLS.map(l => (
                            <td key={l} className="border border-gray-300 px-2 py-1.5 text-center">
                              {(tableData[w]?.[l] || 0) > 0 ? tableData[w][l] : ''}
                            </td>
                          ))}
                          <td className="border border-gray-300 px-2 py-1.5 text-center font-semibold bg-green-50">{rowTotal}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-bold">
                      <td className="border border-gray-400 px-2 py-2 text-center">TOTAL</td>
                      {LENGTH_COLS.map(l => {
                        const colTotal = roundCFT(activeRows.reduce((s, w) => s + calculateCFT(w, thickness, l, tableData[w]?.[l] || 0), 0))
                        return <td key={l} className="border border-gray-400 px-2 py-2 text-center text-blue-700">{colTotal > 0 ? colTotal : ''}</td>
                      })}
                      <td className="border border-gray-400 px-2 py-2 text-center text-green-800 bg-green-100">{sectionTotal}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )
        })}

        {/* Grand Total */}
        <div className="flex justify-end mb-8">
          <div className="border-2 border-gray-800 rounded px-6 py-3 text-center">
            <p className="text-sm text-gray-500">Grand Total</p>
            <p className="text-2xl font-bold text-gray-900">{entry.total_cft} CFT</p>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mt-8 pt-8 border-t border-gray-300">
          <div className="text-center"><div className="h-12 border-b border-gray-400 mb-2"></div><p className="text-sm text-gray-500">Receiver Signature</p></div>
          <div className="text-center"><div className="h-12 border-b border-gray-400 mb-2"></div><p className="text-sm text-gray-500">Authorized Signature</p></div>
        </div>
      </div>
    </div>
  )
}
