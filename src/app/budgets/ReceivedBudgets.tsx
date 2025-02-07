import { useState, useEffect } from 'react'
import { ExternalLink, FileText, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type ReceivedBudget = {
  id: string
  budget_name: string
  created_at: string
  request: string | null
}

export function ReceivedBudgets() {
  const router = useRouter()
  const [receivedBudgets, setReceivedBudgets] = useState<ReceivedBudget[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<ReceivedBudget | null>(null)

  const fetchReceivedBudgets = async () => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('id, budget_name, created_at, request')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const formattedBudgets = data.map(budget => ({
        id: budget.id,
        budget_name: budget.budget_name || 'Untitled Budget',
        created_at: budget.created_at,
        request: budget.request
      }))
      
      setReceivedBudgets(formattedBudgets)
    } catch (error) {
      console.error('Error fetching received budgets:', error)
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', itemToDelete.id)

      if (error) throw error
      
      await fetchReceivedBudgets()
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Error deleting budget:', error)
    }
  }

  const handleRowClick = (budgetId: string, event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest('.action-buttons') || 
        (event.target as HTMLElement).closest('.request-button')) {
      return
    }
    router.push(`/budgez/${budgetId}`)
  }

  const handleRequestClick = (requestId: string) => {
    console.log('Opening request:', requestId)
    // Implementa qui la logica per aprire la richiesta
  }

  useEffect(() => {
    fetchReceivedBudgets()
  }, [])

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">📪 Preventivi Ricevuti</h1>
        <p className="text-gray-500 mb-6 text-sm">
          Monitora e gestisci i preventivi che hai ricevuto: scegli tra i migliori e dai avvio ai progetti.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data Creazione</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Richiesta</TableHead>
            <TableHead>Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receivedBudgets.map((budget) => (
            <TableRow 
              key={budget.id}
              className="cursor-pointer hover:bg-gray-900 hover:text-white"
              onClick={(e) => handleRowClick(budget.id, e)}
            >
              <TableCell className="rounded-l-lg">
                {new Date(budget.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="font-bold">
                {budget.budget_name}
              </TableCell>
              <TableCell>
                {budget.request && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="request-button"
                    onClick={() => handleRequestClick(budget.request!)}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
              <TableCell className="rounded-r-lg">
                <div className="flex gap-2 action-buttons">
                  <Button variant="ghost" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setItemToDelete(budget)
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

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare il budgez &quot;{itemToDelete?.budget_name}&quot;? Questa azione non può essere annullata.
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