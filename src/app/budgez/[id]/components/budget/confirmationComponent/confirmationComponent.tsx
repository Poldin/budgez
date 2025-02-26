'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import {
  Check,
  X,
  AlertTriangle,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'


interface BudgetConfirmationProps {
  content: string
  budgetId: string
  onChange: (newContent: string) => void
  currentBudgetData: BudgetData
}

interface Confirmation {
  userId: string
  userEmail: string
  timestamp: string
  budgetSnapshot: BudgetData

}

interface ConfirmationContent {
  confirmations: Confirmation[]
}

interface BudgetUserLink {
  id: number
  budget_id: string
  user_id: string | null
  user_role: string | null
  external_email: string | null
  reminders: boolean
}

interface Block {
    id: string;
    type: "text" | "heading1" | "heading2" | "techbudget" | "confirmation";
    content: string;
  }
  
  // For currentBudgetData
  interface BudgetData {
    blocks?: Block[];
    id?: string;
    budget_name?: string;
    updated_at?: string;
    body?: {
      blocks: Block[];
      [key: string]: unknown;
    };
    // Adding other properties that might be referenced
    techbudget_data?: {
      commercial_margin?: number;
      margin_type?: string;
      discount?: number;
      discount_type?: string;
      section?: unknown[];
    };
  }
  
  // For currentUser
  interface User {
    id: string;
    email?: string;
  }

