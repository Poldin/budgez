'use client'

import { useEffect } from 'react'
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

export interface QuoteItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  discount: number
  tax: number
  subtotal: number
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

export default function QuoteTableBlock({ 
  data, 
  onChange,
  readOnly = false
}: QuoteTableBlockProps) {
  const calculateSubtotal = (item: QuoteItem): number => {
    const baseAmount = item.quantity * item.unitPrice;
    const discountAmount = baseAmount * (item.discount / 100);
    return baseAmount - discountAmount;
  };

  const calculateTotal = (): number => {
    return data.items.reduce((total, item) => {
      let itemTotal = calculateSubtotal(item);
      
      if (!data.taxIncluded) {
        const taxAmount = itemTotal * (item.tax / 100);
        itemTotal += taxAmount;
      }
      
      return total + itemTotal;
    }, 0);
  };

  const handleAddItem = () => {
    const newItem: QuoteItem = {
      id: Math.random().toString(36).substring(2, 9),
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      tax: 22, // Default IVA in Italia
      subtotal: 0
    };
    
    onChange({
      ...data,
      items: [...data.items, newItem]
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
                  "hover:bg-gray-50 transition-colors"
                )}
              >
                <TableCell className="align-top">
                  {readOnly ? (
                    <div 
                      className="whitespace-pre-wrap break-words quote-description"
                      dangerouslySetInnerHTML={{ __html: item.description }}
                    />
                  ) : (
                    <textarea
                      value={stripLinkMarkup(item.description)}
                      onChange={(e) => {
                        handleDescriptionChange(item.id, e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      onClick={(e) => e.stopPropagation()} // Impedisce l'attivazione dell'onClick della riga
                      onFocus={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      onBlur={(e) => {
                        // Apply URL transformation on blur
                        const transformedValue = transformUrlsToLinks(e.target.value);
                        updateItem(item.id, { description: transformedValue });
                      }}
                      className="w-full min-h-[40px] border-0 focus:ring-1 p-1 resize-y overflow-hidden"
                      placeholder="Descrizione prodotto o servizio"
                      rows={1}
                    />
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
      <div className="p-4 bg-gray-50 border-t border-gray-200">
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
          
          <div className="flex justify-between text-lg">
            <span className="font-semibold">Totale:</span>
            <span className="font-bold">{formatCurrency(calculateTotal())}</span>
          </div>
        </div>
      </div>
      
      {/* Add Item Button */}
      {!readOnly && (
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleAddItem}
            className="flex items-center gap-1 text-gray-700"
          >
            <Plus className="h-4 w-4" />
            Aggiungi voce
          </Button>
        </div>
      )}
    </div>
  )
} 