'use client'

import { Button } from '@/components/ui/button'
import { Printer, Download } from 'lucide-react'
import { WIDTH_ROWS, LENGTH_COLS, calculateCFT, formatWidth, roundCFT } from '@/utils/cftCalculator'

interface Props {
  entry: {
    id: number
    date: string
    vehicle_number: string
    total_cft: number
    supplier: { name: string } | null
    category: { name: string } | null
    wood_type: { name: string } | null
  }
  sectionMap: Record<number, Record<number, Record<number, number>>>
  thicknesses: number[]
}

export default function InwardActions({ entry, sectionMap, thicknesses }: Props) {

  async function handleExcelDownload() {
    const ExcelJS = (await import('exceljs')).default
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Inward Entry')

    // Header info
    ws.mergeCells('A1:L1')
    ws.getCell('A1').value = 'NIRVANA LIVING — Inward Entry'
    ws.getCell('A1').font = { bold: true, size: 14 }

    ws.getCell('A2').value = 'Entry #'; ws.getCell('B2').value = entry.id
    ws.getCell('A3').value = 'Date'; ws.getCell('B3').value = entry.date
    ws.getCell('A4').value = 'Supplier'; ws.getCell('B4').value = entry.supplier?.name || ''
    ws.getCell('A5').value = 'Vehicle'; ws.getCell('B5').value = entry.vehicle_number
    ws.getCell('A6').value = 'Category'; ws.getCell('B6').value = entry.category?.name || ''
    ws.getCell('A7').value = 'Wood Type'; ws.getCell('B7').value = entry.wood_type?.name || ''
    ws.getCell('A8').value = 'Total CFT'; ws.getCell('B8').value = entry.total_cft
    ws.getCell('B8').font = { bold: true, color: { argb: 'FF166534' } }

    let currentRow = 10

    for (let idx = 0; idx < thicknesses.length; idx++) {
      const thickness = thicknesses[idx]
      const tableData = sectionMap[thickness]
      const activeRows = WIDTH_ROWS.filter(w => LENGTH_COLS.some(l => (tableData[w]?.[l] || 0) > 0))

      // Section header
      ws.mergeCells(`A${currentRow}:L${currentRow}`)
      ws.getCell(`A${currentRow}`).value = `Section ${idx + 1} — Thickness: ${thickness}"`
      ws.getCell(`A${currentRow}`).font = { bold: true, size: 12 }
      ws.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
      currentRow++

      // Column headers
      const colHeaders = ['Inches', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', 'Total CFT']
      const headerRow = ws.getRow(currentRow)
      colHeaders.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1)
        cell.value = h
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } }
        cell.alignment = { horizontal: 'center' }
      })
      currentRow++

      // Data rows
      for (const w of activeRows) {
        const row = ws.getRow(currentRow)
        row.getCell(1).value = `${formatWidth(w)}"`
        row.getCell(1).alignment = { horizontal: 'center' }
        let rowTotal = 0
        LENGTH_COLS.forEach((l, i) => {
          const pieces = tableData[w]?.[l] || 0
          const cft = calculateCFT(w, thickness, l, pieces)
          rowTotal += cft
          row.getCell(i + 2).value = pieces > 0 ? pieces : ''
          row.getCell(i + 2).alignment = { horizontal: 'center' }
        })
        const totalCell = row.getCell(12)
        totalCell.value = roundCFT(rowTotal)
        totalCell.font = { bold: true, color: { argb: 'FF166534' } }
        totalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } }
        currentRow++
      }

      // Column total row
      const totalRow = ws.getRow(currentRow)
      totalRow.getCell(1).value = 'Total'
      totalRow.getCell(1).font = { bold: true }
      totalRow.getCell(1).alignment = { horizontal: 'center' }
      let sectionGrand = 0
      LENGTH_COLS.forEach((l, i) => {
        const colTotal = roundCFT(activeRows.reduce((s, w) => s + calculateCFT(w, thickness, l, tableData[w]?.[l] || 0), 0))
        sectionGrand += colTotal
        const cell = totalRow.getCell(i + 2)
        cell.value = colTotal > 0 ? colTotal : ''
        cell.font = { bold: true, color: { argb: 'FF1D4ED8' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
        cell.alignment = { horizontal: 'center' }
      })
      const grandCell = totalRow.getCell(12)
      grandCell.value = roundCFT(sectionGrand)
      grandCell.font = { bold: true, color: { argb: 'FF166534' } }
      grandCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }
      currentRow += 2
    }

    // Grand total
    ws.getCell(`A${currentRow}`).value = 'GRAND TOTAL CFT'
    ws.getCell(`A${currentRow}`).font = { bold: true, size: 12 }
    ws.getCell(`B${currentRow}`).value = entry.total_cft
    ws.getCell(`B${currentRow}`).font = { bold: true, size: 12, color: { argb: 'FF166534' } }

    // Column widths
    ws.getColumn(1).width = 12
    for (let i = 2; i <= 12; i++) ws.getColumn(i).width = 9

    const buf = await wb.xlsx.writeBuffer()
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Inward-Entry-${entry.id}-${entry.date}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => window.print()}>
        <Printer className="w-4 h-4 mr-2" />
        Print
      </Button>
      <Button onClick={handleExcelDownload} className="bg-green-700 hover:bg-green-800">
        <Download className="w-4 h-4 mr-2" />
        Download Excel
      </Button>
    </div>
  )
}
