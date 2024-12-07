'use client'
import { useState, useCallback } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type TaxRateKey = 'no-tax' | 'iva-22' | 'iva-10' | 'iva-4' | 'ritenuta-20'
type RowType = 'one-time' | 'subscription'
type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

interface TaxRate {
  label: string
  rate: number
}

interface SubscriptionConfig {
  startDate: string
  endDate: string
  frequency: Frequency
}

interface BudgetRow {
  id: string
  name: string
  type: RowType
  quantity: number
  unitPrice: number
  taxType: TaxRateKey
  description: string
  subscriptionConfig?: EnhancedSubscriptionConfig;
}

interface DelayConfig {
  value: number;
  unit: 'days' | 'weeks' | 'months' | 'years';
}

interface CustomFrequency {
  value: number;
  unit: 'days' | 'weeks' | 'months' | 'years';
}

interface EnhancedSubscriptionConfig {
  startType: 'date' | 'manual' | 'event';
  startDate?: string;
  startDelay?: DelayConfig;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  customFrequency?: CustomFrequency;
  endType: 'date' | 'occurrences' | 'manual';
  endDate?: string;
  occurrences?: number;
}



const TAX_RATES: Record<TaxRateKey, TaxRate> = {
  'no-tax': { label: 'Nessuna tassa', rate: 0 },
  'iva-22': { label: 'IVA 22%', rate: 0.22 },
  'iva-10': { label: 'IVA 10%', rate: 0.10 },
  'iva-4': { label: 'IVA 4%', rate: 0.04 },
  'ritenuta-20': { label: 'Ritenuta 20%', rate: 0.20 }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('it-IT', { 
    style: 'currency', 
    currency: 'EUR',
    minimumFractionDigits: 2 
  }).format(Math.abs(value))
}

