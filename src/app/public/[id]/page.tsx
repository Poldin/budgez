'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PublicBellaPreview from '../components/PublicBellaPreview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {AlertTriangle, Lock, Send } from 'lucide-react'
import { toast } from 'sonner'

export default function PublicQuotePage() {
  const params = useParams()
  const publicId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [budgetId, setBudgetId] = useState<string | null>(null)
  const [sharingMode, setSharingMode] = useState<'restricted' | 'open' | null>(null)
  const [email, setEmail] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  
  useEffect(() => {
    const fetchBudgetInfo = async () => {
      try {
        setLoading(true)
        console.log('🔍 Fetching budget info for public ID:', publicId)
        
        const { data, error } = await supabase
          .from('budgets')
          .select('id, sharing_mode')
          .eq('public_id', publicId)
          .single()
        
        if (error) throw error
        
        if (!data) {
          console.log('❌ Budget not found for public ID:', publicId)
          setError('Preventivo non trovato')
          return
        }

        console.log('✅ Budget found:', data)
        console.log('🔒 Sharing mode:', data.sharing_mode)

        // Non verifico più lo status, considero il preventivo pubblicato se ha sharing_mode
        if (!data.sharing_mode) {
          console.log('❌ Budget has no sharing mode, access denied')
          setError('Questo preventivo non è disponibile')
          return
        }
        
        setBudgetId(data.id)
        setSharingMode(data.sharing_mode as 'restricted' | 'open' || 'restricted')
        
        // Grant access immediately if it's public and open
        if (data.sharing_mode === 'open') {
          console.log('🔓 Sharing mode is open, granting access immediately')
          setHasAccess(true)
        } else {
          console.log('🔒 Sharing mode is restricted, email verification required')
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
      console.log('❌ Invalid email format:', email)
      toast.error('Inserisci un indirizzo email valido')
      return
    }

    console.log('🔍 Verifying email access for:', email)
    console.log('🔑 Budget ID for verification:', budgetId)
    
    setIsVerifying(true)
    
    try {
      // Check if this email is authorized to view the budget
      const { data, error } = await supabase
        .from('link_budget_users')
        .select('user_role')
        .eq('budget_id', budgetId)
        .eq('external_email', email)
        .single()
      
      if (error) {
        console.log('❌ Email verification failed:', error)
        console.log('❌ No matching record found for email:', email)
        toast.error('Accesso non autorizzato')
        return
      }
      
      // If we found a match, the user is authorized
      console.log('✅ Email verified successfully:', email)
      console.log('👤 User role:', data.user_role)
      setHasAccess(true)
      toast.success('Accesso autorizzato')
    } catch (error) {
      console.error('Error verifying email:', error)
      toast.error('Errore nella verifica dell\'email')
    } finally {
      setIsVerifying(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento preventivo...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full px-6 py-8 bg-white shadow-md rounded-lg">
          <div className="flex items-center justify-center mb-6">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-center mb-4">Preventivo non disponibile</h1>
          <p className="text-gray-600 text-center">{error}</p>
        </div>
      </div>
    )
  }
  
  if (!hasAccess && sharingMode === 'restricted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full px-6 py-8 bg-white shadow-md rounded-lg">
          <div className="flex items-center justify-center mb-6">
            <Lock className="w-12 h-12 text-gray-700" />
          </div>
          <h1 className="text-xl font-bold text-center mb-4">Preventivo riservato</h1>
          <p className="text-gray-600 text-center mb-6">
            Per visualizzare questo preventivo, conferma la tua email di accesso.
          </p>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="La tua email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={verifyEmail} 
                disabled={isVerifying}
                className="bg-black hover:bg-gray-800 text-white"
              >
                {isVerifying ? 'Verifica...' : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white text-white py-4 px-6 shadow-md">
        <div className="min-h-10">
          {/* <h1 className="text-xl font-semibold">Preventivo</h1> */}
        </div>
      </header>
      
      <main>
        {budgetId && <PublicBellaPreview id={budgetId} />}
      </main>
    </div>
  )
} 