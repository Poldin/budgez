'use client'

import { useEffect, useState } from 'react'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from 'lucide-react'
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Checkbox,
} from "@/components/ui/checkbox"
import {
  Label
} from "@/components/ui/label"

export interface QuoteItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  discount: number
  tax: number
  subtotal: number
  isSubscription?: boolean
  subscriptionDetails?: {
    billingCycle: 'monthly' | 'quarterly' | 'yearly' | 'custom'
    customBillingCycle?: {
      value: number
      unit: 'hour' | 'day' | 'week' | 'month' | 'year'
    }
    startDate?: string
    endDate?: string
    autoRenew: boolean
  }
}

export interface QuoteTableData {
  items: QuoteItem[]
  currency: string
  taxIncluded: boolean
}

interface QuoteTableBlockProps {
  data: QuoteTableData
  onChange: (data: QuoteTableData) => void
  readOnly?: boolean
}

// Function to convert URLs in text to clickable links
const transformUrlsToLinks = (content: string): string => {
  // URL regex pattern - captures URLs precisely
  const urlPattern = /\b(?:https?:\/\/|www\.)[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/gi;
  
  // Replace URLs with HTML anchor tags
  return content.replace(urlPattern, (url) => {
    const href = url.startsWith('http') ? url : `https://${url}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800">${url}</a>`;
  });
};

const SubscriptionDialog = ({ 
  open, 
  onOpenChange, 
  onSave,
  initialData
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (details: NonNullable<QuoteItem['subscriptionDetails']>) => void
  initialData?: QuoteItem['subscriptionDetails']
}) => {
  const [billingCycle, setBillingCycle] = useState<NonNullable<QuoteItem['subscriptionDetails']>['billingCycle']>(
    initialData?.billingCycle || 'monthly'
  )
  const [customValue, setCustomValue] = useState<number>(
    (initialData && initialData.customBillingCycle) ? initialData.customBillingCycle.value || 1 : 1
  )
  // Define the unit type explicitly based on the QuoteItem interface
  type UnitType = 'hour' | 'day' | 'week' | 'month' | 'year';
  const [customUnit, setCustomUnit] = useState<UnitType>(
    (initialData && initialData.customBillingCycle) ? initialData.customBillingCycle.unit || 'month' : 'month'
  )
  const [startDate, setStartDate] = useState<string>(
    initialData?.startDate || new Date().toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState<string>(
    initialData?.endDate || ''
  )
  const [autoRenew, setAutoRenew] = useState(
    initialData?.autoRenew !== undefined ? initialData.autoRenew : true
  )

  const handleSave = () => {
    onSave({
      billingCycle,
      customBillingCycle: billingCycle === 'custom' ? {
        value: customValue,
        unit: customUnit
      } : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      autoRenew
    })
    onOpenChange(false)
  }

  const cycleLabels = {
    monthly: 'Mensile',
    quarterly: 'Trimestrale',
    yearly: 'Annuale',
    custom: 'Personalizzato'
  }

  const unitLabels = {
    hour: 'Ore',
    day: 'Giorni',
    week: 'Settimane',
    month: 'Mesi',
    year: 'Anni'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            Configura Abbonamento
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 p-1">
          <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
            <Label className="text-blue-700 mb-2 block font-medium">Ciclo di fatturazione</Label>
            <Select
              value={billingCycle}
              onValueChange={(value) => setBillingCycle(value as NonNullable<QuoteItem['subscriptionDetails']>['billingCycle'])}
            >
              <SelectTrigger className="bg-white border-blue-200 focus:ring-blue-500">
                <SelectValue placeholder="Seleziona ciclo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(cycleLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {billingCycle === 'custom' && (
            <div className="space-y-3 p-3 border border-blue-100 rounded-md">
              <Label className="font-medium">Specificare frequenza</Label>
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap">Ogni</span>
                <Input 
                  type="number" 
                  min="1" 
                  value={customValue}
                  onChange={(e) => setCustomValue(parseInt(e.target.value) || 1)}
                  className="w-20 border-gray-300 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" 
                />
                <Select
                  value={customUnit}
                  onValueChange={(value) => setCustomUnit(value as UnitType)}
                >
                  <SelectTrigger className="flex-1 border-gray-300 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                    <SelectValue placeholder="Unità" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(unitLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label>Data di inizio</Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setStartDate('')}
                  className="h-6 text-xs text-gray-500"
                >
                  Non specificare
                </Button>
              </div>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-gray-300 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label>Data di fine</Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setEndDate('')}
                  className="h-6 text-xs text-gray-500"
                >
                  Non specificare
                </Button>
              </div>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-gray-300 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-md bg-gray-50">
            <Checkbox
              id="autoRenew"
              checked={autoRenew}
              onCheckedChange={(checked) => setAutoRenew(checked as boolean)}
              className={autoRenew ? "text-green-600 border-green-400" : ""}
            />
            <Label htmlFor="autoRenew" className={`font-medium ${autoRenew ? "text-green-700" : "text-gray-700"}`}>
              Rinnovo automatico
            </Label>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-300">
            Annulla
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            Salva
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function QuoteTableBlock({ 
  data, 
  onChange,
  readOnly = false
}: QuoteTableBlockProps) {
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  const calculateSubtotal = (item: QuoteItem): number => {
    const baseAmount = item.quantity * item.unitPrice;
    const discountAmount = baseAmount * (item.discount / 100);
    return baseAmount - discountAmount;
  };

  const calculateTotal = (): { oneTime: number, subscription: number } => {
    return data.items.reduce((totals, item) => {
      let itemTotal = calculateSubtotal(item);
      
      if (!data.taxIncluded) {
        const taxAmount = itemTotal * (item.tax / 100);
        itemTotal += taxAmount;
      }
      
      if (item.isSubscription) {
        totals.subscription += itemTotal;
      } else {
        totals.oneTime += itemTotal;
      }
      
      return totals;
    }, { oneTime: 0, subscription: 0 });
  };

  const handleAddItem = (isSubscription: boolean = false) => {
    const newItem: QuoteItem = {
      id: Math.random().toString(36).substring(2, 9),
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      tax: 22,
      subtotal: 0,
      isSubscription
    };
    
    if (isSubscription) {
      setSelectedItemId(newItem.id);
      setSubscriptionDialogOpen(true);
    }
    
    onChange({
      ...data,
      items: [...data.items, newItem]
    });
  };

  const handleEditSubscription = (itemId: string) => {
    setSelectedItemId(itemId);
    setSubscriptionDialogOpen(true);
  };

  const handleSubscriptionSave = (details: NonNullable<QuoteItem['subscriptionDetails']>) => {
    if (!selectedItemId) return;
    
    onChange({
      ...data,
      items: data.items.map(item => {
        if (item.id === selectedItemId) {
          return {
            ...item,
            subscriptionDetails: details
          };
        }
        return item;
      })
    });
  };

  const handleRemoveItem = (id: string) => {
    onChange({
      ...data,
      items: data.items.filter(item => item.id !== id)
    });
  };

  const updateItem = (id: string, updates: Partial<QuoteItem>) => {
    onChange({
      ...data,
      items: data.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, ...updates };
          updatedItem.subtotal = calculateSubtotal(updatedItem);
          return updatedItem;
        }
        return item;
      })
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: data.currency || 'EUR'
    }).format(amount);
  };

  const handleDescriptionChange = (id: string, value: string) => {
    // Apply URL transformation
    const transformedValue = transformUrlsToLinks(value);
    
    updateItem(id, { description: transformedValue });
  };

  const stripLinkMarkup = (htmlContent: string): string => {
    if (!htmlContent) return '';
    // Questo regex sostituisce i tag HTML con il loro testo, ma mantiene gli URL originali
    return htmlContent.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2')
                     .replace(/<[^>]*>/g, '');
  };

  // Specifica gestione dei link nella descrizione
  const attachLinkHandlers = () => {
    // Aggiungiamo questa funzione che verrà chiamata dopo il render
    setTimeout(() => {
      const links = document.querySelectorAll('.quote-description a');
      
      links.forEach(link => {
        link.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          
          const href = link.getAttribute('href');
          if (href) {
            window.open(href, '_blank', 'noopener,noreferrer');
          }
          
          return false;
        });
      });
    }, 0);
  };

  // Chiamiamo la funzione per aggiungere i gestori degli eventi dopo il render
  useEffect(() => {
    if (readOnly) {
      attachLinkHandlers();
    }
  }, [data.items, readOnly]);

  const formatSubscriptionCycle = (item: QuoteItem): string => {
    if (!item.subscriptionDetails) return '';
    
    const { billingCycle } = item.subscriptionDetails;
    
    switch (billingCycle) {
      case 'monthly': return 'Mensile';
      case 'quarterly': return 'Trimestrale';
      case 'yearly': return 'Annuale';
      case 'custom': 
        if (item.subscriptionDetails.customBillingCycle) {
          const { value, unit } = item.subscriptionDetails.customBillingCycle;
          let unitLabel = '';
          
          switch (unit) {
            case 'hour': unitLabel = value === 1 ? 'ora' : 'ore'; break;
            case 'day': unitLabel = value === 1 ? 'giorno' : 'giorni'; break;
            case 'week': unitLabel = value === 1 ? 'settimana' : 'settimane'; break;
            case 'month': unitLabel = value === 1 ? 'mese' : 'mesi'; break;
            case 'year': unitLabel = value === 1 ? 'anno' : 'anni'; break;
          }
          
          return `Ogni ${value} ${unitLabel}`;
        }
        return 'Personalizzato';
      default: return billingCycle;
    }
  };

  return (
    <div className="w-full my-4 rounded-md border border-gray-200 overflow-hidden">
      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="w-1/2">Descrizione</TableHead>
              <TableHead className="text-right">Quantità</TableHead>
              <TableHead className="text-right">Prezzo unitario</TableHead>
              <TableHead className="text-right">Sconto %</TableHead>
              <TableHead className="text-right">IVA %</TableHead>
              <TableHead className="text-right">Subtotale</TableHead>
              {!readOnly && <TableHead className="w-10"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((item) => (
              <TableRow 
                key={item.id} 
                className={cn(
                  "hover:bg-gray-50 transition-colors",
                  item.isSubscription && "bg-blue-50"
                )}
              >
                <TableCell className="align-top">
                  {readOnly ? (
                    <div 
                      className="whitespace-pre-wrap break-words quote-description"
                      dangerouslySetInnerHTML={{ __html: item.description }}
                    />
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        value={stripLinkMarkup(item.description)}
                        onChange={(e) => {
                          handleDescriptionChange(item.id, e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onBlur={(e) => {
                          const transformedValue = transformUrlsToLinks(e.target.value);
                          updateItem(item.id, { description: transformedValue });
                        }}
                        className="w-full min-h-[40px] border-0 focus:ring-1 p-1 resize-y overflow-hidden"
                        placeholder="Descrizione prodotto o servizio"
                        rows={1}
                      />
                      {item.isSubscription && item.subscriptionDetails && (
                        <div className="mt-2 border border-blue-200 rounded-md overflow-hidden">
                          <div className="bg-blue-50 px-3 py-2 flex items-center justify-between border-b border-blue-200">
                            <span className="font-medium text-blue-700 flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                              </svg>
                              Abbonamento {formatSubscriptionCycle(item)}
                            </span>
                            {!readOnly && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditSubscription(item.id)}
                                className="h-7 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-0 px-2"
                              >
                                Modifica
                              </Button>
                            )}
                          </div>
                          <div className="px-3 py-2 bg-white">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                              {item.subscriptionDetails.startDate && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">Inizio:</span> 
                                  <span className="font-medium">{new Date(item.subscriptionDetails.startDate).toLocaleDateString()}</span>
                                </div>
                              )}
                              {item.subscriptionDetails.endDate && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">Fine:</span> 
                                  <span className="font-medium">{new Date(item.subscriptionDetails.endDate).toLocaleDateString()}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 col-span-2 mt-1">
                                <span className={`w-2 h-2 rounded-full ${item.subscriptionDetails.autoRenew ? "bg-green-500" : "bg-red-500"}`}></span>
                                <span className={`${item.subscriptionDetails.autoRenew ? "text-green-700" : "text-red-700"} font-medium`}>
                                  {item.subscriptionDetails.autoRenew ? "Rinnovo automatico" : "Senza rinnovo automatico"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {readOnly ? (
                    <p>{item.quantity}</p>
                  ) : (
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                      className="border-0 focus:ring-1 p-1 w-20 text-right ml-auto"
                      min="0"
                      step="1"
                    />
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {readOnly ? (
                    <p>{formatCurrency(item.unitPrice)}</p>
                  ) : (
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                      className="border-0 focus:ring-1 p-1 w-28 text-right ml-auto"
                      min="0"
                      step="0.01"
                    />
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {readOnly ? (
                    <p>{item.discount}%</p>
                  ) : (
                    <Input
                      type="number"
                      value={item.discount}
                      onChange={(e) => updateItem(item.id, { discount: parseFloat(e.target.value) || 0 })}
                      className="border-0 focus:ring-1 p-1 w-20 text-right ml-auto"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {readOnly ? (
                    <p>{item.tax}%</p>
                  ) : (
                    <Input
                      type="number"
                      value={item.tax}
                      onChange={(e) => updateItem(item.id, { tax: parseFloat(e.target.value) || 0 })}
                      className="border-0 focus:ring-1 p-1 w-20 text-right ml-auto"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(calculateSubtotal(item))}
                </TableCell>
                {!readOnly && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveItem(item.id);
                      }}
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Totals Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex flex-col gap-2 ml-auto w-72">
          <div className="flex justify-between">
            <span className="text-gray-600">Totale senza IVA:</span>
            <span className="font-medium">
              {formatCurrency(
                data.items.reduce((sum, item) => sum + calculateSubtotal(item), 0)
              )}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">IVA:</span>
            <span className="font-medium">
              {formatCurrency(
                data.items.reduce((sum, item) => {
                  const subtotal = calculateSubtotal(item);
                  return sum + (subtotal * (item.tax / 100));
                }, 0)
              )}
            </span>
          </div>

          <div className="border-t border-gray-200 pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Totale una tantum:</span>
              <span className="font-medium">{formatCurrency(calculateTotal().oneTime)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Totale abbonamenti:</span>
              <span className="font-medium">{formatCurrency(calculateTotal().subscription)}</span>
            </div>
          </div>
          
          <div className="flex justify-between text-lg border-t border-gray-200 pt-2">
            <span className="font-semibold">Totale:</span>
            <span className="font-bold">
              {formatCurrency(calculateTotal().oneTime + calculateTotal().subscription)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Add Item Buttons */}
      {!readOnly && (
        <div className="p-4 border-t border-gray-200 flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddItem(false)}
            className="flex items-center gap-1 text-gray-700"
          >
            <Plus className="h-4 w-4" />
            Aggiungi voce
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddItem(true)}
            className="flex items-center gap-1 text-blue-700 border-blue-300 hover:bg-blue-50"
          >
            <Plus className="h-4 w-4" />
            Aggiungi abbonamento
          </Button>
        </div>
      )}

      <SubscriptionDialog
        open={subscriptionDialogOpen}
        onOpenChange={setSubscriptionDialogOpen}
        onSave={handleSubscriptionSave}
        initialData={selectedItemId ? data.items.find(item => item.id === selectedItemId)?.subscriptionDetails : undefined}
      />
    </div>
  )
} 