import React, { useState, useEffect, useRef } from 'react';
import { Copy, Mail, CheckCheck, Trash2, ExternalLink, AlertCircle, Loader2, Megaphone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface PublishDialogProps {
  budgetId: string;
  publicId: string | null;
}

interface SharedUser {
  id: number;
  external_email: string;
  created_at: string;
  customer_otp: string | null;
}

const PublishDialog: React.FC<PublishDialogProps> = ({ budgetId, publicId }) => {
  const [sharingMode, setSharingMode] = useState<'restricted' | 'open'>('restricted');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [publishInProgress, setPublishInProgress] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoadingPaymentInfo, setIsLoadingPaymentInfo] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showNonOwnerDialog, setShowNonOwnerDialog] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [showQuoteValidationDialog, setShowQuoteValidationDialog] = useState(false);
  const [quoteValidationError, setQuoteValidationError] = useState<string | null>(null);
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load current sharing mode from database
  useEffect(() => {
    const loadBudgetSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('budgets')
          .select('sharing_mode')
          .eq('id', budgetId)
          .single();
        
        if (error) throw error;
        
        if (data && data.sharing_mode) {
          setSharingMode(data.sharing_mode as 'restricted' | 'open');
        }
      } catch (error) {
        console.error('Error loading budget settings:', error);
      }
    };
    
    loadBudgetSettings();
  }, [budgetId]);

  // Load shared users
  useEffect(() => {
    const loadSharedUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('link_budget_users')
          .select('id, external_email, created_at, customer_otp')
          .eq('budget_id', budgetId)
          .eq('user_role', 'customer')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (data) {
          setSharedUsers(data as SharedUser[]);
        }
      } catch (error) {
        console.error('Error loading shared users:', error);
      }
    };
    
    if (budgetId) {
      loadSharedUsers();
    }
  }, [budgetId]);

  // Generate the public URL based on the publicId
  const publicUrl = publicId 
    ? `${window.location.origin}/public/${publicId}`
    : '';

  const copyToClipboard = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      setIsCopied(true);
      toast.success('Link copiato negli appunti');
      
      // Reset the icon after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };

  const handleShareModeChange = async (value: 'restricted' | 'open') => {
    setSharingMode(value);
    try {
      setIsLoading(true);
      
      // Update sharing_mode in the database
      const { error } = await supabase
        .from('budgets')
        .update({
          sharing_mode: value,
          updated_at: new Date().toISOString(),
        })
        .eq('id', budgetId);

      if (error) throw error;
      
      toast.success(`Modalità di condivisione impostata a: ${value === 'open' ? 'Pubblico' : 'Ristretto'}`);
    } catch (error) {
      console.error('Error updating sharing mode:', error);
      toast.error('Errore nell\'aggiornamento della modalità di condivisione');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if quote table block is used and final amount is greater than 0
  const validateQuote = async () => {
    try {
      console.log('🔄 validateQuote chiamata con budgetId:', budgetId);
      if (!budgetId) {
        console.error('❌ budgetId non valido:', budgetId);
        setQuoteValidationError('ID budget non valido');
        setShowQuoteValidationDialog(true);
        return false;
      }
      
      setIsLoading(true);
      console.log('🔍 Iniziando la validazione del preventivo per budgetId:', budgetId);
      
      // Fetch budget data to check for Bella editor blocks
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('body')
        .eq('id', budgetId)
        .single();
      
      if (budgetError) {
        console.error('❌ Errore nel recupero dei dati del budget:', budgetError);
        throw budgetError;
      }
      
      console.log('📋 Dati budget recuperati:', JSON.stringify(budgetData?.body, null, 2));
      
      // Check if Bella editor contains a quote-table block
      // Note: the block type is 'quote-table' with a hyphen, not underscore
      const bellaBlocks = budgetData?.body?.bella?.blocks || [];
      console.log('📑 Blocchi trovati in Bella editor:', bellaBlocks.length);
      console.log('🔍 Tipi di blocchi disponibili:', bellaBlocks.map((b: {type: string}) => b.type));
      
      const quoteTableBlock = bellaBlocks.find((block: {type: string}) => block.type === 'quote-table');
      console.log('📊 Quote table block trovato?', quoteTableBlock ? 'Sì' : 'No');
      
      if (!quoteTableBlock) {
        console.log('❌ Nessun blocco quote-table trovato');
        setQuoteValidationError('Il budget deve contenere almeno un blocco tabella preventivo');
        setShowQuoteValidationDialog(true);
        return false;
      }
      
      console.log('📊 Quote table block completo:', JSON.stringify(quoteTableBlock, null, 2));
      
      // Check if the quote table has items
      const quoteItems = quoteTableBlock.metadata?.quoteTable?.items;
      console.log('📝 Quote items trovati:', quoteItems ? quoteItems.length : 0);
      
      if (!quoteItems || !Array.isArray(quoteItems) || quoteItems.length === 0) {
        console.log('❌ Quote items non validi o vuoti');
        setQuoteValidationError('La tabella preventivo deve contenere almeno un elemento');
        setShowQuoteValidationDialog(true);
        return false;
      }
      
      // Calculate total amount directly from items
      let total = 0;
      
      for (const item of quoteItems) {
        const quantity = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const discount = parseFloat(item.discount) || 0;
        
        // Calculate subtotal (price after discount)
        const baseAmount = quantity * unitPrice;
        const discountAmount = baseAmount * (discount / 100);
        let subtotal = baseAmount - discountAmount;
        
        // Add tax if not included
        if (!quoteTableBlock.metadata?.quoteTable?.taxIncluded) {
          const tax = parseFloat(item.tax) || 0;
          const taxAmount = subtotal * (tax / 100);
          subtotal += taxAmount;
        }
        
        total += subtotal;
        console.log(`💰 Item: ${item.description?.substring(0, 20)}... | Subtotale: ${subtotal}`);
      }
      
      console.log(`💰 Totale calcolato: ${total}`);
      
      if (total <= 0) {
        console.log('❌ Totale non valido (≤ 0)');
        setQuoteValidationError('L\'importo finale del preventivo deve essere maggiore di 0');
        setShowQuoteValidationDialog(true);
        return false;
      }
      
      console.log('✅ Validazione preventivo completata con successo');
      return true;
    } catch (error) {
      console.error('❌ Errore durante la validazione del preventivo:', error);
      setQuoteValidationError('Errore durante la validazione del preventivo');
      setShowQuoteValidationDialog(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const publishBudget = async () => {
    console.log('🚀 publishBudget chiamata con budgetId:', budgetId);
    if (!budgetId) {
      console.error('❌ budgetId non valido:', budgetId);
      toast.error('ID budget non valido');
      return;
    }
    
    try {
      setPublishInProgress(true);
      console.log('🚀 Avvio processo di pubblicazione budget...');
      
      // If there's no publicId, generate one first
      let currentPublicId = publicId;
      if (!currentPublicId) {
        currentPublicId = generatePublicId();
      }
      
      // Update the budget status to 'public' and set the public_id
      const { error } = await supabase
        .from('budgets')
        .update({
          budget_status: 'public',
          public_id: currentPublicId,
          sharing_mode: sharingMode,
          updated_at: new Date().toISOString(),
        })
        .eq('id', budgetId);

      if (error) throw error;
      
      // Log the publish event
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('budgets_logs')
          .insert({
            busget_id: budgetId,
            event: `ha pubblicato il budget`,
            user_id: user.id,
            metadata: {
              logger_email: user.email,
              sharing_mode: sharingMode
            }
          });
      }
      
      toast.success('Budget pubblicato con successo!');
      
      // Reload the page to update the UI
      window.location.reload();
    } catch (error) {
      console.error('Error publishing budget:', error);
      toast.error('Errore nella pubblicazione del budget');
    } finally {
      setPublishInProgress(false);
    }
  };

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

  // Generate 6-digit OTP password
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendEmailWithBudget = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      toast.error('Inserisci un indirizzo email valido');
      return;
    }
    
    // Check if email is already in the shared list
    if (sharedUsers.some(user => user.external_email === recipientEmail)) {
      toast.error('Questa email è già stata aggiunta');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get the current user information
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!publicId) {
        // If budget is not published yet, publish it first
        toast.error('Devi prima pubblicare il budget per poterlo condividere');
        setIsLoading(false);
        return;
      }
      
      // Generate 6-digit OTP password
      const otp = generateOTP();
      
      // Add the recipient to link_budget_users table
      const { error: linkError } = await supabase
        .from('link_budget_users')
        .insert({
          budget_id: budgetId,
          user_role: 'customer',
          external_email: recipientEmail,
          reminders: true,
          customer_otp: otp
        });
      
      if (linkError) throw linkError;
      
      // Log the sharing event
      if (user) {
        await supabase
          .from('budgets_logs')
          .insert({
            busget_id: budgetId,
            event: `ha condiviso il budget via email con ${recipientEmail}`,
            user_id: user.id,
            metadata: {
              logger_email: user.email,
              recipient_email: recipientEmail,
              customer_otp: otp
            }
          });
      }
      
      // Add the new shared user to the local state
      const { data } = await supabase
        .from('link_budget_users')
        .select('id, external_email, created_at, customer_otp')
        .eq('external_email', recipientEmail)
        .eq('budget_id', budgetId)
        .single();
        
      if (data) {
        setSharedUsers(prev => [data as SharedUser, ...prev]);
      }
      
      // Send email notification using the send-email API
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipientEmail,
          subject: 'Budget condiviso con te su Budgez',
          content: `
            <p>Ciao,</p>
            <p>${user?.email || 'è stato'} condiviso con te un budget su Budgez.</p>
            <p>Puoi visualizzarlo cliccando sul seguente link:</p>
            <p><a href="${publicUrl}" style="display: inline-block; background-color: #000; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; margin: 15px 0;">Visualizza Budget</a></p>
            <p>Il tuo codice di accesso è: <strong>${otp}</strong></p>
            <p></p>
            <p>Grazie,<br>Il team di Budgez</p>
          `
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nell\'invio dell\'email');
      }
      
      toast.success(`Email inviata a ${recipientEmail}`);
      setRecipientEmail('');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Errore nell\'invio dell\'email');
    } finally {
      setIsLoading(false);
    }
  };

  const removeSharedUser = async (id: number, email: string) => {
    try {
      setIsLoading(true);
      
      // Delete from the database
      const { error } = await supabase
        .from('link_budget_users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update the local state
      setSharedUsers(prev => prev.filter(user => user.id !== id));
      
      // Log the removal
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('budgets_logs')
          .insert({
            busget_id: budgetId,
            event: `ha rimosso la condivisione con ${email}`,
            user_id: user.id,
            metadata: {
              logger_email: user.email,
              removed_email: email
            }
          });
      }
      
      toast.success(`Condivisione con ${email} rimossa`);
    } catch (error) {
      console.error('Error removing shared user:', error);
      toast.error('Errore nella rimozione della condivisione');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to check if payment method is set up
  const checkPaymentMethod = async () => {
    try {
      setIsLoadingPaymentInfo(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Utente non autenticato');
        return false;
      }

      // First, check if the user is the owner of the budget
      const { data: linkData, error: linkError } = await supabase
        .from('link_budget_users')
        .select('user_role')
        .eq('budget_id', budgetId)
        .eq('user_id', user.id)
        .single();

      if (linkError) {
        console.error('Errore nel recupero del ruolo utente:', linkError);
        return false;
      }

      // If user is not the owner, show the non-owner dialog
      if (!linkData || linkData.user_role !== 'owner') {
        setShowNonOwnerDialog(true);
        return false;
      }
      
      // Query user_settings table for the current user
      const { data: userSettings, error } = await supabase
        .from('user_settings')
        .select('body')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Errore nel recupero delle impostazioni utente:', error);
        return false;
      }
      
      // Check if stripe_payment_method exists in the body
      if (!userSettings || !userSettings.body || !userSettings.body.stripe_payment_method) {
        setShowPaymentDialog(true);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking payment method:', error);
      return false;
    } finally {
      setIsLoadingPaymentInfo(false);
    }
  };

  // Redirect to checkout/payment setup
  const redirectToCheckout = async () => {
    try {
      setIsLoadingPaymentInfo(true);
      
      // Get current URL to redirect back after payment setup
      const returnUrl = window.location.href;
      
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          return_url: returnUrl
        }),
      });
      
      if (!response.ok) {
        throw new Error('Errore durante la creazione della sessione di checkout');
      }
      
      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('URL di checkout non valido');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Errore nella creazione della sessione di pagamento');
    } finally {
      setIsLoadingPaymentInfo(false);
    }
  };

  // Function to handle dialog trigger click
  const handleDialogTrigger = async () => {
    console.log('👆 Pulsante Pubblica cliccato (handleDialogTrigger)');
    setIsButtonLoading(true);
    
    try {
      // Step 1: Check payment method
      console.log('💳 Verifico metodo di pagamento...');
      const isPaymentSet = await checkPaymentMethod();
      console.log('💳 Controllo metodo di pagamento completato:', isPaymentSet);
      
      if (!isPaymentSet) {
        console.log('❌ Metodo di pagamento non configurato');
        setIsButtonLoading(false);
        return;
      }
      
      // Step 2: Validate quote table
      console.log('📊 Verifico tabella preventivo...');
      const isQuoteValid = await validateQuote();
      console.log('📊 Validazione tabella preventivo completata:', isQuoteValid);
      
      if (!isQuoteValid) {
        console.log('❌ Tabella preventivo non valida');
        setIsButtonLoading(false);
        return;
      }
      
      // Step 3: If both validations pass, open the dialog
      console.log('✅ Tutte le verifiche completate con successo');
      console.log('🔓 Aprendo dialog di pubblicazione');
      setIsDialogOpen(true);
    } catch (error) {
      console.error('❌ Errore durante le verifiche:', error);
      toast.error('Si è verificato un errore durante le verifiche preliminari');
    } finally {
      setIsButtonLoading(false);
    }
  };

  // Redirect to settings page
  const redirectToSettings = () => {
    window.open('/settings?tab=pagamenti', '_blank');
  };

  // Check if returning from payment setup
  useEffect(() => {
    const checkPaymentReturn = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const paymentSuccess = searchParams.get('payment_success');
      
      if (paymentSuccess === 'true') {
        // Remove the parameter from URL to avoid reloading
        const url = new URL(window.location.href);
        url.searchParams.delete('payment_success');
        window.history.replaceState({}, '', url.toString());
        
        // Verify payment method and open publish dialog if valid
        setIsButtonLoading(true);
        const isPaymentSet = await checkPaymentMethod();
        if (isPaymentSet) {
          setIsDialogOpen(true);
          toast.success('Metodo di pagamento configurato con successo!');
        }
        setIsButtonLoading(false);
      }
    };
    
    checkPaymentReturn();
  }, []);

  const fetchEmailSuggestions = async (searchTerm: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Fetching email suggestions for term:', searchTerm);

      // First, get all budgets associated with the current user
      const { data: userBudgets, error: budgetsError } = await supabase
        .from('link_budget_users')
        .select('budget_id')
        .eq('user_id', user.id);

      if (budgetsError) {
        console.error('Error fetching user budgets:', budgetsError);
        return;
      }

      if (!userBudgets || userBudgets.length === 0) {
        console.log('No budgets found for user');
        return;
      }

      const budgetIds = userBudgets.map(b => b.budget_id);

      // Then, get all emails from these budgets
      const { data, error } = await supabase
        .from('link_budget_users')
        .select('external_email, created_at')
        .in('budget_id', budgetIds)
        .not('external_email', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching email suggestions:', error);
        return;
      }

      console.log('Email suggestions data:', data);

      // Get unique emails
      const uniqueEmails = Array.from(new Set(
        data
          .map(item => item.external_email)
          .filter(email => 
            email && 
            email.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !sharedUsers.some(user => user.external_email === email)
          )
      )).slice(0, 6); // Take only the first 6

      console.log('Filtered suggestions:', uniqueEmails);
      setEmailSuggestions(uniqueEmails);
    } catch (error) {
      console.error('Error in fetchEmailSuggestions:', error);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRecipientEmail(value);
    fetchEmailSuggestions(value);
    setShowSuggestions(true);
  };

  const handleSelectEmail = (selectedEmail: string) => {
    setRecipientEmail(selectedEmail);
    setShowSuggestions(false);
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  };

  const handleInputFocus = () => {
    fetchEmailSuggestions('');
    setShowSuggestions(true);
  };

  const handleClickOutside = (e: MouseEvent) => {
    // Non chiudere se il click è sull'input o sulla tendina
    if ((emailInputRef.current && emailInputRef.current.contains(e.target as Node)) || 
        (dropdownRef.current && dropdownRef.current.contains(e.target as Node))) {
      return;
    }
    setShowSuggestions(false);
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1 bg-black text-white hover:bg-gray-800 hover:text-white"
        onClick={handleDialogTrigger}
        disabled={isButtonLoading || isLoadingPaymentInfo}
      >
        {isButtonLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifica...
          </>
        ) : (
          <>
            <Megaphone className="h-4 w-4 animate-pulse" />
            Pubblica
          </>
        )}
      </Button>

      {/* Quote Validation Dialog */}
      <Dialog open={showQuoteValidationDialog} onOpenChange={setShowQuoteValidationDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Requisiti per la pubblicazione</DialogTitle>
          </DialogHeader>
          
          <div className="py-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="text-yellow-500 h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Impossibile pubblicare il budget</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {quoteValidationError || 'Il budget non soddisfa i requisiti per la pubblicazione.'}
                </p>
                
                <div className="mt-4 bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium">Requisiti:</p>
                  <ul className="text-sm text-gray-500 list-disc pl-5 mt-1 space-y-1">
                    <li>Deve essere presente almeno un blocco tabella preventivo</li>
                    <li>L&apos;importo finale del preventivo deve essere maggiore di 0</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => setShowQuoteValidationDialog(false)}
              className="w-full"
            >
              Ho capito
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Non-Owner Dialog */}
      <Dialog open={showNonOwnerDialog} onOpenChange={setShowNonOwnerDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Impossibile procedere</DialogTitle>
          </DialogHeader>
          
          <div className="py-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="text-yellow-500 h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Configurazione necessaria</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Per procedere con la pubblicazione, il proprietario del budget deve configurare un metodo di pagamento valido.
                  Questo è richiesto per l&apos;addebito automatico della commissione (0,1%) quando un cliente accetta un preventivo.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Contatta il proprietario del budget per richiedere la configurazione del metodo di pagamento.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => setShowNonOwnerDialog(false)}
              className="w-full"
            >
              Ho capito
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Method Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Configurazione modalità di pagamento</DialogTitle>
          </DialogHeader>
          
          <div className="py-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="text-yellow-500 h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Configurazione necessaria</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Come proprietario del budget, è necessario configurare un metodo di pagamento valido per procedere con la pubblicazione.
                  Questo è richiesto per l&apos;addebito automatico della commissione (0,1%) quando un cliente accetta un preventivo.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 mt-6">
              <Button 
                onClick={redirectToCheckout}
                className="w-full bg-black hover:bg-gray-800"
                disabled={isLoadingPaymentInfo}
              >
                {isLoadingPaymentInfo ? "Preparando il checkout..." : "Registra metodo di pagamento"}
              </Button>
              <Button 
                variant="outline" 
                onClick={redirectToSettings}
                className="w-full"
              >
                Vai alle impostazioni di pagamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Main Publish Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[60%]">
          <DialogHeader>
            <DialogTitle className="text-xl">pubblica e condividi</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">Condividi il tuo budget con altri attraverso un link o via email, scegliendo se renderlo accessibile a tutti o solo a persone specifiche.</p>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Select 
                value={sharingMode}
                onValueChange={(value) => handleShareModeChange(value as 'restricted' | 'open')}
                disabled={isLoading}
              >
                <SelectTrigger className="w-fit h-fit p-3 items-start justify-start">
                  <SelectValue placeholder="Seleziona modalità di condivisione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restricted" className="py-3">
                    <div className="flex flex-col gap-2">
                      <span className="font-medium">Solo account condivisi</span>
                      <span className="text-xs text-gray-500">Solo le persone con cui hai condiviso il budgetvia email potranno visualizzarlo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="open" className="py-3">
                    <div className="flex flex-col gap-2">
                      <span className="font-medium">Chiunque con il link</span>
                      <span className="text-xs text-gray-500">Chiunque possieda il link al budget potrà visualizzarlo</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2 items-center bg-gray-100 p-2 rounded-md">
                <div className="text-sm font-mono truncate flex-1">
                  {publicUrl || 'Il link apparirà qui dopo la pubblicazione'}
                </div>
                <Button 
                  onClick={() => window.open(publicUrl, '_blank')}
                  disabled={!publicUrl}
                  variant="ghost" 
                  size="sm"
                  className="shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={copyToClipboard} 
                  disabled={!publicUrl}
                  variant="ghost" 
                  size="sm"
                  className="shrink-0"
                >
                  {isCopied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Questo è il link che puoi condividere {sharingMode === 'open' ? 'con chiunque' : 'con le persone autorizzate'}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-sm text-gray-500">Invia il link al budget direttamente via email</h3>
              <div className="flex gap-2 relative">
                <Input 
                  ref={emailInputRef}
                  placeholder="Email del destinatario"
                  value={recipientEmail}
                  onChange={handleEmailChange}
                  onFocus={handleInputFocus}
                  type="email"
                  className="flex-1 z-10"
                />
                <Button onClick={sendEmailWithBudget} disabled={isLoading}>
                  <Mail className="h-4 w-4" />
                </Button>
                
                {showSuggestions && emailSuggestions.length > 0 && (
                  <div 
                    ref={dropdownRef}
                    className="absolute top-full left-0 mt-1 w-[calc(100%-48px)] max-h-60 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg z-50"
                  >
                    {emailSuggestions.map((suggestion, index) => (
                      <div 
                        key={index} 
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectEmail(suggestion);
                        }}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {sharedUsers.length > 0 && (
                <div className="mt-4">
                  <div className="space-y-2">
                    {sharedUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                        <div className="flex items-center gap-3">
                          <div className="text-sm">{user.external_email}</div>
                          {user.customer_otp && (
                            <div className="bg-gray-200 px-2 py-1 rounded text-xs font-mono">
                              PIN: {user.customer_otp}
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeSharedUser(user.id, user.external_email)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            {!publicId && (
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  console.log('🔵 Pulsante Pubblica Budget cliccato');
                  try {
                    publishBudget();
                  } catch (error) {
                    console.error('❌ Errore durante la chiamata a publishBudget:', error);
                  }
                }} 
                disabled={publishInProgress}
                className="w-full bg-black hover:bg-gray-800 text-white"
              >
                {publishInProgress ? 'Pubblicazione in corso...' : 'Pubblica Budget'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PublishDialog; 