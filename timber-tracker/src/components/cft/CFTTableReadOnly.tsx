'use client'

import { useMemo } from 'react'
import { WIDTH_ROWS, LENGTH_COLS, calculateCFT, formatWidth, roundCFT } from '@/utils/cftCalculator'

interface Props {
  thickness: number
  data: Record<number, Record<number, number>>
}

export default function CFTTableReadOnly({ thickness, data }: Props) {
  const activeRows = WIDTH_ROWS.filter((w) => LENGTH_COLS.some((l) => (data[w]?.[l] || 0) > 0))

  const rowTotals = useMemo(() => {
    const t: Record<number, number> = {}
    for (const w of activeRows) {
      t[w] = roundCFT(LENGTH_COLS.reduce((s, l) => s + calculateCFT(w, thickness, l, data[w]?.[l] || 0), 0))
    }
    return t
  }, [data, thickness, activeRows])

  const colTotals = useMemo(() => {
    const t: Record<number, number> = {}
    for (const l of LENGTH_COLS) {
      t[l] = roundCFT(activeRows.reduce((s, w) => s + calculateCFT(w, thickness, l, data[w]?.[l] || 0), 0))
    }
    return t
  }, [data, thickness, activeRows])

  const grandTotal = roundCFT(Object.values(rowTotals).reduce((a, b) => a + b, 0))

  if (activeRows.length === 0) {
    return <p className="text-gray-400 text-center py-8">Koi data nahi</p>
  }

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="text-sm border-collapse w-full">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="border border-gray-600 px-3 py-2 text-left">Inches</th>
            {LENGTH_COLS.map((l) => (
              <th key={l} className="border border-gray-600 px-3 py-2 text-center">{l} ft</th>
            ))}
            <th className="border border-gray-600 px-3 py-2 text-center bg-green-800">Total CFT</th>
          </tr>
        </thead>
        <tbody>
          {activeRows.map((w) => (
            <tr key={w} className="bg-green-50">
              <td className="border border-gray-200 px-3 py-2 font-medium text-center">{formatWidth(w)}"</td>
              {LENGTH_COLS.map((l) => {
                const pieces = data[w]?.[l] || 0
                return (
                  <td key={l} className="border border-gray-200 px-3 py-2 text-center">
                    {pieces > 0 ? <span className="font-medium">{pieces}</span> : <span className="text-gray-300">—</span>}
                  </td>
                )
              })}
              <td className="border border-gray-200 px-3 py-2 text-center font-semibold text-green-700 bg-green-100">
                {rowTotals[w]}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-semibold">
            <td className="border border-gray-300 px-3 py-2 text-center">Total</td>
            {LENGTH_COLS.map((l) => (
              <td key={l} className="border border-gray-300 px-3 py-2 text-center text-blue-700">
                {colTotals[l] > 0 ? colTotals[l] : '—'}
              </td>
            ))}
            <td className="border border-gray-300 px-3 py-2 text-center text-lg font-bold text-green-700 bg-green-100">
              {grandTotal}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
