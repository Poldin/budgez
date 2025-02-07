'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { supabase } from '@/lib/supabase'

type TaxDescription = {
  id: string
  created_at: string
  body: {
    fixed: number
    percentage: number
    description: string
  }
}

type FormData = {
  fixed: number
  percentage: number
  description: string
}

const initialFormData: FormData = {
  fixed: 0,
  percentage: 0,
  description: ''
}

export default function TaxSettings() {

  const [taxes, setTaxes] = useState<TaxDescription[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedTax, setSelectedTax] = useState<TaxDescription | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isLoading, setIsLoading] = useState(true)

  const fetchTaxes = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('tax_descriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTaxes(data || [])
    } catch (error) {
      console.error('Error fetching taxes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('User not authenticated')

      if (selectedTax) {
        const { error } = await supabase
          .from('tax_descriptions')
          .update({
            body: formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTax.id)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('tax_descriptions')
          .insert([{
            body: formData,
            user_id: user.id
          }])

        if (error) throw error
      }

      setShowDialog(false)
      setSelectedTax(null)
      setFormData(initialFormData)
      fetchTaxes()
    } catch (error) {
      console.error('Error saving tax:', error)
    }
  }

  const handleDelete = async () => {
    if (!selectedTax) return

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('tax_descriptions')
        .delete()
        .eq('id', selectedTax.id)
        .eq('user_id', user.id)

      if (error) throw error

      setShowDeleteDialog(false)
      setSelectedTax(null)
      fetchTaxes()
    } catch (error) {
      console.error('Error deleting tax:', error)
    }
  }

  useEffect(() => {
    fetchTaxes()
  }, [])

  if (isLoading) {
    return <div>waiting the next apocalypse...</div>
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold">📑 Tasse</h2>
          <p className="text-gray-500 mb-6 text-sm">
            Configura le tue aliquote IVA e imposte fisse da applicare ai preventivi.
          </p>
        </div>
        <Button onClick={() => {
          setSelectedTax(null)
          setFormData(initialFormData)
          setShowDialog(true)
        }}>
          <Plus className="mr-2 h-4 w-4" /> Nuova Tassa
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrizione</TableHead>
            <TableHead>Importo Fisso</TableHead>
            <TableHead>Percentuale</TableHead>
            <TableHead>Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {taxes.map((tax) => (
            <TableRow 
              key={tax.id} 
              className="cursor-pointer hover:bg-gray-900 hover:text-white"
            >
              <TableCell className="rounded-l-lg">
                {tax.body.description}
              </TableCell>
              <TableCell>€ {tax.body.fixed.toFixed(2)}</TableCell>
              <TableCell>{tax.body.percentage}%</TableCell>
              <TableCell className="rounded-r-lg">
                <div className="flex gap-2 action-buttons">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedTax(tax)
                      setFormData(tax.body)
                      setShowDialog(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedTax(tax)
                      setShowDeleteDialog(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTax ? 'Modifica Tassa' : 'Nuova Tassa'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descrizione</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="es. IVA standard, Ritenuta d'acconto..."
              />
            </div>
            <div className="space-y-2">
              <Label>Importo Fisso (€)</Label>
              <Input
                type="number"
                value={formData.fixed}
                onChange={(e) => setFormData(prev => ({ ...prev, fixed: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Percentuale (%)</Label>
              <Input
                type="number"
                value={formData.percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, percentage: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleSave}>
              {selectedTax ? 'Aggiorna' : 'Crea'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare questa tassa? L&apos;azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}