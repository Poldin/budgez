'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BellaPreview from '../../budgez/[id]/components/bella/preview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail } from 'lucide-react'

export default function PublicQuotePage() {
  const params = useParams()
  const publicId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [budgetId, setBudgetId] = useState<string | null>(null)
  const [accessMode, setAccessMode] = useState<'anyone' | 'restricted' | null>(null)
  const [email, setEmail] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [authorizedEmails, setAuthorizedEmails] = useState<string[]>([])
  const [hasAccess, setHasAccess] = useState(false)
  
  useEffect(() => {
    const fetchBudgetInfo = async () => {
      try {
        setLoading(true)
        
        const { data, error } = await supabase
          .from('budgets')
          .select('id, public_visibility, authorized_emails')
          .eq('public_id', publicId)
          .single()
        
        if (error) throw error
        
        if (!data) {
          setError('Preventivo non trovato')
          return
        }
        
        setBudgetId(data.id)
        setAccessMode(data.public_visibility)
        
        if (data.authorized_emails && Array.isArray(data.authorized_emails)) {
          setAuthorizedEmails(data.authorized_emails)
        }
        
        // Grant access immediately if it's public
        if (data.public_visibility === 'anyone') {
          setHasAccess(true)
        }
      } catch (error) {
        console.error('Error fetching budget:', error)
        setError('Preventivo non trovato o accesso non autorizzato')
      } finally {
        setLoading(false)
      }
    }
    
    fetchBudgetInfo()
  }, [publicId])
  
  const verifyEmail = async () => {
    if (!email || !email.includes('@')) {
      setError('Inserisci un indirizzo email valido')
      return
    }
    
    setIsVerifying(true)
    setError(null)
    
    try {
      // Check if email is in the authorized list
      if (authorizedEmails.includes(email.toLowerCase())) {
        setHasAccess(true)
        
        // Log access
        if (budgetId) {
          await supabase
            .from('budgets_logs')
            .insert({
              busget_id: budgetId,
              event: `accesso pubblico [email: ${email}]`,
              user_id: null,
              metadata: {
                access_email: email,
                access_method: 'email_verification'
              }
            })
        }
      } else {
        setError('Email non autorizzata ad accedere a questo preventivo')
      }
    } catch (error) {
      console.error('Error verifying email:', error)
      setError('Errore durante la verifica dell\'email')
    } finally {
      setIsVerifying(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">Caricamento...</div>
      </div>
    )
  }
  
  if (error && !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
          <div className="text-center text-red-500 mb-4">{error}</div>
          <Button 
            onClick={() => setError(null)}
            className="w-full"
          >
            Riprova
          </Button>
        </div>
      </div>
    )
  }
  
  if (accessMode === 'restricted' && !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Verifica Accesso</h1>
          <p className="text-gray-500 mb-6 text-center">
            Per visualizzare questo preventivo, inserisci la tua email.
          </p>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="La tua email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && verifyEmail()}
                  disabled={isVerifying}
                />
              </div>
              <Button 
                onClick={verifyEmail}
                disabled={isVerifying}
              >
                Verifica
              </Button>
            </div>
            
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  if (hasAccess && budgetId) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-black text-white py-6 px-6 shadow-md">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-semibold">Preventivo</h1>
          </div>
        </header>
        
        <main>
          <BellaPreview id={budgetId} />
        </main>
        
        <footer className="py-8 text-center text-gray-500 text-sm border-t mt-8">
          <div className="max-w-4xl mx-auto">
            <p>Powered by Budgez</p>
          </div>
        </footer>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        Errore imprevisto. Si prega di riprovare.
      </div>
    </div>
  )
} 