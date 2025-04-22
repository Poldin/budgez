'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface Currency {
  id: number
  code: string
  symbol: string
  label: string
}

interface SettingsProps {
  budgetId: string
}

export default function Settings({ budgetId }: SettingsProps) {
  const [currency, setCurrency] = useState<string>('EUR')
  const [loading, setLoading] = useState(true)
  const [currencies, setCurrencies] = useState<Currency[]>([])

  // Load currencies from the database
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const { data, error } = await supabase
          .from('currency')
          .select('*')
          .order('code')

        if (error) throw error

        if (data) {
          setCurrencies(data)
        }
      } catch (error) {
        console.error('Error loading currencies:', error)
        // Fallback to some default currencies if database fetch fails
        setCurrencies([
          { id: 1, code: 'EUR', symbol: '€', label: 'Euro (€)' },
          { id: 2, code: 'USD', symbol: '$', label: 'US Dollar ($)' }
        ])
      }
    }

    fetchCurrencies()
  }, [])

  // Load existing settings from the database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('budgets')
          .select('settings')
          .eq('id', budgetId)
          .single()

        if (error) throw error

        // If settings exist and have a currency, set it
        if (data.settings?.currency) {
          setCurrency(data.settings.currency)
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [budgetId])

  // Save changes to the database
  const saveSettings = async (newCurrency: string) => {
    try {
      setCurrency(newCurrency)

      // Create a settings object with currency code and symbol
      const currencyData = currencies.find(c => c.code === newCurrency)
      const settings = {
        currency: newCurrency,
        currencySymbol: currencyData?.symbol || '€' // Default to Euro symbol if not found
      }

      const { error } = await supabase
        .from('budgets')
        .update({
          settings: settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', budgetId)

      if (error) throw error

      toast.success('Impostazioni salvate')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Errore nel salvataggio delle impostazioni')
    }
  }

  // Get currency display label
  const getCurrencyLabel = (code: string) => {
    const currencyData = currencies.find(c => c.code === code)
    return currencyData ? currencyData.label : code
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Impostazioni generali</CardTitle>
          <CardDescription>
            Configura le impostazioni generali del preventivo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Valuta</Label>
            <Select
              disabled={loading || currencies.length === 0}
              value={currency}
              onValueChange={saveSettings}
            >
              <SelectTrigger id="currency" className="w-full md:w-[240px]">
                <SelectValue placeholder="Seleziona valuta">
                  {currency && getCurrencyLabel(currency)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {currencies.map(curr => (
                  <SelectItem key={curr.code} value={curr.code}>
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              La valuta selezionata sarà utilizzata in tutto il preventivo e nella visualizzazione pubblica.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
