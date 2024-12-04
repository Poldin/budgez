'use client'
import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"

type TaxRateKey = 'no-tax' | 'iva-22' | 'iva-10' | 'iva-4' | 'ritenuta-20'
type RowType = 'one-time' | 'subscription'

interface TaxRate {
  label: string
  rate: number
}

interface BudgetRow {
  id: string
  name: string
  type: RowType
  quantity: number
  unitPrice: number
  taxType: TaxRateKey
  description: string
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('it-IT', { 
    style: 'currency', 
    currency: 'EUR',
    minimumFractionDigits: 2 
  }).format(Math.abs(value))
}

const TAX_RATES: Record<TaxRateKey, TaxRate> = {
  'no-tax': { label: 'Nessuna tassa', rate: 0 },
  'iva-22': { label: 'IVA 22%', rate: 0.22 },
  'iva-10': { label: 'IVA 10%', rate: 0.10 },
  'iva-4': { label: 'IVA 4%', rate: 0.04 },
  'ritenuta-20': { label: 'Ritenuta 20%', rate: 0.20 }
}

export default function SimpleBudget() {
  const [rows, setRows] = useState<BudgetRow[]>([{
    id: '1',
    name: '',
    type: 'one-time',
    quantity: 1,
    unitPrice: 0,
    taxType: 'no-tax',
    description: ''
  }])

  const addRow = () => {
    setRows([...rows, {
      id: Date.now().toString(),
      name: '',
      type: 'one-time',
      quantity: 1,
      unitPrice: 0,
      taxType: 'no-tax',
      description: ''
    }])
  }

  const updateRow = (id: string, field: keyof BudgetRow, value: BudgetRow[keyof BudgetRow]) => {
    setRows(rows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ))
  }

  const removeRow = (id: string) => {
    setRows(rows.filter(row => row.id !== id))
  }

  const calculateSubtotal = () => {
    return rows.reduce((acc, row) => acc + (row.quantity * row.unitPrice), 0)
  }

  const calculateTotalTax = () => {
    return rows.reduce((acc, row) => {
      const subtotal = row.quantity * row.unitPrice
      return acc + (subtotal * TAX_RATES[row.taxType].rate)
    }, 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTotalTax()
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Nome</TableHead>
              <TableHead className="w-[120px]">Tipologia</TableHead>
              <TableHead className="w-[100px] text-right">Quantità</TableHead>
              <TableHead className="w-[120px] text-right">Prezzo Unitario</TableHead>
              <TableHead className="w-[120px]">Tasse</TableHead>
              <TableHead className="w-[120px] text-right">Imponibile</TableHead>
              <TableHead className="w-[120px] text-right">Totale</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(row => {
              const subtotal = row.quantity * row.unitPrice
              const taxAmount = subtotal * TAX_RATES[row.taxType].rate
              
              return (
                <>
                  <TableRow key={row.id} className="group">
                    <TableCell>
                      <Input
                        value={row.name}
                        onChange={e => updateRow(row.id, 'name', e.target.value)}
                        className="w-full"
                        placeholder="Nome voce"
                      />
                    </TableCell>
                    <TableCell>
                      <select
                        value={row.type}
                        onChange={e => updateRow(row.id, 'type', e.target.value as RowType)}
                        className="w-full p-2 border rounded bg-background"
                      >
                        <option value="one-time">One Shot</option>
                        <option value="subscription">Abbonamento</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={row.quantity}
                        onChange={e => updateRow(row.id, 'quantity', Number(e.target.value))}
                        className="w-full text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={row.unitPrice}
                        onChange={e => updateRow(row.id, 'unitPrice', Number(e.target.value))}
                        className="w-full text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <select
                        value={row.taxType}
                        onChange={e => updateRow(row.id, 'taxType', e.target.value as TaxRateKey)}
                        className="w-full p-2 border rounded bg-background"
                      >
                        {Object.entries(TAX_RATES).map(([key, { label }]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(subtotal)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(subtotal + taxAmount)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(row.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={8} className="border-b">
                      <Textarea
                        value={row.description}
                        onChange={e => updateRow(row.id, 'description', e.target.value)}
                        placeholder="Descrizione"
                        className="w-full min-h-[10px]"
                      />
                    </TableCell>
                  </TableRow>
                </>
              )
            })}
            <TableRow>
              <TableCell colSpan={8}>
                <Button onClick={addRow} variant="outline" size="sm" className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi voce
                </Button>
              </TableCell>
            </TableRow>
            <TableRow className="border-t-2">
              <TableCell colSpan={5} className="text-right">Imponibile</TableCell>
              <TableCell colSpan={2} className="text-right">{formatCurrency(calculateSubtotal())}</TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={5} className="text-right">Totale Tasse</TableCell>
              <TableCell colSpan={2} className="text-right">{formatCurrency(calculateTotalTax())}</TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={5} className="text-right font-bold">Totale</TableCell>
              <TableCell colSpan={2} className="text-right font-bold">{formatCurrency(calculateTotal())}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}