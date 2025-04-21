'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Signature } from 'lucide-react'

type BlockAlignment = 'left' | 'center' | 'right'
type BlockType = 'text' | 'heading1' | 'heading2' | 'image' | 'video' | 'quote-table'

export interface Block {
  id: string
  type: BlockType
  content: string
  alignment: BlockAlignment
  metadata?: {
    url?: string
    width?: number
    height?: number
    alt?: string
    fileName?: string 
    storageKey?: string
    videoType?: 'youtube' | 'vimeo' | 'loom'
    quoteTable?: {
      items: Array<{
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
      }>
      currency: string
      taxIncluded: boolean
    }
  }
}

// Define a type for the snapshot data
export interface SnapshotData {
  bella?: {
    blocks: Block[];
  };
  [key: string]: unknown;
}

// Function to convert URLs in text to clickable links
const transformUrlsToLinks = (content: string): string => {
  if (!content) return '';
  
  // Se il contenuto contiene già tag anchor, non effettuare trasformazioni
  if (content.includes('<a href=')) {
    return content;
  }
  
  // Match URLs that start with http://, https://, or www.
  const urlRegex = /(https?:\/\/[^\s"'<>]+)|(www\.[^\s"'<>]+)/gi;
  
  return content.replace(urlRegex, (matched) => {
    const url = matched.startsWith('www.') ? `https://${matched}` : matched;
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-gray-700 underline hover:text-gray-900">${matched}</a>`;
  });
};

// Aggiungiamo questa funzione helper per formattare il ciclo di abbonamento
const formatSubscriptionCycle = (item: {
  subscriptionDetails?: {
    billingCycle: 'monthly' | 'quarterly' | 'yearly' | 'custom';
    customBillingCycle?: {
      value: number;
      unit: 'hour' | 'day' | 'week' | 'month' | 'year';
    };
  }
}): string => {
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

export default function BellaPreview({ 
  id, 
  hideSignature = false, 
  snapshotData = null 
}: { 
  id: string, 
  hideSignature?: boolean,
  snapshotData?: SnapshotData | null
}) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isApproved, setIsApproved] = useState(false)
  const [totalAmount, setTotalAmount] = useState<number | null>(null)
  const [currency, setCurrency] = useState<string>('EUR')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  

  useEffect(() => {
    const fetchContent = async () => {
      try {
        // If we have snapshot data, use it instead of fetching from database
        if (snapshotData) {
          if (snapshotData.bella?.blocks) {
            setBlocks(snapshotData.bella.blocks)
            // Find the quote table block and extract total amount
            const quoteTableBlock = snapshotData.bella.blocks.find((block: Block) => block.type === 'quote-table')
            if (quoteTableBlock?.metadata?.quoteTable) {
              const quoteTable = quoteTableBlock.metadata.quoteTable
              const subtotal = quoteTable.items.reduce((sum: number, item: { subtotal: number }) => sum + item.subtotal, 0)
              const taxAmount = quoteTable.items.reduce((sum: number, item: { subtotal: number; tax: number }) => {
                return sum + (item.subtotal * (item.tax / 100))
              }, 0)
              const total = subtotal + (quoteTable.taxIncluded ? 0 : taxAmount)
              setTotalAmount(total)
              setCurrency(quoteTable.currency || 'EUR')
            }
          } else {
            setBlocks([])
          }
          setLoading(false)
          return
        }
        
        // Otherwise fetch from database as usual
        // Check if URL has ?approved=true for demo purposes
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const approvedParam = urlParams.get('approved');
          setIsApproved(approvedParam === 'true');
        }

        const { data, error } = await supabase
          .from('budgets')
          .select('body')
          .eq('id', id)
          .single()

        if (error) throw error

        if (data?.body?.bella?.blocks) {
          setBlocks(data.body.bella.blocks)
          // Find the quote table block and extract total amount
          const quoteTableBlock = data.body.bella.blocks.find((block: Block) => block.type === 'quote-table')
          if (quoteTableBlock?.metadata?.quoteTable) {
            const quoteTable = quoteTableBlock.metadata.quoteTable
            const subtotal = quoteTable.items.reduce((sum: number, item: { subtotal: number }) => sum + item.subtotal, 0)
            const taxAmount = quoteTable.items.reduce((sum: number, item: { subtotal: number; tax: number }) => {
              return sum + (item.subtotal * (item.tax / 100))
            }, 0)
            const total = subtotal + (quoteTable.taxIncluded ? 0 : taxAmount)
            setTotalAmount(total)
            setCurrency(quoteTable.currency || 'EUR')
          }
        } else {
          setBlocks([])
        }
      } catch (error) {
        console.error('Error fetching content:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [id, snapshotData])

  const renderBlock = (block: Block) => {
    const getAlignmentClasses = (alignment: BlockAlignment) => {
      switch (alignment) {
        case 'left': return 'text-left';
        case 'center': return 'text-center';
        case 'right': return 'text-right';
        default: return 'text-left';
      }
    };

    const handleClick = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A') {
        e.preventDefault();
        const href = target.getAttribute('href');
        if (href) {  
          window.open(href, '_blank');
        }
      }
    };

    // Process content for text-based blocks
    const processedContent = 
      (block.type === 'text' || block.type === 'heading1' || block.type === 'heading2') ? 
      transformUrlsToLinks(block.content) : 
      block.content;
    
    switch (block.type) {
      case 'text':
        // If content is empty, render a line break
        if (!block.content.trim()) {
          return <div className="h-4" />;
        }
        return (
          <div 
            className={`text-sm text-gray-800 mb-4 ${getAlignmentClasses(block.alignment)}`}
            dangerouslySetInnerHTML={{ __html: processedContent }}
            onClick={handleClick}
          />
        );
      case 'heading1':
        return (
          <div 
            className={`text-3xl font-bold mb-4 ${getAlignmentClasses(block.alignment)}`}
            dangerouslySetInnerHTML={{ __html: processedContent }}
            onClick={handleClick}
          />
        );
      case 'heading2':
        return (
          <div 
            className={`text-2xl font-bold mb-4 ${getAlignmentClasses(block.alignment)}`}
            dangerouslySetInnerHTML={{ __html: processedContent }}
            onClick={handleClick}
          />
        );
      case 'image':
        return (
          <div className={`mb-6 ${getAlignmentClasses(block.alignment)}`}>
            {block.metadata?.url && (
              <>
                <img 
                  src={block.metadata.url} 
                  alt={block.metadata.alt || 'Image'} 
                  className="max-w-full h-auto rounded-lg"
                  style={{
                    maxWidth: '100%',
                    width: block.metadata.width ? `${block.metadata.width}px` : 'auto',
                    margin: block.alignment === 'center' ? '0 auto' : undefined
                  }}
                />
                {block.content && (
                  <div 
                    className={`text-sm text-gray-600 mt-2 ${getAlignmentClasses(block.alignment)}`}
                    dangerouslySetInnerHTML={{ __html: transformUrlsToLinks(block.content) }}
                    onClick={handleClick}
                  />
                )}
              </>
            )}
          </div>
        );
      case 'video':
        if (!block.metadata?.url) return null;
        
        const videoUrl = block.metadata.url;
        
        // YouTube embed
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
          const youtubeId = videoUrl.includes('youtu.be') 
            ? videoUrl.split('/').pop() 
            : new URLSearchParams(new URL(videoUrl).search).get('v');
          
          return (
            <div className={`mb-6 ${getAlignmentClasses(block.alignment)}`}>
              <div className="relative pb-[56.25%] h-0 overflow-hidden max-w-full">
                <iframe 
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Embedded YouTube video"
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  style={{
                    maxWidth: '100%',
                    margin: block.alignment === 'center' ? '0 auto' : undefined
                  }}
                />
              </div>
            </div>
          );
        }
        
        // Vimeo embed
        if (videoUrl.includes('vimeo.com')) {
          const vimeoId = videoUrl.split('/').pop();
          
          return (
            <div className={`mb-6 ${getAlignmentClasses(block.alignment)}`}>
              <div className="relative pb-[56.25%] h-0 overflow-hidden max-w-full">
                <iframe 
                  src={`https://player.vimeo.com/video/${vimeoId}`}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title="Embedded Vimeo video"
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  style={{
                    maxWidth: '100%',
                    margin: block.alignment === 'center' ? '0 auto' : undefined
                  }}
                />
              </div>
            </div>
          );
        }
        
        // Loom embed
        if (videoUrl.includes('loom.com')) {
          return (
            <div className={`mb-6 ${getAlignmentClasses(block.alignment)}`}>
              <div className="relative pb-[56.25%] h-0 overflow-hidden max-w-full">
                <iframe 
                  src={`${videoUrl.replace('/share/', '/embed/')}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Embedded Loom video"
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  style={{
                    maxWidth: '100%',
                    margin: block.alignment === 'center' ? '0 auto' : undefined
                  }}
                />
              </div>
            </div>
          );
        }
        
        // Generic video URL
        return (
          <div className={`mb-6 ${getAlignmentClasses(block.alignment)}`}>
            <video 
              controls
              src={videoUrl}
              className="max-w-full h-auto rounded-lg"
              style={{
                maxWidth: '100%',
                margin: block.alignment === 'center' ? '0 auto' : undefined
              }}
            />
          </div>
        );
        
      case 'quote-table':
        const quoteTable = block.metadata?.quoteTable;
        if (!quoteTable) return null;
        
        // Dividiamo gli elementi in abbonamenti e una tantum
        const oneTimeItems = quoteTable.items.filter(item => !item.isSubscription);
        const subscriptionItems = quoteTable.items.filter(item => item.isSubscription);
        
        // Calcoliamo i subtotali separatamente
        const oneTimeSubtotal = oneTimeItems.reduce((sum, item) => sum + item.subtotal, 0);
        const subscriptionSubtotal = subscriptionItems.reduce((sum, item) => sum + item.subtotal, 0);
        
        const oneTimeTaxAmount = oneTimeItems.reduce((sum, item) => {
          return sum + (item.subtotal * (item.tax / 100));
        }, 0);
        
        const subscriptionTaxAmount = subscriptionItems.reduce((sum, item) => {
          return sum + (item.subtotal * (item.tax / 100));
        }, 0);
        
        const oneTimeTotal = oneTimeSubtotal + (quoteTable.taxIncluded ? 0 : oneTimeTaxAmount);
        const subscriptionTotal = subscriptionSubtotal + (quoteTable.taxIncluded ? 0 : subscriptionTaxAmount);
        const totalAmount = oneTimeTotal + subscriptionTotal;
        
        // Format currency
        const formatCurrency = (amount: number) => {
          return new Intl.NumberFormat('it-IT', { 
            style: 'currency', 
            currency: quoteTable.currency || 'EUR' 
          }).format(amount);
        };
        
        return (
          <div className="mb-6">
            <div className="space-y-6">
              {/* Prima mostriamo gli elementi one-time */}
              {oneTimeItems.length > 0 && (
                <>
                  {oneTimeItems.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="font-medium mb-3">{item.description}</div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-800">
                          Quantità: {item.quantity}
                        </span>
                        {item.discount > 0 && (
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-800">
                            Sconto: {item.discount}%
                          </span>
                        )}
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-800">
                          Prezzo: {formatCurrency(item.unitPrice)}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-800">
                          IVA: {item.tax}%
                        </span>
                      </div>
                      
                      <div className="flex justify-end text-right">
                        <div className="font-semibold text-lg">
                          {item.discount > 0 ? (
                            <div className="flex flex-col items-end">
                              <div className="text-sm text-gray-500">
                                <span className="line-through">{formatCurrency(item.quantity * item.unitPrice)}</span>
                              </div>
                              <div className="text-green-600">
                                {formatCurrency(item.subtotal)} <span className="text-sm">(-{item.discount}%)</span>
                              </div>
                            </div>
                          ) : (
                            formatCurrency(item.subtotal)
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              
              {/* Poi mostriamo gli abbonamenti con uno stile diverso */}
              {subscriptionItems.length > 0 && (
                <>
                  {subscriptionItems.map((item) => (
                    <div key={item.id} className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-4">
                      <div className="font-medium mb-2 text-blue-800">{item.description}</div>
                      
                      {item.subscriptionDetails && (
                        <div className="bg-white rounded p-3 mb-3 border border-blue-100 text-sm">
                          <div className="flex items-center mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mr-2">
                              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                            <span className="font-medium text-blue-700">Abbonamento {formatSubscriptionCycle(item)}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            {item.subscriptionDetails.startDate && (
                              <div className="flex items-center">
                                <span className="text-gray-500 mr-1">Inizio:</span> 
                                <span>{new Date(item.subscriptionDetails.startDate).toLocaleDateString()}</span>
                              </div>
                            )}
                            {item.subscriptionDetails.endDate && (
                              <div className="flex items-center">
                                <span className="text-gray-500 mr-1">Fine:</span> 
                                <span>{new Date(item.subscriptionDetails.endDate).toLocaleDateString()}</span>
                              </div>
                            )}
                            <div className="flex items-center col-span-2 mt-1">
                              <span className={`w-2 h-2 rounded-full mr-2 ${item.subscriptionDetails.autoRenew ? "bg-green-500" : "bg-red-500"}`}></span>
                              <span className={item.subscriptionDetails.autoRenew ? "text-green-700" : "text-red-700"}>
                                {item.subscriptionDetails.autoRenew ? "Rinnovo automatico" : "Senza rinnovo automatico"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-blue-200 text-blue-800">
                          Quantità: {item.quantity}
                        </span>
                        {item.discount > 0 && (
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-blue-200 text-blue-800">
                            Sconto: {item.discount}%
                          </span>
                        )}
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-blue-200 text-blue-800">
                          Prezzo: {formatCurrency(item.unitPrice)}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-blue-200 text-blue-800">
                          IVA: {item.tax}%
                        </span>
                      </div>
                      
                      <div className="flex justify-end text-right">
                        <div className="font-semibold text-lg">
                          {item.discount > 0 ? (
                            <div className="flex flex-col items-end">
                              <div className="text-sm text-gray-500">
                                <span className="line-through">{formatCurrency(item.quantity * item.unitPrice)}</span>
                              </div>
                              <div className="text-blue-700">
                                {formatCurrency(item.subtotal)} <span className="text-sm">(-{item.discount}%)</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-blue-700">{formatCurrency(item.subtotal)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              
              {/* Sezione totali */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                {/* Se ci sono elementi one-time, mostriamo il subtotale */}
                {oneTimeItems.length > 0 && (
                  <>
                    <div className="flex justify-end items-center mb-2">
                      <span className="text-gray-600 mr-2">Subtotale (una tantum)</span>
                      <span className="font-medium">{formatCurrency(oneTimeSubtotal)}</span>
                    </div>
                    
                    {!quoteTable.taxIncluded && (
                      <div className="flex justify-end items-center mb-2">
                        <span className="text-gray-600 mr-2">IVA (una tantum)</span>
                        <span className="font-medium">{formatCurrency(oneTimeTaxAmount)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-end items-center mb-3">
                      <span className="font-semibold mr-2">Totale una tantum</span>
                      <span className="font-bold">{formatCurrency(oneTimeTotal)}</span>
                    </div>
                  </>
                )}
                
                {/* Se ci sono abbonamenti, mostriamo il subtotale degli abbonamenti */}
                {subscriptionItems.length > 0 && (
                  <>
                    <div className="flex justify-end items-center mb-2">
                      <span className="text-gray-600 mr-2">Subtotale (abbonamenti)</span>
                      <span className="font-medium">{formatCurrency(subscriptionSubtotal)}</span>
                    </div>
                    
                    {!quoteTable.taxIncluded && (
                      <div className="flex justify-end items-center mb-2">
                        <span className="text-gray-600 mr-2">IVA (abbonamenti)</span>
                        <span className="font-medium">{formatCurrency(subscriptionTaxAmount)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-end items-center mb-3">
                      <span className="font-semibold mr-2">Totale abbonamenti</span>
                      <span className="font-bold text-blue-700">{formatCurrency(subscriptionTotal)}</span>
                    </div>
                  </>
                )}
                
                {/* Se ci sono sia elementi one-time che abbonamenti, mostriamo il totale complessivo */}
                {oneTimeItems.length > 0 && subscriptionItems.length > 0 && (
                  <div className="flex justify-end items-center text-lg pt-2 border-t border-gray-200">
                    <span className="font-bold mr-2">Totale complessivo</span>
                    <span className="font-bold">{formatCurrency(totalAmount)}</span>
                  </div>
                )}
                
                {/* Se ci sono solo elementi one-time o solo abbonamenti, mostriamo solo il totale rispettivo */}
                {(oneTimeItems.length === 0 || subscriptionItems.length === 0) && (
                  <div className="flex justify-end items-center text-lg">
                    <span className="font-bold mr-2">Totale</span>
                    <span className="font-bold">{formatCurrency(totalAmount)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowOtpInput(true)
  }

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSuccess(true)
    // Reset after 3 seconds
    setTimeout(() => {
      setShowSuccess(false)
      setShowOtpInput(false)
      setEmail('')
      setOtp('')
      setDialogOpen(false)
    }, 3000)
  }

  if (loading) return <div className="py-8 px-4 text-center">Loading...</div>;

  return (
    <div className="relative">
      {/* Signature Button or Approval Info */}
      {!hideSignature && (
        <div className="fixed top-4 right-4 z-50">
          {isApproved ? (
            <div className="bg-green-100 border border-green-500 text-green-800 px-4 py-2 rounded-lg shadow-md text-sm font-medium flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Approvato il xxx da xxx
            </div>
          ) : (
            <button
              onClick={() => setDialogOpen(true)}
              className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg shadow-md transition-colors font-medium flex items-center"
            >
              <Signature className="mr-2" />
              Accetta preventivo
            </button>
          )}
        </div>
      )}

      {/* Proposal acceptance dialog */}
      <Dialog open={dialogOpen && !hideSignature} onOpenChange={(open) => !hideSignature && setDialogOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Accettazione preventivo</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            {totalAmount !== null && (
              <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">totale</span>
                  <span className="text-xl font-bold text-gray-900">
                    {new Intl.NumberFormat('it-IT', { 
                      style: 'currency', 
                      currency: currency 
                    }).format(totalAmount)}
                  </span>
                </div>
              </div>
            )}
            <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Questa è una preview del processo di accettazione. Nella versione pubblicata, questa funzionalità permetterebbe di firmare digitalmente il preventivo via OTP.
                  </p>
                </div>
              </div>
            </div>
            <p className="mb-4 text-sm text-gray-500">Per accettare il preventivo, inserisci il tuo indirizzo email. Ti invieremo un codice di verifica OTP che dovrai inserire per completare l&apos;accettazione.</p>
            
            {showSuccess ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Preventivo firmato con successo!</h3>
                <p className="text-sm text-gray-500">La firma digitale è stata apposta correttamente.</p>
              </div>
            ) : showOtpInput ? (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                    Codice OTP
                  </label>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                    placeholder="Inserisci il codice OTP"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-md"
                >
                  Conferma firma
                </button>
              </form>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Indirizzo email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                    placeholder="Inserisci la tua email"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-md"
                >
                  Richiedi codice OTP
                </button>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-4xl mx-auto py-8 px-4">
        {blocks.length > 0 ? (
          blocks.map((block) => (
            <div key={block.id} className="mb-4">
              {renderBlock(block)}
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500">
            No content available for preview
          </div>
        )}
        
        {/* Powered by Budgez button */}
        <div className="mt-16 flex justify-center">
          <a 
            href="https://budgez.xyz" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs text-gray-600 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-sm border border-gray-300 shadow-sm transition-colors"
          >
            powered by B) Budgez
          </a>
        </div>
      </div>
    </div>
  );
} 