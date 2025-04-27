import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Signature } from 'lucide-react'
import { toast } from 'sonner'

interface RealSignatureProps {
  budgetId: string
  totalAmount: number
  currency: string
  currencySymbol?: string
}

export default function RealSignature({ 
  budgetId, 
  totalAmount, 
  currency, 
  currencySymbol = '€' 
}: RealSignatureProps) {
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
  const [showApprovalDetailsDialog, setShowApprovalDetailsDialog] = useState(false)

  // Check if budget is already approved on component mount
  const checkApprovalStatus = async () => {
    try {
      const response = await fetch(`/api/budget/approval-status?budgetId=${budgetId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch approval status')
      }
      
      const { data } = await response.json()
      
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
      const response = await fetch('/api/budget/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          budgetId,
          email,
          name
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore nell\'invio dell\'OTP')
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
      const response = await fetch('/api/budget/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          budgetId,
          email,
          otp
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.error || 'Codice OTP non valido o scaduto')
        return
      }
      
      const data = await response.json()
      
      setShowSuccess(true)
      
      // Update local state
      setIsApproved(true)
      setSignatureDate(data.approvalDate)
      setSignatureName(data.name)
      
      // Rimosso il timer di 3 secondi per lasciare che l'utente chiuda manualmente
    } catch (error) {
      console.error('Error verifying OTP:', error)
      toast.error('Errore nella verifica del codice OTP')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Funzione per chiudere il dialog e resettare gli stati
  const handleCloseSuccessDialog = () => {
    setShowSuccess(false)
    setShowOtpInput(false)
    setOtp('')
    setDialogOpen(false)
  }

  // Function to format currency with symbol
  const formatCurrency = (amount: number): string => {
    const formatter = new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'symbol'
    })
    
    const formattedAmount = formatter.format(amount)
    
    // For some currencies like USD, the formatter may still show "USD 100" instead of "$ 100"
    // So we need to manually replace it in some cases
    if (formattedAmount.includes(currency)) {
      return formattedAmount.replace(currency, currencySymbol)
    }
    
    return formattedAmount
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
                    {formatCurrency(totalAmount)}
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
                <p className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md border border-blue-100 mb-4">
                  <strong>Nota:</strong> È stata salvata una copia del preventivo attuale. Anche in caso di modifiche future al preventivo originale, la versione approvata rimarrà invariata.
                </p>
                <button
                  onClick={handleCloseSuccessDialog}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-md"
                >
                  Chiudi
                </button>
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