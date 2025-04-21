import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import BellaPreview, { Block, SnapshotData } from '../../budgez/[id]/components/bella/preview'
import RealSignature from './RealSignature'
import { toast } from 'sonner'

interface Props {
  id: string
}

// Update this code to use the Block type from the preview component
const extractQuoteTableData = (blocks: Block[]) => {
  const quoteTableBlock = blocks.find(block => block.type === 'quote-table');
  return quoteTableBlock?.metadata?.quoteTable;
};

export default function PublicBellaPreview({ id }: Props) {
  const [totalAmount, setTotalAmount] = useState<number | null>(null)
  const [currency, setCurrency] = useState<string>('EUR')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [snapshotData, setSnapshotData] = useState<SnapshotData | null>(null)
  
  useEffect(() => {
    const fetchBudgetData = async () => {
      try {
        setLoading(true)
        
        // First check if there's an approved version of this budget
        const { data: approvalData, error: approvalError } = await supabase
          .from('budget_approvals')
          .select('created_at, body_approval')
          .eq('budget_id', id)
          .eq('approved', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        if (approvalError && approvalError.code !== 'PGRST116') {
          // If there's an error other than "no rows returned", throw it
          throw approvalError
        }
        
        // If we found an approved version with snapshot data
        if (approvalData?.body_approval) {
          console.log('Found approved snapshot version of budget')
          setSnapshotData(approvalData.body_approval)
          
          // Extract total amount from snapshot data
          if (approvalData.body_approval?.bella?.blocks) {
            const quoteTable = extractQuoteTableData(approvalData.body_approval.bella.blocks);
            if (quoteTable) {
              extractTotalFromQuoteTable(quoteTable);
            }
          }
          
          setLoading(false)
          return
        }
        
        // If no approved version found, fetch the current version
        const { data, error } = await supabase
          .from('budgets')
          .select('body')
          .eq('id', id)
          .single()

        if (error) throw error

        if (data?.body?.bella?.blocks) {
          const quoteTable = extractQuoteTableData(data.body.bella.blocks);
          if (quoteTable) {
            extractTotalFromQuoteTable(quoteTable);
          }
        }
      } catch (error) {
        console.error('Error fetching budget data:', error)
        setError(error as Error)
        toast.error('Errore nel caricamento del preventivo')
      } finally {
        setLoading(false)
      }
    }
    
    // Helper function to extract total amount from a quote table
    const extractTotalFromQuoteTable = (quoteTable: {
      items: Array<{
        id: string;
        description: string;
        quantity: number;
        unitPrice: number;
        discount: number;
        tax: number;
        subtotal: number;
        isSubscription?: boolean;
      }>;
      currency: string;
      taxIncluded: boolean;
    }) => {
      const subtotal = quoteTable.items.reduce(
        (sum: number, item: { subtotal: number }) => sum + item.subtotal, 
        0
      )
      const taxAmount = quoteTable.items.reduce(
        (sum: number, item: { subtotal: number; tax: number }) => {
          return sum + (item.subtotal * (item.tax / 100))
        }, 
        0
      )
      const total = subtotal + (quoteTable.taxIncluded ? 0 : taxAmount)
      setTotalAmount(total)
      setCurrency(quoteTable.currency || 'EUR')
    }

    fetchBudgetData()
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-red-500 mb-4">Si è verificato un errore nel caricamento del preventivo</div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
        >
          Riprova
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Add the real signature component */}
      <RealSignature 
        budgetId={id} 
        totalAmount={totalAmount || 0} 
        currency={currency} 
      />
      
      {/* If this document is already approved, show notification banner */}
      {/* {isApproved && approvalDate && (
        <div className="bg-blue-50 p-4 mb-4 border-l-4 border-blue-400">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Versione approvata:</strong> Stai visualizzando la versione del preventivo approvata il {new Date(approvalDate).toLocaleDateString()} alle {new Date(approvalDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}. 
                Questa versione è immutabile e rimane valida anche in caso di modifiche al preventivo originale.
              </p>
            </div>
          </div>
        </div>
      )} */}
      
      {/* Use the original BellaPreview component with signature hidden */}
      {snapshotData ? (
        <div className="relative">
          <BellaPreview id={id} hideSignature={true} snapshotData={snapshotData} />
        </div>
      ) : (
        <BellaPreview id={id} hideSignature={true} />
      )}
    </div>
  )
} 