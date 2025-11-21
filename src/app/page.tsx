'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Download, FileDown, Copy, ArrowUp, ArrowDown, Check, Boxes, CheckSquare, ChevronDown, FileText, Sparkles } from 'lucide-react';
import { translations, type Language } from '@/lib/translations';
import { budgetTemplates } from '@/lib/budget-templates';
import Footer from '@/components/footer/footer';
import GanttChart from '@/components/gantt-chart';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import PDFExportDialog from '@/components/pdf-export-dialog';
import PDFExportConfig from '@/components/pdf-export-config';
import AppHeader from '@/components/app-header';
import SettingsSection from '@/components/budget/settings-section';

// Componente per animare il subtitle parola per parola
const AnimatedSubtitle = ({ text }: { text: string }) => {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const words = text.split(' ');

  useEffect(() => {
    // Animazione solo una volta all'ingresso
    const timeouts: NodeJS.Timeout[] = [];
    
    // Delay iniziale prima di iniziare l'animazione
    const initialDelay = setTimeout(() => {
      words.forEach((_, index) => {
        const timeout = setTimeout(() => {
          setHighlightedIndex(index);
        }, index * 350); // 350ms tra ogni parola
        timeouts.push(timeout);
      });

      // Reset dopo che tutte le parole sono state evidenziate
      const resetTimeout = setTimeout(() => {
        setHighlightedIndex(-1);
      }, words.length * 350 + 1500); // Attende 1.5 secondi dopo l'ultima parola
      timeouts.push(resetTimeout);
    }, 500);
    
    timeouts.push(initialDelay);

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [text]);

  return (
    <span className="inline-flex flex-wrap justify-center gap-x-2">
      {words.map((word, index) => (
        <span
          key={index}
          className={`transition-all duration-300 ${
            highlightedIndex === index
              ? 'bg-yellow-200 px-1 rounded'
              : 'text-gray-600'
          }`}
        >
          {word}
        </span>
      ))}
    </span>
  );
};

interface Resource {
  id: string;
  name: string;
  costType: 'hourly' | 'quantity' | 'fixed';
  pricePerHour: number;
}

interface ResourceAssignment {
  resourceId: string;
  hours: number; // per orario o quantità
  fixedPrice: number; // per fisso - inserito nell'attività
}

interface ActivityDiscount {
  enabled: boolean;
  type: 'percentage' | 'fixed';
  value: number;
  applyOn: 'taxable' | 'withVat'; // imponibile o totale ivato
}

interface Activity {
  id: string;
  name: string;
  description: string;
  resources: ResourceAssignment[];
  vat: number; // Percentuale IVA specifica per questa attività
  discount?: ActivityDiscount; // Sconto opzionale per l'attività
  startDate?: string; // Data inizio attività (ISO format)
  endDate?: string; // Data fine attività (ISO format)
}

interface GeneralDiscount {
  enabled: boolean;
  type: 'percentage' | 'fixed';
  value: number;
  applyOn: 'taxable' | 'withVat'; // imponibile o totale ivato
}

export default function HomePage() {
  // Funzione per calcolare il giorno dell'anno
  const getDayOfYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };

  const getDefaultBudgetName = () => {
    const now = new Date();
    return `Preventivo #${getDayOfYear()}/${now.getFullYear()}`;
  };

  const [language, setLanguage] = useState<Language>('it');
  const [currency, setCurrency] = useState('€');
  const [defaultVat, setDefaultVat] = useState(22); // IVA default 22%
  const [budgetName, setBudgetName] = useState(getDefaultBudgetName());
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
  const [randomizedTemplates, setRandomizedTemplates] = useState<typeof budgetTemplates>([]);
  const [isClient, setIsClient] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfConfig, setPdfConfig] = useState<{
    companyLogo?: string;
    companyName: string;
    companyInfo: string;
    headerText: string;
    contractTerms: string;
    signatureSection: {
      companyName: string;
      signerName: string;
      signerRole: string;
      date: string;
      place: string;
    };
  }>({
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

  const calculatedExpirationDate = React.useMemo(() => {
    const date = new Date();
    if (expirationUnit === 'days') date.setDate(date.getDate() + expirationValue);
    if (expirationUnit === 'weeks') date.setDate(date.getDate() + (expirationValue * 7));
    if (expirationUnit === 'months') date.setMonth(date.getMonth() + expirationValue);
    return date;
  }, [expirationValue, expirationUnit]);

  const t = translations[language];

  // Inizializza randomizzazione solo sul client
  React.useEffect(() => {
    setIsClient(true);
    const allTags = Array.from(new Set(budgetTemplates.flatMap(t => t.tags)));
    const shuffled = [...allTags].sort(() => 0.5 - Math.random());
    setRandomizedTags(shuffled);
    
    // Randomizza anche i template per la visualizzazione iniziale
    const shuffledTemplates = [...budgetTemplates].sort(() => 0.5 - Math.random()).slice(0, 10);
    setRandomizedTemplates(shuffledTemplates);
  }, []);

  // Filtra template in base a ricerca e tag selezionati
  const filteredTemplates = React.useMemo(() => {
    const filtered = budgetTemplates.filter(template => {
      const matchesSearch = searchQuery === '' || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tag => template.tags.includes(tag));
      
      return matchesSearch && matchesTags;
    });

    // Se non ci sono filtri attivi, usa i template randomizzati precaricati
    if (searchQuery === '' && selectedTags.length === 0) {
      return isClient ? randomizedTemplates : filtered.slice(0, 10);
    }
    
    return filtered;
  }, [searchQuery, selectedTags, randomizedTemplates, isClient]);

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

  const calculateResourceCost = (resourceId: string, hours: number, fixedPrice: number): number => {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return 0;
    
    if (resource.costType === 'hourly' || resource.costType === 'quantity') {
      return hours * resource.pricePerHour;
    } else {
      return fixedPrice;
    }
  };

  // Calcola il subtotale dell'attività (senza IVA e senza sconto)
  const calculateActivityTotal = (activity: Activity): number => {
    return activity.resources.reduce((total, assignment) => {
      return total + calculateResourceCost(assignment.resourceId, assignment.hours, assignment.fixedPrice);
    }, 0);
  };

  // Calcola l'importo dello sconto dell'attività
  const calculateActivityDiscountAmount = (activity: Activity): number => {
    if (!activity.discount || !activity.discount.enabled || activity.discount.value === 0) {
      return 0;
    }

    const subtotal = calculateActivityTotal(activity);
    const baseAmount = activity.discount.applyOn === 'taxable' 
      ? subtotal 
      : subtotal + (subtotal * activity.vat / 100);

    if (activity.discount.type === 'percentage') {
      return baseAmount * activity.discount.value / 100;
    } else {
      return activity.discount.value;
    }
  };

  // Calcola il totale dell'attività con IVA e con sconto applicato
  const calculateActivityTotalWithVat = (activity: Activity): number => {
    const subtotal = calculateActivityTotal(activity);
    const discountAmount = calculateActivityDiscountAmount(activity);
    
    if (!activity.discount || !activity.discount.enabled) {
      // Nessuno sconto: subtotale + IVA
      return subtotal + (subtotal * activity.vat / 100);
    }

    if (activity.discount.applyOn === 'taxable') {
      // Sconto applicato sull'imponibile
      const subtotalAfterDiscount = subtotal - discountAmount;
      return subtotalAfterDiscount + (subtotalAfterDiscount * activity.vat / 100);
    } else {
      // Sconto applicato sul totale IVAto
      const totalWithVat = subtotal + (subtotal * activity.vat / 100);
      return totalWithVat - discountAmount;
    }
  };

  // Calcola il subtotale generale (somma di tutti i subtotali delle attività con sconti applicati)
  const calculateGrandSubtotal = (): number => {
    return activities.reduce((total, activity) => {
      const subtotal = calculateActivityTotal(activity);
      const discountAmount = calculateActivityDiscountAmount(activity);
      
      if (!activity.discount || !activity.discount.enabled) {
        return total + subtotal;
      }

      if (activity.discount.applyOn === 'taxable') {
        return total + (subtotal - discountAmount);
      } else {
        // Se lo sconto è sul totale IVAto, dobbiamo ricalcolare l'imponibile
        const totalWithVat = subtotal + (subtotal * activity.vat / 100);
        const totalAfterDiscount = totalWithVat - discountAmount;
        const subtotalAfterDiscount = totalAfterDiscount / (1 + activity.vat / 100);
        return total + subtotalAfterDiscount;
      }
    }, 0);
  };

  // Calcola il totale IVA generale
  const calculateGrandVat = (): number => {
    return activities.reduce((total, activity) => {
      const subtotal = calculateActivityTotal(activity);
      const discountAmount = calculateActivityDiscountAmount(activity);
      
      if (!activity.discount || !activity.discount.enabled) {
        return total + (subtotal * activity.vat / 100);
      }

      if (activity.discount.applyOn === 'taxable') {
        const subtotalAfterDiscount = subtotal - discountAmount;
        return total + (subtotalAfterDiscount * activity.vat / 100);
      } else {
        const totalWithVat = subtotal + (subtotal * activity.vat / 100);
        const totalAfterDiscount = totalWithVat - discountAmount;
        const subtotalAfterDiscount = totalAfterDiscount / (1 + activity.vat / 100);
        return total + (subtotalAfterDiscount * activity.vat / 100);
      }
    }, 0);
  };

  // Calcola il totale senza sconto generale
  const calculateGrandTotalBeforeGeneralDiscount = (): number => {
    return calculateGrandSubtotal() + calculateGrandVat();
  };

  // Calcola l'importo dello sconto generale
  const calculateGeneralDiscountAmount = (): number => {
    if (!generalDiscount.enabled || generalDiscount.value === 0) {
      return 0;
    }

    const subtotal = calculateGrandSubtotal();
    const totalWithVat = calculateGrandTotalBeforeGeneralDiscount();
    const baseAmount = generalDiscount.applyOn === 'taxable' ? subtotal : totalWithVat;

    if (generalDiscount.type === 'percentage') {
      return baseAmount * generalDiscount.value / 100;
    } else {
      return generalDiscount.value;
    }
  };

  // Calcola il gran totale finale (con sconto generale se applicabile)
  const calculateGrandTotal = (): number => {
    const totalBeforeDiscount = calculateGrandTotalBeforeGeneralDiscount();
    const generalDiscountAmount = calculateGeneralDiscountAmount();
    return totalBeforeDiscount - generalDiscountAmount;
  };

  // Calcola il totale degli sconti applicati sulle attività
  const calculateTotalActivityDiscounts = (): number => {
    return activities.reduce((total, activity) => {
      return total + calculateActivityDiscountAmount(activity);
    }, 0);
  };

  // Formattazione numeri in stile italiano (1.000,50)
  const formatNumber = (num: number): string => {
    return num.toLocaleString('it-IT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Converte una Date in formato YYYY-MM-DD preservando la data locale (senza shift UTC)
  const formatDateToLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const generateGanttHTML = () => {
    // Filtra attività con date
    const activitiesWithDates = activities.filter(a => a.startDate && a.endDate);
    if (activitiesWithDates.length === 0) return '';

    // Calcola date min/max e scala temporale
    const dates = activitiesWithDates.flatMap(a => [
      new Date(a.startDate!),
      new Date(a.endDate!)
    ]);
    const rawMinDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const rawMaxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    const durationDays = Math.ceil((rawMaxDate.getTime() - rawMinDate.getTime()) / (1000 * 60 * 60 * 24));
    const paddingDays = Math.max(1, Math.ceil(durationDays * 0.05));
    
    const minDate = new Date(rawMinDate);
    minDate.setDate(minDate.getDate() - paddingDays);
    const maxDate = new Date(rawMaxDate);
    maxDate.setDate(maxDate.getDate() + paddingDays);
    
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Genera barre Gantt
    const ganttBars = activitiesWithDates.map((activity, idx) => {
      const start = new Date(activity.startDate!);
      const end = new Date(activity.endDate!);
      const offsetDays = Math.max(0, Math.ceil((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
      const barDurationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const leftPercent = (offsetDays / totalDays) * 100;
      const widthPercent = (barDurationDays / totalDays) * 100;
      
      const hue = (idx * 360) / activitiesWithDates.length;
      
      return `
        <div style="display: flex; align-items: center; margin-bottom: 12px; page-break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact;">
          <div style="width: 200px; flex-shrink: 0; padding-right: 16px;">
            <div style="font-size: 12px; font-weight: 600;">${activity.name}</div>
            <div style="font-size: 10px; color: #666;">
              ${start.toLocaleDateString('it-IT')} - ${end.toLocaleDateString('it-IT')}
            </div>
          </div>
          <div style="flex: 1; position: relative; height: 40px; background: #f5f5f5; border-radius: 4px; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact;">
            <div style="position: absolute; left: ${leftPercent}%; width: ${widthPercent}%; height: 28px; top: 6px; background: hsl(${hue}, 70%, 60%); border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 600; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; padding: 0 8px; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact;">
              ${activity.name}
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div style="page-break-before: always; margin-top: 40px; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact;">
        <h2 style="color: #1a1a1a; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px; margin-bottom: 20px; font-size: 20px;">
          Timeline Progetto
        </h2>
        <div style="font-size: 11px; color: #666; margin-bottom: 16px;">
          Periodo: ${minDate.toLocaleDateString('it-IT')} - ${maxDate.toLocaleDateString('it-IT')} • Durata: ${totalDays} giorni
        </div>
        ${ganttBars}
      </div>
    `;
  };

  const generatePDFHTML = (): string => {
    const total = calculateGrandTotal();
    const subtotal = calculateGrandSubtotal();
    const vatAmount = calculateGrandVat();
    const totalBeforeGeneralDiscount = calculateGrandTotalBeforeGeneralDiscount();
    const generalDiscountAmount = calculateGeneralDiscountAmount();
    const ganttHTML = generateGanttHTML();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Budgez - ${budgetName}</title>
        <style>
          @page {
            margin: 0;
          }
          @media print {
            body {
              margin: 1.5cm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 30px;
            max-width: 1000px;
            margin: 0 auto;
            font-size: 12px;
            line-height: 1.6;
          }
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            gap: 40px;
          }
          .company-section {
            flex: 0 0 40%;
            display: flex;
            flex-direction: column;
            gap: 15px;
          }
          .logo-section {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            padding: 15px;
            background-color: #fafafa;
            border: 1px solid #e5e5e5;
            border-radius: 4px;
            min-height: 100px;
          }
          .logo-section img {
            max-width: 100%;
            max-height: 80px;
            object-fit: contain;
          }
          .company-name {
            font-size: 18px;
            font-weight: bold;
            color: #1a1a1a;
            text-align: left;
            padding: 10px;
          }
          .company-info {
            font-size: 10px;
            color: #555;
            text-align: left;
            white-space: pre-wrap;
            line-height: 1.6;
          }
          .header-text {
            flex: 0 0 50%;
            padding: 15px;
            background-color: #f9f9f9;
            border: 0.5px solid #cccccc;
            white-space: pre-wrap;
            font-size: 11px;
            text-align: right;
            align-self: flex-start;
          }
          h1 {
            color: #1a1a1a;
            padding-bottom: 8px;
            margin-bottom: 20px;
            font-size: 24px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          th {
            background-color: #1a1a1a;
            color: white;
            padding: 8px 10px;
            text-align: left;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
          }
          td {
            padding: 6px 10px;
            border-bottom: 1px solid #e5e5e5;
          }
          .activity-header {
            background-color: #f5f5f5;
            font-weight: bold;
            font-size: 13px;
          }
          .activity-desc {
            font-size: 11px;
            color: #666;
            font-style: italic;
            padding: 4px 10px;
          }
          .resource-row td {
            padding-left: 20px;
          }
          .activity-total-row {
            background-color: #f9f9f9;
            font-weight: bold;
            border-top: 2px solid #ddd;
          }
          .activity-total-row td {
            padding: 8px 10px;
          }
          .summary-section {
            margin-top: 20px;
            border: 2px solid #1a1a1a;
          }
          .summary-row {
            background-color: #f5f5f5;
          }
          .summary-row td {
            padding: 8px 10px;
            font-weight: bold;
          }
          .discount-row {
            background-color: #fef3c7;
            color: #b45309;
          }
          .discount-row td {
            padding: 8px 10px;
            font-weight: bold;
          }
          .grand-total-row {
            background-color: #1a1a1a;
            color: white;
          }
          .grand-total-row td {
            padding: 12px 10px;
            font-size: 16px;
            font-weight: bold;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .smaller {
            font-size: 10px;
          }
          .discount-badge {
            color: #b45309;
            font-size: 10px;
          }
          .contract-terms {
            margin-top: 40px;
            page-break-before: always;
            padding: 20px;
          }
          .contract-terms h2 {
            color: #1a1a1a;
            padding-bottom: 8px;
            margin-bottom: 15px;
            font-size: 18px;
          }
          .contract-terms-content {
            white-space: pre-wrap;
            font-size: 11px;
            line-height: 1.8;
          }
        </style>
      </head>
      <body>
        ${pdfConfig.companyLogo || pdfConfig.companyName || pdfConfig.headerText ? `
          <div class="header-container">
            <div class="company-section">
              ${pdfConfig.companyLogo ? `
                <div class="logo-section">
                  <img src="${pdfConfig.companyLogo}" alt="Company Logo" />
                </div>
              ` : ''}
              ${pdfConfig.companyName ? `
                <div class="company-name">${pdfConfig.companyName}</div>
              ` : ''}
              ${pdfConfig.companyInfo ? `
                <div class="company-info">${pdfConfig.companyInfo}</div>
              ` : ''}
            </div>
            
            ${pdfConfig.headerText ? `
              <div class="header-text">${pdfConfig.headerText}</div>
            ` : ''}
          </div>
        ` : ''}
        
        <h1>${budgetName}</h1>
        
        <table>
          <thead>
            <tr>
              <th style="width: 30%;">${t.activityName}</th>
              <th style="width: 25%;">${t.resourceName}</th>
              <th style="width: 15%;" class="text-center">Dettagli</th>
              <th style="width: 10%;" class="text-right">${t.subtotal}</th>
              <th style="width: 10%;" class="text-right">IVA</th>
              <th style="width: 10%;" class="text-right">${t.total}</th>
            </tr>
          </thead>
          <tbody>
            ${activities.map((activity) => {
              const activitySubtotal = calculateActivityTotal(activity);
              const activityDiscountAmount = calculateActivityDiscountAmount(activity);
              const activityTotalWithVat = calculateActivityTotalWithVat(activity);
              
              let rows = '';
              
              activity.resources.forEach((assignment, resIndex) => {
                const resource = resources.find(r => r.id === assignment.resourceId);
                if (!resource) return;
                
                const cost = calculateResourceCost(assignment.resourceId, assignment.hours, assignment.fixedPrice);
                const detailText = resource.costType === 'hourly' 
                  ? `${assignment.hours}h × ${currency}${formatNumber(resource.pricePerHour)}/h`
                  : resource.costType === 'quantity'
                  ? `${assignment.hours} × ${currency}${formatNumber(resource.pricePerHour)}/u`
                  : `${currency}${formatNumber(assignment.fixedPrice)}`;
                
                rows += `
                  <tr class="resource-row">
                    ${resIndex === 0 ? `
                      <td rowspan="${activity.resources.length + (activity.description ? 1 : 0)}" class="activity-header">
                        ${activity.name} - ${currency}${formatNumber(activityTotalWithVat)}
                      </td>
                    ` : ''}
                    <td>${resource.name}</td>
                    <td class="text-center smaller">${detailText}</td>
                    <td class="text-right">${currency}${formatNumber(cost)}</td>
                    ${resIndex === 0 ? `
                      <td rowspan="${activity.resources.length + (activity.description ? 1 : 0)}" class="text-right" style="vertical-align: top;">
                        ${currency}${formatNumber(activitySubtotal * activity.vat / 100)}<br/>
                        <span class="smaller">(${activity.vat}%)</span>
                      </td>
                      <td rowspan="${activity.resources.length + (activity.description ? 1 : 0)}" class="text-right" style="font-weight: bold; vertical-align: top;">
                        ${currency}${formatNumber(activityTotalWithVat)}
                        ${activity.discount?.enabled && activityDiscountAmount > 0 ? `<br/><span class="discount-badge">-${currency}${formatNumber(activityDiscountAmount)} ${t.discount}</span>` : ''}
                      </td>
                    ` : ''}
                  </tr>
                `;
              });
              
              if (activity.description) {
                rows += `
                  <tr>
                    <td colspan="2" class="activity-desc">${activity.description}</td>
                  </tr>
                `;
              }
              
              rows += `
                <tr class="activity-total-row">
                  <td colspan="3" class="text-right">${t.total} ${activity.name}:</td>
                  <td class="text-right">${currency}${formatNumber(activitySubtotal)}</td>
                  <td class="text-right">${currency}${formatNumber(activitySubtotal * activity.vat / 100)}</td>
                  <td class="text-right">${currency}${formatNumber(activityTotalWithVat)}</td>
                </tr>
              `;
              
              return rows;
            }).join('')}
          </tbody>
        </table>
        
        <table class="summary-section">
          <tbody>
            <tr class="summary-row">
              <td style="width: 70%;" class="text-right">${t.subtotal}:</td>
              <td style="width: 30%;" class="text-right">${currency}${formatNumber(subtotal)}</td>
            </tr>
            <tr class="summary-row">
              <td class="text-right">${t.vatAmount}:</td>
              <td class="text-right">${currency}${formatNumber(vatAmount)}</td>
            </tr>
            ${calculateTotalActivityDiscounts() > 0 ? `
              <tr class="discount-row">
                <td class="text-right">${t.discount} ${t.activities}:</td>
                <td class="text-right">-${currency}${formatNumber(calculateTotalActivityDiscounts())}</td>
              </tr>
            ` : ''}
            ${generalDiscount.enabled && generalDiscountAmount > 0 ? `
              <tr class="summary-row">
                <td class="text-right">${t.beforeDiscount}:</td>
                <td class="text-right">${currency}${formatNumber(totalBeforeGeneralDiscount)}</td>
              </tr>
              <tr class="discount-row">
                <td class="text-right">${t.generalDiscount}:</td>
                <td class="text-right">-${currency}${formatNumber(generalDiscountAmount)}</td>
              </tr>
            ` : ''}
            <tr class="grand-total-row">
              <td class="text-right">${t.finalTotal}:</td>
              <td class="text-right">${currency}${formatNumber(total)}</td>
            </tr>
          </tbody>
        </table>
        
        ${ganttHTML}
        
        ${pdfConfig.contractTerms ? `
          <div class="contract-terms">
            <h2>Condizioni Contrattuali</h2>
            <div class="contract-terms-content">${pdfConfig.contractTerms}</div>
          </div>
        ` : ''}
      </body>
      </html>
    `;
  };

  const handleExport = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const html = generatePDFHTML();
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

  const createInteractivePage = () => {
    // TODO: Implementare la creazione della pagina interattiva
    // Per ora mostra un alert
    alert('Funzionalità pagina interattiva in arrivo!');
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

  const generateTableHTML = () => {
    const subtotal = calculateGrandSubtotal();
    const vatAmount = calculateGrandVat();
    const totalBeforeGeneralDiscount = calculateGrandTotalBeforeGeneralDiscount();
    const generalDiscountAmount = calculateGeneralDiscountAmount();
    const total = calculateGrandTotal();
    
    return `
      <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px;">
        <thead>
          <tr>
            <th style="background-color: #1a1a1a; color: white; padding: 8px 10px; text-align: left; font-weight: bold; border: 1px solid #ddd;">${t.activityName}</th>
            <th style="background-color: #1a1a1a; color: white; padding: 8px 10px; text-align: left; font-weight: bold; border: 1px solid #ddd;">${t.resourceName}</th>
            <th style="background-color: #1a1a1a; color: white; padding: 8px 10px; text-align: right; font-weight: bold; border: 1px solid #ddd;">${t.subtotal}</th>
            <th style="background-color: #1a1a1a; color: white; padding: 8px 10px; text-align: right; font-weight: bold; border: 1px solid #ddd;">IVA</th>
            <th style="background-color: #1a1a1a; color: white; padding: 8px 10px; text-align: right; font-weight: bold; border: 1px solid #ddd;">${t.total}</th>
          </tr>
        </thead>
        <tbody>
          ${activities.map((activity) => {
            const activitySubtotal = calculateActivityTotal(activity);
            const activityDiscountAmount = calculateActivityDiscountAmount(activity);
            const activityTotalWithVat = calculateActivityTotalWithVat(activity);
            
            let rows = '';
            
            activity.resources.forEach((assignment, resIndex) => {
              const resource = resources.find(r => r.id === assignment.resourceId);
              if (!resource) return;
              
              const cost = calculateResourceCost(assignment.resourceId, assignment.hours, assignment.fixedPrice);
              
              // Formatta le date se presenti
              let dateRange = '';
              if (activity.startDate && activity.endDate) {
                const startDate = new Date(activity.startDate);
                const endDate = new Date(activity.endDate);
                dateRange = `<div style="font-size: 10px; color: #666; font-weight: normal; margin-top: 2px;">${startDate.toLocaleDateString('it-IT')} - ${endDate.toLocaleDateString('it-IT')}</div>`;
              }
              
              rows += `
                <tr>
                  ${resIndex === 0 ? `
                    <td rowspan="${activity.resources.length + (activity.description ? 1 : 0)}" style="background-color: #f5f5f5; font-weight: bold; padding: 6px 10px; border: 1px solid #ddd;">
                      <div>${activity.name}</div>
                      ${dateRange}
                    </td>
                  ` : ''}
                  <td style="padding: 6px 10px 6px 20px; border: 1px solid #ddd;">${resource.name}</td>
                  <td style="text-align: right; padding: 6px 10px; border: 1px solid #ddd;">${currency}${formatNumber(cost)}</td>
                  ${resIndex === 0 ? `
                    <td rowspan="${activity.resources.length + (activity.description ? 1 : 0)}" style="text-align: right; padding: 6px 10px; border: 1px solid #ddd; vertical-align: top;">
                      <div>${currency}${formatNumber(activitySubtotal * activity.vat / 100)}</div>
                      <div style="font-size: 10px;">(${activity.vat}%)</div>
                    </td>
                    <td rowspan="${activity.resources.length + (activity.description ? 1 : 0)}" style="text-align: right; padding: 6px 10px; border: 1px solid #ddd; vertical-align: top;">
                      ${currency}${formatNumber(activityTotalWithVat)}
                      ${activity.discount?.enabled && activityDiscountAmount > 0 ? `<div style="font-size: 10px; color: #b45309;">-${currency}${formatNumber(activityDiscountAmount)} ${t.discount}</div>` : ''}
                    </td>
                  ` : ''}
                </tr>
              `;
            });
            
            if (activity.description) {
              rows += `
                <tr>
                  <td colspan="2" style="font-size: 11px; color: #666; font-style: italic; padding: 4px 10px; border: 1px solid #ddd;">
                    ${activity.description}
                  </td>
                </tr>
              `;
            }
            
            rows += `
              <tr style="background-color: #f9f9f9; font-weight: bold;">
                <td colspan="2" style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;"></td>
                <td style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${currency}${formatNumber(activitySubtotal)}</td>
                <td style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${currency}${formatNumber(activitySubtotal * activity.vat / 100)}</td>
                <td style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${currency}${formatNumber(activityTotalWithVat)}</td>
              </tr>
            `;
            
            return rows;
          }).join('')}
        </tbody>
        <tfoot>
          <tr style="background-color: #f5f5f5; font-weight: bold;">
            <td colspan="4" style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${t.subtotal}:</td>
            <td style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${currency}${formatNumber(subtotal)}</td>
          </tr>
          <tr style="background-color: #f5f5f5; font-weight: bold;">
            <td colspan="4" style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${t.vatAmount}:</td>
            <td style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${currency}${formatNumber(vatAmount)}</td>
          </tr>
          ${calculateTotalActivityDiscounts() > 0 ? `
            <tr style="background-color: #fef3c7; font-weight: bold; color: #b45309;">
              <td colspan="4" style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${t.discount} ${t.activities}:</td>
              <td style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">-${currency}${formatNumber(calculateTotalActivityDiscounts())}</td>
            </tr>
          ` : ''}
          ${generalDiscount.enabled && generalDiscountAmount > 0 ? `
            <tr style="background-color: #fef3c7; font-weight: bold;">
              <td colspan="4" style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${t.beforeDiscount}:</td>
              <td style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${currency}${formatNumber(totalBeforeGeneralDiscount)}</td>
            </tr>
            <tr style="background-color: #fef3c7; font-weight: bold; color: #b45309;">
              <td colspan="4" style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${t.generalDiscount}:</td>
              <td style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">-${currency}${formatNumber(generalDiscountAmount)}</td>
            </tr>
          ` : ''}
          <tr style="background-color: #1a1a1a; color: white; font-weight: bold;">
            <td colspan="4" style="text-align: right; padding: 12px 10px; font-size: 16px; border: 1px solid #ddd;"></td>
            <td style="text-align: right; padding: 12px 10px; font-size: 16px; border: 1px solid #ddd;">${currency}${formatNumber(total)}</td>
          </tr>
        </tfoot>
      </table>
    `;
  };

  const copyTableToClipboard = async () => {
    try {
      const tableHTML = generateTableHTML();
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
        await navigator.clipboard.writeText(generateTableHTML());
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
  }) => {
    // Non caricare il budgetName dai template, solo dalle configurazioni personalizzate
    if (config.budgetName) setBudgetName(config.budgetName);
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
        ctaText={t.requestQuote}
        ctaHref="/requests"
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Subtitle */}
          <div className="text-center mb-8">
            <p className="text-xl">
              <AnimatedSubtitle text={t.subtitle} />
            </p>
          </div>

          {/* Settings Section */}
          <div className="mb-8">
            <SettingsSection
              budgetName={budgetName}
              setBudgetName={setBudgetName}
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

          {/* Resources Section */}
          <Accordion type="multiple" defaultValue={["resources", "activities"]} className="mb-8">
            <AccordionItem value="resources">
              <div className="flex items-center justify-between gap-4 mb-4">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline flex-1">
                  <div className="flex items-center gap-2">
                    <Boxes className="h-5 w-5 text-gray-500" />
                    {t.resources}
                  </div>
                </AccordionTrigger>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    addResource();
                  }} 
                  className="!w-fit shrink-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t.addResource}
                </Button>
              </div>
              
              <AccordionContent>
                <div className="space-y-3">
                  {resources.map((resource, index) => (
                <Card key={resource.id}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-12 gap-3 items-end">
                      {/* Nome e Tipo sulla stessa riga */}
                      <div className="col-span-5">
                        <Label className="text-gray-500">{t.resourceName}</Label>
                        <Input
                          value={resource.name}
                          onChange={(e) => updateResource(resource.id, 'name', e.target.value)}
                          placeholder={t.resourceName}
                          className="font-bold"
                        />
                      </div>

                      <div className="col-span-2">
                        <Label className="text-gray-500">{t.costType}</Label>
                        <Select
                          value={resource.costType}
                          onValueChange={(value) => updateResource(resource.id, 'costType', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">{t.hourly}</SelectItem>
                            <SelectItem value="quantity">{t.quantity}</SelectItem>
                            <SelectItem value="fixed">{t.fixed}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Prezzo */}
                      {resource.costType === 'hourly' ? (
                        <div className="col-span-3">
                          <Label className="text-gray-500">{t.pricePerHour} ({currency})</Label>
                          <NumberInput
                            value={resource.pricePerHour}
                            onChange={(value) => updateResource(resource.id, 'pricePerHour', value)}
                            placeholder="0"
                            min={0}
                          />
                        </div>
                      ) : resource.costType === 'quantity' ? (
                        <div className="col-span-3">
                          <Label className="text-gray-500">{t.pricePerUnit} ({currency})</Label>
                          <NumberInput
                            value={resource.pricePerHour}
                            onChange={(value) => updateResource(resource.id, 'pricePerHour', value)}
                            placeholder="0"
                            min={0}
                          />
                        </div>
                      ) : (
                        <div className="col-span-3">
                          <Label className="text-gray-500 italic">{t.priceEnteredInActivity}</Label>
                          <div className="h-9 flex items-center text-sm text-gray-500 italic">
                            {t.priceWillBeSpecified}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="col-span-2 flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveResourceUp(index)}
                          disabled={index === 0}
                          className="px-2"
                          title="Sposta su"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveResourceDown(index)}
                          disabled={index === resources.length - 1}
                          className="px-2"
                          title="Sposta giù"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteResource(resource.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
                          title="Elimina"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

                  {resources.length === 0 && (
                    <Card>
                      <CardContent className="pt-6 text-center text-gray-500">
                        <p>{t.createResourcesFirst}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Activities Section */}
            <AccordionItem value="activities">
              <div className="flex items-center justify-between gap-4 mb-4">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline flex-1">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-gray-500" />
                    {t.activities}
                  </div>
                </AccordionTrigger>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    addActivity();
                  }} 
                  disabled={resources.length === 0} 
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t.addActivity}
                </Button>
              </div>

              <AccordionContent>
                <div className="space-y-4">
                  {activities.map((activity, activityIndex) => {
                    const isExpanded = expandedActivities.has(activity.id);
                    return (
                <Card key={activity.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center gap-2 flex-1 cursor-pointer"
                        onClick={() => {
                          const newExpanded = new Set(expandedActivities);
                          if (isExpanded) {
                            newExpanded.delete(activity.id);
                          } else {
                            newExpanded.add(activity.id);
                          }
                          setExpandedActivities(newExpanded);
                        }}
                      >
                        <ChevronDown 
                          className={`h-5 w-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                        <CardTitle className="text-xl">
                          {activity.name || `${t.activityName} ${activityIndex + 1}`}
                        </CardTitle>
                        {!isExpanded && (
                          <span className="text-lg font-bold ml-auto">
                            {currency}{formatNumber(calculateActivityTotalWithVat(activity))}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveActivityUp(activityIndex);
                          }}
                          disabled={activityIndex === 0}
                          className="px-2"
                          title="Sposta su"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveActivityDown(activityIndex);
                          }}
                          disabled={activityIndex === activities.length - 1}
                          className="px-2"
                          title="Sposta giù"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteActivity(activity.id);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
                          title="Elimina"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                  <CardContent className="space-y-4">
                    {/* Nome Attività */}
                    <div>
                      <Label className="text-gray-500">{t.activityName}</Label>
                      <Input
                        value={activity.name}
                        onChange={(e) => updateActivity(activity.id, 'name', e.target.value)}
                        placeholder={t.activityName}
                      />
                    </div>

                    {/* Descrizione */}
                    <div>
                      <Label className="text-gray-500">{t.activityDescription}</Label>
                      <Textarea
                        value={activity.description}
                        onChange={(e) => updateActivity(activity.id, 'description', e.target.value)}
                        placeholder={t.activityDescription}
                        rows={2}
                      />
                    </div>

                    {/* Date Attività */}
                    <div>
                      <Label className="text-gray-500">Periodo Attività</Label>
                      <div className="max-w-md">
                        <DateRangePicker
                          value={{
                            from: activity.startDate ? new Date(activity.startDate) : undefined,
                            to: activity.endDate ? new Date(activity.endDate) : undefined,
                          }}
                          onChange={(range) => {
                            if (range.from) {
                              updateActivity(activity.id, 'startDate', formatDateToLocal(range.from));
                            }
                            if (range.to) {
                              updateActivity(activity.id, 'endDate', formatDateToLocal(range.to));
                            }
                          }}
                          placeholder="Seleziona periodo attività"
                        />
                      </div>
                    </div>

                    {/* Risorse Assegnate */}
                    <div>
                      <Label className="text-base font-semibold">{t.assignResources}</Label>
                      <div className="space-y-3 mt-3">
                        {activity.resources.map((assignment, index) => {
                          const resource = resources.find(r => r.id === assignment.resourceId);
                          return (
                            <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 bg-gray-50 rounded-lg">
                              <div className="col-span-5">
                                <Label className="text-xs text-gray-500">{t.selectResource}</Label>
                                <Select
                                  value={assignment.resourceId}
                                  onValueChange={(value) => updateActivityResource(activity.id, index, 'resourceId', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={t.selectResource} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {resources.map(r => (
                                      <SelectItem key={r.id} value={r.id}>
                                        {r.name} ({r.costType === 'hourly' ? `${currency}${r.pricePerHour}/h` : r.costType === 'quantity' ? `${currency}${r.pricePerHour}/u` : t.fixed})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {resource && resource.costType === 'hourly' ? (
                                <div className="col-span-2">
                                  <Label className="text-xs text-gray-500">{t.hours}</Label>
                                  <NumberInput
                                    value={assignment.hours}
                                    onChange={(value) => updateActivityResource(activity.id, index, 'hours', value)}
                                    placeholder="0"
                                    min={0}
                                  />
                                </div>
                              ) : resource && resource.costType === 'quantity' ? (
                                <div className="col-span-2">
                                  <Label className="text-xs text-gray-500">{t.quantity}</Label>
                                  <NumberInput
                                    value={assignment.hours}
                                    onChange={(value) => updateActivityResource(activity.id, index, 'hours', value)}
                                    placeholder="0"
                                    min={0}
                                  />
                                </div>
                              ) : resource && resource.costType === 'fixed' ? (
                                <div className="col-span-2">
                                  <Label className="text-xs text-gray-500">{t.fixedPrice} ({currency})</Label>
                                  <NumberInput
                                    value={assignment.fixedPrice}
                                    onChange={(value) => updateActivityResource(activity.id, index, 'fixedPrice', value)}
                                    placeholder="0"
                                    min={0}
                                  />
                                </div>
                              ) : (
                                <div className="col-span-2"></div>
                              )}

                              <div className="col-span-3 text-right">
                                <Label className="text-xs text-gray-500">{t.subtotal}</Label>
                                <div className="text-lg font-bold">
                                  {currency}{formatNumber(calculateResourceCost(assignment.resourceId, assignment.hours, assignment.fixedPrice))}
                                </div>
                              </div>

                              <div className="col-span-2 flex justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeResourceFromActivity(activity.id, index)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}

                        <Button
                          onClick={() => addResourceToActivity(activity.id)}
                          variant="outline"
                          size="sm"
                          className="w-fit"
                          disabled={resources.length === 0}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {t.addResourceToActivity}
                        </Button>
                      </div>
                    </div>

                    {/* IVA Attività */}
                    <div className="pt-3 border-t">
                      <Label className="text-gray-500">{t.vatRate}</Label>
                      <div className="max-w-24">
                        <NumberInput
                          value={activity.vat}
                          onChange={(value) => updateActivity(activity.id, 'vat', value)}
                          placeholder="22"
                          min={0}
                          max={100}
                        />
                      </div>
                    </div>

                    {/* Sconto Attività */}
                    <div className="pt-3 border-t">
                      <div className="flex items-center gap-2 mb-3">
                        <Switch
                          checked={activity.discount?.enabled || false}
                          onCheckedChange={(checked) => {
                            const newDiscount: ActivityDiscount = activity.discount || {
                              enabled: false,
                              type: 'percentage',
                              value: 0,
                              applyOn: 'taxable'
                            };
                            updateActivity(activity.id, 'discount', {
                              ...newDiscount,
                              enabled: checked
                            });
                          }}
                        />
                        <Label className="text-base font-semibold">{t.activityDiscount}</Label>
                      </div>
                      
                      {activity.discount?.enabled && (
                        <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs text-gray-500">{t.discountType}</Label>
                              <Select
                                value={activity.discount?.type || 'percentage'}
                                onValueChange={(value: 'percentage' | 'fixed') => {
                                  const newDiscount = activity.discount || {
                                    enabled: true,
                                    type: 'percentage',
                                    value: 0,
                                    applyOn: 'taxable'
                                  };
                                  updateActivity(activity.id, 'discount', {
                                    ...newDiscount,
                                    type: value
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="percentage">{t.percentage}</SelectItem>
                                  <SelectItem value="fixed">{t.fixedAmount}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label className="text-xs text-gray-500">
                                {activity.discount?.type === 'percentage' ? t.percentage : `${t.fixedAmount} (${currency})`}
                              </Label>
                              <NumberInput
                                value={activity.discount?.value || 0}
                                onChange={(value) => {
                                  const newDiscount = activity.discount || {
                                    enabled: true,
                                    type: 'percentage',
                                    value: 0,
                                    applyOn: 'taxable'
                                  };
                                  updateActivity(activity.id, 'discount', {
                                    ...newDiscount,
                                    value
                                  });
                                }}
                                placeholder="0"
                                min={0}
                              />
                            </div>

                            <div>
                              <Label className="text-xs text-gray-500">{t.applyDiscountOn}</Label>
                              <Select
                                value={activity.discount?.applyOn || 'taxable'}
                                onValueChange={(value: 'taxable' | 'withVat') => {
                                  const newDiscount = activity.discount || {
                                    enabled: true,
                                    type: 'percentage',
                                    value: 0,
                                    applyOn: 'taxable'
                                  };
                                  updateActivity(activity.id, 'discount', {
                                    ...newDiscount,
                                    applyOn: value
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="taxable">{t.taxableAmount}</SelectItem>
                                  <SelectItem value="withVat">{t.totalWithVatAmount}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {activity.discount.value > 0 && (
                            <div className="bg-amber-50 p-2 rounded text-xs text-amber-800">
                              {t.discountAmount}: {currency}{formatNumber(calculateActivityDiscountAmount(activity))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Totale Attività */}
                    <div className="pt-3 border-t space-y-2">
                      <div className="flex justify-end items-center gap-2 text-sm">
                        <span className="font-semibold">{t.subtotal}:</span>
                        <span className="font-bold">
                          {currency}{formatNumber(calculateActivityTotal(activity))}
                        </span>
                      </div>
                      {activity.discount?.enabled && activity.discount.value > 0 && (
                        <div className="flex justify-end items-center gap-2 text-sm text-amber-600">
                          <span>{t.discount}:</span>
                          <span>
                            -{currency}{formatNumber(calculateActivityDiscountAmount(activity))}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-end items-center gap-2 text-sm text-gray-600">
                        <span>{t.vat} ({activity.vat}%):</span>
                        <span>
                          {currency}{formatNumber(calculateActivityTotal(activity) * activity.vat / 100)}
                        </span>
                      </div>
                      <div className="flex justify-end items-center gap-2 pt-2 border-t">
                        <span className="font-semibold text-lg">{t.total}:</span>
                        <span className="text-2xl font-bold">
                          {currency}{formatNumber(calculateActivityTotalWithVat(activity))}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  )}
                </Card>
                );
              })}

                  {activities.length === 0 && resources.length > 0 && (
                    <Card>
                      <CardContent className="pt-6 text-center text-gray-500">
                        <p>{t.createFirstActivity}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* General Discount Section */}
          {activities.length > 0 && (
            <Card className="mb-6 border-2 border-amber-200 bg-amber-50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={generalDiscount.enabled}
                    onCheckedChange={(checked) => setGeneralDiscount({
                      ...generalDiscount,
                      enabled: checked
                    })}
                  />
                  <CardTitle className="text-lg font-semibold">{t.generalDiscount}</CardTitle>
                </div>
              </CardHeader>
              
              {generalDiscount.enabled && (
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-gray-500">{t.discountType}</Label>
                        <Select
                          value={generalDiscount.type}
                          onValueChange={(value: 'percentage' | 'fixed') => setGeneralDiscount({
                            ...generalDiscount,
                            type: value
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">{t.percentage}</SelectItem>
                            <SelectItem value="fixed">{t.fixedAmount}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-gray-500">
                          {generalDiscount.type === 'percentage' ? t.percentage : `${t.fixedAmount} (${currency})`}
                        </Label>
                        <NumberInput
                          value={generalDiscount.value}
                          onChange={(value) => setGeneralDiscount({
                            ...generalDiscount,
                            value
                          })}
                          placeholder="0"
                          min={0}
                        />
                      </div>

                      <div>
                        <Label className="text-gray-500">{t.applyDiscountOn}</Label>
                        <Select
                          value={generalDiscount.applyOn}
                          onValueChange={(value: 'taxable' | 'withVat') => setGeneralDiscount({
                            ...generalDiscount,
                            applyOn: value
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="taxable">{t.taxableAmount}</SelectItem>
                            <SelectItem value="withVat">{t.totalWithVatAmount}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {generalDiscount.value > 0 && (
                      <div className="bg-white p-4 rounded-lg border-2 border-amber-300">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t.beforeDiscount}:</span>
                            <span className="font-semibold">{currency}{formatNumber(calculateGrandTotalBeforeGeneralDiscount())}</span>
                          </div>
                          <div className="flex justify-between text-amber-700">
                            <span>{t.discountAmount}:</span>
                            <span className="font-semibold">-{currency}{formatNumber(calculateGeneralDiscountAmount())}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-amber-200">
                            <span className="font-semibold">{t.afterDiscount}:</span>
                            <span className="text-lg font-bold text-green-700">{currency}{formatNumber(calculateGrandTotal())}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Total */}
          {activities.length > 0 && (
            <div ref={finalTotalRef}>
              {/* Summary Table Preview */}
              <Card className="bg-white border-2 border-gray-200 mb-8">
                <CardHeader className="border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">
                      {t.summaryTable}
                    </CardTitle>
                    <Button 
                      onClick={copyTableToClipboard} 
                      variant={tableCopied ? "default" : "default"} 
                      size="sm"
                      className={`transition-all ${tableCopied ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      disabled={tableCopied}
                    >
                      {tableCopied ? (
                        <Check className="h-4 w-4 text-white" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 overflow-x-auto">
                  <div 
                    className="text-xs"
                    dangerouslySetInnerHTML={{ __html: generateTableHTML() }}
                  />
                </CardContent>
              </Card>

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

              <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white mb-8">
                <CardContent className="pt-8 pb-8">
                  <div className="text-center">
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-center items-center gap-4 text-sm opacity-80 flex-wrap">
                        <span>{t.subtotal}: {currency}{formatNumber(calculateGrandSubtotal())}</span>
                        <span>•</span>
                        <span>{t.vatAmount}: {currency}{formatNumber(calculateGrandVat())}</span>
                        {calculateTotalActivityDiscounts() > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-amber-300">{t.discount} {t.activities}: -{currency}{formatNumber(calculateTotalActivityDiscounts())}</span>
                          </>
                        )}
                        {generalDiscount.enabled && generalDiscount.value > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-amber-300">{t.generalDiscount}: -{currency}{formatNumber(calculateGeneralDiscountAmount())}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-medium mb-2 opacity-90">{t.finalTotal}</p>
                    <p className="text-6xl font-bold">
                      {currency}{formatNumber(calculateGrandTotal())}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* PDF Export Configuration */}
              <PDFExportConfig
                pdfConfig={pdfConfig}
                setPdfConfig={setPdfConfig}
                logoPreview={logoPreview}
                setLogoPreview={setLogoPreview}
              />

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center items-center mb-8">
                {/* Esporta con Select */}
                <Select onValueChange={(value) => {
                  if (value === 'pdf') {
                    exportToPDF();
                  } else if (value === 'docx') {
                    exportToDOCX();
                  }
                }}>
                  <SelectTrigger className="group h-11 overflow-hidden transition-all duration-300 w-11 hover:w-[140px] hover:gap-2 justify-center hover:justify-start bg-white border border-input hover:bg-accent hover:text-accent-foreground">
                    <FileDown className="h-5 w-5 flex-shrink-0" />
                    <span className="whitespace-nowrap opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto transition-all duration-300">
                      Esporta
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="docx">DOCX</SelectItem>
                  </SelectContent>
                </Select>

                {/* Salva config */}
                <Button 
                  onClick={exportToJSON} 
                  variant="outline"
                  className="group h-11 overflow-hidden transition-all duration-300 w-11 hover:w-[160px] hover:gap-2 justify-center hover:justify-start"
                >
                  <Download className="h-5 w-5 flex-shrink-0" />
                  <span className="whitespace-nowrap opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto transition-all duration-300">
                    Salva config
                  </span>
                </Button>

                {/* Copia config */}
                <Button 
                  onClick={copyToClipboard} 
                  variant={configCopied ? "default" : "outline"} 
                  className={`group h-11 overflow-hidden transition-all duration-300 hover: gap-2 justify-center hover:justify-start ${
                    configCopied 
                      ? 'bg-green-600 hover:bg-green-700 w-11' 
                      : 'w-11 hover:w-[160px]'
                  }`}
                  disabled={configCopied}
                >
                  {configCopied ? (
                    <Check className="h-5 w-5 text-white flex-shrink-0" />
                  ) : (
                    <Copy className="h-5 w-5 flex-shrink-0" />
                  )}
                  <span className={`whitespace-nowrap transition-all duration-300 ${
                    configCopied 
                      ? 'opacity-0 w-0' 
                      : 'opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto'
                  }`}>
                    Copia config
                  </span>
                </Button>

                {/* CTA principale - Pagina interattiva */}
                <Button 
                  onClick={createInteractivePage} 
                  size="lg" 
                  variant="default"
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Crea preventivo interattivo
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Total - visible only when there are activities and final total is not in view */}
      {activities.length > 0 && showFloatingTotal && (
        <div className="fixed bottom-6 right-6 z-40 animate-in slide-in-from-bottom-4 duration-300">
          <Card className="shadow-2xl border-2 border-gray-900 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <p className="text-2xl font-bold">
                  {currency}{formatNumber(calculateGrandTotal())}
                </p>
                <Button 
                  onClick={exportToPDF} 
                  size="sm" 
                  variant="ghost"
                  className="text-white hover:bg-gray-700 hover:text-white p-2"
                  title="Esporta PDF"
                >
                  <FileDown className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* JSON Configuration Dialog */}
      <Dialog open={jsonDialogOpen} onOpenChange={setJsonDialogOpen}>
        <DialogContent className="min-w-[60vw] h-[100vh] max-h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t.loadCustomConfiguration}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              <Label>{t.pasteYourJSON}</Label>
              <Textarea
                placeholder='{"currency": "€", "resources": [...], "activities": [...]}'
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  setJsonError('');
                }}
                className="font-mono text-xs mt-2 flex-1 resize-none"
              />
              {jsonError && (
                <p className="text-sm text-red-600 mt-2">{jsonError}</p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button onClick={handleLoadJson} className="w-fit">
                {t.load}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setJsonDialogOpen(false);
                  setJsonInput('');
                  setJsonError('');
                }}
              >
                {t.cancel}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
        calculateResourceCost={calculateResourceCost}
        calculateActivityTotal={calculateActivityTotal}
        calculateActivityDiscountAmount={calculateActivityDiscountAmount}
        calculateActivityTotalWithVat={calculateActivityTotalWithVat}
        calculateGrandSubtotal={calculateGrandSubtotal}
        calculateGrandVat={calculateGrandVat}
        calculateGrandTotalBeforeGeneralDiscount={calculateGrandTotalBeforeGeneralDiscount}
        calculateGeneralDiscountAmount={calculateGeneralDiscountAmount}
        calculateGrandTotal={calculateGrandTotal}
        calculateTotalActivityDiscounts={calculateTotalActivityDiscounts}
        generateGanttHTML={generateGanttHTML}
      />
    </div>
  );
}
