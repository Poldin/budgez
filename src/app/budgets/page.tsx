'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Copy, Trash2, Plus, Signature } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface BudgetQueryResult {
  budget_id: string
  user_role: 'owner' | 'editor' | 'viewer'
  budgets: {
    id: string
    budget_name: string | null
    created_at: string
    budget_status: string
    public_id: string
  } | null  
}

type Budget = {
  id: string
  public_id: string
  budget_name: string
  created_at: string
  status: 'draft'
  userRole: 'owner' | 'editor' | 'viewer'
  isApproved: boolean
  approvalDate?: string
}

const getRoleBadgeStyle = (role: string) => {
  switch (role) {
    case 'owner':
      return 'bg-blue-200 text-blue-800'
    case 'editor':
      return 'bg-green-200 text-green-800'
    case 'viewer':
      return 'bg-purple-200 text-purple-800'
    default:
      return 'bg-gray-200 text-gray-800'
  }
}

export default function BudgetDashboard() {
  const router = useRouter()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Budget | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 50

  const handleRowClick = (budgetId: string, event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest('.action-buttons')) {
      return
    }
    router.push(`/budgez/${budgetId}`)
  }

  const fetchBudgets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      // First get the count of all budgets for pagination
      const { count, error: countError } = await supabase
        .from('link_budget_users')
        .select('budget_id', { count: 'exact' })
        .eq('user_id', user.id)
        .in('user_role', ['owner', 'editor', 'viewer'])

      if (countError) throw countError
      
      // Calculate total pages
      const totalItems = count || 0
      const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage)
      setTotalPages(calculatedTotalPages || 1)

      // Adjust current page if needed
      if (currentPage > calculatedTotalPages) {
        setCurrentPage(calculatedTotalPages || 1)
      }

      // Now get the paginated data
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      const { data, error } = await supabase
        .from('link_budget_users')
        .select(`
          budget_id,
          user_role,
          budgets (
            id,
            budget_name,
            created_at,
            budget_status,
            public_id
          )
        `)
        .eq('user_id', user.id)
        .in('user_role', ['owner', 'editor', 'viewer'])
        .order('created_at', { foreignTable: 'budgets', ascending: false }) // Order by created_at in descending order
        .range(from, to)

      if (error) throw error

      const typedData = data as unknown as BudgetQueryResult[]
      
      const formattedBudgets = typedData
        .filter(item => item.budgets)
        .map(item => ({
          id: item.budgets!.id,
          public_id: item.budgets!.public_id,
          budget_name: item.budgets!.budget_name || 'Untitled Budget',
          created_at: item.budgets!.created_at,
          status: item.budgets!.budget_status as 'draft',
          userRole: item.user_role as 'owner' | 'editor' | 'viewer',
          isApproved: false, // default value, will be updated below
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // Ensure client-side sorting
      
      // Check approval status for each budget
      const budgetsWithApproval = await Promise.all(
        formattedBudgets.map(async (budget) => {
          try {
            const { data: approvalData } = await supabase
              .from('budget_approvals')
              .select('created_at')
              .eq('budget_id', budget.id)
              .eq('approved', true)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()

            if (approvalData) {
              return {
                ...budget,
                isApproved: true,
                approvalDate: approvalData.created_at
              }
            }
          } catch (error) {
            console.error(`Error checking approval for budget ${budget.id}:`, error)
          }
          return budget
        })
      )
      
      setBudgets(budgetsWithApproval)
    } catch (error) {
      console.error('Error fetching budgets:', error)
    }
  }

  const generatePublicId = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    
    const randomLetters = Array.from(
      { length: 4 }, 
      () => letters.charAt(Math.floor(Math.random() * letters.length))
    ).join('');
    
    const randomNumbers = Array.from(
      { length: 4 }, 
      () => numbers.charAt(Math.floor(Math.random() * numbers.length))
    ).join('');
  
    return `${randomLetters}${randomNumbers}`;
  };

  const createBudget = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')
  
      const public_id = generatePublicId();
  
      // First create the budget
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .insert([{
          budget_name: 'New Budget',
          body: {},
          public_id: public_id
        }])
        .select('id')
        .single()
  
      if (budgetError) throw budgetError
      if (!budgetData) throw new Error('No data returned')
  
      // Then create the user link
      const { error: linkError } = await supabase
        .from('link_budget_users')
        .insert([{
          budget_id: budgetData.id,
          user_id: user.id,
          user_role: 'owner',
          external_email: user.email
        }])
  
      if (linkError) throw linkError
  
      // Add logging
      const { error: logError } = await supabase
        .from('budgets_logs')
        .insert([{
          busget_id: budgetData.id,
          event: 'ha creato un nuovo budget',
          user_id: user.id,
          metadata: {
            logger_email: user.email
          }
        }])
  
      if (logError) throw logError
      
      window.location.href = `/budgez/${budgetData.id}`
    } catch (error) {
      console.error('Error creating budget:', error)
    }
  }

  const handleDuplicate = async (budget: Budget) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')
  
      const public_id = generatePublicId();
  
      // First create the duplicate budget
      const { data: newBudget, error: budgetError } = await supabase
        .from('budgets')
        .insert([{
          budget_name: `${budget.budget_name} (Copy)`,
          body: {},
          public_id: public_id
        }])
        .select()
        .single()
  
      if (budgetError) throw budgetError
      if (!newBudget) throw new Error('No data returned')
  
      // Then create the user link
      const { error: linkError } = await supabase
        .from('link_budget_users')
        .insert([{
          budget_id: newBudget.id,
          user_id: user.id,
          user_role: 'owner',
          external_email: user.email
        }])
  
      if (linkError) throw linkError
  
      // Add logging
      const { error: logError } = await supabase
        .from('budgets_logs')
        .insert([{
          busget_id: newBudget.id,
          event: 'ha creato un nuovo budget',
          user_id: user.id,
          metadata: {
            logger_email: user.email
          }
        }])
  
      if (logError) throw logError
      
      await fetchBudgets()
    } catch (error) {
      console.error('Error duplicating budget:', error)
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return

    try {
      // Start a Supabase transaction to ensure atomicity
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      // First delete all logs associated with the budget
      const { error: logsError } = await supabase
        .from('budgets_logs')
        .delete()
        .eq('busget_id', itemToDelete.id)

      if (logsError) {
        console.error('Error deleting logs:', logsError)
        throw logsError
      }

      // Then delete all user links
      const { error: linkError } = await supabase
        .from('link_budget_users')
        .delete()
        .eq('budget_id', itemToDelete.id)

      if (linkError) {
        console.error('Error deleting user links:', linkError)
        throw linkError
      }

      // Finally delete the budget itself
      const { error: budgetError } = await supabase
        .from('budgets')
        .delete()
        .eq('id', itemToDelete.id)

      if (budgetError) {
        console.error('Error deleting budget:', budgetError)
        throw budgetError
      }
      
      await fetchBudgets()
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Error in delete operation:', error)
      // You might want to show an error message to the user here
    }
  }

  useEffect(() => {
    fetchBudgets()
    // fetchTemplates()
  }, [currentPage])

  return (
    <div className="flex h-screen bg-gray-100">
      <main className="flex-1 p-8">
        <Tabs defaultValue="budgets">
          <TabsList>
            <TabsTrigger value="budgets" className="data-[state=active]:bg-black data-[state=active]:text-white">⚡le tue quotazioni</TabsTrigger>
            {/* <TabsTrigger value="budgets_received" className="data-[state=active]:bg-black data-[state=active]:text-white">📪 ricevuti</TabsTrigger> */}
          </TabsList>

          <TabsContent value="budgets">
            <Card className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold">⚡le tue quotazioni</h1>
                  <p className="text-gray-500 mb-6 text-sm">
                    Crea preventivi e condividili internamente con il team per completarli rapidamente.
                  </p>
                </div>
                <Button onClick={createBudget}>
                  <Plus className="mr-2 h-4 w-4" /> nuovo preventivo
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Creazione</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    {/* <TableHead>Stato</TableHead> */}
                    <TableHead>Ruolo</TableHead>
                    <TableHead>Stato Approvazione</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgets.map((budget) => (
                    <TableRow 
                      key={budget.id} 
                      className="cursor-pointer hover:bg-gray-900 hover:text-white"
                      onClick={(e) => handleRowClick(budget.id, e)}
                    >
                      <TableCell className="rounded-l-lg">
                        {new Date(budget.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="">
                        {budget.public_id}
                      </TableCell>
                      <TableCell className="font-bold">{budget.budget_name}</TableCell>
                      {/* <TableCell>
                        <Badge className="bg-gray-200 text-gray-800">draft</Badge>
                      </TableCell> */}
                      <TableCell>
                        <Badge className={getRoleBadgeStyle(budget.userRole)}>
                          {budget.userRole}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {budget.isApproved ? (
                          <Badge className="bg-green-100 border border-green-500 text-green-800 flex items-center">
                            <Signature className="h-3 w-3 mr-1" />
                            Approvato
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">Non approvato</span>
                        )}
                      </TableCell>
                      <TableCell className="rounded-r-lg">
                        <div className="flex gap-2 action-buttons">
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDuplicate(budget)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          {budget.userRole === 'owner' && (
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
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-4 gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Precedente
                  </Button>
                  <div className="flex items-center px-4">
                    Pagina {currentPage} di {totalPages}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Successiva
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* <TabsContent value="budgets_received">
            <ReceivedBudgets />
          </TabsContent> */}
        </Tabs>
      </main>

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
    </div>
  )
}