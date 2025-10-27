'use client'

import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Download, FileDown, Library, FileJson, Copy, ArrowUp, ArrowDown, Check } from 'lucide-react';
import { translations, type Language } from '@/lib/translations';
import TemplatesSidebar from '@/components/templates-sidebar';
import CurrencySelector from '@/components/currency-selector';
import { budgetTemplates } from '@/lib/budget-templates';
import Footer from '@/components/footer/footer';

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
}

interface GeneralDiscount {
  enabled: boolean;
  type: 'percentage' | 'fixed';
  value: number;
  applyOn: 'taxable' | 'withVat'; // imponibile o totale ivato
}

export default function HomePage() {
  const [language, setLanguage] = useState<Language>('it');
  const [currency, setCurrency] = useState('€');
  const [defaultVat, setDefaultVat] = useState(22); // IVA default 22%
  const [resources, setResources] = useState<Resource[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [generalDiscount, setGeneralDiscount] = useState<GeneralDiscount>({
    enabled: false,
    type: 'percentage',
    value: 0,
    applyOn: 'taxable'
  });
  const [showFloatingTotal, setShowFloatingTotal] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [jsonDialogOpen, setJsonDialogOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [tableCopied, setTableCopied] = useState(false);
  const [randomTemplates, setRandomTemplates] = useState<typeof budgetTemplates>([]);
  const finalTotalRef = useRef<HTMLDivElement>(null);

  const t = translations[language];

  // Seleziona 7 template casuali all'avvio
  React.useEffect(() => {
    const shuffled = [...budgetTemplates].sort(() => 0.5 - Math.random());
    setRandomTemplates(shuffled.slice(0, 7));
  }, []);

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
  };

  const deleteActivity = (id: string) => {
    setActivities(activities.filter(a => a.id !== id));
  };

  const updateActivity = (id: string, field: keyof Activity, value: string | number | ResourceAssignment[] | ActivityDiscount | undefined) => {
    setActivities(activities.map(a => 
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

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const total = calculateGrandTotal();
      const subtotal = calculateGrandSubtotal();
      const vatAmount = calculateGrandVat();
      const totalBeforeGeneralDiscount = calculateGrandTotalBeforeGeneralDiscount();
      const generalDiscountAmount = calculateGeneralDiscountAmount();
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Budgez - Preventivo</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 30px;
              max-width: 1000px;
              margin: 0 auto;
              font-size: 12px;
            }
            h1 {
              color: #1a1a1a;
              border-bottom: 3px solid #1a1a1a;
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
          </style>
        </head>
        <body>
          <h1>Preventivo</h1>
          
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
                
                // Activity resources
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
                          ${activity.name}
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
                
                // Activity description (if exists)
                if (activity.description) {
                  rows += `
                    <tr>
                      <td colspan="2" class="activity-desc">${activity.description}</td>
                    </tr>
                  `;
                }
                
                // Activity total row
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
        </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const exportToJSON = () => {
    const config = {
      currency,
      defaultVat,
      resources,
      activities,
      generalDiscount,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    const config = {
      currency,
      defaultVat,
      resources,
      activities,
      generalDiscount,
      exportDate: new Date().toISOString(),
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      alert('Configurazione copiata negli appunti!');
    } catch {
      alert('Errore nella copia. Riprova.');
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
            <th style="background-color: #1a1a1a; color: white; padding: 8px 10px; text-align: center; font-weight: bold; border: 1px solid #ddd;">Dettagli</th>
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
              const detailText = resource.costType === 'hourly' 
                ? `${assignment.hours}h × ${currency}${formatNumber(resource.pricePerHour)}/h`
                : resource.costType === 'quantity'
                ? `${assignment.hours} × ${currency}${formatNumber(resource.pricePerHour)}/u`
                : `${currency}${formatNumber(assignment.fixedPrice)}`;
              
              rows += `
                <tr>
                  ${resIndex === 0 ? `
                    <td rowspan="${activity.resources.length + (activity.description ? 1 : 0)}" style="background-color: #f5f5f5; font-weight: bold; padding: 6px 10px; border: 1px solid #ddd;">
                      ${activity.name}
                    </td>
                  ` : ''}
                  <td style="padding: 6px 10px 6px 20px; border: 1px solid #ddd;">${resource.name}</td>
                  <td style="text-align: center; padding: 6px 10px; font-size: 10px; border: 1px solid #ddd;">${detailText}</td>
                  <td style="text-align: right; padding: 6px 10px; border: 1px solid #ddd;">${currency}${formatNumber(cost)}</td>
                  ${resIndex === 0 ? `
                    <td rowspan="${activity.resources.length + (activity.description ? 1 : 0)}" style="text-align: right; padding: 6px 10px; border: 1px solid #ddd; vertical-align: top;">
                      <div>${currency}${formatNumber(activitySubtotal * activity.vat / 100)}</div>
                      <div style="font-size: 10px;">(${activity.vat}%)</div>
                    </td>
                    <td rowspan="${activity.resources.length + (activity.description ? 1 : 0)}" style="text-align: right; font-weight: bold; padding: 6px 10px; border: 1px solid #ddd; vertical-align: top;">
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
                <td colspan="3" style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${t.total} ${activity.name}:</td>
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
            <td colspan="5" style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${t.subtotal}:</td>
            <td style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${currency}${formatNumber(subtotal)}</td>
          </tr>
          <tr style="background-color: #f5f5f5; font-weight: bold;">
            <td colspan="5" style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${t.vatAmount}:</td>
            <td style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${currency}${formatNumber(vatAmount)}</td>
          </tr>
          ${calculateTotalActivityDiscounts() > 0 ? `
            <tr style="background-color: #fef3c7; font-weight: bold; color: #b45309;">
              <td colspan="5" style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${t.discount} ${t.activities}:</td>
              <td style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">-${currency}${formatNumber(calculateTotalActivityDiscounts())}</td>
            </tr>
          ` : ''}
          ${generalDiscount.enabled && generalDiscountAmount > 0 ? `
            <tr style="background-color: #fef3c7; font-weight: bold;">
              <td colspan="5" style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${t.beforeDiscount}:</td>
              <td style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${currency}${formatNumber(totalBeforeGeneralDiscount)}</td>
            </tr>
            <tr style="background-color: #fef3c7; font-weight: bold; color: #b45309;">
              <td colspan="5" style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${t.generalDiscount}:</td>
              <td style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">-${currency}${formatNumber(generalDiscountAmount)}</td>
            </tr>
          ` : ''}
          <tr style="background-color: #1a1a1a; color: white; font-weight: bold;">
            <td colspan="5" style="text-align: right; padding: 12px 10px; font-size: 16px; border: 1px solid #ddd;">${t.finalTotal}:</td>
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
      setTimeout(() => setTableCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support ClipboardItem
      try {
        await navigator.clipboard.writeText(generateTableHTML());
        setTableCopied(true);
        setTimeout(() => setTableCopied(false), 2000);
      } catch (err2) {
        console.error('Errore nella copia:', err2);
      }
    }
  };

  const loadConfiguration = (config: {
    currency?: string;
    defaultVat?: number;
    resources?: unknown[];
    activities?: unknown[];
    generalDiscount?: unknown;
  }) => {
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
      {/* Templates Sidebar */}
      <TemplatesSidebar 
        language={language}
        onSelectTemplate={loadConfiguration}
        templates={budgetTemplates}
        isOpen={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold">B) Budgez</span>
            </div>
            
              <div className="flex items-center space-x-4">
              <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="it">🇮🇹 Italiano</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                  <SelectItem value="fr">🇫🇷 Français</SelectItem>
                  <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                  <SelectItem value="es">🇪🇸 Español</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => window.location.href = '/how-to'}>
                {t.howItWorks}
                </Button>
              </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Subtitle */}
          <div className="text-center mb-8">
            <p className="text-xl text-gray-600">
              {t.subtitle}
            </p>
          </div>

          {/* Settings Accordion */}
          <Accordion type="single" collapsible defaultValue="settings" className="mb-8">
            <AccordionItem value="settings">
              <AccordionTrigger className="text-lg font-semibold px-4">
                {t.settings}
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    {/* Load Configuration Buttons */}
                    <div className="border-b pb-4 mb-4">
                      <Label className="text-base font-semibold mb-2 block">
                        {t.startHere}
                      </Label>
                      <p className="text-sm text-gray-600 mb-3">
                        {t.templateIntro}
                      </p>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <Button 
                          onClick={() => setSidebarOpen(true)} 
                          variant="default"
                          className="w-full"
                        >
                          <Library className="h-4 w-4 mr-2" />
                          {t.viewAllTemplates}
                        </Button>
                        <Button 
                          onClick={() => setJsonDialogOpen(true)} 
                          variant="outline"
                          className="w-full"
                        >
                          <FileJson className="h-4 w-4 mr-2" />
                          {t.customConfiguration}
                        </Button>
                      </div>

                      {/* Template Preview Cards */}
                      {randomTemplates.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
                            {t.recommendedTemplates}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {randomTemplates.map((template) => (
                              <Card 
                                key={template.id}
                                className="cursor-pointer hover:shadow-md hover:border-gray-400 transition-all duration-200"
                                onClick={() => loadConfiguration(template.config)}
                              >
                                <CardHeader className="pb-2 pt-3 px-3">
                                  <CardTitle className="text-sm font-semibold leading-tight">
                                    {template.name}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="px-3 pb-3">
                                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                    {template.description}
                                  </p>
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {template.tags.slice(0, 2).map((tag) => (
                                      <span 
                                        key={tag}
                                        className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                    {template.tags.length > 2 && (
                                      <span className="text-xs text-gray-400 px-1">
                                        +{template.tags.length - 2}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {template.config.resources.length} {t.resourcesCount} · {template.config.activities.length} {t.activitiesCount}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Currency and VAT on same row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CurrencySelector
                        value={currency}
                        onChange={setCurrency}
                        label={t.currency}
                      />
                      
                      <div>
                        <Label htmlFor="defaultVat" className="text-base font-semibold mb-2 block">
                          {t.defaultVat}
                        </Label>
                        <NumberInput
                          id="defaultVat"
                          value={defaultVat}
                          onChange={setDefaultVat}
                          placeholder="22"
                          min={0}
                          max={100}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {t.defaultForNewActivities}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Resources Section */}
          <Accordion type="multiple" defaultValue={["resources", "activities"]} className="mb-8">
            <AccordionItem value="resources">
              <div className="flex items-center justify-between gap-4 mb-4">
                <AccordionTrigger className="text-3xl font-bold hover:no-underline flex-1">
                  {t.resources}
                </AccordionTrigger>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    addResource();
                  }} 
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t.addResource}
                </Button>
              </div>
              
              <AccordionContent>
                <div className="space-y-3">
                  {resources.map((resource, index) => (
                <Card key={resource.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">
                      {resource.name || `${t.resourceName} ${index + 1}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-12 gap-3 items-end">
                      {/* Nome e Tipo sulla stessa riga */}
                      <div className="col-span-5">
                        <Label>{t.resourceName}</Label>
                        <Input
                          value={resource.name}
                          onChange={(e) => updateResource(resource.id, 'name', e.target.value)}
                          placeholder={t.resourceName}
                        />
                      </div>

                      <div className="col-span-2">
                        <Label>{t.costType}</Label>
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
                          <Label>{t.pricePerHour} ({currency})</Label>
                          <NumberInput
                            value={resource.pricePerHour}
                            onChange={(value) => updateResource(resource.id, 'pricePerHour', value)}
                            placeholder="0"
                            min={0}
                          />
                        </div>
                      ) : resource.costType === 'quantity' ? (
                        <div className="col-span-3">
                          <Label>{t.pricePerUnit} ({currency})</Label>
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
                <AccordionTrigger className="text-3xl font-bold hover:no-underline flex-1">
                  {t.activities}
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
                  {activities.map((activity, activityIndex) => (
                <Card key={activity.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">
                        {activity.name || `${t.activityName} ${activityIndex + 1}`}
                      </CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveActivityUp(activityIndex)}
                          disabled={activityIndex === 0}
                          className="px-2"
                          title="Sposta su"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveActivityDown(activityIndex)}
                          disabled={activityIndex === activities.length - 1}
                          className="px-2"
                          title="Sposta giù"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteActivity(activity.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
                          title="Elimina"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Nome Attività */}
                    <div>
                      <Label>{t.activityName}</Label>
                      <Input
                        value={activity.name}
                        onChange={(e) => updateActivity(activity.id, 'name', e.target.value)}
                        placeholder={t.activityName}
                      />
                    </div>

                    {/* Descrizione */}
                    <div>
                      <Label>{t.activityDescription}</Label>
                      <Textarea
                        value={activity.description}
                        onChange={(e) => updateActivity(activity.id, 'description', e.target.value)}
                        placeholder={t.activityDescription}
                        rows={2}
                      />
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
                                <Label className="text-xs">{t.selectResource}</Label>
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
                                  <Label className="text-xs">{t.hours}</Label>
                                  <NumberInput
                                    value={assignment.hours}
                                    onChange={(value) => updateActivityResource(activity.id, index, 'hours', value)}
                                    placeholder="0"
                                    min={0}
                                  />
                                </div>
                              ) : resource && resource.costType === 'quantity' ? (
                                <div className="col-span-2">
                                  <Label className="text-xs">{t.quantity}</Label>
                                  <NumberInput
                                    value={assignment.hours}
                                    onChange={(value) => updateActivityResource(activity.id, index, 'hours', value)}
                                    placeholder="0"
                                    min={0}
                                  />
                                </div>
                              ) : resource && resource.costType === 'fixed' ? (
                                <div className="col-span-2">
                                  <Label className="text-xs">{t.fixedPrice} ({currency})</Label>
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
                                <Label className="text-xs">{t.subtotal}</Label>
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
                          className="w-full"
                          disabled={resources.length === 0}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {t.addResourceToActivity}
                        </Button>
                      </div>
                    </div>

                    {/* IVA Attività */}
                    <div className="pt-3 border-t">
                      <Label>{t.vatRate}</Label>
                      <NumberInput
                        value={activity.vat}
                        onChange={(value) => updateActivity(activity.id, 'vat', value)}
                        placeholder="22"
                        min={0}
                        max={100}
                      />
                    </div>

                    {/* Sconto Attività */}
                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-base font-semibold">{t.activityDiscount}</Label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={activity.discount?.enabled || false}
                            onChange={(e) => {
                              const newDiscount: ActivityDiscount = activity.discount || {
                                enabled: false,
                                type: 'percentage',
                                value: 0,
                                applyOn: 'taxable'
                              };
                              updateActivity(activity.id, 'discount', {
                                ...newDiscount,
                                enabled: e.target.checked
                              });
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-600">{t.discount}</span>
                        </label>
                      </div>
                      
                      {activity.discount?.enabled && (
                        <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">{t.discountType}</Label>
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
                              <Label className="text-xs">
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
                          </div>

                          <div>
                            <Label className="text-xs">{t.applyDiscountOn}</Label>
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
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold">{t.subtotal}:</span>
                        <span className="font-bold">
                          {currency}{formatNumber(calculateActivityTotal(activity))}
                        </span>
                      </div>
                      {activity.discount?.enabled && activity.discount.value > 0 && (
                        <div className="flex justify-between items-center text-sm text-amber-600">
                          <span>{t.discount}:</span>
                          <span>
                            -{currency}{formatNumber(calculateActivityDiscountAmount(activity))}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>{t.vat} ({activity.vat}%):</span>
                        <span>
                          {currency}{formatNumber(calculateActivityTotal(activity) * activity.vat / 100)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-semibold text-lg">{t.total}:</span>
                        <span className="text-2xl font-bold">
                          {currency}{formatNumber(calculateActivityTotalWithVat(activity))}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

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
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{t.generalDiscount}</CardTitle>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generalDiscount.enabled}
                      onChange={(e) => setGeneralDiscount({
                        ...generalDiscount,
                        enabled: e.target.checked
                      })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-600">{t.discount}</span>
                  </label>
                </div>
              </CardHeader>
              
              {generalDiscount.enabled && (
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>{t.discountType}</Label>
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
                        <Label>
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
                        <Label>{t.applyDiscountOn}</Label>
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

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-center items-center mb-8">
                <Button onClick={exportToPDF} size="lg" variant="default">
                  <FileDown className="h-5 w-5 mr-2" />
                  {t.exportPDF}
                </Button>
                <div className="flex gap-2 items-center">
                  <Button onClick={exportToJSON} size="lg" variant="outline">
                    <Download className="h-5 w-5 mr-2" />
                    {t.exportJSON}
                  </Button>
                  <Button onClick={copyToClipboard} size="lg" variant="outline" className="px-4">
                    <Copy className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Summary Table Preview */}
              <Card className="bg-white border-2 border-gray-200">
                <CardHeader className="border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">
                      {t.summaryTable}
                    </CardTitle>
                    <Button 
                      onClick={copyTableToClipboard} 
                      variant={tableCopied ? "outline" : "default"} 
                      size="sm"
                      disabled={tableCopied}
                    >
                      {tableCopied ? (
                        <>
                          <Check className="h-4 w-4 mr-2 text-green-600" />
                          <span className="text-green-600">{t.copied}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          {t.copy}
                        </>
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
            </div>
          )}
        </div>
      </main>

      {/* Floating Total - visible only when there are activities and final total is not in view */}
      {activities.length > 0 && showFloatingTotal && (
        <div className="fixed bottom-6 right-6 z-40 animate-in slide-in-from-bottom-4 duration-300">
          <Card className="shadow-2xl border-2 border-gray-900 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {currency}{formatNumber(calculateGrandTotal())}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* JSON Configuration Dialog */}
      <Dialog open={jsonDialogOpen} onOpenChange={setJsonDialogOpen}>
        <DialogContent className="min-w-[60vw]">
          <DialogHeader>
            <DialogTitle>{t.loadCustomConfiguration}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t.pasteYourJSON}</Label>
              <Textarea
                placeholder='{"currency": "€", "resources": [...], "activities": [...]}'
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  setJsonError('');
                }}
                rows={10}
                className="font-mono text-xs mt-2"
              />
              {jsonError && (
                <p className="text-sm text-red-600 mt-2">{jsonError}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleLoadJson} className="flex-1">
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
    </div>
  );
}
