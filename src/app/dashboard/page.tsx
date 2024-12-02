'use client'

import { useState } from 'react'
import { ExternalLink, Copy, Trash2, Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type BudgetStatus = 'active' | 'pending' | 'completed'
type UserRole = 'owner' | 'editor' | 'viewer'

type Budget = {
  id: string
  title: string
  client: string
  createdAt: string
  status: BudgetStatus
  userRole: UserRole
}

type Template = {
  id: string
  name: string
  type: string
  useCase: string
}

export default function BudgetDashboard() {

  const [budgets, setBudgets] = useState<Budget[]>([
    { id: '1', title: 'Marketing Q1', client: 'Acme Inc', createdAt: '2024-01-15', status: 'active', userRole: 'owner' },
    { id: '2', title: 'Development 2024', client: 'Tech Corp', createdAt: '2024-02-01', status: 'pending', userRole: 'editor' }
  ])

  const [templates] = useState<Template[]>([
    { id: '1', name: 'Marketing Campaign', type: 'Marketing', useCase: 'Campagne pubblicitarie' },
    { id: '2', name: 'Software Project', type: 'IT', useCase: 'Sviluppo software' },
    { id: '3', name: 'Event Planning', type: 'Eventi', useCase: 'Organizzazione eventi' },
    { id: '4', name: 'Research Project', type: 'R&D', useCase: 'Progetti di ricerca' }
  ])

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Budget | null>(null)

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'owner': return 'bg-blue-200 text-blue-800'
      case 'editor': return 'bg-green-200 text-green-800'
      case 'viewer': return 'bg-gray-200 text-gray-800'
    }
  }

  const handleDuplicate = (budget: Budget) => {
    const newBudget = {
      ...budget,
      id: Date.now().toString(),
      title: `${budget.title} (Copy)`,
      status: 'pending' as BudgetStatus,
      createdAt: new Date().toISOString().split('T')[0]
    }
    setBudgets([...budgets, newBudget])
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <nav className="w-64 bg-white shadow-sm p-4">
        <h2 className="text-xl font-bold mb-4">Menu</h2>
        <ul className="space-y-2">
          <li className="p-2 hover:bg-gray-100 rounded cursor-pointer">Dashboard</li>
          <li className="p-2 hover:bg-gray-100 rounded cursor-pointer">Impostazioni</li>
        </ul>
      </nav>

      <main className="flex-1 p-8">
        <Tabs defaultValue="budgets">
          <TabsList>
            <TabsTrigger value="budgets">Budgez</TabsTrigger>
            <TabsTrigger value="templates">Template</TabsTrigger>
          </TabsList>

          <TabsContent value="budgets">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Budgez</h1>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Nuovo Budget
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Creazione</TableHead>
                    <TableHead>Progetto</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Ruolo</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgets.map((budget) => (
                    <TableRow key={budget.id} className="cursor-pointer hover:bg-gray-900 hover:text-white">
                      <TableCell className='rounded-l-lg'>{new Date(budget.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{budget.title}</TableCell>
                      <TableCell>{budget.client}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(budget.userRole)}>
                          {budget.userRole}
                        </Badge>
                      </TableCell>
                      <TableCell className='rounded-r-lg'>
                        <div className="flex gap-2">
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
                    <TableHead>Caso d'uso</TableHead>
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
              Sei sicuro di voler eliminare il budgez "{itemToDelete?.title}"? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annulla
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (itemToDelete) {
                  setBudgets(budgets.filter(b => b.id !== itemToDelete.id))
                  setShowDeleteDialog(false)
                }
              }}
            >
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}