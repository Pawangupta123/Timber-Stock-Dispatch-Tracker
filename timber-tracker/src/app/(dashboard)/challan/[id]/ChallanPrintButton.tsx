'use client'

import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

export default function ChallanPrintButton() {
  return (
    <Button onClick={() => window.print()} className="bg-gray-800 hover:bg-gray-900">
      <Printer className="w-4 h-4 mr-2" />
      Print Challan
    </Button>
  )
}
