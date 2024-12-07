'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Copy, Trash2, Plus, Edit } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from '@/lib/supabase'
import StatsOverview from './components/stats'
import { useRouter } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"


type Budget = {
  id: string
  budget_name: string
  created_at: string
  status: 'draft'
  userRole: 'owner'
}

type Template = {
    id: string
    created_at: string
    body: {
      template: {
        name: string
        tag: string[]
        description: string
      }
    }
  }

  type EditTemplateData = {
    id: string;
    name: string;
    tag: string[];
    description: string;
  }

export default function BudgetDashboard() {
    const router = useRouter()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  //const [isLoading, setIsLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Budget | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editTemplate, setEditTemplate] = useState<EditTemplateData | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [showDeleteTemplateDialog, setShowDeleteTemplateDialog] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null)

  
  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return

    try {
        const { error } = await supabase
            .from('templates')
            .delete()
            .eq('id', templateToDelete.id)

        if (error) throw error
        
        await fetchTemplates()
        setShowDeleteTemplateDialog(false)
    } catch (error) {
        console.error('Error deleting template:', error)
    }
}
  
  const handleEditTemplate = (template: Template) => {
    setEditTemplate({
      id: template.id,
      name: template.body.template.name,
      tag: template.body.template.tag,
      description: template.body.template.description
    })
    setShowEditDialog(true)
  }

  const handleSaveTemplate = async () => {
    if (!editTemplate) return
  
    try {
      const { data: currentTemplate } = await supabase
        .from('templates')
        .select('body')
        .eq('id', editTemplate.id)
        .single()
  
      const updatedBody = {
        ...currentTemplate?.body,
        template: {
          ...currentTemplate?.body?.template,
          name: editTemplate.name,
          tag: editTemplate.tag,
          description: editTemplate.description
        }
      }
  
      const { error } = await supabase
        .from('templates')
        .update({ body: updatedBody })
        .eq('id', editTemplate.id)
  
      if (error) throw error
      await fetchTemplates()
      setShowEditDialog(false)
    } catch (error) {
      console.error('Error updating template:', error)
    }
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput && editTemplate) {
      e.preventDefault()
      setEditTemplate({
        ...editTemplate,
        tag: [...editTemplate.tag, tagInput]
      })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    if (editTemplate) {
      setEditTemplate({
        ...editTemplate,
        tag: editTemplate.tag.filter(tag => tag !== tagToRemove)
      })
    }
  }

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created at', { ascending: false })

        console.log(data)

      if (error) throw error
      setTemplates(data)
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

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
    fetchTemplates()
  }, [])

  return (
    <div className="flex h-screen bg-gray-100">
      <main className="flex-1 p-8">
        <Tabs defaultValue="budgets">
          <TabsList>
            <TabsTrigger value="stats" className="data-[state=active]:bg-black data-[state=active]:text-white">🧮Stats</TabsTrigger>
            <TabsTrigger value="budgets" className="data-[state=active]:bg-black data-[state=active]:text-white">⚡Budgez</TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-black data-[state=active]:text-white">🎢Template</TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">🧮Stats</h1>
              </div>
              <StatsOverview />
            </Card>
          </TabsContent>

          <TabsContent value="budgets">
            <Card className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                <h1 className="text-2xl font-bold">⚡Budgez</h1>
                <p className="text-gray-500 mb-6 text-sm">
                    I Budgez sono preventivi: il nostro obiettivo è permetterti di creare Budgez alla velocità della⚡luce e ricavare dati quando li condividi con i tuoi clienti. Così puoi chiudere più deal, meglio e controllando di più i risultati🤑
                </p>
                </div>
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
              <h2 className="text-2xl font-bold">🎢Template</h2>
              <p className="text-gray-500 mb-6 text-sm">
                    I template sono modelli predefiniti che ti permettono di iniziare rapidamente nuovi budgez con strutture già ottimizzate. Per creare un template, crea un nuovo Budgez e salvalo quando lo stai configurando al punto che ritieni opportuno🫣
                </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Template</TableHead>
                    <TableHead>Tag</TableHead>
                    <TableHead>Descrizione</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {templates.map((template) => (
                    <TableRow key={template.id} className='hover:bg-gray-900 hover:text-white'>
                        <TableCell className='rounded-l-lg font-semibold    '>
                        {template.body?.template?.name || 'Unnamed Template'}
                        </TableCell>
                        <TableCell>
                        <div className="flex flex-wrap gap-1">
                            {template.body?.template?.tag?.map((tag) => (
                            <Badge key={tag} variant="secondary" className="bg-gray-200 text-gray-800">
                                {tag}
                            </Badge>
                            )) || '-'}
                        </div>
                        </TableCell>
                        <TableCell>
                        {template.body?.template?.description || '-'}
                        </TableCell>
                        <TableCell className='rounded-r-lg'>
                        <div className="flex gap-2 items-center justify-start">
                        <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEditTemplate(template)}>
                            <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                    setTemplateToDelete(template)
                                    setShowDeleteTemplateDialog(true)
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

      {/* edit template */}
    <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifica Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input 
              value={editTemplate?.name || ''} 
              onChange={(e) => setEditTemplate(prev => prev ? {...prev, name: e.target.value} : null)}
            />
          </div>
          <div>
            <Label>Tag</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {editTemplate?.tag.map(tag => (
                <Badge key={tag} variant="secondary" className="bg-gray-200 text-gray-800">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="ml-1">×</button>
                </Badge>
              ))}
            </div>
            <Input 
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Premi Enter per aggiungere un tag"
            />
          </div>
          <div>
            <Label>Descrizione</Label>
            <Textarea 
              value={editTemplate?.description || ''} 
              onChange={(e) => setEditTemplate(prev => prev ? {...prev, description: e.target.value} : null)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowEditDialog(false)}>
            Annulla
          </Button>
          <Button onClick={handleSaveTemplate}>
            Salva
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete template dialog */}
    <Dialog open={showDeleteTemplateDialog} onOpenChange={setShowDeleteTemplateDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Conferma Eliminazione Template</DialogTitle>
                <DialogDescription>
                    Sei sicuro di voler eliminare il template &quot;{templateToDelete?.body.template.name}&quot;? Questa azione non può essere annullata.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteTemplateDialog(false)}>
                    Annulla
                </Button>
                <Button variant="destructive" onClick={handleDeleteTemplate}>
                    Elimina
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </div>
  )
}