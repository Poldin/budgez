'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { User, Globe, Trash2, Lock, Receipt, CreditCard, ExternalLink, AlertCircle, CheckCircle, Wallet, Percent, Award } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from 'next/navigation'
import debounce from 'lodash/debounce'

// Types
type ThemeType = 'light' | 'dark' | 'system';
type CurrencyType = 'EUR' | 'USD' | 'GBP';
type LanguageType = 'it' | 'en' | 'es' | 'fr' | 'de';

interface UserSettings {
  id: number;
  user_id: string;
  theme: ThemeType;
  notifications_enabled: boolean;
  currency: CurrencyType;
  language: LanguageType;
  created_at: string;
  updated_at: string;
  default_tax_rate: number;
  email_notifications: boolean;
  company_name: string;
  company_address: string;
  company_vat: string;
  body?: {
    base_language?: string;
    base_public_budget_language?: string;
    base_currency?: string;
    is_payment_set?: boolean;
    is_initial_form_?: boolean;
    stripe_customer_id?: string;
  };
}

type User = {
  id: string
  email?: string
  created_at?: string
  user_metadata: {
    user_name?: string
  }
}

// Payment info types
type CardInfo = {
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
};

type StripeInfo = {
  exists: boolean;
  hasPaymentMethod: boolean;
  cardInfo?: CardInfo | null;
  customer?: {
    email?: string;
    name?: string;
  };
};

// Default settings
const defaultSettings: Partial<UserSettings> = {
  theme: 'system',
  notifications_enabled: true,
  currency: 'EUR',
  language: 'it',
  default_tax_rate: 22,
  email_notifications: true,
  company_name: '',
  company_address: '',
  company_vat: '',
};

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [loadingPaymentInfo, setLoadingPaymentInfo] = useState<boolean>(false);
  const [stripeInfo, setStripeInfo] = useState<StripeInfo | null>(null);
  const [activeTab, setActiveTab] = useState<string>('generali');
  
  // User profile states
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Funzioni per i pagamenti
  const fetchStripeInfo = async () => {
    if (!user) return;
    
    try {
      setLoadingPaymentInfo(true);
      console.log('Calling stripe info API...');
      const response = await fetch('/api/create-checkout-session', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error('Errore nel recupero delle informazioni di pagamento');
      }
      
      const data = await response.json();
      console.log('Stripe info received:', data);
      setStripeInfo(data);
    } catch (error) {
      console.error('Error fetching Stripe info:', error);
    } finally {
      setLoadingPaymentInfo(false);
    }
  };
  
  const redirectToCheckout = async () => {
    try {
      setLoadingPaymentInfo(true);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      setLoadingPaymentInfo(false);
    }
  };
  
  const redirectToPortal = async () => {
    try {
      console.log('Creating portal session...');
      setLoadingPaymentInfo(true);
      
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error('Errore durante la creazione della sessione del portal');
      }
      
      const { url } = await response.json();
      
      if (url) {
        window.open(url, '_blank');
      } else {
        throw new Error('URL del portal non valido');
      }
    } catch (error) {
      console.error('Error redirecting to portal:', error);
    } finally {
      setLoadingPaymentInfo(false);
    }
  };

  // Check for URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const paymentSuccess = searchParams.get('payment_success');
    const paymentCancelled = searchParams.get('payment_cancelled');
    
    if (paymentSuccess === 'true') {
      // Rimuovi il parametro dall'URL per evitare ricaricamenti futuri
      const url = new URL(window.location.href);
      url.searchParams.delete('payment_success');
      window.history.replaceState({}, '', url.toString());
      
      setSuccessMessage('Metodo di pagamento configurato con successo!');
      
      // Aggiorna le informazioni di Stripe
      fetchStripeInfo();
    }
    
    if (paymentCancelled === 'true') {
      // Rimuovi il parametro dall'URL
      const url = new URL(window.location.href);
      url.searchParams.delete('payment_cancelled');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // Fetch user settings
  const fetchUserSettings = async (): Promise<void> => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      // Fetch user profile information
      if (!user.user_metadata?.user_name) {
        const updatedMetadata = {
          ...user.user_metadata,
          user_name: ''
        };
        
        const { error: updateError } = await supabase.auth.updateUser({
          data: updatedMetadata
        });

        if (updateError) throw updateError;
        
        user.user_metadata = updatedMetadata;
      }

      setUser(user);
      setUserName(user.user_metadata?.user_name || '');

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create default settings
          await createDefaultSettings(user.id);
        } else {
          throw error;
        }
      } else if (data) {
        setSettings(data as UserSettings);
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create default settings for new user
  const createDefaultSettings = async (userId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .insert([
          {
            user_id: userId,
            ...defaultSettings
          }
        ])
        .select()
        .single();

      if (error) throw error;
      setSettings(data as UserSettings);
    } catch (error) {
      console.error('Error creating default settings:', error);
    }
  };

  // Update user profile
  const updateProfile = async (newUserName: string) => {
    if (!user) return;
    
    setIsSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          user_name: newUserName
        }
      });
  
      if (error) throw error;
      
      setUser(prev => prev ? {
        ...prev,
        user_metadata: {
          ...prev.user_metadata,
          user_name: newUserName
        }
      } : null);
  
      // Emetti l'evento di aggiornamento
      window.dispatchEvent(new CustomEvent('userNameUpdated', { 
        detail: newUserName 
      }));
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const debouncedUpdate = useCallback(
    debounce((value: string) => {
      updateProfile(value);
    }, 500),
    [user]
  );

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setUserName(newValue);
    debouncedUpdate(newValue);
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.auth.admin.deleteUser(user.id);

      if (error) throw error;

      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  // Update settings with debounce
  const debouncedUpdateSettings = useCallback(
    debounce((newSettings: UserSettings) => {
      updateSettings(newSettings);
    }, 500),
    []
  );

  // Update settings
  const updateSettings = async (updatedSettings: UserSettings): Promise<void> => {
    try {
    //   setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('user_settings')
        .update({
          ...updatedSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      setSuccessMessage('Impostazioni salvate con successo');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating settings:', error);
    } finally {
    //   setSaving(false);
    }
  };

  // Handle settings change
  const handleInputChange = (key: keyof UserSettings, value: unknown) => {
    if (!settings) return;
    
    const newSettings = {
      ...settings,
      [key]: value
    };
    
    setSettings(newSettings);
    debouncedUpdateSettings(newSettings);
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Formatta le info della carta
  const formatCardInfo = (cardInfo: CardInfo | null | undefined) => {
    if (!cardInfo) return null;
    
    const brandName = cardInfo.brand ? cardInfo.brand.charAt(0).toUpperCase() + cardInfo.brand.slice(1) : '';
    const lastFour = cardInfo.last4 ? cardInfo.last4 : '';
    const expMonth = cardInfo.expMonth?.toString().padStart(2, '0');
    const expYear = cardInfo.expYear ? cardInfo.expYear % 100 : '';
    
    return {
      display: `${brandName} •••• ${lastFour}`,
      expiry: expMonth && expYear ? `${expMonth}/${expYear}` : '',
    };
  };

  // Salva la tab attiva
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('budgez-settings-tab', value);
    }
  };

  // Load settings on component mount
  useEffect(() => {
    fetchUserSettings();
    
    // Recupera la tab salvata, se esiste
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('budgez-settings-tab');
      if (savedTab) {
        setActiveTab(savedTab);
      }
    }
    
    return () => {
      debouncedUpdate.cancel();
      debouncedUpdateSettings.cancel();
    };
  }, []);

  // Nuovo useEffect dedicato per caricare le informazioni di Stripe
  useEffect(() => {
    // Chiamiamo fetchStripeInfo solo quando user è disponibile e non stiamo caricando
    if (user && !loading) {
      console.log('User is loaded, fetching Stripe info...');
      fetchStripeInfo();
    }
  }, [user, loading]); // Dipende da user e loading

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <main className="flex-1 p-8">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="generali" className="data-[state=active]:bg-black data-[state=active]:text-white">
              <Globe className="mr-2 h-4 w-4" />
              Generali
            </TabsTrigger>
            <TabsTrigger value="preventivi" className="data-[state=active]:bg-black data-[state=active]:text-white">
              <Receipt className="mr-2 h-4 w-4" />
              Preventivi
            </TabsTrigger>
            <TabsTrigger value="pagamenti" className="data-[state=active]:bg-black data-[state=active]:text-white">
              <CreditCard className="mr-2 h-4 w-4" />
              Pagamenti
            </TabsTrigger>
          </TabsList>

          {/* GENERALI TAB */}
          <TabsContent value="generali">
            <Card className="p-6">
              <div className="mb-4">
                <h1 className="text-2xl font-bold">⚙️ Impostazioni Generali</h1>
                <p className="text-gray-500 mb-6 text-sm">
                  Gestisci il tuo profilo e le impostazioni dell&apos;account
                </p>
              </div>

              {successMessage && (
                <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md">
                  {successMessage}
                </div>
              )}

              {settings && user && (
                <div className="grid gap-8">
                  {/* PROFILO UTENTE */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Profilo
                    </h2>
                    
                    <div className="grid gap-5 border-b pb-6 mb-6">
                      {/* Nome utente */}
                      <div className="space-y-1">
                        <Label htmlFor="user_name">Nome utente</Label>
                        <div className="relative">
                          <Input
                            id="user_name"
                            value={userName}
                            onChange={handleUsernameChange}
                            placeholder="user name"
                            className="font-bold w-fit min-w-96"
                          />
                          {isSavingProfile && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                              saving bees from extintion...
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Email dell'utente */}
                      <div className="space-y-1">
                        <Label htmlFor="email">Email</Label>
                        <div className="p-2 bg-gray-50 rounded-md border border-gray-200 text-sm w-fit min-w-96">
                          {user?.email || '-'}
                        </div>
                      </div>
                      
                      {/* Data di iscrizione */}
                      <div className="space-y-1">
                        <Label htmlFor="created_at">Data di iscrizione a Budgez</Label>
                        <div className="p-2 bg-gray-50 rounded-md border border-gray-200 text-sm w-fit min-w-96">
                          {user?.created_at ? formatDate(user.created_at) : '-'}
                        </div>
                      </div>
                    </div>

                    {/* LINGUA */}
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Lingua
                    </h2>
                    
                    <div className="grid gap-5 border-b pb-6 mb-6">
                      <div className="grid gap-2">
                        <Label htmlFor="language">Seleziona lingua</Label>
                        <Select 
                          value={settings.language} 
                          onValueChange={(value) => handleInputChange('language', value as LanguageType)}
                        >
                          <SelectTrigger className="w-fit min-w-96">
                            <SelectValue placeholder="Seleziona lingua" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="it">Italiano</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="de">Deutsch</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* ZONA PERICOLOSA */}
                    <h2 className="text-xl font-semibold text-red-600 mb-4 flex items-center gap-2 mt-6">
                      <Trash2 className="h-5 w-5" />
                      Zona Pericolosa
                    </h2>
                    
                    <div className="grid gap-5">
                      <p className="text-sm text-gray-500 mb-4">
                        Una volta eliminato il tuo account, tutti i tuoi dati verranno rimossi permanentemente.
                      </p>
                      <Button 
                        variant="destructive"
                        onClick={() => setShowDeleteDialog(true)}
                        className="w-fit"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Elimina Account
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* PREVENTIVI TAB */}
          <TabsContent value="preventivi">
            <Card className="p-6">
              <div className="mb-4">
                <h1 className="text-2xl font-bold">📄 Impostazioni Preventivi</h1>
                <p className="text-gray-500 mb-6 text-sm">
                  Configura le impostazioni predefinite per i tuoi preventivi
                </p>
              </div>

              {successMessage && (
                <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md">
                  {successMessage}
                </div>
              )}

              {settings && (
                <div className="grid gap-8">
                  {/* IMPOSTAZIONI PREVENTIVO */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Impostazioni Preventivo Pubblicato
                    </h2>
                    
                    <div className="grid gap-5">
                      <div className="grid gap-2">
                        <Label htmlFor="quote_language">Lingua del preventivo</Label>
                        <Select 
                          value={settings.language} 
                          onValueChange={(value) => handleInputChange('language', value as LanguageType)}
                        >
                          <SelectTrigger className="w-fit min-w-96">
                            <SelectValue placeholder="Seleziona lingua" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="it">Italiano</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="de">Deutsch</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="quote_currency">Valuta</Label>
                        <Select 
                          value={settings.currency} 
                          onValueChange={(value) => handleInputChange('currency', value as CurrencyType)}
                        >
                          <SelectTrigger className="w-fit min-w-96">
                            <SelectValue placeholder="Seleziona valuta" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EUR">Euro (€)</SelectItem>
                            <SelectItem value="USD">Dollaro USA ($)</SelectItem>
                            <SelectItem value="GBP">Sterlina (£)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* PAGAMENTI TAB */}
          <TabsContent value="pagamenti">
            <Card className="p-6">
              <div className="mb-4">
                <h1 className="text-2xl font-bold">💳 Impostazioni Pagamenti</h1>
                <p className="text-gray-500 mb-6 text-sm">
                  Informazioni sulle tariffe e gestione del tuo account di pagamento
                </p>
              </div>

              {successMessage && (
                <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md">
                  {successMessage}
                </div>
              )}

              {settings && (
                <div className="grid gap-8">
                  {/* OPZIONI DI PAGAMENTO */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Le nostre tariffe
                    </h2>
                    
                    <div className="grid gap-5 p-6 bg-gray-50 rounded-md border mb-8">
                      <h3 className="font-medium border-b pb-2">Come funziona il nostro modello di pricing</h3>
                      
                      <div className="flex items-start gap-3">
                        <Award className="h-5 w-5 text-gray-700 mt-1 flex-shrink-0" />
                        <p>
                          Budgez è <span className="font-semibold">completamente gratuito</span> da utilizzare per creare e gestire i tuoi preventivi.
                          Puoi creare quanti preventivi vuoi senza limiti.
                        </p>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-gray-700 mt-1 flex-shrink-0" />
                        <p>
                          Paghi solo quando un cliente <span className="font-semibold">accetta formalmente</span> un preventivo attraverso la piattaforma.
                          Se il preventivo non viene accettato, non paghi nulla.
                        </p>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Percent className="h-5 w-5 text-gray-700 mt-1 flex-shrink-0" />
                        <p>
                          La commissione è dello <span className="font-semibold">0,1%</span> sul valore totale del preventivo approvato,
                          con una commissione minima di <span className="font-semibold">€0,50</span> per preventivo.
                        </p>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Wallet className="h-5 w-5 text-gray-700 mt-1 flex-shrink-0" />
                        <p>
                          Gli addebiti avvengono automaticamente sulla carta registrata quando un cliente accetta il preventivo.
                          Riceverai regolare fattura per ogni commissione.
                        </p>
                      </div>
                    </div>

                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      Metodo di pagamento
                    </h2>
                    
                    <div className="grid gap-5 p-6 bg-gray-50 rounded-md border">
                      {loadingPaymentInfo ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
                          <span className="ml-3">Caricamento informazioni di pagamento...</span>
                        </div>
                      ) : stripeInfo === null ? (
                        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md">
                          <p>Impossibile caricare le informazioni di pagamento. 
                            <Button 
                              variant="link" 
                              className="p-0 h-auto text-yellow-800 underline"
                              onClick={fetchStripeInfo}
                            >
                              Riprova
                            </Button>
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Caso 1: Utente non esiste in Stripe */}
                          {!stripeInfo.exists && (
                            <div className="space-y-4">
                              <div className="flex items-start gap-3">
                                <AlertCircle className="text-yellow-500 h-5 w-5 mt-0.5 flex-shrink-0" />
                                <div>
                                  <h3 className="font-medium">Registrazione metodo di pagamento necessaria</h3>
                                  <p className="text-sm text-gray-500 mt-1">
                                    È necessario registrare un metodo di pagamento e i dati fiscali (partita IVA/codice fiscale) per 
                                    permettere l&apos;addebito automatico della commissione quando un cliente accetta un preventivo.
                                    Questo processo è da fare una sola volta - gli addebiti futuri avverranno automaticamente.
                                  </p>
                                </div>
                              </div>
                              <Button 
                                onClick={redirectToCheckout}
                                className="bg-black hover:bg-gray-800"
                                disabled={loadingPaymentInfo}
                              >
                                {loadingPaymentInfo ? "Preparando il checkout..." : "Registra metodo di pagamento e dati fiscali"}
                              </Button>
                            </div>
                          )}
                          
                          {/* Caso 2: Utente esiste ma senza metodo di pagamento */}
                          {stripeInfo.exists && !stripeInfo.hasPaymentMethod && (
                            <div className="space-y-4">
                              <div className="flex items-start gap-3">
                                <AlertCircle className="text-yellow-500 h-5 w-5 mt-0.5 flex-shrink-0" />
                                <div>
                                  <h3 className="font-medium">Dati fiscali registrati ma metodo di pagamento mancante</h3>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Il tuo account è registrato, ma manca un metodo di pagamento valido.
                                    La registrazione di un metodo di pagamento è necessaria per permettere l&apos;addebito automatico 
                                    della commissione quando un cliente accetta un preventivo.
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button 
                                  onClick={redirectToCheckout}
                                  className="bg-black hover:bg-gray-800"
                                  disabled={loadingPaymentInfo}
                                >
                                  {loadingPaymentInfo ? "Preparando il checkout..." : "Registra metodo di pagamento"}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  onClick={redirectToPortal}
                                  disabled={loadingPaymentInfo}
                                >
                                  {loadingPaymentInfo ? "Preparando il portale..." : "Gestisci account di pagamento"} {!loadingPaymentInfo && <ExternalLink className="ml-2 h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {/* Caso 3: Utente con metodo di pagamento configurato */}
                          {stripeInfo.exists && stripeInfo.hasPaymentMethod && (
                            <div className="space-y-4">
                              <div className="flex items-start gap-3">
                                <CheckCircle className="text-green-500 h-5 w-5 mt-0.5 flex-shrink-0" />
                                <div>
                                  <h3 className="font-medium">Metodo di pagamento e dati fiscali configurati</h3>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Hai configurato correttamente il tuo metodo di pagamento e i dati fiscali.
                                    Gli addebiti avverranno automaticamente quando un cliente accetta un preventivo (0,1% del valore, min. €0,50).
                                  </p>
                                </div>
                              </div>
                              
                              {stripeInfo.cardInfo && (
                                <div className="bg-white p-4 border rounded-md">
                                  <h4 className="text-sm text-gray-500 mb-1">Carta registrata per addebiti automatici:</h4>
                                  <div className="flex justify-between items-center">
                                    <p className="font-medium">{formatCardInfo(stripeInfo.cardInfo)?.display}</p>
                                    <p className="text-sm text-gray-500">Scade: {formatCardInfo(stripeInfo.cardInfo)?.expiry}</p>
                                  </div>
                                </div>
                              )}
                              
                              <Button 
                                variant="outline" 
                                onClick={redirectToPortal}
                                disabled={loadingPaymentInfo}
                              >
                                {loadingPaymentInfo ? "Preparando il portale..." : "Gestisci dati di pagamento"} {!loadingPaymentInfo && <ExternalLink className="ml-2 h-4 w-4" />}
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialog per eliminazione account */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione Account</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile e comporterà la perdita di tutti i tuoi dati, inclusi i preventivi e le impostazioni.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Elimina Account Definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}