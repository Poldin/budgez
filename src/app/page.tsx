'use client'

import React, { useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Compass, Plus } from "lucide-react";
import { translations, type Language } from '@/lib/translations';
import { getTemplates } from '@/app/actions/quote-actions';
import type { BudgetTemplate } from '@/components/templates-sidebar';
import Footer from '@/components/footer/footer';
import GanttChart from '@/components/gantt-chart';
import PDFExportDialog from '@/components/pdf-export-dialog';
import PDFExportConfig from '@/components/pdf-export-config';
import AppHeader from '@/components/app-header';
import SettingsSection from '@/components/budget/settings-section';
import AuthDialog from '@/components/auth-dialog';
import AnimatedSubtitle from '@/components/budget/animated-subtitle';
import ResourcesSection from '@/components/budget/resources-section';
import ActivitiesSection from '@/components/budget/activities-section';
import GeneralDiscountSection from '@/components/budget/general-discount-section';
import SummaryTable from '@/components/budget/summary-table';
import FinalTotalCard from '@/components/budget/final-total-card';
import ActionButtons from '@/components/budget/action-buttons';
import FloatingTotal from '@/components/budget/floating-total';
import JsonConfigDialog from '@/components/budget/json-config-dialog';
import HowToCarouselDialog from '@/components/budget/how-to-carousel-dialog';
import HistorySection from '@/components/history-section';
import ProfileSection from '@/components/profile-section';
import { generateTableHTML } from '@/components/budget/table-html-generator';
import { generatePDFHTML, generateGanttHTML, type PDFConfig } from '@/components/budget/pdf-html-generator';
import { createClientSupabaseClient } from '@/lib/database/supabase-client';
import type { Resource, Activity, GeneralDiscount, ActivityDiscount, ResourceAssignment } from '@/types/budget';
import { getDefaultBudgetName, formatNumber, formatDateToLocal, getDayOfYear } from '@/lib/budget-utils';
import {
  calculateResourceCost,
  calculateActivityTotal,
  calculateActivityDiscountAmount,
  calculateActivityTotalWithVat,
  calculateGrandSubtotal,
  calculateGrandVat,
  calculateGrandTotalBeforeGeneralDiscount,
  calculateGeneralDiscountAmount,
  calculateGrandTotal,
  calculateTotalActivityDiscounts
} from '@/lib/budget-calculations';

