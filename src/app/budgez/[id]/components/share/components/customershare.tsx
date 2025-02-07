import React, { useState, useEffect } from 'react';
import { Plus, Share, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface EmailTemplate {
  id: number;
  body: {
    type: string;
    subject: string;
    ref_name: string;
    message_body: string;
  };
}

interface SharedCustomer {
  email: string;
  id: string;
  userId?: string;
}

interface CustomerShareProps {
  budgetId: string;
}

const CustomerShare: React.FC<CustomerShareProps> = ({ budgetId }) => {
  const [email, setEmail] = useState('');
  const [sharedCustomers, setSharedCustomers] = useState<SharedCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sendEmails, setSendEmails] = useState(true);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  useEffect(() => {
    loadSharedCustomers();
    loadEmailTemplates();
  }, [budgetId]);

  const loadEmailTemplates = async () => {
    // Valori di default per i template
    const defaultSubject = "Il nostro preventivo per Voi";
    const defaultMessage = "Vi inviamo il presente messaggio per condividervi il nostro preventivo.\nTrovate di seguito il link per visionarlo.\n\nAttendiamo vostro riscontro.\nCordialmente.";
  
    try {
      // Ottieni la sessione corrente
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        // In caso di errore, imposta i valori di default
        setEmailTemplates([]);
        setSelectedTemplate(null);
        setCustomSubject(defaultSubject);
        setCustomMessage(defaultMessage);
        return;
      }
  
      if (!session?.user?.id) {
        console.error('No authenticated user found');
        // Se non c'è un utente autenticato, imposta i valori di default
        setEmailTemplates([]);
        setSelectedTemplate(null);
        setCustomSubject(defaultSubject);
        setCustomMessage(defaultMessage);
        return;
      }
  
      // Ottieni i template per l'utente corrente
      const { data: templates, error: templatesError } = await supabase
        .from('emails')
        .select('*')
        .eq('type', 'customer_sharing')
        .eq('user_id', session.user.id);
  
      if (templatesError) {
        console.error('Error loading templates:', templatesError);
        // In caso di errore nel caricamento dei template, imposta i valori di default
        setEmailTemplates([]);
        setSelectedTemplate(null);
        setCustomSubject(defaultSubject);
        setCustomMessage(defaultMessage);
        return;
      }
  
      // Imposta i template nell'array
      setEmailTemplates(templates || []);
  
      // Se ci sono template disponibili, usa il primo template
      if (templates && templates.length > 0) {
        setSelectedTemplate(templates[0]);
        setCustomSubject(templates[0].body.subject);
        setCustomMessage(templates[0].body.message_body);
      } else {
        // Se non ci sono template disponibili, usa i valori di default
        setSelectedTemplate(null);
        setCustomSubject(defaultSubject);
        setCustomMessage(defaultMessage);
      }
    } catch (error) {
      console.error('Error in loadEmailTemplates:', error);
      toast.error('Errore nel caricamento dei template');
      // In caso di errore generico, imposta i valori di default
      setEmailTemplates([]);
      setSelectedTemplate(null);
      setCustomSubject(defaultSubject);
      setCustomMessage(defaultMessage);
    }
  };

  const loadSharedCustomers = async () => {
    const { data: existingUsers, error } = await supabase
      .from('link_budget_users')
      .select('*')
      .eq('budget_id', budgetId)
      .eq('user_role', 'customer');

    if (error) {
      console.error('Error loading customers:', error);
      return;
    }

    const formattedUsers: SharedCustomer[] = existingUsers.map(user => ({
      email: user.external_email,
      id: user.id.toString(),
      userId: user.user_id
    }));

    setSharedCustomers(formattedUsers);
  };

  const sendInviteEmail = async (userEmail: string) => {
    try {
      // Pre-process the message to handle newlines and create proper HTML
      const formattedMessage = customMessage
        .split('\n')
        .filter(line => line.trim() !== '') // Remove empty lines
        .map(line => `<p style="margin: 0 0 10px 0;">${line}</p>`)
        .join('');
  
      const emailContent = `
        <div style="margin-bottom: 20px;">
          ${formattedMessage}
        </div>
  
        <div style="margin: 30px 0;">
          <a href="https://www.budgez.xyz/budgez/${budgetId}" 
            style="display: inline-block; 
                   background-color: black; 
                   color: white !important; 
                   padding: 10px 20px; 
                   text-decoration: none; 
                   border-radius: 5px;">
            Accedi all'Offerta
          </a>
        </div>
  
        <div style="color: #666666; font-size: 14px;">
          <p style="margin: 0;">oppure copia e incolla il seguente URL sul tuo browser:</p>
          <p style="margin: 5px 0;">https://www.budgez.xyz/budgez/${budgetId}</p>
        </div>
      `;
  
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userEmail,
          subject: customSubject,
          content: emailContent,
        })
      });
  
      if (!response.ok) {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending invite email:', error);
      toast.error('Errore nell\'invio dell\'email al cliente');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && email) {
      addCustomer();
    }
  };

  const addCustomer = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Inserisci un indirizzo email valido');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('No user logged in');

      // Check if user exists in auth.users
      const { data: authUser } = await supabase
        .rpc('get_user_id_by_email', {
          email_address: email
        });

      // Insert into link_budget_users
      const { data: newUserLink, error: insertError } = await supabase
        .from('link_budget_users')
        .insert({
          budget_id: budgetId,
          user_role: 'customer',
          external_email: email,
          user_id: authUser || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Log the customer share
      const { error: logError } = await supabase
        .from('budgets_logs')
        .insert({
          busget_id: budgetId,
          event: `ha condiviso con cliente ${email}`,
          user_id: currentUser.id,
          metadata: {
            logger_email: currentUser.email
          }
        });

      if (logError) throw logError;

      const newCustomer: SharedCustomer = {
        email,
        id: newUserLink.id.toString(),
        userId: authUser
      };
      
      setSharedCustomers([...sharedCustomers, newCustomer]);
      setEmail('');

      // Send invite email if switch is on
      if (sendEmails) {
        await sendInviteEmail(email);
      }
      
      toast.success('Cliente aggiunto con successo');
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Errore nell\'aggiunta del cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const removeCustomer = async (userId: string) => {
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('No user logged in');

      // Find the customer's email before deletion
      const customerEmail = sharedCustomers.find(c => c.id === userId)?.email;
      if (!customerEmail) throw new Error('Customer email not found');

      const { error } = await supabase
        .from('link_budget_users')
        .delete()
        .eq('id', parseInt(userId));

      if (error) throw error;

      // Log the customer share removal
      const { error: logError } = await supabase
        .from('budgets_logs')
        .insert({
          busget_id: budgetId,
          event: `ha eliminato condivisione con cliente ${customerEmail}`,
          user_id: currentUser.id,
          metadata: {
            logger_email: currentUser.email
          }
        });

      if (logError) throw logError;

      setSharedCustomers(sharedCustomers.filter(customer => customer.id !== userId));
      toast.success('Cliente rimosso con successo');
    } catch (error) {
      console.error('Error removing customer:', error);
      toast.error('Errore nella rimozione del cliente');
    }
  };

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setCustomSubject(template.body.subject);
    setCustomMessage(template.body.message_body);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2 text-xl">💎 Vendi</h3>
        <p className="text-gray-400 text-sm mb-4">
          Condividi il budget con i tuoi clienti
        </p>
      </div>

      <Dialog>
        <div className="flex items-center justify-start mb-2 gap-2">
          <DialogTrigger asChild>
            <Button className=" hover:bg-gray-300 bg-transparent text-gray-700">
              <Share className="h-4 w-4 mr-2" /> Personalizza email
            </Button>
          </DialogTrigger>
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={sendEmails}
              onCheckedChange={setSendEmails}
            />
            <span className="text-sm text-gray-600">
              Invia email di notifica
            </span>
          </div>
        </div>

        <DialogContent className="min-w-[80vw]">
          <DialogHeader>
            <DialogTitle>Personalizza Email</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-4">
              <Input
                placeholder="Oggetto Email"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
              />
              <Textarea
                placeholder="Corpo del Messaggio"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="min-h-[200px]"
              />
            </div>

            <div className="border-l pl-4 space-y-4">
              <h3 className="font-semibold">Template Disponibili</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {emailTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                      selectedTemplate?.id === template.id ? 'border-black' : ''
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <h4 className="font-medium">{template.body.ref_name}</h4>
                    <p className="text-sm text-gray-600 truncate">
                      {template.body.subject}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex gap-2">
        <Input
          placeholder="Inserisci indirizzo email del cliente"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <Button onClick={addCustomer} disabled={isLoading}>
          <Plus className='h-4 w-4'/>
        </Button>
      </div>

      <div className="space-y-2">
        {sharedCustomers.map(customer => (
          <div key={customer.id} className="flex items-center justify-between bg-gray-50 rounded p-2">
            <span className="truncate text-gray-800 text-sm">{customer.email}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => removeCustomer(customer.id)}
            >
              <Trash2 className="h-4 w-4 text-black" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerShare;