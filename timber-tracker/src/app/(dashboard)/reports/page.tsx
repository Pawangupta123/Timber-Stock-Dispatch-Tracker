'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Search, Download } from 'lucide-react'

interface ReportEntry {
  id: number
  date: string
  vehicle_number: string
  total_cft: number
  thickness: number
  challan_number?: string
  party: { name: string }
  category: { name: string }
  wood_type: { name: string }
  type: 'inward' | 'outward'
}

export default function ReportsPage() {
  const supabase = createClient()
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [reportType, setReportType] = useState<'inward' | 'outward' | 'stock'>('stock')
  const [results, setResults] = useState<ReportEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch() {
    setLoading(true)
    setSearched(true)

    if (reportType === 'inward' || reportType === 'stock') {
      const { data: inward } = await supabase
        .from('inward_entries')
        .select(`*, party:parties(name), category:categories(name), wood_type:wood_types(name)`)
        .gte('date', fromDate || '2000-01-01')
        .lte('date', toDate || '2099-12-31')
        .order('date', { ascending: false })

      if (reportType === 'inward') {
        setResults((inward || []).map((e) => ({ ...e, type: 'inward', party: (e as any).party })))
        setLoading(false)
        return
      }

      const { data: outward } = await supabase
        .from('outward_entries')
        .select(`*, party:parties(name), category:categories(name), wood_type:wood_types(name)`)
        .gte('date', fromDate || '2000-01-01')
        .lte('date', toDate || '2099-12-31')
        .order('date', { ascending: false })

      const combined = [
        ...(inward || []).map((e) => ({ ...e, type: 'inward' as const, party: (e as any).supplier })),
        ...(outward || []).map((e) => ({ ...e, type: 'outward' as const, party: (e as any).receiver })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setResults(combined as any)
    } else {
      const { data: outward } = await supabase
        .from('outward_entries')
        .select(`*, party:parties(name), category:categories(name), wood_type:wood_types(name)`)
        .gte('date', fromDate || '2000-01-01')
        .lte('date', toDate || '2099-12-31')
        .order('date', { ascending: false })

      setResults((outward || []).map((e) => ({ ...e, type: 'outward', party: (e as any).receiver })) as any)
    }

    setLoading(false)
  }

  const totalInward = results.filter((r) => r.type === 'inward').reduce((s, r) => s + r.total_cft, 0)
  const totalOutward = results.filter((r) => r.type === 'outward').reduce((s, r) => s + r.total_cft, 0)
  const balance = Math.round((totalInward - totalOutward) * 1000) / 1000

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <div className="flex gap-2">
                {(['inward', 'outward', 'stock'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setReportType(t)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                      reportType === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t === 'stock' ? 'Stock (Both)' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
            </div>
            <Button onClick={handleSearch} disabled={loading} className="bg-green-600 hover:bg-green-700">
              <Search className="w-4 h-4 mr-2" />
              {loading ? 'Loading...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {searched && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-gray-500">Total Inward</p>
                <p className="text-xl font-bold text-green-700">{Math.round(totalInward * 1000) / 1000} CFT</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-gray-500">Total Outward</p>
                <p className="text-xl font-bold text-red-700">{Math.round(totalOutward * 1000) / 1000} CFT</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-gray-500">Balance</p>
                <p className="text-xl font-bold text-blue-700">{balance} CFT</p>
              </CardContent>
            </Card>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Party</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Vehicle</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Wood</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">CFT</th>
                </tr>
              </thead>
              <tbody>
                {results.map((entry) => (
                  <tr key={`${entry.type}-${entry.id}`} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Badge className={entry.type === 'inward' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                        {entry.type === 'inward' ? '↓ IN' : '↑ OUT'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{format(new Date(entry.date), 'dd/MM/yyyy')}</td>
                    <td className="px-4 py-3 font-medium">{(entry as any).party?.name || '—'}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{entry.vehicle_number}</Badge></td>
                    <td className="px-4 py-3">{(entry as any).category?.name}</td>
                    <td className="px-4 py-3">{(entry as any).wood_type?.name}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${entry.type === 'inward' ? 'text-green-700' : 'text-orange-700'}`}>
                      {entry.type === 'outward' ? '-' : '+'}{entry.total_cft}
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No records found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