function HomePageContent() {

  const [language, setLanguage] = useState<Language>('it');
  const [currency, setCurrency] = useState('€');
  const [defaultVat, setDefaultVat] = useState(22); // IVA default 22%
  const [budgetName, setBudgetName] = useState(getDefaultBudgetName());
  const [budgetDescription, setBudgetDescription] = useState('');
  const [budgetTags, setBudgetTags] = useState<string[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [generalDiscount, setGeneralDiscount] = useState<GeneralDiscount>({
    enabled: false,
    type: 'percentage',
    value: 0,
    applyOn: 'taxable'
  });
  const [showFloatingTotal, setShowFloatingTotal] = useState(true);
  const [jsonDialogOpen, setJsonDialogOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [tableCopied, setTableCopied] = useState(false);
  const [configCopied, setConfigCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [randomizedTags, setRandomizedTags] = useState<string[]>([]);
  const [budgetTemplates, setBudgetTemplates] = useState<BudgetTemplate[]>([]);
  const [randomizedTemplates, setRandomizedTemplates] = useState<BudgetTemplate[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [totalTemplatesInDb, setTotalTemplatesInDb] = useState<number | undefined>(undefined);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfConfig, setPdfConfig] = useState<PDFConfig>({
    companyName: '',
    companyInfo: `[Nome Azienda]
P. IVA [Partita IVA]
[Indirizzo]
[CAP] - [Città] ([Provincia])
Tel. [Telefono]
[www.sitoweb.it]
[email@azienda.it]`,
    headerText: `Spett.le
[NOME AZIENDA/ENTE]
[INDIRIZZO]
[CAP] [CITTÀ] ([PROVINCIA])
CF/P.IVA: [CODICE FISCALE]

Alla cortese attenzione di [NOME REFERENTE]`,
    contractTerms: `CONDIZIONI DI PAGAMENTO:
• Acconto del 30% alla firma del contratto
• Saldo alla consegna del progetto/servizio
• Pagamenti tramite bonifico bancario entro [GIORNI] giorni dalla data fattura

VALIDITÀ DELL'OFFERTA:
• La presente offerta ha validità di [GIORNI] giorni dalla data di emissione

TERMINI DI CONSEGNA:
• Il completamento del progetto è previsto entro [TEMPO] dalla firma del contratto
• Eventuali ritardi dovuti a causa di forza maggiore non sono imputabili al fornitore

GARANZIA:
• [MESI] mesi di garanzia su difetti di fabbricazione o malfunzionamenti


________________________________________________________________________________________


FIRMA PER ACCETTAZIONE


Data ________________________


Nome del firmatario _______________________________

Firma _______________________________`,
    signatureSection: {
      companyName: '[NOME AZIENDA]',
      signerName: '[NOME E COGNOME]',
      signerRole: '[RUOLO]',
      date: new Date().toLocaleDateString('it-IT'),
      place: '[CITTÀ]',
    },
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [expirationValue, setExpirationValue] = useState(2);
  const [expirationUnit, setExpirationUnit] = useState<'days' | 'weeks' | 'months'>('weeks');
  const [expirationEnabled, setExpirationEnabled] = useState(true);
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const finalTotalRef = useRef<HTMLDivElement>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('create');
  const [howToDialogOpen, setHowToDialogOpen] = useState(false);
  const [savingQuote, setSavingQuote] = useState(false);
  const [currentQuoteId, setCurrentQuoteId] = useState<string | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();

  const calculatedExpirationDate = React.useMemo(() => {
    const date = new Date();
    if (expirationUnit === 'days') date.setDate(date.getDate() + expirationValue);
    if (expirationUnit === 'weeks') date.setDate(date.getDate() + (expirationValue * 7));
    if (expirationUnit === 'months') date.setMonth(date.getMonth() + expirationValue);
    return date;
  }, [expirationValue, expirationUnit]);

  const t = translations[language];

  // Carica i template dal database
  React.useEffect(() => {
    const loadTemplates = async () => {
      setTemplatesLoading(true);
      const result = await getTemplates();
      if (result.success && result.data) {
        const templates = result.data as BudgetTemplate[];
        setBudgetTemplates(templates);
        setTotalTemplatesInDb(result.totalInDb);
        
        // Estrai tutti i tag unici
        const allTags: string[] = Array.from(new Set(templates.flatMap((t) => t.tags)));
        const shuffled = [...allTags].sort(() => 0.5 - Math.random());
        setRandomizedTags(shuffled);
        
        // Randomizza anche i template per la visualizzazione iniziale
        const shuffledTemplates = [...templates].sort(() => 0.5 - Math.random()).slice(0, 10);
        setRandomizedTemplates(shuffledTemplates);
      }
      setTemplatesLoading(false);
    };
    
    loadTemplates();
  }, []);

  // Inizializza client-side flag
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Verifica stato autenticazione
  React.useEffect(() => {
    const supabase = createClientSupabaseClient();
    
    // Ottieni sessione corrente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Ascolta cambiamenti autenticazione
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email || 'no user');
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Carica preventivo se c'è qid nell'URL
  React.useEffect(() => {
    const qid = searchParams.get('qid');
    if (qid && qid !== currentQuoteId) {
      loadQuoteFromId(qid);
    } else if (!qid && currentQuoteId) {
      // Se non c'è più qid nell'URL, resetta
      setCurrentQuoteId(null);
    }
  }, [searchParams]);

  const resetToNewQuote = () => {
    // Rimuovi qid dall'URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('qid');
    router.push(newUrl.pathname + newUrl.search);
    
    // Resetta lo stato
    setCurrentQuoteId(null);
    
    // Resetta i campi ai valori di default
    setBudgetName(getDefaultBudgetName());
    setBudgetDescription('');
    setBudgetTags([]);
    setResources([]);
    setActivities([]);
    setGeneralDiscount({
      enabled: false,
      type: 'percentage',
      value: 0,
      applyOn: 'taxable'
    });
    setExpirationEnabled(true);
    setExpirationValue(2);
    setExpirationUnit('weeks');
    setPdfConfig({
      companyName: '',
      companyInfo: `[Nome Azienda]
P. IVA [Partita IVA]
[Indirizzo]
[CAP] - [Città] ([Provincia])
Tel. [Telefono]
[www.sitoweb.it]
[email@azienda.it]`,
      headerText: `Spett.le
[NOME AZIENDA/ENTE]
[INDIRIZZO]
[CAP] [CITTÀ] ([PROVINCIA])
CF/P.IVA: [CODICE FISCALE]

Alla cortese attenzione di [NOME REFERENTE]`,
      contractTerms: `CONDIZIONI DI PAGAMENTO:
• Acconto del 30% alla firma del contratto
• Saldo alla consegna del progetto/servizio
• Pagamenti tramite bonifico bancario entro [GIORNI] giorni dalla data fattura

VALIDITÀ DELL'OFFERTA:
• La presente offerta ha validità di [GIORNI] giorni dalla data di emissione

TERMINI DI CONSEGNA:
• Il completamento del progetto è previsto entro [TEMPO] dalla firma del contratto
• Eventuali ritardi dovuti a causa di forza maggiore non sono imputabili al fornitore

GARANZIA:
• [MESI] mesi di garanzia su difetti di fabbricazione o malfunzionamenti


________________________________________________________________________________________


FIRMA PER ACCETTAZIONE


Data ________________________


Nome del firmatario _______________________________

Firma _______________________________`,
      signatureSection: {
        companyName: '[NOME AZIENDA]',
        signerName: '[NOME E COGNOME]',
        signerRole: '[RUOLO]',
        date: new Date().toLocaleDateString('it-IT'),
        place: '[CITTÀ]',
      },
    });
  };

  const loadQuoteFromId = async (quoteId: string) => {
    setLoadingQuote(true);
    try {
      const supabase = createClientSupabaseClient();
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (error) {
        console.error('Error loading quote:', error);
        setLoadingQuote(false);
        return;
      }

      if (data) {
        setCurrentQuoteId(quoteId);
        const metadata = (data.metadata || {}) as any;
        
        // Popola tutti i campi con i dati del preventivo
        if (metadata.budgetName) setBudgetName(metadata.budgetName);
        else if (data.name) setBudgetName(data.name);
        
        if (metadata.budgetDescription) setBudgetDescription(metadata.budgetDescription);
        if (metadata.budgetTags) setBudgetTags(metadata.budgetTags || []);
        if (metadata.currency) setCurrency(metadata.currency);
        if (metadata.defaultVat !== undefined) setDefaultVat(metadata.defaultVat);
        if (metadata.resources) setResources(metadata.resources as Resource[]);
        if (metadata.activities) setActivities(metadata.activities as Activity[]);
        if (metadata.generalDiscount) {
          setGeneralDiscount(metadata.generalDiscount as GeneralDiscount);
        }
        
        // Carica scadenza dal campo deadline del database o dai metadata
        if (data.deadline) {
          // Usa il campo deadline del database (priorità)
          const deadlineDate = new Date(data.deadline);
          const now = new Date();
          const diffTime = deadlineDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays > 0) {
            setExpirationEnabled(true);
            if (diffDays <= 30) {
              setExpirationValue(diffDays);
              setExpirationUnit('days');
            } else if (diffDays <= 90) {
              setExpirationValue(Math.ceil(diffDays / 7));
              setExpirationUnit('weeks');
            } else {
              setExpirationValue(Math.ceil(diffDays / 30));
              setExpirationUnit('months');
            }
          }
        } else if (metadata.expiration) {
          // Fallback ai metadata se non c'è deadline nel database
          setExpirationEnabled(metadata.expiration.enabled);
          if (metadata.expiration.value) setExpirationValue(metadata.expiration.value);
          if (metadata.expiration.unit) setExpirationUnit(metadata.expiration.unit);
        }
        
        // Carica pdfConfig
        if (metadata.pdfConfig) {
          setPdfConfig(metadata.pdfConfig as PDFConfig);
        }
      }
    } catch (error) {
      console.error('Error loading quote:', error);
    } finally {
      setLoadingQuote(false);
    }
  };

  // Filtra template in base a ricerca e tag selezionati
  const filteredTemplates = React.useMemo(() => {
    if (templatesLoading || budgetTemplates.length === 0) {
      return [];
    }

    const filtered = budgetTemplates.filter((template: BudgetTemplate) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' || 
        template.name.toLowerCase().includes(searchLower) ||
        template.description.toLowerCase().includes(searchLower) ||
        template.tags.some((tag: string) => tag.toLowerCase().includes(searchLower));
      
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some((tag: string) => template.tags.includes(tag));
      
      return matchesSearch && matchesTags;
    });
    
    return filtered;
  }, [searchQuery, selectedTags, budgetTemplates, templatesLoading]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Hide floating total when final total section is visible
  React.useEffect(() => {
    if (!finalTotalRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFloatingTotal(!entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '-50px',
      }
    );

    observer.observe(finalTotalRef.current);

    return () => observer.disconnect();
  }, [activities.length]);

  // Resource operations
  const addResource = () => {
    const newResource: Resource = {
      id: Date.now().toString(),
      name: '',
      costType: 'hourly',
      pricePerHour: 0,
    };
    setResources([...resources, newResource]);
  };

  const deleteResource = (id: string) => {
    setResources(resources.filter(r => r.id !== id));
    // Rimuovi anche le assegnazioni di questa risorsa dalle attività
    setActivities(activities.map(a => ({
      ...a,
      resources: a.resources.filter(r => r.resourceId !== id)
    })));
  };

  const updateResource = (id: string, field: keyof Resource, value: string | number) => {
    setResources(resources.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  const moveResourceUp = (index: number) => {
    if (index === 0) return; // Già in cima
    const newResources = [...resources];
    [newResources[index - 1], newResources[index]] = [newResources[index], newResources[index - 1]];
    setResources(newResources);
  };

  const moveResourceDown = (index: number) => {
    if (index === resources.length - 1) return; // Già in fondo
    const newResources = [...resources];
    [newResources[index], newResources[index + 1]] = [newResources[index + 1], newResources[index]];
    setResources(newResources);
  };

  // Activity operations
  const addActivity = () => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      name: '',
      description: '',
      resources: [],
      vat: defaultVat, // Usa l'IVA di default
    };
    setActivities([...activities, newActivity]);
    // Apri automaticamente la nuova attività
    setExpandedActivities(new Set([...expandedActivities, newActivity.id]));
  };

  const deleteActivity = (id: string) => {
    setActivities(activities.filter(a => a.id !== id));
  };

  const updateActivity = (id: string, field: keyof Activity, value: string | number | ResourceAssignment[] | ActivityDiscount | undefined) => {
    setActivities(prevActivities => prevActivities.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  const moveActivityUp = (index: number) => {
    if (index === 0) return; // Già in cima
    const newActivities = [...activities];
    [newActivities[index - 1], newActivities[index]] = [newActivities[index], newActivities[index - 1]];
    setActivities(newActivities);
  };

  const moveActivityDown = (index: number) => {
    if (index === activities.length - 1) return; // Già in fondo
    const newActivities = [...activities];
    [newActivities[index], newActivities[index + 1]] = [newActivities[index + 1], newActivities[index]];
    setActivities(newActivities);
  };

  const addResourceToActivity = (activityId: string) => {
    setActivities(activities.map(a => {
      if (a.id === activityId) {
        return {
          ...a,
          resources: [...a.resources, { resourceId: '', hours: 0, fixedPrice: 0 }]
        };
      }
      return a;
    }));
  };

  const updateActivityResource = (activityId: string, index: number, field: keyof ResourceAssignment, value: string | number) => {
    setActivities(activities.map(a => {
      if (a.id === activityId) {
        const newResources = [...a.resources];
        newResources[index] = { ...newResources[index], [field]: value };
        return { ...a, resources: newResources };
      }
      return a;
    }));
  };

  const removeResourceFromActivity = (activityId: string, index: number) => {
    setActivities(activities.map(a => {
      if (a.id === activityId) {
        return {
          ...a,
          resources: a.resources.filter((_, i) => i !== index)
        };
      }
      return a;
    }));
  };

  // Helper functions che wrappano le funzioni importate per mantenere compatibilità
  const calculateResourceCostLocal = (resourceId: string, hours: number, fixedPrice: number): number => {
    return calculateResourceCost(resources, resourceId, hours, fixedPrice);
  };

  const calculateActivityTotalLocal = (activity: Activity): number => {
    return calculateActivityTotal(resources, activity);
  };

  const calculateActivityDiscountAmountLocal = (activity: Activity): number => {
    return calculateActivityDiscountAmount(resources, activity);
  };

  const calculateActivityTotalWithVatLocal = (activity: Activity): number => {
    return calculateActivityTotalWithVat(resources, activity);
  };

  const calculateGrandSubtotalLocal = (): number => {
    return calculateGrandSubtotal(resources, activities);
  };

  const calculateGrandVatLocal = (): number => {
    return calculateGrandVat(resources, activities);
  };

  const calculateGrandTotalBeforeGeneralDiscountLocal = (): number => {
    return calculateGrandTotalBeforeGeneralDiscount(resources, activities);
  };

  const calculateGeneralDiscountAmountLocal = (): number => {
    return calculateGeneralDiscountAmount(resources, activities, generalDiscount);
  };

  const calculateGrandTotalLocal = (): number => {
    return calculateGrandTotal(resources, activities, generalDiscount);
  };

  const calculateTotalActivityDiscountsLocal = (): number => {
    return calculateTotalActivityDiscounts(resources, activities);
  };


  const handleExport = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const html = generatePDFHTML(resources, activities, generalDiscount, currency, budgetName, pdfConfig, language);
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const exportToPDF = () => {
    handleExport();
  };

  const exportToDOCX = async () => {
    // Apri il dialog per esportare DOCX (per ora usa il dialog esistente)
    setPdfDialogOpen(true);
  };

  const createInteractivePage = async () => {
    // 0. Verifica se l'utente è loggato
    if (!user) {
      // Mostra il dialog di login
      setAuthDialogOpen(true);
      return;
    }

    // 1. Prepara i metadata del preventivo
    const metadata: any = {
      budgetName,
      currency,
      defaultVat,
      resources,
      activities,
      generalDiscount,
      exportDate: new Date().toISOString(),
      pdfConfig: {
        companyName: pdfConfig.companyName,
        companyInfo: pdfConfig.companyInfo,
        headerText: pdfConfig.headerText,
        contractTerms: pdfConfig.contractTerms,
        signatureSection: pdfConfig.signatureSection,
      },
    };

    // Aggiungi scadenza solo se abilitata (nei metadata per riferimento)
    if (expirationEnabled) {
      metadata.expiration = {
        enabled: true,
        value: expirationValue,
        unit: expirationUnit,
      };
    }

    // Aggiungi altri campi se presenti
    if (budgetDescription) {
      metadata.budgetDescription = budgetDescription;
    }
    if (budgetTags && budgetTags.length > 0) {
      metadata.budgetTags = budgetTags;
    }

    // Prepara i dati per l'inserimento/aggiornamento
    const quoteData: any = {
      user_id: user.id,
      name: budgetName,
      metadata: metadata,
      is_template: false,
      deadline: expirationEnabled ? calculatedExpirationDate.toISOString() : null,
    };

    setSavingQuote(true);

    try {
      const supabase = createClientSupabaseClient();
      let result;

      if (currentQuoteId) {
        // Aggiorna preventivo esistente
        const { data, error } = await supabase
          .from('quotes')
          .update(quoteData)
          .eq('id', currentQuoteId)
          .select()
          .single();

        if (error) {
          throw error;
        }
        result = { data, error: null };
      } else {
        // Crea nuovo preventivo
        const { data, error } = await supabase
          .from('quotes')
          .insert(quoteData)
          .select()
          .single();

        if (error) {
          throw error;
        }
        result = { data, error: null };
      }

      if (result.data?.id) {
        const quoteId = result.data.id;
        
        // Apri la pagina interattiva in una nuova tab
        window.open(`/v/${quoteId}`, '_blank');
        
        // Aggiorna l'URL corrente con qid
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('qid', quoteId);
        router.push(newUrl.pathname + newUrl.search);
        
        // Aggiorna lo stato
        setCurrentQuoteId(quoteId);
      } else {
        alert('Preventivo salvato con successo!');
      }
    } catch (error: any) {
      console.error('Errore durante il salvataggio del preventivo:', error);
      alert('Errore durante il salvataggio del preventivo: ' + (error.message || 'Errore sconosciuto'));
    } finally {
      setSavingQuote(false);
    }
  };

  const exportToJSON = () => {
    const config: any = {
      budgetName,
      currency,
      defaultVat,
      resources,
      activities,
      generalDiscount,
      exportDate: new Date().toISOString(),
      // Includi i dati del mittente, destinatario e condizioni contrattuali (escluso il logo)
      pdfConfig: {
        companyName: pdfConfig.companyName,
        companyInfo: pdfConfig.companyInfo,
        headerText: pdfConfig.headerText,
        contractTerms: pdfConfig.contractTerms,
        signatureSection: pdfConfig.signatureSection,
      },
    };
    
    // Aggiungi scadenza solo se abilitata
    if (expirationEnabled) {
      config.expiration = {
        enabled: true,
        value: expirationValue,
        unit: expirationUnit,
      };
    }
    
    // Formatta la data: YYYYMMDD_HHMMSS
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const dateTimeStr = `${dateStr}_${timeStr}`;
    
    // Sanifica il nome del preventivo per il nome file
    const sanitizedName = budgetName
      .replace(/[<>:"/\\|?*]/g, '') // Rimuove caratteri non validi
      .replace(/\s+/g, '_') // Sostituisce spazi con underscore
      .slice(0, 50); // Limita la lunghezza
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Budgez_${sanitizedName}_${dateTimeStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    const config: any = {
      budgetName,
      currency,
      defaultVat,
      resources,
      activities,
      generalDiscount,
      exportDate: new Date().toISOString(),
      // Includi i dati del mittente, destinatario e condizioni contrattuali (escluso il logo)
      pdfConfig: {
        companyName: pdfConfig.companyName,
        companyInfo: pdfConfig.companyInfo,
        headerText: pdfConfig.headerText,
        contractTerms: pdfConfig.contractTerms,
        signatureSection: pdfConfig.signatureSection,
      },
    };
    
    // Aggiungi scadenza solo se abilitata
    if (expirationEnabled) {
      config.expiration = {
        enabled: true,
        value: expirationValue,
        unit: expirationUnit,
      };
    }
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      setConfigCopied(true);
      setTimeout(() => setConfigCopied(false), 3000);
    } catch {
      // Silenziosamente ignora gli errori
      console.error('Errore nella copia della configurazione');
    }
  };


  const copyTableToClipboard = async () => {
    try {
      const tableHTML = generateTableHTML(resources, activities, generalDiscount, currency, language);
      const richTextBlob = new Blob([tableHTML], { type: 'text/html' });
      const plainTextBlob = new Blob([tableHTML], { type: 'text/plain' });
      
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': richTextBlob,
          'text/plain': plainTextBlob
        })
      ]);
      setTableCopied(true);
      setTimeout(() => setTableCopied(false), 3000);
    } catch {
      // Fallback for browsers that don't support ClipboardItem
      try {
        await navigator.clipboard.writeText(generateTableHTML(resources, activities, generalDiscount, currency, language));
        setTableCopied(true);
        setTimeout(() => setTableCopied(false), 3000);
      } catch (err2) {
        console.error('Errore nella copia:', err2);
      }
    }
  };

  const loadConfiguration = (config: {
    budgetName?: string;
    currency?: string;
    defaultVat?: number;
    resources?: unknown[];
    activities?: unknown[];
    generalDiscount?: unknown;
    expiration?: {
      enabled: boolean;
      value: number;
      unit: 'days' | 'weeks' | 'months';
    };
    pdfConfig?: {
      companyName?: string;
      companyInfo?: string;
      headerText?: string;
      contractTerms?: string;
      signatureSection?: {
        companyName: string;
        signerName: string;
        signerRole: string;
        date: string;
        place: string;
      };
    };
  }, templateName?: string, templateDescription?: string, templateTags?: string[]) => {
    // Se viene passato un templateName, aggiorna il nome del preventivo con il formato dinamico
    if (templateName) {
      const now = new Date();
      const dayOfYear = getDayOfYear();
      setBudgetName(`Preventivo #${dayOfYear}/${now.getFullYear()} - ${templateName}`);
      // Imposta anche la descrizione del template se presente
      if (templateDescription) {
        setBudgetDescription(templateDescription);
      }
      // Imposta i tag del template se presenti
      if (templateTags && templateTags.length > 0) {
        setBudgetTags(templateTags);
      }
    } else if (config.budgetName) {
      // Carica il budgetName solo dalle configurazioni personalizzate (JSON)
      setBudgetName(config.budgetName);
    }
    if (config.currency) setCurrency(config.currency);
    if (config.defaultVat !== undefined) setDefaultVat(config.defaultVat);
    if (config.resources) setResources(config.resources as unknown as Resource[]);
    if (config.activities) setActivities(config.activities as unknown as Activity[]);
    if (config.generalDiscount) {
      setGeneralDiscount(config.generalDiscount as unknown as GeneralDiscount);
    } else {
      // Reset general discount if not in config
      setGeneralDiscount({
        enabled: false,
        type: 'percentage',
        value: 0,
        applyOn: 'taxable'
      });
    }
    
    // Carica scadenza se presente
    if (config.expiration) {
      setExpirationEnabled(config.expiration.enabled);
      if (config.expiration.value) setExpirationValue(config.expiration.value);
      if (config.expiration.unit) setExpirationUnit(config.expiration.unit);
    }
    
    // Carica i dati del PDF config se presenti (mittente, destinatario, condizioni contrattuali)
    if (config.pdfConfig) {
      setPdfConfig(prevConfig => ({
        ...prevConfig,
        companyName: config.pdfConfig?.companyName ?? prevConfig.companyName,
        companyInfo: config.pdfConfig?.companyInfo ?? prevConfig.companyInfo,
        headerText: config.pdfConfig?.headerText ?? prevConfig.headerText,
        contractTerms: config.pdfConfig?.contractTerms ?? prevConfig.contractTerms,
        signatureSection: config.pdfConfig?.signatureSection ?? prevConfig.signatureSection,
      }));
    }
  };

  const handleLoadJson = () => {
    try {
      const config = JSON.parse(jsonInput);
      if (!config.currency || !config.resources || !config.activities) {
        setJsonError('Configurazione non valida. Assicurati che contenga currency, resources e activities.');
        return;
      }
      loadConfiguration(config);
      setJsonDialogOpen(false);
      setJsonInput('');
      setJsonError('');
    } catch {
      setJsonError('JSON non valido. Verifica la sintassi.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

      {/* Header */}
      <AppHeader 
        language={language}
        onLanguageChange={setLanguage}
        translations={t}
        user={user}
        onLoginClick={() => setAuthDialogOpen(true)}
        onLogout={async () => {
          try {
            const supabase = createClientSupabaseClient();
            const { error } = await supabase.auth.signOut();
            if (error) {
              console.error('Errore durante il logout:', error);
            } else {
              // Forza l'aggiornamento dello stato anche se il listener non si attiva
              setUser(null);
            }
          } catch (error) {
            console.error('Errore durante il logout:', error);
            // In caso di errore, forza comunque l'aggiornamento
            setUser(null);
          }
        }}
      />

      {/* Auth Dialog */}
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        language={language}
        translations={t}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Tabs - Only show when user is logged in */}
          {user && (
            <div className="mb-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-fit grid grid-cols-3">
                  <TabsTrigger value="create">{(t as any).tabCreate || 'Crea'}</TabsTrigger>
                  <TabsTrigger value="history">{(t as any).tabHistory || 'Storico'}</TabsTrigger>
                  <TabsTrigger value="profile">{(t as any).tabProfile || 'Profilo'}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* Page Title */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {user && activeTab === 'history' 
                  ? (t as any).historyTitle || 'Storico Preventivi'
                  : user && activeTab === 'profile'
                  ? (t as any).profileTitle || 'Profilo'
                  : t.createBudget}
              </h1>
              {(!user || activeTab === 'create') && (
                <div className="flex items-center gap-2">
                  {currentQuoteId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetToNewQuote}
                      className="h-8 text-sm"
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      Crea nuovo preventivo
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHowToDialogOpen(true)}
                    className="h-8 text-sm"
                  >
                    <Compass className="h-4 w-4 mr-1.5" />
                    Scopri come
                  </Button>
                </div>
              )}
            </div>
            <p className="text-base text-gray-600 max-w-3xl">
              <AnimatedSubtitle 
                text={
                  user && activeTab === 'history'
                    ? (t as any).historySubtitle || 'Visualizza e gestisci i tuoi preventivi salvati'
                    : user && activeTab === 'profile'
                    ? (t as any).profileSubtitle || 'Gestisci le impostazioni del tuo account'
                    : t.subtitle
                } 
              />
            </p>
          </div>

          {/* Tab Content */}
          {user ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* Create Tab */}
              <TabsContent value="create" className="mt-0">
                {/* Settings Section */}
                <div className="mb-8">
                  <SettingsSection
                    budgetName={budgetName}
                    setBudgetName={setBudgetName}
                    budgetDescription={budgetDescription}
                    setBudgetDescription={setBudgetDescription}
                    budgetTags={budgetTags}
                    setBudgetTags={setBudgetTags}
                    currency={currency}
                    setCurrency={setCurrency}
                    defaultVat={defaultVat}
                    setDefaultVat={setDefaultVat}
                    expirationEnabled={expirationEnabled}
                    setExpirationEnabled={setExpirationEnabled}
                    expirationValue={expirationValue}
                    setExpirationValue={setExpirationValue}
                    expirationUnit={expirationUnit}
                    setExpirationUnit={setExpirationUnit}
                    calculatedExpirationDate={calculatedExpirationDate}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedTags={selectedTags}
                    toggleTag={toggleTag}
                    randomizedTags={randomizedTags}
                    filteredTemplates={filteredTemplates}
                    loadConfiguration={loadConfiguration}
                    budgetTemplatesLength={budgetTemplates.length}
                    totalTemplatesInDb={totalTemplatesInDb}
                    onOpenJsonDialog={() => setJsonDialogOpen(true)}
                    translations={t}
                  />
                </div>

                {/* Resources and Activities Sections */}
                <Accordion type="multiple" defaultValue={["resources", "activities"]} className="mb-8">
                  <ResourcesSection
                    resources={resources}
                    currency={currency}
                    onAdd={addResource}
                    onUpdate={updateResource}
                    onDelete={deleteResource}
                    onMoveUp={moveResourceUp}
                    onMoveDown={moveResourceDown}
                    translations={t}
                  />
                  <ActivitiesSection
                    activities={activities}
                    resources={resources}
                    currency={currency}
                    defaultVat={defaultVat}
                    expandedActivities={expandedActivities}
                    onToggleActivity={(activityId) => {
                      const newExpanded = new Set(expandedActivities);
                      if (newExpanded.has(activityId)) {
                        newExpanded.delete(activityId);
                      } else {
                        newExpanded.add(activityId);
                      }
                      setExpandedActivities(newExpanded);
                    }}
                    onAdd={addActivity}
                    onUpdate={updateActivity}
                    onDelete={deleteActivity}
                    onMoveUp={moveActivityUp}
                    onMoveDown={moveActivityDown}
                    onAddResource={addResourceToActivity}
                    onUpdateResource={updateActivityResource}
                    onRemoveResource={removeResourceFromActivity}
                    translations={t}
                  />
                </Accordion>

                {/* General Discount Section */}
                {activities.length > 0 && (
                  <GeneralDiscountSection
                    generalDiscount={generalDiscount}
                    resources={resources}
                    activities={activities}
                    currency={currency}
                    onUpdate={setGeneralDiscount}
                    translations={t}
                  />
                )}

                {/* Total */}
                {activities.length > 0 && (
                  <div ref={finalTotalRef}>
                    {/* Summary Table Preview */}
                    <SummaryTable
                      activities={activities}
                      resources={resources}
                      generalDiscount={generalDiscount}
                      currency={currency}
                      tableCopied={tableCopied}
                      onCopy={copyTableToClipboard}
                      translations={t}
                    />

                    {/* Timeline - Collapsible */}
                    {activities.length > 0 && (
                      <Card className="bg-white border-2 border-gray-200 mb-8">
                        <Accordion type="single" collapsible defaultValue="" className="w-full">
                          <AccordionItem value="gantt-chart" className="border-none">
                            <AccordionTrigger className="px-6 py-4 hover:no-underline">
                              <CardTitle className="text-lg font-semibold">
                                Timeline
                              </CardTitle>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                              <GanttChart 
                                activities={activities}
                                onUpdateActivity={updateActivity}
                              />
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </Card>
                    )}

                    <FinalTotalCard
                      resources={resources}
                      activities={activities}
                      generalDiscount={generalDiscount}
                      currency={currency}
                      translations={t}
                    />

                    {/* PDF Export Configuration */}
                    <PDFExportConfig
                      pdfConfig={pdfConfig}
                      setPdfConfig={setPdfConfig}
                      logoPreview={logoPreview}
                      setLogoPreview={setLogoPreview}
                    />

                    {/* Action Buttons */}
                    <ActionButtons
                      configCopied={configCopied}
                      onExportPDF={exportToPDF}
                      onExportDOCX={exportToDOCX}
                      onExportJSON={exportToJSON}
                      onCopyConfig={copyToClipboard}
                      onCreateInteractive={createInteractivePage}
                      savingQuote={savingQuote}
                      isEditing={!!currentQuoteId}
                      onCreateNew={resetToNewQuote}
                    />
                  </div>
                )}
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="mt-0">
                <HistorySection
                  userId={user.id}
                  language={language}
                  translations={t}
                />
              </TabsContent>

              {/* Profile Tab */}
              <TabsContent value="profile" className="mt-0">
                <ProfileSection
                  userEmail={user.email || ''}
                  userId={user.id}
                  language={language}
                  translations={t}
                  onAccountDeleted={async () => {
                    const supabase = createClientSupabaseClient();
                    await supabase.auth.signOut();
                    setUser(null);
                    setActiveTab('create');
                  }}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <>
              {/* Settings Section */}
              <div className="mb-8">
                <SettingsSection
                  budgetName={budgetName}
                  setBudgetName={setBudgetName}
                  budgetDescription={budgetDescription}
                  setBudgetDescription={setBudgetDescription}
                  budgetTags={budgetTags}
                  setBudgetTags={setBudgetTags}
                  currency={currency}
                  setCurrency={setCurrency}
                  defaultVat={defaultVat}
                  setDefaultVat={setDefaultVat}
                  expirationEnabled={expirationEnabled}
                  setExpirationEnabled={setExpirationEnabled}
                  expirationValue={expirationValue}
                  setExpirationValue={setExpirationValue}
                  expirationUnit={expirationUnit}
                  setExpirationUnit={setExpirationUnit}
                  calculatedExpirationDate={calculatedExpirationDate}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedTags={selectedTags}
                  toggleTag={toggleTag}
                  randomizedTags={randomizedTags}
                  filteredTemplates={filteredTemplates}
                  loadConfiguration={loadConfiguration}
                  budgetTemplatesLength={budgetTemplates.length}
                  onOpenJsonDialog={() => setJsonDialogOpen(true)}
                  translations={t}
                />
              </div>

              {/* Resources and Activities Sections */}
              <Accordion type="multiple" defaultValue={["resources", "activities"]} className="mb-8">
                <ResourcesSection
                  resources={resources}
                  currency={currency}
                  onAdd={addResource}
                  onUpdate={updateResource}
                  onDelete={deleteResource}
                  onMoveUp={moveResourceUp}
                  onMoveDown={moveResourceDown}
                  translations={t}
                />
                <ActivitiesSection
                  activities={activities}
                  resources={resources}
                  currency={currency}
                  defaultVat={defaultVat}
                  expandedActivities={expandedActivities}
                  onToggleActivity={(activityId) => {
                    const newExpanded = new Set(expandedActivities);
                    if (newExpanded.has(activityId)) {
                      newExpanded.delete(activityId);
                    } else {
                      newExpanded.add(activityId);
                    }
                    setExpandedActivities(newExpanded);
                  }}
                  onAdd={addActivity}
                  onUpdate={updateActivity}
                  onDelete={deleteActivity}
                  onMoveUp={moveActivityUp}
                  onMoveDown={moveActivityDown}
                  onAddResource={addResourceToActivity}
                  onUpdateResource={updateActivityResource}
                  onRemoveResource={removeResourceFromActivity}
                  translations={t}
                />
              </Accordion>

              {/* General Discount Section */}
              {activities.length > 0 && (
                <GeneralDiscountSection
                  generalDiscount={generalDiscount}
                  resources={resources}
                  activities={activities}
                  currency={currency}
                  onUpdate={setGeneralDiscount}
                  translations={t}
                />
              )}

              {/* Total */}
              {activities.length > 0 && (
                <div ref={finalTotalRef}>
                  {/* Summary Table Preview */}
                  <SummaryTable
                    activities={activities}
                    resources={resources}
                    generalDiscount={generalDiscount}
                    currency={currency}
                    tableCopied={tableCopied}
                    onCopy={copyTableToClipboard}
                    translations={t}
                  />

                  {/* Timeline - Collapsible */}
                  {activities.length > 0 && (
                    <Card className="bg-white border-2 border-gray-200 mb-8">
                      <Accordion type="single" collapsible defaultValue="" className="w-full">
                        <AccordionItem value="gantt-chart" className="border-none">
                          <AccordionTrigger className="px-6 py-4 hover:no-underline">
                            <CardTitle className="text-lg font-semibold">
                              Timeline
                            </CardTitle>
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-6">
                            <GanttChart 
                              activities={activities}
                              onUpdateActivity={updateActivity}
                            />
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </Card>
                  )}

                  <FinalTotalCard
                    resources={resources}
                    activities={activities}
                    generalDiscount={generalDiscount}
                    currency={currency}
                    translations={t}
                  />

                  {/* PDF Export Configuration */}
                  <PDFExportConfig
                    pdfConfig={pdfConfig}
                    setPdfConfig={setPdfConfig}
                    logoPreview={logoPreview}
                    setLogoPreview={setLogoPreview}
                  />

                  {/* Action Buttons */}
                  <ActionButtons
                    configCopied={configCopied}
                    onExportPDF={exportToPDF}
                    onExportDOCX={exportToDOCX}
                    onExportJSON={exportToJSON}
                    onCopyConfig={copyToClipboard}
                    onCreateInteractive={createInteractivePage}
                    savingQuote={savingQuote}
                    isEditing={!!currentQuoteId}
                    onCreateNew={resetToNewQuote}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Floating Total - visible only when there are activities and final total is not in view */}
      <FloatingTotal
        resources={resources}
        activities={activities}
        generalDiscount={generalDiscount}
        currency={currency}
        show={activities.length > 0 && showFloatingTotal}
        onExportPDF={exportToPDF}
      />

      {/* JSON Configuration Dialog */}
      <JsonConfigDialog
        open={jsonDialogOpen}
        onOpenChange={setJsonDialogOpen}
        onLoad={loadConfiguration}
        translations={t}
      />

      {/* How To Carousel Dialog */}
      <HowToCarouselDialog
        open={howToDialogOpen}
        onOpenChange={setHowToDialogOpen}
      />

      {/* Footer */}
      <Footer language={language} onLanguageChange={setLanguage} />

      {/* PDF Export Dialog */}
      <PDFExportDialog
        open={pdfDialogOpen}
        onOpenChange={setPdfDialogOpen}
        budgetName={budgetName}
        currency={currency}
        resources={resources}
        activities={activities}
        generalDiscount={generalDiscount}
        translations={t}
        formatNumber={formatNumber}
        calculateResourceCost={(resourceId: string, hours: number, fixedPrice: number) => 
          calculateResourceCost(resources, resourceId, hours, fixedPrice)
        }
        calculateActivityTotal={(activity: Activity) => 
          calculateActivityTotal(resources, activity)
        }
        calculateActivityDiscountAmount={(activity: Activity) => 
          calculateActivityDiscountAmount(resources, activity)
        }
        calculateActivityTotalWithVat={(activity: Activity) => 
          calculateActivityTotalWithVat(resources, activity)
        }
        calculateGrandSubtotal={() => 
          calculateGrandSubtotal(resources, activities)
        }
        calculateGrandVat={() => 
          calculateGrandVat(resources, activities)
        }
        calculateGrandTotalBeforeGeneralDiscount={() => 
          calculateGrandTotalBeforeGeneralDiscount(resources, activities)
        }
        calculateGeneralDiscountAmount={() => 
          calculateGeneralDiscountAmount(resources, activities, generalDiscount)
        }
        calculateGrandTotal={() => 
          calculateGrandTotal(resources, activities, generalDiscount)
        }
        calculateTotalActivityDiscounts={() => 
          calculateTotalActivityDiscounts(resources, activities)
        }
        generateGanttHTML={() => generateGanttHTML(activities)}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