const BudgetConfirmationBlock = ({
  content,
  budgetId,
  onChange,
  currentBudgetData
}: BudgetConfirmationProps) => {
  const [confirmations, setConfirmations] = useState<Confirmation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [budgetName, setBudgetName] = useState<string>('')

  // Fetch current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        setCurrentUser(user)
      } catch (err) {
        console.error('Failed to fetch user:', err)
      }
    }

    const fetchBudgetName = async () => {
      try {
        const { data, error } = await supabase
          .from('budgets')
          .select('budget_name')
          .eq('id', budgetId)
          .single()

        if (error) throw error
        setBudgetName(data?.budget_name || 'Budget senza nome')
      } catch (err) {
        console.error('Error fetching budget name:', err)
      }
    }

    fetchCurrentUser()
    fetchBudgetName()
  }, [budgetId])

  // Parse content on component mount
  useEffect(() => {
    if (content) {
      try {
        const parsedContent: ConfirmationContent = JSON.parse(content)
        setConfirmations(parsedContent.confirmations || [])
      } catch (err) {
        console.error('Failed to parse confirmation content:', err)
        setConfirmations([])
      }
    } else {
      setConfirmations([])
    }
  }, [content])

  // Helper function to determine if current user has confirmed
  const hasUserConfirmed = () => {
    if (!currentUser) return false
    return confirmations.some(conf => conf.userId === currentUser.id)
  }

  // Helper to check if the current budget matches a confirmation's snapshot
  const isCurrentBudgetMatchingSnapshot = (snapshot: BudgetData) => {
    // Verifichiamo che lo snapshot abbia i blocks
    if (!snapshot?.blocks || !currentBudgetData?.blocks) return false;
    
    // Filtriamo i blocchi di tipo confirmation in entrambi gli array
    const currentBlocks = currentBudgetData.blocks.filter(
      (block: Block) => block.type !== 'confirmation'
    );
    
    const snapshotBlocks = snapshot.blocks.filter(
      (block: Block) => block.type !== 'confirmation'
    );
    
    // Se il numero di blocchi è diverso, i budget sono diversi
    if (currentBlocks.length !== snapshotBlocks.length) {
      console.log('Numero di blocchi diverso');
      return false;
    }
    
    // Confrontiamo ogni blocco
    for (let i = 0; i < currentBlocks.length; i++) {
      const currentBlock = currentBlocks[i];
      const snapshotBlock = snapshotBlocks[i];
      
      // Verifichiamo id e tipo
      if (currentBlock.id !== snapshotBlock.id || 
          currentBlock.type !== snapshotBlock.type) {
        console.log('ID o tipo diverso', currentBlock.id, snapshotBlock.id);
        return false;
      }
      
      // Per i blocchi di tipo techbudget, dobbiamo analizzare il JSON
      if (currentBlock.type === 'techbudget') {
        try {
          const currentData = JSON.parse(currentBlock.content);
          const snapshotData = JSON.parse(snapshotBlock.content);
          
          // Confrontiamo i valori rilevanti del techbudget
          if (currentData.commercial_margin !== snapshotData.commercial_margin ||
              currentData.margin_type !== snapshotData.margin_type ||
              currentData.discount !== snapshotData.discount ||
              currentData.discount_type !== snapshotData.discount_type) {
            console.log('Valori del techbudget diversi');
            return false;
          }
          
          // Confrontiamo le sezioni e le attività (controllo più completo)
          if (JSON.stringify(currentData.section) !== JSON.stringify(snapshotData.section)) {
            console.log('Sezioni del techbudget diverse');
            return false;
          }
        } catch (error) {
          console.error('Errore nel parsing del JSON del techbudget', error);
          return false;
        }
      } else {
        // Per gli altri tipi di blocchi, confrontiamo direttamente il contenuto
        if (currentBlock.content !== snapshotBlock.content) {
          console.log('Contenuto diverso per blocco non techbudget');
          return false;
        }
      }
    }
    
    // Se arriviamo qui, i budget sono uguali
    return true;
  };

  const sendNotificationEmails = async (confirmerEmail: string) => {
    try {
      // Fetch all users linked to this budget
      const { data: linkedUsers, error } = await supabase
        .from('link_budget_users')
        .select('*')
        .eq('budget_id', budgetId)

      if (error) throw error

      if (!linkedUsers || linkedUsers.length === 0) {
        console.log('Nessun utente collegato a questo budget')
        return
      }

      // Get auth.users data for user_id references
      const userIds = linkedUsers
        .filter(link => link.user_id)
        .map(link => link.user_id)
      
      const userEmails: Record<string, string> = {}
      
      if (userIds.length > 0) {
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds)
        
        if (!userError && users) {
          users.forEach(user => {
            if (user.id && user.email) {
              userEmails[user.id] = user.email
            }
          })
        }
      }

      // Prepare email recipients (internal and external)
      const emailRecipients: string[] = []
      
      linkedUsers.forEach((link: BudgetUserLink) => {
        // Handle user_id references (internal users)
        if (link.user_id && userEmails[link.user_id]) {
          const email = userEmails[link.user_id]
          if (email && email !== confirmerEmail && link.reminders) {
            emailRecipients.push(email)
          }
        }
        // Handle external_email references
        else if (link.external_email && link.external_email !== confirmerEmail && link.reminders) {
          emailRecipients.push(link.external_email)
        }
      })

      // Send emails to all recipients
      for (const recipientEmail of emailRecipients) {
        if (!recipientEmail) continue
        
        await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: recipientEmail,
            subject: `Conferma budget: ${budgetName}`,
            content: `
              <p>Ciao,</p>
              <p>${confirmerEmail} ha confermato il budget "${budgetName}" [https://www.budgez.xyz/budgez/${budgetId}].</p>
              <p>Puoi accedere al budget tramite la piattaforma Budgez per visionarlo.</p>
            `
          })
        })
      }
    } catch (err) {
      console.error('Errore nell\'invio delle email di notifica:', err)
    }
  }

  const handleConfirm = async () => {
    if (!currentUser) {
      setError('You must be logged in to confirm the budget')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Create a new confirmation
      const newConfirmation: Confirmation = {
        userId: currentUser.id,
        userEmail: currentUser.email || 'Unknown User',
        timestamp: new Date().toISOString(),
        budgetSnapshot: currentBudgetData
      }
      
      // Add to list of confirmations
      const updatedConfirmations = [...confirmations, newConfirmation]
      
      // Update content
      const newContent = JSON.stringify({
        confirmations: updatedConfirmations
      })
      
      // Call onChange to update in parent component
      onChange(newContent)
      
      // Update local state
      setConfirmations(updatedConfirmations)

      // Send notification emails
      if (currentUser.email) {
        await sendNotificationEmails(currentUser.email)
      }
    } catch (err) {
      console.error('Failed to confirm budget:', err)
      setError('Failed to confirm the budget. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveConfirmation = async () => {
    if (!currentUser) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Filter out the current user's confirmation
      const updatedConfirmations = confirmations.filter(
        conf => conf.userId !== currentUser.id
      )
      
      // Update content
      const newContent = JSON.stringify({
        confirmations: updatedConfirmations
      })
      
      // Call onChange to update in parent component
      onChange(newContent)
      
      // Update local state
      setConfirmations(updatedConfirmations)
    } catch (err) {
      console.error('Failed to remove confirmation:', err)
      setError('Failed to remove your confirmation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h3 className="text-md font-medium mb-3 flex items-center">
        <Check className="h-5 w-5 text-gray-600 mr-2" />
        Conferma budget
      </h3>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-2 rounded mb-3 text-sm">
          {error}
        </div>
      )}
      
      {confirmations.length === 0 ? (
        <div className="text-gray-600 text-sm mb-4">
          Non hai ancora confermato. Clicca &quot;Conferma budget&quot; per procedere con la tua conferma.
        </div>
      ) : (
        <div className="mb-4">
          {confirmations.map((conf) => {
            const isMatch = isCurrentBudgetMatchingSnapshot(conf.budgetSnapshot)
            
            return (
              <div 
                key={`${conf.userId}-${conf.timestamp}`}
                className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0"
              >
                <div className="flex items-center">
                  <div className="mr-3">
                    {isMatch ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <div className="group relative">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs rounded p-1 whitespace-nowrap z-50">
                          il budget è cambiato dalla versione della conferma.
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{conf.userEmail}</div>
                    <div className="text-xs text-gray-500 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {format(new Date(conf.timestamp), "dd/MM/yyyy HH:mm", { locale: it })}
                    </div>
                  </div>
                </div>
                
                {currentUser?.id === conf.userId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveConfirmation}
                    disabled={loading}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
      
      {!hasUserConfirmed() ? (
        <Button
          onClick={handleConfirm}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white"
          size="sm"
        >
          Conferma Budget
        </Button>
      ) : (
        <div className="text-sm text-green-600">
          Hai confermato il budget
        </div>
      )}
    </div>
  )
}

export default BudgetConfirmationBlock