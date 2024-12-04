'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Copy, Trash2, Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from '@/lib/supabase'
import StatsOverview from './components/stats'
import { useRouter } from 'next/navigation'


type Budget = {
  id: string
  budget_name: string
  created_at: string
  status: 'draft'
  userRole: 'owner'
}

type Template = {
  id: string
  name: string
  type: string
  useCase: string
}

export default function BudgetDashboard() {
    const router = useRouter()
  const [budgets, setBudgets] = useState<Budget[]>([])
  //const [isLoading, setIsLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Budget | null>(null)

  const [templates] = useState<Template[]>([
    { id: '1', name: 'Marketing Campaign', type: 'Marketing', useCase: 'Campagne pubblicitarie' },
    { id: '2', name: 'Software Project', type: 'IT', useCase: 'Sviluppo software' },
    { id: '3', name: 'Event Planning', type: 'Eventi', useCase: 'Organizzazione eventi' },
    { id: '4', name: 'Research Project', type: 'R&D', useCase: 'Progetti di ricerca' }
  ])

  const handleRowClick = (budgetId: string, event: React.MouseEvent) => {
    // Prevent navigation if clicking on action buttons
    if ((event.target as HTMLElement).closest('.action-buttons')) {
      return
    }
    router.push(`/budgez/${budgetId}`)
  }

  const fetchBudgets = async () => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const formattedBudgets = data.map(budget => ({
        id: budget.id,
        budget_name: budget.budget_name || 'Untitled Budget',
        created_at: budget.created_at,
        status: 'draft' as const,
        userRole: 'owner' as const
      }))
      
      setBudgets(formattedBudgets)
    } catch (error) {
      console.error('Error fetching budgets:', error)
    } finally {
      //setIsLoading(false)
    }
  }

  const createBudget = async () => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert([{
          budget_name: 'New Budget',
          body: {}
        }])
        .select('id')
        .single()
  
      if (error) throw error
      if (!data) throw new Error('No data returned')
      
      window.location.href = `/budgez/${data.id}`
    } catch (error) {
      console.error('Error creating budget:', error)
    }
  }

  const handleDuplicate = async (budget: Budget) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .insert([{
          budget_name: `${budget.budget_name} (Copy)`,
          body: {}
        }])
        .select()

      if (error) throw error
      
      await fetchBudgets()
    } catch (error) {
      console.error('Error duplicating budget:', error)
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
      
      await fetchBudgets()
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Error deleting budget:', error)
    }
  }

  useEffect(() => {
    fetchBudgets()
  }, [])

  return (
    <div className="flex h-screen bg-gray-100">
      <main className="flex-1 p-8">
        <Tabs defaultValue="budgets">
          <TabsList>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="budgets">Budgez</TabsTrigger>
            <TabsTrigger value="templates">Template</TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Stats</h1>
              </div>
              <StatsOverview />
            </Card>
          </TabsContent>

          <TabsContent value="budgets">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">i tuoi Budgez</h1>
                <Button onClick={createBudget}>
                  <Plus className="mr-2 h-4 w-4" /> Nuovo Budget
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Creazione</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Ruolo</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgets.map((budget) => (
                    <TableRow key={budget.id} 
                    className="cursor-pointer hover:bg-gray-900 hover:text-white"
                    onClick={(e) => handleRowClick(budget.id, e)}>
                      <TableCell className='rounded-l-lg'>
                        {new Date(budget.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className='font-bold'>{budget.budget_name}</TableCell>
                      <TableCell>
                        <Badge className="bg-gray-200 text-gray-800">draft</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-200 text-blue-800">owner</Badge>
                      </TableCell>
                      <TableCell className='rounded-r-lg'>
                        <div className="flex gap-2 action-buttons">
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDuplicate(budget)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
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
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Template</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Template</TableHead>
                    <TableHead>Tipologia</TableHead>
                    <TableHead>Caso d`&apos;`uso</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id} className='hover:bg-gray-900 hover:text-white'>
                      <TableCell>{template.name}</TableCell>
                      <TableCell>{template.type}</TableCell>
                      <TableCell>{template.useCase}</TableCell>
                      <TableCell className='rounded-r-lg'>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare il budgez `&quot;`{itemToDelete?.budget_name}`&quot;`? Questa azione non può essere annullata.
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
    </div>
  )
}