'use client'

import { useCallback } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import CFTTable, { CFTData } from './CFTTable'
import { WIDTH_ROWS, LENGTH_COLS, calculateCFT, roundCFT } from '@/utils/cftCalculator'

export interface Section {
  id: string
  thickness: string
  tableData: CFTData
}

interface Props {
  sections: Section[]
  onChange: (sections: Section[]) => void
  categoryName?: string
}

function sectionTotal(section: Section): number {
  const t = parseFloat(section.thickness) || 0
  if (!t) return 0
  let total = 0
  for (const w of WIDTH_ROWS) {
    for (const l of LENGTH_COLS) {
      total += calculateCFT(w, t, l, section.tableData[w]?.[l] || 0)
    }
  }
  return roundCFT(total)
}

export function grandTotal(sections: Section[]): number {
  return roundCFT(sections.reduce((sum, s) => sum + sectionTotal(s), 0))
}

export default function ThicknessSections({ sections, onChange, categoryName }: Props) {

  const addSection = useCallback(() => {
    onChange([...sections, { id: crypto.randomUUID(), thickness: '', tableData: {} }])
  }, [sections, onChange])

  const removeSection = useCallback((id: string) => {
    if (sections.length === 1) return
    onChange(sections.filter(s => s.id !== id))
  }, [sections, onChange])

  const updateThickness = useCallback((id: string, value: string) => {
    onChange(sections.map(s => s.id === id ? { ...s, thickness: value } : s))
  }, [sections, onChange])

  const updateTableData = useCallback((id: string, data: CFTData) => {
    onChange(sections.map(s => s.id === id ? { ...s, tableData: data } : s))
  }, [sections, onChange])

  const total = grandTotal(sections)

  return (
    <div className="space-y-6">
      {sections.map((section, idx) => {
        const thickness = parseFloat(section.thickness) || 0
        const secTotal = sectionTotal(section)

        return (
          <div key={section.id} className="border rounded-xl p-4 bg-white shadow-sm">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Section {idx + 1}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Thickness:</span>
                <Input
                  type="number"
                  step="0.25"
                  min="0.25"
                  placeholder="e.g. 2.5"
                  value={section.thickness}
                  onChange={e => updateThickness(section.id, e.target.value)}
                  className="w-28 h-8 text-sm"
                />
                <span className="text-sm text-gray-500">inches</span>
              </div>
              {secTotal > 0 && (
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-sm text-gray-500">Section Total:</span>
                  <span className="font-bold text-green-700">{secTotal} CFT</span>
                </div>
              )}
              {sections.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeSection(section.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* CFT Table */}
            {thickness > 0 ? (
              <CFTTable
                thickness={thickness}
                data={section.tableData}
                onChange={data => updateTableData(section.id, data)}
                categoryName={categoryName}
              />
            ) : (
              <div className="border-2 border-dashed rounded-lg py-10 text-center text-gray-400 text-sm">
                Enter thickness above to show the table
              </div>
            )}
          </div>
        )
      })}

      {/* Add Section Button */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={addSection}
          className="border-dashed border-2 text-green-700 border-green-400 hover:bg-green-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Thickness Section
        </Button>

        {total > 0 && (
          <div className="ml-auto bg-green-700 text-white px-6 py-2 rounded-lg font-bold text-lg">
            Grand Total: {total} CFT
          </div>
        )}
      </div>
    </div>
  )
}
