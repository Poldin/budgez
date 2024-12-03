'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ExternalLink, Copy, Trash2, ArrowLeft, ArrowUpRight, Share } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Brief from './components/brief'
import SimpleBudget from './components/budget/SimpleBudget/page'
import TechBudget from './components/budget/TechBudget/page'

interface Document {
  id: string;
  file: File | null;
  name: string;
  size: string;
  url: string;
}

interface Link {
  id: string;
  url: string;
  name: string;
}

interface Brief {
  description: string;
  documents: Document[];
  links: Link[];
}

interface GeneralInfo {
  projectName: string;
  client: string;
  budgez_code: string;
  internalStatus: 'draft' | 'pending' | 'approved' | 'rejected';
}

interface BudgetSection {
  id: string;
  name: string;
  amount: number;
}

interface Budget {
  section: BudgetSection[];
  commercial_margin: number;
  discount: number;
}

interface BudgetData {
  brief: Brief;
  general_info: GeneralInfo;
  budget: Budget;
}

const defaultData: BudgetData = {
  brief: { description: '', documents: [], links: [] },
  general_info: {
    projectName: '',
    client: '',
    budgez_code: '',
    internalStatus: 'draft'
  },
  budget: {
    section: [],
    commercial_margin: 0,
    discount: 0
  }
}

export default function BudgetPage() {
  const params = useParams()
  const budgetId = params.id as string
  const supabase = createClientComponentClient()
  
  const [budgetData, setBudgetData] = useState<BudgetData>(defaultData)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [title, setTitle] = useState("Untitled Budget")
  const [calculatorType, setCalculatorType] = useState('simple')
  const [isLoading, setIsLoading] = useState(true)
  console.log("budgetId: ", budgetId)


  useEffect(() => {
    if (budgetId) {
      loadBudget()
      console.log("loading the budget: ", budgetId)
    }
  }, [budgetId])

  const loadBudget = async () => {
    setIsLoading(true)
    try {
      const { data: budget, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', budgetId)
        .single()

      if (error) throw error

      if (budget) {
        setTitle(budget.budget_name || "Untitled Budget")
        if (budget.body) {
          setBudgetData(budget.body as BudgetData)
          setCalculatorType(budget.body.budget_type || 'simple')
        }
      }
    } catch (error) {
      console.error('Error loading budget:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveBudget = async () => {
    try {
      const budgetBody = {
        ...budgetData,
        budget_type: calculatorType
      }

      const { error } = await supabase
        .from('budgets')
        .update({
          budget_name: title,
          body: budgetBody,
          updated_at: new Date().toISOString()
        })
        .eq('id', budgetId)
      
      if (error) throw error
    } catch (error) {
      console.error('Error saving budget:', error)
    }
  }

  const handleUpdate = (newData: Partial<BudgetData>) => {
    const updatedData = { ...budgetData, ...newData }
    setBudgetData(updatedData)
    saveBudget()
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    saveBudget()
  }

  const handleCalculatorTypeChange = (value: string) => {
    setCalculatorType(value)
    saveBudget()
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Loading...</div>
  }

  return (
    <div className="flex h-full bg-gray-100">
      <main className="flex-1 p-8">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost"
              className="hover:bg-black rounded-full hover:text-white"
            >
              <ArrowLeft className="h-7 w-7" />
            </Button>
            <Input
              value={title}
              onChange={handleTitleChange}
              className="text-xl font-bold bg-white border-none focus:bg-white"
            />
            <div className="flex gap-1 ml-auto">
              <Button 
                variant="outline" 
                className="flex items-center bg-white"
              >
                <ArrowUpRight className="h-4 w-4" />
                External
              </Button>
              <Button 
                variant="outline" 
                className='bg-black text-white hover:bg-gray-800 hover:text-white'
              >
                <Share className="h-4 w-4" /> Share
              </Button>
            </div>
          </div>

          <Tabs defaultValue="budget" className="mb-6">
            <TabsList>
              <TabsTrigger value="brief">Brief</TabsTrigger>
              <TabsTrigger value="budget">Budget</TabsTrigger>
              <TabsTrigger value="external">External</TabsTrigger>
            </TabsList>

            <Card className="p-6">
              <TabsContent value="brief">
                <Brief budgetData={budgetData} onUpdate={handleUpdate} />
              </TabsContent>

              <TabsContent value="budget">
                <div className="flex justify-between items-center space-x-4 mb-6">
                  <h2 className="text-xl font-bold">Budget</h2>
                  <Select
                    value={calculatorType}
                    onValueChange={handleCalculatorTypeChange}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select calculator type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple Budget</SelectItem>
                      <SelectItem value="tech">Tech Project Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {calculatorType === 'simple' && <SimpleBudget />}
                {calculatorType === 'tech' && <TechBudget />}
              </TabsContent>

              <TabsContent value="external">
                <h2 className="text-xl font-bold">External View</h2>
              </TabsContent>
            </Card>
          </Tabs>
        </div>
      </main>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>Are you sure you want to delete this item?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(false)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}