import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Signature } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface RealSignatureProps {
  budgetId: string
  totalAmount: number
  currency: string
}

export default function RealSignature({ budgetId, totalAmount, currency }: RealSignatureProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isApproved, setIsApproved] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [otp, setOtp] = useState('')
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [signatureDate, setSignatureDate] = useState<string | null>(null)
  const [signatureName, setSignatureName] = useState<string | null>(null)
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null)
  const [showApprovalDetailsDialog, setShowApprovalDetailsDialog] = useState(false)

  // Check if budget is already approved on component mount
  const checkApprovalStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('budget_approvals')
        .select('created_at, name, email')
        .eq('budget_id', budgetId)
        .eq('approved', true)
        .maybeSingle()

      if (error) throw error
      
      if (data) {
        setIsApproved(true)
        setSignatureDate(data.created_at)
        setSignatureName(data.name)
        setEmail(data.email)
      }
    } catch (error) {
      console.error('Error checking approval status:', error)
    }
  }

  // Fetch approval status on mount
  useEffect(() => {
    checkApprovalStatus()
  }, [budgetId])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      toast.error('Inserisci un indirizzo email valido')
      return
    }

    if (!name.trim()) {
      toast.error('Inserisci il tuo nome')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Generate a random 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
      
      // Store the OTP for later verification
      setGeneratedOtp(otpCode)
      
      // Send the OTP via email
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: 'Codice di verifica per approvazione preventivo',
          content: `
            <p>Ciao ${name},</p>
            <p>Ecco il tuo codice di verifica per approvare il preventivo:</p>
            <div style="
              font-size: 24px;
              font-weight: bold;
              margin: 20px 0;
              padding: 15px;
              background-color: #f5f5f5;
              border-radius: 5px;
              text-align: center;
              letter-spacing: 5px;
            ">
              ${otpCode}
            </div>
            <p>Il codice è valido solo per questa sessione.</p>
            <p>Se non hai richiesto questo codice, puoi ignorare questa email.</p>
          `
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore nell\'invio dell\'email')
      }
      
      toast.success('Codice OTP inviato alla tua email')
      setShowOtpInput(true)
    } catch (error) {
      console.error('Error sending OTP:', error)
      toast.error('Errore nell\'invio del codice OTP')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!otp.trim()) {
      toast.error('Inserisci il codice OTP')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Verify the OTP code matches the generated one
      if (otp !== generatedOtp) {
        toast.error('Codice OTP non valido')
        return
      }
      
      // First, get the current budget data to store as a snapshot
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('body, name')
        .eq('id', budgetId)
        .single()
        
      if (budgetError) throw budgetError
      
      if (!budgetData || !budgetData.body) {
        toast.error('Errore nel recupero dei dati del preventivo')
        return
      }
      
      // Record the approval in the database with the budget snapshot
      const { error } = await supabase
        .from('budget_approvals')
        .insert({
          budget_id: budgetId,
          email: email,
          name: name,
          approved: true,
          body_approval: budgetData.body // Store snapshot of the budget at time of approval
        })
        
      if (error) throw error
      
      // Fetch all connected users who should be notified (owner, editor, viewer roles)
      const { data: connectedUsers, error: usersError } = await supabase
        .from('link_budget_users')
        .select('user_id, external_email, user_role')
        .eq('budget_id', budgetId)
        .in('user_role', ['owner', 'editor', 'viewer'])
      
      if (usersError) throw usersError

      if (connectedUsers && connectedUsers.length > 0) {
        // Get user emails - either from external_email or auth.users table
        for (const user of connectedUsers) {
          let recipientEmail = user.external_email;
          
          // If external_email is not available but we have a user_id, fetch from auth.users
          if (!recipientEmail && user.user_id) {
            const { data: userData, error: userError } = await supabase
              .from('auth.users')
              .select('email')
              .eq('id', user.user_id)
              .single()
              
            if (userError) {
              console.error('Error fetching user email:', userError)
              continue // Skip this user and continue with the next one
            }
            
            if (userData) {
              recipientEmail = userData.email
            }
          }
          
          // Send notification email if we have a valid email
          if (recipientEmail) {
            const formattedDate = new Date().toLocaleDateString()
            const formattedTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            const budgetName = budgetData.name || 'Preventivo'
            const budgetLink = `${window.location.origin}/budget/${budgetId}`
            
            await fetch('/api/send-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: recipientEmail,
                subject: `Preventivo "${budgetName}" approvato`,
                content: `
                  <p>Gentile utente,</p>
                  <p>Ti informiamo che il preventivo <strong>"${budgetName}"</strong> è stato approvato.</p>
                  <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
                    <p><strong>Dettagli approvazione:</strong></p>
                    <p>Data: ${formattedDate}</p>
                    <p>Ora: ${formattedTime}</p>
                    <p>Nome: ${name}</p>
                    <p>Email: ${email}</p>
                  </div>
                  <p>Puoi visualizzare il preventivo approvato al seguente link:</p>
                  <p><a href="${budgetLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0;">Visualizza Preventivo</a></p>
                  <p>È stata salvata una copia del preventivo al momento dell'approvazione. Anche in caso di modifiche future al preventivo originale, la versione approvata rimarrà invariata.</p>
                `
              }),
            }).catch(err => {
              console.error(`Error sending notification to ${recipientEmail}:`, err)
            })
          }
        }
      }

      setShowSuccess(true)
      
      // Update local state
      const now = new Date().toISOString()
      setIsApproved(true)
      setSignatureDate(now)
      setSignatureName(name)
      
      // Reset after 3 seconds
      setTimeout(() => {
        setShowSuccess(false)
        setShowOtpInput(false)
        setOtp('')
        setGeneratedOtp(null)
        setDialogOpen(false)
      }, 3000)
    } catch (error) {
      console.error('Error verifying OTP:', error)
      toast.error('Errore nella verifica del codice OTP')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      {isApproved ? (
        <div 
          className="bg-green-100 border border-green-500 text-green-800 px-4 py-2 rounded-lg shadow-md text-sm font-medium flex items-center cursor-pointer hover:bg-green-200 transition-colors"
          onClick={() => setShowApprovalDetailsDialog(true)}
        >
          <Signature className="h-4 w-4 mr-2" />
          {signatureDate && new Date(signatureDate).toLocaleDateString()} - {signatureDate && new Date(signatureDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>
      ) : (
        <button
          onClick={() => setDialogOpen(true)}
          className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg shadow-md transition-colors font-medium flex items-center"
        >
          <Signature className="mr-2" />
          Accetta preventivo
        </button>
      )}

      {/* Proposal acceptance dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Accettazione preventivo</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            {totalAmount !== null && (
              <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">totale</span>
                  <span className="text-xl font-bold text-gray-900">
                    {new Intl.NumberFormat('it-IT', { 
                      style: 'currency', 
                      currency: currency 
                    }).format(totalAmount)}
                  </span>
                </div>
              </div>
            )}
            
            <p className="mb-4 text-sm text-gray-500">Per accettare il preventivo, inserisci il tuo nome e indirizzo email. Ti invieremo un codice di verifica OTP che dovrai inserire per completare l&apos;accettazione.</p>
            
            {showSuccess ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Preventivo firmato con successo!</h3>
                <p className="text-sm text-gray-500 mb-2">La firma digitale è stata apposta correttamente.</p>
                <p className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md border border-blue-100">
                  <strong>Nota:</strong> È stata salvata una copia del preventivo attuale. Anche in caso di modifiche future al preventivo originale, la versione approvata rimarrà invariata.
                </p>
              </div>
            ) : showOtpInput ? (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                    Codice OTP
                  </label>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                    placeholder="Inserisci il codice OTP"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-md disabled:opacity-70"
                >
                  {isSubmitting ? 'Verifica in corso...' : 'Conferma firma'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome e cognome
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                    placeholder="Inserisci il tuo nome e cognome"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Indirizzo email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                    placeholder="Inserisci la tua email"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-md disabled:opacity-70"
                >
                  {isSubmitting ? 'Invio in corso...' : 'Richiedi codice OTP'}
                </button>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Approval details dialog */}
      <Dialog open={showApprovalDetailsDialog} onOpenChange={setShowApprovalDetailsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dettagli approvazione</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <div className="flex items-center mb-4">
              <Signature className="h-6 w-6 mr-2 text-green-600" />
              <span className="text-lg font-medium">Preventivo sottoscritto</span>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="mb-2"><strong>Data:</strong> {signatureDate && new Date(signatureDate).toLocaleDateString()}</p>
              <p className="mb-2"><strong>Ora:</strong> {signatureDate && new Date(signatureDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              <p className="mb-2"><strong>Nome:</strong> {signatureName}</p>
              <p><strong>Email:</strong> {email}</p>
            </div>
            
            <p className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md border border-blue-100">
              <strong>Nota:</strong> È stata salvata una copia del preventivo al momento dell&apos;approvazione. Anche in caso di modifiche future al preventivo originale, la versione approvata rimarrà invariata.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 