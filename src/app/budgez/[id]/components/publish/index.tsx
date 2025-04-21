import React, { useState, useEffect } from 'react';
import { Globe, Copy, Mail, CheckCheck, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

  const publishBudget = async () => {
    try {
      setPublishInProgress(true);
      
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Globe className="h-4 w-4" />
          Pubblica
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[60%]">
        <DialogHeader>
          <DialogTitle className="text-xl">pubblica e condividi</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">Condividi il tuo budget con altri attraverso un link o via email, scegliendo se renderlo accessibile a tutti o solo a persone specifiche.</p>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            {/* <h3 className="font-medium text-gray-500">Modalità di condivisione</h3> */}
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
            <div className="flex gap-2">
              <Input 
                placeholder="Email del destinatario"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                type="email"
                className="flex-1"
              />
              <Button onClick={sendEmailWithBudget} disabled={isLoading}>
                <Mail className="h-4 w-4" />
              </Button>
            </div>
            
            {sharedUsers.length > 0 && (
              <div className="mt-4">
                {/* <h4 className="text-sm font-medium text-gray-500 mb-2">Email condivise</h4> */}
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
              onClick={publishBudget} 
              disabled={publishInProgress}
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              {publishInProgress ? 'Pubblicazione in corso...' : 'Pubblica Budget'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PublishDialog; 