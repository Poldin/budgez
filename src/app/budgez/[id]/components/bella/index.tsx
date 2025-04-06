'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import {
  Plus,
  Grip,
  Text as TextIcon,
  Heading1,
  Heading2,
  Trash2,
  Image as ImageIcon,
  Video,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

import ImageBlock from './blocks/ImageBlock'
import VideoBlock from './blocks/VideoBlock'
import QuoteTableBlock from './blocks/QuoteTableBlock'

// Defining the types of blocks we can add
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

const globalStyles = `
  ::selection {
    background-color: #D1D5DB;
  }
`

// Function to convert URLs in text to clickable links
const transformUrlsToLinks = (content: string): string => {
  // URL regex pattern - migliorata per catturare URLs in modo più preciso
  const urlPattern = /\b(?:https?:\/\/|www\.)[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/gi;
  
  // Sostituisce le URL con tag anchor HTML
  return content.replace(urlPattern, (url) => {
    const href = url.startsWith('http') ? url : `https://${url}`;
    // Usiamo una classe per lo stile invece di mettere lo sfondo blu direttamente nel tag
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800">${url}</a>`;
  });
};

export default function BellaEditor({ id }: { id: string }) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null)
  const [draggingOver, setDraggingOver] = useState<string | null>(null)
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null)
  
  const blockRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const dropdownRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  const updateQueue = useRef<{ [key: string]: Block }>({})
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Generate random ID for blocks
  const generateId = () => Math.random().toString(36).substr(2, 9)
  
  const fetchContent = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('body')
        .eq('id', id)
        .single()

      if (error) throw error

      if (data?.body?.bella?.blocks) {
        setBlocks(data.body.bella.blocks)
      } else {
        // Initialize with a default heading and text block
        setBlocks([
          { id: generateId(), type: 'heading1', content: 'Il tuo preventivo', alignment: 'center' },
          { id: generateId(), type: 'text', content: 'Inserisci qui i dettagli del tuo preventivo...', alignment: 'left' }
        ])
      }
    } catch (error) {
      console.error('Error fetching content:', error)
    } finally {
      setLoading(false)
    }
  }, [id])
  
  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.innerHTML = globalStyles
    document.head.appendChild(styleElement)

    return () => {
      document.head.removeChild(styleElement)
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  const updateDatabase = async (newBlocks: Block[]) => {
    try {
      const { data: currentBudget, error: fetchError } = await supabase
        .from('budgets')
        .select('body')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      const currentBody = currentBudget?.body || {}
      const newBody = {
        ...currentBody,
        bella: {
          ...(currentBody.bella || {}),
          blocks: newBlocks
        }
      }

      const { error: updateError } = await supabase
        .from('budgets')
        .update({
          body: newBody,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateError) throw updateError
    } catch (error) {
      console.error('Error updating content:', error)
    }
  }

  const insertBlock = async (type: BlockType, alignment: BlockAlignment = 'left', index: number) => {
    const newBlock: Block = { 
      id: generateId(), 
      type, 
      content: '', 
      alignment,
      metadata: type === 'image' || type === 'video' ? { url: '' } : undefined
    }
    
    const newBlocks = [
      ...blocks.slice(0, index + 1),
      newBlock,
      ...blocks.slice(index + 1)
    ]
    setBlocks(newBlocks)
    
    // Wait for the database update to complete
    await updateDatabase(newBlocks)
    
    setTimeout(() => {
      if (type === 'text' || type === 'heading1' || type === 'heading2') {
        blockRefs.current[newBlock.id]?.focus()
      }
    }, 0)
  }

  const handleKeyDown = async (e: React.KeyboardEvent, blockId: string) => {
    const currentBlock = blocks.find(b => b.id === blockId)
    const currentIndex = blocks.findIndex(b => b.id === blockId)
    
    if (e.key === '+') {
      setTimeout(() => {
        dropdownRefs.current[blockId]?.click()
      }, 0)
      return
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
  
      // 1. Save the current block content
      const currentContent = blockRefs.current[blockId]?.innerHTML || ''
      
      // 2. Update local state first
      const updatedBlocks = blocks.map(block => 
        block.id === blockId 
          ? { ...block, content: currentContent }
          : block
      )
      setBlocks(updatedBlocks)
      
      // 3. Save to database
      await updateDatabase(updatedBlocks)
      
      // 4. Clear the queue
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      delete updateQueue.current[blockId]
      
      // 5. Create new block
      const newBlock: Block = { 
        id: generateId(), 
        type: 'text', 
        content: '',
        alignment: 'left'
      }
      
      const finalBlocks = [
        ...updatedBlocks.slice(0, currentIndex + 1),
        newBlock,
        ...updatedBlocks.slice(currentIndex + 1)
      ]
      
      setBlocks(finalBlocks)
      await updateDatabase(finalBlocks)
      
      setTimeout(() => {
        blockRefs.current[newBlock.id]?.focus()
      }, 0)
    } else if (e.key === 'Backspace' && currentBlock?.content === '' && blocks.length > 1) {
      e.preventDefault()
      
      const prevBlock = blocks[currentIndex - 1]
      if (!prevBlock) return
      
      // Save content of previous block
      const prevContent = blockRefs.current[prevBlock.id]?.innerHTML || ''
      const updatedBlocks = blocks
        .filter(b => b.id !== blockId)
        .map(block => 
          block.id === prevBlock.id
            ? { ...block, content: prevContent }
            : block
        )
      
      setBlocks(updatedBlocks)
      await updateDatabase(updatedBlocks)
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      delete updateQueue.current[blockId]
      delete updateQueue.current[prevBlock.id]
      
      setTimeout(() => {
        blockRefs.current[prevBlock.id]?.focus()
      }, 0)
    }
  }

  const updateBlockAlignment = (blockId: string, alignment: BlockAlignment) => {
    const newBlocks = blocks.map(block => 
      block.id === blockId ? { ...block, alignment } : block
    )
    setBlocks(newBlocks)
    updateDatabase(newBlocks)
  }

  const renderBlock = (block: Block) => {
    const ref = (el: HTMLDivElement | null) => {
      if (el && !el.innerHTML && block.content && (block.type === 'text' || block.type === 'heading1' || block.type === 'heading2')) {
        el.innerHTML = block.content;
      }
      blockRefs.current[block.id] = el;
    }
  
    const isEmpty = !block.content;
    const isActive = focusedBlockId === block.id;
    const placeholder = isEmpty && isActive ? "click '+' for new blocks" : '';
  
    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      let content = target.innerHTML;
      
      // Transform URLs to links
      if (!content.includes('<a href=')) {
        const transformedContent = transformUrlsToLinks(content);
        if (transformedContent !== content) {
          target.innerHTML = transformedContent;
          // Place cursor at the end
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(target);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
          content = transformedContent;
        }
      }
      
      // Update queue with new content
      updateQueue.current[block.id] = { ...block, content };
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      updateTimeoutRef.current = setTimeout(() => {
        const newBlocks = blocks.map(b => 
          b.id === block.id ? { ...b, content } : b
        );
        setBlocks(newBlocks);
        updateDatabase(newBlocks);
      }, 1000);
    };
  
    const handleBlur = () => {
      // If there's a pending update, process it
      if (updateQueue.current[block.id]) {
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        
        updateDatabase(blocks.map(b => 
          b.id === block.id ? { ...b, content: updateQueue.current[block.id].content } : b
        ));
        delete updateQueue.current[block.id];
      }
  
      setFocusedBlockId(null);
    };
  
    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
      
      // Update queue with new content after paste
      const target = e.currentTarget as HTMLDivElement;
      updateQueue.current[block.id] = { ...block, content: target.innerHTML };
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      updateTimeoutRef.current = setTimeout(() => {
        updateDatabase(blocks.map(b => 
          b.id === block.id ? { ...b, content: updateQueue.current[block.id].content } : b
        ));
      }, 1000);
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

    const handleImageOrVideoChange = (newData: Partial<Block>) => {
      const updatedBlock = { ...block, ...newData };
      const newBlocks = blocks.map(b => 
        b.id === block.id ? updatedBlock : b
      );
      setBlocks(newBlocks);
      updateDatabase(newBlocks);
    };
  
    const getAlignmentClasses = (alignment: BlockAlignment) => {
      switch (alignment) {
        case 'left': return 'text-left';
        case 'center': return 'text-center';
        case 'right': return 'text-right';
        default: return 'text-left';
      }
    };
    
    const commonProps = {
      ref,
      contentEditable: block.type !== 'image' && block.type !== 'video',
      suppressContentEditableWarning: true,
      onInput: handleInput,  
      onClick: handleClick,
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, block.id),
      onFocus: () => setFocusedBlockId(block.id),
      onBlur: handleBlur,
      onPaste: handlePaste,
      'data-placeholder': placeholder,
      className: `outline-none w-full empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground text-gray-800 ${getAlignmentClasses(block.alignment)}`
    };
  
    switch (block.type) {
      case 'text':
        return <div {...commonProps} className={`${commonProps.className} text-sm`} />;
      case 'heading1':
        return <div {...commonProps} className={`${commonProps.className} text-3xl font-bold min-h-[36px]`} />;
      case 'heading2':
        return <div {...commonProps} className={`${commonProps.className} text-2xl font-bold min-h-[32px]`} />;
      case 'image':
        return <ImageBlock block={block} onChange={handleImageOrVideoChange} />;
      case 'video':
        return <VideoBlock block={block} onChange={handleImageOrVideoChange} />;
      case 'quote-table':
        const initialData = block.metadata?.quoteTable || {
          items: [
            {
              id: generateId(),
              description: 'Inserisci descrizione prodotto o servizio',
              quantity: 1,
              unitPrice: 0,
              discount: 0,
              tax: 22,
              subtotal: 0
            }
          ],
          currency: 'EUR',
          taxIncluded: false
        };
        
        return (
          <div className="relative group">
            <div
              className={`relative ${getAlignmentClasses(block.alignment)}`}
              ref={ref}
              onDragOver={(e) => handleDragOver(e, block.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, block.id)}
            >
              <QuoteTableBlock
                data={initialData}
                onChange={(newData) => {
                  const updatedBlock = { 
                    ...block, 
                    metadata: { 
                      ...block.metadata, 
                      quoteTable: newData 
                    } 
                  };
                  
                  const updatedBlocks = blocks.map(b => 
                    b.id === block.id ? updatedBlock : b
                  );
                  
                  setBlocks(updatedBlocks);
                  
                  // Queue update to database
                  updateQueue.current[block.id] = updatedBlock;
                  
                  if (updateTimeoutRef.current) {
                    clearTimeout(updateTimeoutRef.current);
                  }
                  
                  updateTimeoutRef.current = setTimeout(() => {
                    const blockUpdates = { ...updateQueue.current };
                    updateQueue.current = {};
                    
                    const finalBlocks = blocks.map(b => 
                      blockUpdates[b.id] ? blockUpdates[b.id] : b
                    );
                    
                    updateDatabase(finalBlocks);
                  }, 1000);
                }}
              />
              
              {focusedBlockId === block.id && (
                <div className="absolute right-0 -top-10 flex space-x-2">
                  <div className="flex space-x-1 bg-white shadow rounded-md p-1">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8"
                      onClick={() => updateBlockAlignment(block.id, 'left')}
                    >
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8"
                      onClick={() => updateBlockAlignment(block.id, 'center')}
                    >
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8"
                      onClick={() => updateBlockAlignment(block.id, 'right')}
                    >
                      <AlignRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 bg-white shadow rounded-md" 
                    onClick={() => {
                      const newBlocks = blocks.filter(b => b.id !== block.id)
                      setBlocks(newBlocks)
                      updateDatabase(newBlocks)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )
      default:
        return null;
    }
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, blockId: string) => {
    setDraggedBlock(blockId)
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, blockId: string) => {
    e.preventDefault()
    setDraggingOver(blockId)
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDraggingOver(null)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault()
    setDraggingOver(null)
    
    if (!draggedBlock || draggedBlock === targetId) return

    const sourceIndex = blocks.findIndex(b => b.id === draggedBlock)
    const targetIndex = blocks.findIndex(b => b.id === targetId)
    
    const newBlocks = [...blocks]
    const [removed] = newBlocks.splice(sourceIndex, 1)
    newBlocks.splice(targetIndex, 0, removed)
    
    setBlocks(newBlocks)
    updateDatabase(newBlocks)
    setDraggedBlock(null)
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="">
      {blocks.map((block, index) => (
        <div
          key={block.id}
          className={`group flex items-start gap-2 rounded-lg hover:bg-muted/50 relative ${
            draggingOver === block.id ? 'border-t-2 border-primary' : ''
          }`}
          onDragOver={(e) => handleDragOver(e, block.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, block.id)}
        >
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, block.id)}
            >
              <Grip className="h-4 w-4 text-muted-foreground cursor-grab" />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  ref={(el) => { dropdownRefs.current[block.id] = el }}
                  variant="ghost"
                  className="h-8 w-8"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => insertBlock('text', 'left', index)}>
                  <TextIcon className="mr-2 h-4 w-4" />
                  <span>Testo</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertBlock('heading1', 'left', index)}>
                  <Heading1 className="mr-2 h-4 w-4" />
                  <span>Titolo 1</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertBlock('heading2', 'left', index)}>
                  <Heading2 className="mr-2 h-4 w-4" />
                  <span>Titolo 2</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertBlock('image', 'center', index)}>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  <span>Immagine</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertBlock('video', 'center', index)}>
                  <Video className="mr-2 h-4 w-4" />
                  <span>Video</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertBlock('quote-table', 'center', index)}>
                  <Table className="mr-2 h-4 w-4" />
                  <span>Tabella preventivo</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Alignment menu for text/heading blocks */}
            {(block.type === 'text' || block.type === 'heading1' || block.type === 'heading2' || block.type === 'image' || block.type === 'video') && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    {block.alignment === 'left' && <AlignLeft className="h-4 w-4 text-gray-600" />}
                    {block.alignment === 'center' && <AlignCenter className="h-4 w-4 text-gray-600" />}
                    {block.alignment === 'right' && <AlignRight className="h-4 w-4 text-gray-600" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => updateBlockAlignment(block.id, 'left')}>
                    <AlignLeft className="h-4 w-4 mr-2" />
                    Left
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateBlockAlignment(block.id, 'center')}>
                    <AlignCenter className="h-4 w-4 mr-2" />
                    Center
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateBlockAlignment(block.id, 'right')}>
                    <AlignRight className="h-4 w-4 mr-2" />
                    Right
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {blocks.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newBlocks = blocks.filter(b => b.id !== block.id)
                  setBlocks(newBlocks)
                  updateDatabase(newBlocks)
                }}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3 text-gray-600" />
              </Button>
            )}
          </div>

          <div className="flex-1">
            {renderBlock(block)}
          </div>
        </div>
      ))}
    </div>
  )
} 