export default function SimpleBudget() {
  const [rows, setRows] = useState<BudgetRow[]>([{
    id: '1',
    name: '',
    type: 'one-time',
    quantity: 1,
    unitPrice: 0,
    taxType: 'no-tax',
    description: '',
    subscriptionConfig: {
      startType: 'date',
      startDate: new Date().toISOString().split('T')[0],
      frequency: 'monthly',
      endType: 'manual'
    }
  }])

  const addRow = useCallback(() => {
    setRows(prevRows => [...prevRows, {
      id: Date.now().toString(),
      name: '',
      type: 'one-time',
      quantity: 1,
      unitPrice: 0,
      taxType: 'no-tax',
      description: '',
      subscriptionConfig: {
        startType: 'date',
        startDate: new Date().toISOString().split('T')[0],
        frequency: 'monthly',
        endType: 'manual'
      }
    }])
  }, [])

  const updateRow = useCallback((id: string, field: keyof BudgetRow, value: any) => {
    setRows(prevRows => prevRows.map(row => {
      if (row.id === id) {
        return { ...row, [field]: value }
      }
      return row
    }))
  }, [])

  const updateSubscriptionConfig = useCallback((id: string, field: keyof EnhancedSubscriptionConfig | 'startDelay' | 'customFrequency', value: any) => {
    setRows(prevRows => prevRows.map(row => {
      if (row.id === id && row.subscriptionConfig) {
        if (field === 'startDelay' || field === 'customFrequency') {
          return {
            ...row,
            subscriptionConfig: {
              ...row.subscriptionConfig,
              [field]: value
            }
          }
        }
        return {
          ...row,
          subscriptionConfig: {
            ...row.subscriptionConfig,
            [field]: value
          }
        }
      }
      return row
    }))
  }, [])

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

  const subscriptionRows = rows.filter(row => row.type === 'subscription')

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
              <TableCell colSpan={5} className="text-right font-bold">Imponibile</TableCell>
              <TableCell colSpan={2} className="text-right font-bold">{formatCurrency(calculateSubtotal())}</TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={5} className="text-right">Totale Tasse</TableCell>
              <TableCell colSpan={2} className="text-right">{formatCurrency(calculateTotalTax())}</TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={5} className="text-right font-bold text-2xl">Totale</TableCell>
              <TableCell colSpan={2} className="text-right font-bold text-2xl">{formatCurrency(calculateTotal())}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {subscriptionRows.length > 0 && (
  <Card>
    <CardHeader>
      <CardTitle></CardTitle>
    </CardHeader>
    <CardContent>
      {subscriptionRows.map(row => (
        <div key={row.id} className="space-y-2 rounded">
          <div className="font-semibold">{row.name || 'Abbonamento senza nome'}</div>
          
          {/* Start Date Configuration */}
          <div className="space-y-2">
            <div className='flex gap-2 items-center justify-center'>
            <label className="text-sm font-medium bg-black text-white rounded-sm p-2">inizio</label>
            <Select 
              value={row.subscriptionConfig?.startType} 
              onValueChange={(value) => updateSubscriptionConfig(row.id, 'startType', value)}

            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
              <SelectItem value="event" className='font-semibold'>Evento <span className='text-sm text-gray-500 font-normal'> definisci un evento e un ritardo (opzionale): l'abbonamento parirà nella data identificata</span></SelectItem>
                <SelectItem value="date" className='font-semibold'>Data <span className='text-sm text-gray-500 font-normal'> definisci una data e un ritardo (opzionale): l'abbonamento parirà nella data identificata</span></SelectItem>
                <SelectItem value="manual" className='font-semibold'>Manuale <span className='text-sm text-gray-500 font-normal'> l'abbonamento verrà inizializzato manualmente</span></SelectItem>
              </SelectContent>
            </Select>
            </div>

            {row.subscriptionConfig?.startType === 'event' && (
              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={row.subscriptionConfig.startDate ?? 'budget-approval'}
                  defaultValue="budget-approval"
                  onValueChange={(value) => updateSubscriptionConfig(row.id, 'startDate', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona evento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="budget-approval">Approvazione del Budget</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={row.subscriptionConfig.startDelay?.value}
                  onChange={e => updateSubscriptionConfig(row.id, 'startDelay', {
                    value: Number(e.target.value),
                    unit: row.subscriptionConfig?.startDelay?.unit || 'days'
                  })}
                  placeholder="Ritardo"
                />
                <Select
                  value={row.subscriptionConfig.startDelay?.unit}
                  onValueChange={(value) => updateSubscriptionConfig(row.id, 'startDelay', {
                    value: row.subscriptionConfig?.startDelay?.value || 0,
                    unit: value as DelayConfig['unit']
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Giorni</SelectItem>
                    <SelectItem value="weeks">Settimane</SelectItem>
                    <SelectItem value="months">Mesi</SelectItem>
                    <SelectItem value="years">Anni</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

{row.subscriptionConfig?.startType === 'date' && (
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="date"
                  value={row.subscriptionConfig.startDate}
                  onChange={e => updateSubscriptionConfig(row.id, 'startDate', e.target.value)}
                />
                <Input
                  type="number"
                  value={row.subscriptionConfig.startDelay?.value}
                  onChange={e => updateSubscriptionConfig(row.id, 'startDelay', {
                    value: Number(e.target.value),
                    unit: row.subscriptionConfig?.startDelay?.unit || 'days'
                  })}
                  placeholder="Ritardo"
                />
                <Select
                  value={row.subscriptionConfig.startDelay?.unit}
                  onValueChange={(value) => updateSubscriptionConfig(row.id, 'startDelay', {
                    value: row.subscriptionConfig?.startDelay?.value || 0,
                    unit: value as DelayConfig['unit']
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Giorni</SelectItem>
                    <SelectItem value="weeks">Settimane</SelectItem>
                    <SelectItem value="months">Mesi</SelectItem>
                    <SelectItem value="years">Anni</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Frequency Configuration */}
          <div className="space-y-2">
            <div className='flex items-center justify-center gap-2'>
            <label className="text-sm font-medium bg-black text-white rounded-sm p-2">frequenza</label>
            <Select
              value={row.subscriptionConfig?.frequency}
              onValueChange={(value) => updateSubscriptionConfig(row.id, 'frequency', value)}
            >
              
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Giornaliero</SelectItem>
                <SelectItem value="weekly">Settimanale</SelectItem>
                <SelectItem value="monthly">Mensile</SelectItem>
                <SelectItem value="yearly">Annuale</SelectItem>
                <SelectItem value="custom">Personalizzato</SelectItem>
              </SelectContent>
            </Select>
            </div>

            {row.subscriptionConfig?.frequency === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  value={row.subscriptionConfig.customFrequency?.value}
                  onChange={e => updateSubscriptionConfig(row.id, 'customFrequency', {
                    value: Number(e.target.value),
                    unit: row.subscriptionConfig?.customFrequency?.unit || 'days'
                  })}
                />
                <Select
                  value={row.subscriptionConfig.customFrequency?.unit}
                  onValueChange={(value) => updateSubscriptionConfig(row.id, 'customFrequency', {
                    value: row.subscriptionConfig?.customFrequency?.value || 0,
                    unit: value as CustomFrequency['unit']
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Giorni</SelectItem>
                    <SelectItem value="weeks">Settimane</SelectItem>
                    <SelectItem value="months">Mesi</SelectItem>
                    <SelectItem value="years">Anni</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* End Date Configuration */}
          <div className="space-y-2">
            <div className='flex items-center justify-center gap-2'>
            <label className="text-sm font-medium bg-black text-white rounded-sm p-2">fine</label>
            <Select
              value={row.subscriptionConfig?.endType}
              onValueChange={(value) => updateSubscriptionConfig(row.id, 'endType', value)}
              
            >
              <SelectTrigger>
                <SelectValue  />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date" className='font-semibold'>Data specifica <span className='text-sm text-gray-500 font-normal'> viene definita una data specifica di fine</span></SelectItem>
                <SelectItem value="occurrences" className='font-semibold'>Numero occorrenze <span className='text-sm text-gray-500 font-normal'> al termine delle occorrenze specificate si chiude l'abbonamento</span></SelectItem>
                <SelectItem value="manual" className='font-semibold'>Manuale <span className='text-sm text-gray-500 font-normal'> l'abbonamento verrà chiuso manualmente</span></SelectItem>
              </SelectContent>
            </Select>
            </div>

            {row.subscriptionConfig?.endType === 'date' && (
              <Input
                type="date"
                value={row.subscriptionConfig.endDate}
                onChange={e => updateSubscriptionConfig(row.id, 'endDate', e.target.value)}
              />
            )}

            {row.subscriptionConfig?.endType === 'occurrences' && (
              <Input
                type="number"
                value={row.subscriptionConfig.occurrences}
                onChange={e => updateSubscriptionConfig(row.id, 'occurrences', Number(e.target.value))}
                min={1}
                placeholder="Numero di occorrenze"
              />
            )}
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
)}
    </div>
  )
}