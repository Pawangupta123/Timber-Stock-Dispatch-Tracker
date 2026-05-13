import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDownToLine, ArrowUpFromLine, Package, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const [inwardRes, outwardRes, categoriesRes] = await Promise.all([
    supabase.from('inward_entries').select('total_cft, category_id, categories(name)'),
    supabase.from('outward_entries').select('total_cft, category_id, categories(name)'),
    supabase.from('categories').select('id, name'),
  ])

  const totalInward = (inwardRes.data || []).reduce((s, e) => s + (e.total_cft || 0), 0)
  const totalOutward = (outwardRes.data || []).reduce((s, e) => s + (e.total_cft || 0), 0)
  const totalStock = totalInward - totalOutward

  // Category-wise stock
  const categoryStock: Record<string, { name: string; inward: number; outward: number }> = {}
  for (const cat of categoriesRes.data || []) {
    categoryStock[cat.id] = { name: cat.name, inward: 0, outward: 0 }
  }
  for (const e of inwardRes.data || []) {
    if (categoryStock[e.category_id]) categoryStock[e.category_id].inward += e.total_cft || 0
  }
  for (const e of outwardRes.data || []) {
    if (categoryStock[e.category_id]) categoryStock[e.category_id].outward += e.total_cft || 0
  }

  const round = (n: number) => Math.round(n * 1000) / 1000

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Live stock overview</p>
        </div>
        <div className="flex gap-3">
          <Link href="/inward/new">
            <Button className="bg-green-600 hover:bg-green-700">
              <ArrowDownToLine className="w-4 h-4 mr-2" />
              New Inward
            </Button>
          </Link>
          <Link href="/outward/new">
            <Button variant="outline">
              <ArrowUpFromLine className="w-4 h-4 mr-2" />
              New Outward
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Inward</p>
                <p className="text-2xl font-bold text-green-700 mt-1">{round(totalInward)}</p>
                <p className="text-xs text-gray-400">CFT</p>
              </div>
              <ArrowDownToLine className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Outward</p>
                <p className="text-2xl font-bold text-red-700 mt-1">{round(totalOutward)}</p>
                <p className="text-xs text-gray-400">CFT</p>
              </div>
              <ArrowUpFromLine className="w-8 h-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Current Stock</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{round(totalStock)}</p>
                <p className="text-xs text-gray-400">CFT</p>
              </div>
              <Package className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Entries</p>
                <p className="text-2xl font-bold text-orange-700 mt-1">
                  {(inwardRes.data?.length || 0) + (outwardRes.data?.length || 0)}
                </p>
                <p className="text-xs text-gray-400">Inward + Outward</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category-wise Stock */}
      <Card>
        <CardHeader>
          <CardTitle>Category-wise Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left font-semibold text-gray-600">Category</th>
                <th className="py-2 text-right font-semibold text-green-600">Inward CFT</th>
                <th className="py-2 text-right font-semibold text-red-600">Outward CFT</th>
                <th className="py-2 text-right font-semibold text-blue-600">Balance CFT</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(categoryStock).map((cat) => {
                const balance = round(cat.inward - cat.outward)
                return (
                  <tr key={cat.name} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-medium">{cat.name}</td>
                    <td className="py-3 text-right text-green-700">{round(cat.inward)}</td>
                    <td className="py-3 text-right text-red-700">{round(cat.outward)}</td>
                    <td className="py-3 text-right font-bold text-blue-700">{balance}</td>
                  </tr>
                )
              })}
              {Object.keys(categoryStock).length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-gray-400">No data yet</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
