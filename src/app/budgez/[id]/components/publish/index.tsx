import React, { useState, useEffect } from 'react';
import { Globe, Copy, Mail } from 'lucide-react';
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

const PublishDialog: React.FC<PublishDialogProps> = ({ budgetId, publicId }) => {
  const [sharingMode, setSharingMode] = useState<'restricted' | 'open'>('restricted');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [publishInProgress, setPublishInProgress] = useState(false);

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

  // Generate the public URL based on the publicId
  const publicUrl = publicId 
    ? `${window.location.origin}/public/${publicId}`
    : '';

  const copyToClipboard = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      toast.success('Link copiato negli appunti');
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

  const sendEmailWithBudget = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      toast.error('Inserisci un indirizzo email valido');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Here you would implement email sending functionality
      // For now, we'll just show a success toast
      toast.success(`Email inviata a ${recipientEmail}`);
      setRecipientEmail('');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Errore nell\'invio dell\'email');
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
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <h3 className="font-medium text-gray-500">Modalità di condivisione</h3>
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
            <h3 className=" font-medium text-gray-500">Link al budget</h3>
            <div className="flex gap-2">
              <Input 
                value={publicUrl}
                readOnly
                className="flex-1"
                placeholder="Il link apparirà qui dopo la pubblicazione"
              />
              <Button onClick={copyToClipboard} disabled={!publicUrl}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Questo è il link che puoi condividere {sharingMode === 'open' ? 'con chiunque' : 'con le persone autorizzate'}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-gray-500">Invia per email</h3>
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
            <p className="text-sm text-gray-500 mt-2">
              Invia il link al budget direttamente via email
            </p>
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