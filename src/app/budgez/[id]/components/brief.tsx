'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import {
  Plus,
  Grip,
  Text as TextIcon,
  Heading1,
  Heading2,
  Trash2,
  Gauge
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import TechBudgetScreen from './budget/compute_budget_section'

type BlockType = 'text' | 'heading1' | 'heading2' | 'techbudget'

interface Block {
  id: string
  type: BlockType
  content: string
}

const globalStyles = `
  ::selection {
    background-color: #D1D5DB;
  }
`


const transformUrlsToLinks = (content: string): string => {
  // URL regex pattern
  const urlPattern = /(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
  
  return content.replace(urlPattern, (url) => {
    const href = url.startsWith('http') ? url : `https://${url}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-900 bg-blue-200 px-1 rounded-sm cursor-pointer font-medium">${url}</a>`;
  });
};



export default function BlockEditor({ id }: { id: string }) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null)
  const [draggingOver, setDraggingOver] = useState<string | null>(null)
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null)
  
  const blockRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const dropdownRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  const updateQueue = useRef<{ [key: string]: string }>({})
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
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
  }, [id])

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('body')
        .eq('id', id)
        .single()

      if (error) throw error

      if (data?.body?.blocks) {
        setBlocks(data.body.blocks)
      } else {
        setBlocks([{ id: generateId(), type: 'text', content: '' }])
      }
    } catch (error) {
      console.error('Error fetching content:', error)
    } finally {
      setLoading(false)
    }
  }

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
        blocks: newBlocks
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

  const handleTechBudgetChange = (
    blockId: string,
    newContent: string,
    currentBlocks: Block[],
    updateQueue: { [key: string]: string },
    updateTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
    setBlocks: React.Dispatch<React.SetStateAction<Block[]>>,
    updateDatabase: (blocks: Block[]) => Promise<void>
  ) => {
    // Aggiorniamo la coda con il nuovo contenuto
    updateQueue[blockId] = newContent;
    
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      const newBlocks = currentBlocks.map(block => 
        block.id === blockId ? { ...block, content: newContent } : block
      );
      setBlocks(newBlocks);
      updateDatabase(newBlocks);
    }, 1000);
  };

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const insertBlock = async (type: BlockType, index: number) => {
    const newBlock = { id: generateId(), type, content: '' }
    const newBlocks = [
      ...blocks.slice(0, index + 1),
      newBlock,
      ...blocks.slice(index + 1)
    ]
    setBlocks(newBlocks)
    // Wait for the database update to complete
    await updateDatabase(newBlocks)
    
    setTimeout(() => {
      blockRefs.current[newBlock.id]?.focus()
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
  
      // 1. Prima salviamo il blocco corrente
      const currentContent = blockRefs.current[blockId]?.innerHTML || ''
      
      // 2. Aggiorniamo prima lo stato locale
      const updatedBlocks = blocks.map(block => 
        block.id === blockId 
          ? { ...block, content: currentContent }
          : block
      )
      setBlocks(updatedBlocks)
      
      // 3. Salviamo nel database
      await updateDatabase(updatedBlocks)
      
      // 4. Rimuoviamo dalla coda
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      delete updateQueue.current[blockId]
      
      // 5. Solo dopo creiamo il nuovo blocco
      const newBlock = { id: generateId(), type: 'text' as BlockType, content: '' }
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
      
      // Salviamo prima il contenuto del blocco precedente
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

  const renderBlock = (block: Block) => {
    const ref = (el: HTMLDivElement | null) => {
      if (el && !el.innerHTML && block.content) {
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
      
      // Aggiorniamo la coda con il nuovo contenuto
      updateQueue.current[block.id] = content;
      
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
      
      
      // Se c'è un aggiornamento in sospeso, processiamolo
      if (updateQueue.current[block.id]) {
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        
        updateDatabase(blocks.map(b => 
          b.id === block.id ? { ...b, content: updateQueue.current[block.id] } : b
        ));
        delete updateQueue.current[block.id];
      }
  
      setFocusedBlockId(null);
    };
  
    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
      
      // Aggiorniamo la coda con il nuovo contenuto dopo il paste
      const target = e.currentTarget as HTMLDivElement;
      updateQueue.current[block.id] = target.innerHTML;
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      updateTimeoutRef.current = setTimeout(() => {
        updateDatabase(blocks.map(b => 
          b.id === block.id ? { ...b, content: updateQueue.current[block.id] } : b
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
  
    const commonProps = {
      ref,
      contentEditable: true,
      suppressContentEditableWarning: true,
      onInput: handleInput,  
      onClick: handleClick,
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, block.id),
      onFocus: () => setFocusedBlockId(block.id),
      onBlur: handleBlur,
      onPaste: handlePaste,
      'data-placeholder': placeholder,
    };
  
    const classes = {
      base: "outline-none w-full empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground text-gray-800",
      text: "text-sm",
      heading1: "text-3xl font-bold min-h-[36px]",
      heading2: "text-2xl font-bold min-h-[32px]"
    };
  
    switch (block.type) {
      case 'text':
        return <div {...commonProps} className={`${classes.base} ${classes.text}`} />
      case 'heading1':
        return <div {...commonProps} className={`${classes.base} ${classes.heading1}`} />
      case 'heading2':
        return <div {...commonProps} className={`${classes.base} ${classes.heading2}`} />
        case 'techbudget':
  return (
    <TechBudgetScreen
      content={block.content}
      onChange={(newContent: string) => {
        handleTechBudgetChange(
          block.id,
          newContent,
          blocks,
          updateQueue.current,
          updateTimeoutRef,
          setBlocks,
          updateDatabase
        );
      }}
      initialData={block.content ? JSON.parse(block.content) : undefined}
    />
  );
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
                  ref={(el: HTMLButtonElement | null) => {
                    dropdownRefs.current[block.id] = el
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <Plus className="h-4 w-4 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => insertBlock('text', index)}>
                  <TextIcon className="h-4 w-4 mr-2" />
                  Text
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertBlock('heading1', index)}>
                <Heading1 className="h-4 w-4 mr-2" />
                  Heading 1
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertBlock('heading2', index)}>
                  <Heading2 className="h-4 w-4 mr-2" />
                  Heading 2
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertBlock('techbudget', index)}>
                  <Gauge className="h-4 w-4 mr-2" />
                  Tech Budget
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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