'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Signature } from 'lucide-react'

type BlockAlignment = 'left' | 'center' | 'right'
type BlockType = 'text' | 'heading1' | 'heading2' | 'image' | 'video' | 'quote-table'

interface Block {
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
      }>
      currency: string
      taxIncluded: boolean
    }
  }
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

export default function BellaPreview({ id }: { id: string }) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  // Simulate approved state with a URL parameter for demo purposes
  const [isApproved, setIsApproved] = useState(false)
  

  useEffect(() => {
    const fetchContent = async () => {
      try {
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
  }, [id])

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
        
        // Calculate totals
        const subtotal = quoteTable.items.reduce((sum, item) => sum + item.subtotal, 0);
        const taxAmount = quoteTable.items.reduce((sum, item) => {
          return sum + (item.subtotal * (item.tax / 100));
        }, 0);
        const total = subtotal + (quoteTable.taxIncluded ? 0 : taxAmount);
        
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
              {quoteTable.items.map((item) => (
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
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-end items-center mb-2">
                  <span className="text-gray-600 mr-2">Subtotale</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                
                {!quoteTable.taxIncluded && (
                  <div className="flex justify-end items-center mb-2">
                    <span className="text-gray-600 mr-2">IVA </span>
                    <span className="font-medium">{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                
                <div className="flex justify-end items-center text-lg">
                  <span className="font-bold mr-2">Totale </span>
                  <span className="font-bold">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) return <div className="py-8 px-4 text-center">Loading...</div>;

  return (
    <div className="relative">
      {/* Signature Button or Approval Info */}
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

      {/* Proposal acceptance dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Accettazione preventivo</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="mb-4">Per accettare il preventivo, inserisci il tuo indirizzo email. Ti invieremo un codice di verifica OTP che dovrai inserire per completare l&apos;accettazione.</p>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Indirizzo email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                  placeholder="Inserisci la tua email"
                />
              </div>
              <button
                className="w-full bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-md"
                onClick={() => setDialogOpen(false)}
              >
                Richiedi codice OTP
              </button>
              <p className="text-xs text-gray-500 text-center">Firmando questo preventivo confermi di accettare i termini e le condizioni di servizio.</p>
            </div>
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
      </div>
    </div>
  );
} 