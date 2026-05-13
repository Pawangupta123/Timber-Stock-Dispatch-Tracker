'use client'

import { useCallback, useMemo } from 'react'
import {
  WIDTH_ROWS,
  LENGTH_COLS,
  calculateCFT,
  formatWidth,
  roundCFT,
} from '@/utils/cftCalculator'

// data[widthInch][lengthFeet] = pieces
export type CFTData = Record<number, Record<number, number>>

interface CFTTableProps {
  thickness: number
  data: CFTData
  onChange: (data: CFTData) => void
  readOnly?: boolean
  categoryName?: string
}

export default function CFTTable({ thickness, data, onChange, readOnly = false, categoryName }: CFTTableProps) {

  const handlePiecesChange = useCallback(
    (widthInch: number, lengthFeet: number, value: string) => {
      const pieces = parseInt(value) || 0
      const next: CFTData = {
        ...data,
        [widthInch]: {
          ...(data[widthInch] || {}),
          [lengthFeet]: pieces,
        },
      }
      onChange(next)
    },
    [data, onChange]
  )

  // Row totals
  const rowTotals = useMemo(() => {
    const totals: Record<number, number> = {}
    for (const w of WIDTH_ROWS) {
      let sum = 0
      for (const l of LENGTH_COLS) {
        const pieces = data[w]?.[l] || 0
        sum += calculateCFT(w, thickness, l, pieces)
      }
      totals[w] = roundCFT(sum)
    }
    return totals
  }, [data, thickness])

  // Column totals
  const colTotals = useMemo(() => {
    const totals: Record<number, number> = {}
    for (const l of LENGTH_COLS) {
      let sum = 0
      for (const w of WIDTH_ROWS) {
        const pieces = data[w]?.[l] || 0
        sum += calculateCFT(w, thickness, l, pieces)
      }
      totals[l] = roundCFT(sum)
    }
    return totals
  }, [data, thickness])

  const grandTotal = useMemo(
    () => roundCFT(Object.values(rowTotals).reduce((a, b) => a + b, 0)),
    [rowTotals]
  )

  // Only render rows that have any pieces OR all rows if not readOnly
  const visibleRows = readOnly
    ? WIDTH_ROWS.filter((w) => LENGTH_COLS.some((l) => (data[w]?.[l] || 0) > 0))
    : WIDTH_ROWS

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="text-sm border-collapse w-full">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="border border-gray-600 px-3 py-2 text-left font-semibold min-w-[70px] sticky left-0 bg-gray-800 z-10">
              {categoryName ? `${categoryName}=` : 'Inches'}
            </th>
            {LENGTH_COLS.map((l) => (
              <th key={l} className="border border-gray-600 px-3 py-2 text-center font-semibold min-w-[60px]">
                {l}
              </th>
            ))}
            <th className="border border-gray-600 px-3 py-2 text-center font-semibold min-w-[80px] bg-green-800">
              Total CFT
            </th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((w, idx) => {
            const rowTotal = rowTotals[w]
            const hasData = LENGTH_COLS.some((l) => (data[w]?.[l] || 0) > 0)
            return (
              <tr
                key={w}
                className={
                  hasData
                    ? 'bg-green-50'
                    : idx % 2 === 0
                    ? 'bg-white'
                    : 'bg-gray-50'
                }
              >
                <td className="border border-gray-200 px-3 py-1 font-medium text-gray-700 text-center sticky left-0 bg-inherit z-10">
                  {formatWidth(w)}
                </td>
                {LENGTH_COLS.map((l) => {
                  const pieces = data[w]?.[l] || 0
                  const cft = roundCFT(calculateCFT(w, thickness, l, pieces))
                  return (
                    <td key={l} className="border border-gray-200 p-0">
                      {readOnly ? (
                        <div className="text-center px-2 py-1">
                          {pieces > 0 ? (
                            <span className="font-medium">{pieces}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </div>
                      ) : (
                        <div className="relative group">
                          <input
                            type="number"
                            min="0"
                            value={pieces || ''}
                            onChange={(e) => handlePiecesChange(w, l, e.target.value)}
                            placeholder="0"
                            className="w-full text-center px-1 py-1.5 outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-400 rounded-none bg-transparent text-sm"
                          />
                          {pieces > 0 && thickness > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 text-[9px] text-green-600 text-center leading-none pb-0.5 pointer-events-none">
                              {cft} cft
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  )
                })}
                <td className="border border-gray-200 px-3 py-1 text-center font-semibold text-green-700 bg-green-50">
                  {rowTotal > 0 ? rowTotal : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-semibold">
            <td className="border border-gray-300 px-3 py-2 text-center sticky left-0 bg-gray-100 z-10">
              Total
            </td>
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
