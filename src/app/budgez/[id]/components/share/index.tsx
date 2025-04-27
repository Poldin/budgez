import React, { useState, useEffect, useRef } from 'react';
import { Plus, Share, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Tabs,
  TabsContent,
} from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface SharedUser {
  email: string;
  role: 'editor' | 'viewer' | 'owner' | 'customer';
  id: string;
  userId?: string;
}

interface ShareDialogProps {
  budgetId: string;
}

const ShareDialog: React.FC<ShareDialogProps> = ({ budgetId }) => {
  const [email, setEmail] = useState('');
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSharedUsers();
  }, [budgetId]);

  const loadSharedUsers = async () => {
    console.log('Loading users for budget:', budgetId);

    const { data: existingUsers, error } = await supabase
      .from('link_budget_users')
      .select('*')
      .eq('budget_id', budgetId);
      
    if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return;
    }

    const formattedUsers: SharedUser[] = existingUsers.map(user => ({
      email: user.external_email,
      role: user.user_role as 'editor' | 'viewer',
      id: user.id.toString(),
      userId: user.user_id
    }));

    setSharedUsers(formattedUsers);
  };

  const sendInviteEmail = async (userEmail: string) => {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userEmail,
          subject: 'Invito a collaborare a un budget',
          content: `
            <p>Ciao! 👋</p>
            <p>Hai ricevuto un invito a collaborare a un budget.</p>
            <p>Per accedere al budget, visita questo link:</p>
            <p><a href="https://www.budgez.xyz/budgez/${budgetId}" 
                  style="display: inline-block; 
                         background-color: black; 
                         color: white; 
                         padding: 10px 20px; 
                         text-decoration: none; 
                         border-radius: 5px; 
                         margin: 20px 0;">
                Accedi al Budget
            </a></p>
            <p> oppure copia e incolla questo link sul tuo browser:\nhttps://www.budgez.xyz/budgez/${budgetId}</p>
            <p>Se non hai ancora un account, dovrai crearne uno per collaborare.</p>
          `
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending invite email:', error);
      toast.error('Errore nell\'invio dell\'email di invito');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && email) {
      addUser();
    }
  };

  const addUser = async () => {
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
          user_role: 'viewer',
          external_email: email,
          user_id: authUser || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Log the share event
      const { error: logError } = await supabase
        .from('budgets_logs')
        .insert({
          busget_id: budgetId,
          event: `ha condiviso internamente con ${email} [ruolo: viewer]`,
          user_id: currentUser.id,
          metadata: {
            logger_email: currentUser.email
          }
        });

      if (logError) throw logError;

      const newUser: SharedUser = {
        email,
        role: 'viewer',
        id: newUserLink.id.toString(),
        userId: authUser?.id
      };
      
      setSharedUsers([...sharedUsers, newUser]);
      setEmail('');

      await sendInviteEmail(email);
      toast.success('Utente aggiunto con successo');
      
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Errore nell\'aggiunta dell\'utente');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'editor' | 'viewer') => {
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('No user logged in');

      const { error } = await supabase
        .from('link_budget_users')
        .update({ user_role: newRole })
        .eq('id', parseInt(userId));

      if (error) throw error;

      // Find the user's email for the log
      const userEmail = sharedUsers.find(u => u.id === userId)?.email;
      if (!userEmail) throw new Error('User email not found');

      // Log the role update
      const { error: logError } = await supabase
        .from('budgets_logs')
        .insert({
          busget_id: budgetId,
          event: `ha modificato il ruolo di ${userEmail} in ${newRole}`,
          user_id: currentUser.id,
          metadata: {
            logger_email: currentUser.email
          }
        });

      if (logError) throw logError;

      setSharedUsers(sharedUsers.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

      toast.success('Ruolo utente aggiornato');
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Errore nell\'aggiornamento del ruolo');
    }
  };

  const removeUser = async (userId: string) => {
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('No user logged in');

      // Find the user's email before deletion
      const userEmail = sharedUsers.find(u => u.id === userId)?.email;
      if (!userEmail) throw new Error('User email not found');

      const { error } = await supabase
        .from('link_budget_users')
        .delete()
        .eq('id', parseInt(userId));

      if (error) throw error;

      // Log the removal
      const { error: logError } = await supabase
        .from('budgets_logs')
        .insert({
          busget_id: budgetId,
          event: `ha eliminato la condivisione a ${userEmail}`,
          user_id: currentUser.id,
          metadata: {
            logger_email: currentUser.email
          }
        });

      if (logError) throw logError;

      setSharedUsers(sharedUsers.filter(user => user.id !== userId));
      toast.success('Utente rimosso con successo');
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('Errore nella rimozione dell\'utente');
    }
  };

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
      console.log('User budget IDs:', budgetIds);

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
            !sharedUsers.some(user => user.email === email)
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
    setEmail(value);
    fetchEmailSuggestions(value);
    setShowSuggestions(true);
  };

  const handleSelectEmail = (selectedEmail: string) => {
    setEmail(selectedEmail);
    setShowSuggestions(false);
  };

  const handleInputFocus = () => {
    fetchEmailSuggestions('');
    setShowSuggestions(true);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-black text-white hover:bg-gray-800">
          <Share className="h-4 w-4 mr-2" /> Share
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-[50vw] min-h-[50vh] items-stretch justify-start flex flex-col">
        <DialogHeader>
          <DialogTitle>Condividi Budget</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="internal">
          
          
          <TabsContent value="internal" className="space-y-4">
            <div>
              {/* <h3 className="font-semibold mb-2 text-xl">👀 Collabora</h3> */}
              <p className="text-gray-400 text-sm">
                Condividi il budget internamente per rifinirlo al meglio [inviamo una mail di invito a collaborare!]
              </p>
            </div>
            
            <div className="flex gap-2 relative">
              <Input
                ref={inputRef}
                placeholder="Inserisci indirizzo email"
                value={email}
                onChange={handleEmailChange}
                onFocus={handleInputFocus}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="z-10"
              />
              <Button onClick={addUser} disabled={isLoading}>
                <Plus className="h-4 w-4" />
              </Button>
              
              {showSuggestions && emailSuggestions.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-[calc(100%-48px)] max-h-60 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  {emailSuggestions.map((suggestion, index) => (
                    <div 
                      key={index} 
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => handleSelectEmail(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {sharedUsers.find(user => user.role === 'owner') && (
              <div className="text-sm text-gray-600 px-1">
                {sharedUsers.find(user => user.role === 'owner')?.email} è owner
              </div>
            )}
            
            <div className="">
              {sharedUsers.filter(user => user.role !== 'owner'&& user.role !== 'customer' ).map(user => (
                <div key={user.id} className="flex items-center justify-between bg-gray-50 rounded p-1">
                  <span className="truncate text-gray-800 text-sm">{user.email}</span>
                  <div className="flex items-center gap-2 text-sm">
                    <Select
                      value={user.role}
                      onValueChange={(value: 'editor' | 'viewer') => updateUserRole(user.id, value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className='text-sm'>
                        <SelectItem value="viewer" className='text-sm'>Viewer</SelectItem>
                        <SelectItem value="editor" className='text-sm'>Editor</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeUser(user.id)}
                    >
                      <Trash2 className="h-4 w-4 text-black" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          

        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;