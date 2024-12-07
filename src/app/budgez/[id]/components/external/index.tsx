import React, { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Plus, Type, Image, Link as LinkIcon, FileText, Trash2, GripVertical } from 'lucide-react';
import {
    DndContext, 
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

interface FileBlock {
    url: string;
    name: string;
    type: string;
}

type BlockContent = string | FileBlock;

interface Block {
    id: string;
    type: 'paragraph' | 'heading1' | 'heading2' | 'image' | 'file' | 'link';
    content: BlockContent;
}

interface SortableBlockProps {
    block: Block;
    renderBlock: (block: Block) => React.ReactNode;
    onAddBlock: (type: Block['type'], id: string) => void;
    onDeleteBlock: (id: string) => void;
}

const SortableBlock: React.FC<SortableBlockProps> = ({ block, renderBlock, onAddBlock, onDeleteBlock }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative group">
            <div className="flex items-start gap-2 w-full">
                <div className="flex-shrink-0 flex flex-row gap-1">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab h-6 w-6 p-0"
                        {...attributes}
                        {...listeners}
                    >
                        <GripVertical className="h-4 w-4 text-gray-600" />
                    </Button>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <Plus className="h-4 w-4 text-gray-600" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => onAddBlock('heading1', block.id)}>
                                    <Type className="mr-2 h-4 w-4" /> H1
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onAddBlock('heading2', block.id)}>
                                    <Type className="mr-2 h-4 w-4" /> H2
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onAddBlock('paragraph', block.id)}>
                                    <Type className="mr-2 h-4 w-4" /> p
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onAddBlock('image', block.id)}>
                                    <Image className="mr-2 h-4 w-4" /> Image
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onAddBlock('file', block.id)}>
                                    <FileText className="mr-2 h-4 w-4" /> Doc
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onAddBlock('link', block.id)}>
                                    <LinkIcon className="mr-2 h-4 w-4" /> Link
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteBlock(block.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                    >
                        <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                </div>
                <div className="flex-1 ml-2 min-w-0">
                    {renderBlock(block)}
                </div>
            </div>
        </div>
    );
};

const External = () => {
    const supabase = createClientComponentClient();
    const [blocks, setBlocks] = useState<Block[]>([
        { id: '1', type: 'paragraph', content: '' }
    ]);
    const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const addBlock = (type: Block['type'], afterId: string) => {
        const newBlock: Block = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            content: type === 'image' || type === 'file' ? { url: '', name: '', type } : ''
        };
    
        setBlocks(currentBlocks => {
            const index = currentBlocks.findIndex(block => block.id === afterId);
            const newBlocks = [...currentBlocks];
            newBlocks.splice(index + 1, 0, newBlock);
            return newBlocks;
        });
    };

    const deleteBlock = (id: string) => {
        if (blocks.length > 1) {
            setBlocks(blocks => blocks.filter(block => block.id !== id));
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        
        if (over && active.id !== over.id) {
            setBlocks((blocks) => {
                const oldIndex = blocks.findIndex((block) => block.id === active.id);
                const newIndex = blocks.findIndex((block) => block.id === over.id);
                
                return arrayMove(blocks, oldIndex, newIndex);
            });
        }
    };

    const updateBlockContent = (id: string, content: BlockContent) => {
        setBlocks(currentBlocks =>
            currentBlocks.map(block =>
                block.id === id ? { ...block, content } : block
            )
        );
    };

    const handleFileUpload = async (file: File, blockId: string, type: string) => {
        setIsUploading(true);
        try {
            const localUrl = URL.createObjectURL(file);
            updateBlockContent(blockId, {
                url: localUrl,
                name: file.name,
                type
            });
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, blockId: string) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addBlock('paragraph', blockId);
        }
    };

    const renderBlockContent = (block: Block) => {
        const isSelected = selectedBlock === block.id;
        
        const commonInputProps = {
            onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => 
                updateBlockContent(block.id, e.target.value),
            onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, block.id),
            onClick: () => setSelectedBlock(block.id),
            className: `w-full bg-transparent outline-none resize-none leading-normal ${
                isSelected ? '' : ''
            }`,
            placeholder: '',
            value: typeof block.content === 'string' ? block.content : ''
        };

        switch (block.type) {
            case 'heading1':
                return (
                    <input 
                        {...commonInputProps}
                        className={`${commonInputProps.className} text-4xl font-bold text-gray-800`} 
                    />
                );
            case 'heading2':
                return (
                    <input 
                        {...commonInputProps}
                        className={`${commonInputProps.className} text-2xl font-bold text-gray-800`} 
                    />
                );
            case 'paragraph':
                return (
                    <textarea 
                        {...commonInputProps}
                        className={`${commonInputProps.className} text-gray-600`}
                        rows={1}
                        onChange={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = `${e.target.scrollHeight}px`;
                            updateBlockContent(block.id, e.target.value);   
                        }}
                    />
                );
            case 'image':
            case 'file': {
                const fileBlock = block.content as FileBlock;
                if (!fileBlock.url) {
                    return (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <Input
                                type="file"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        handleFileUpload(file, block.id, block.type);
                                    }
                                }}
                                disabled={isUploading}
                            />
                        </div>
                    );
                }
                return block.type === 'image' ? (
                    <img 
                        src={fileBlock.url} 
                        alt={fileBlock.name}
                        className="max-w-full h-auto rounded-lg"
                    />
                ) : (
                    <div className="flex items-center gap-2 p-4 m-2 border rounded-lg hover:bg-gray-50">
                        <FileText className="h-6 w-6 text-red-500" />
                        <a 
                            href={fileBlock.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600"
                        >
                            {fileBlock.name}
                        </a>
                    </div>
                );
            }
            case 'link':
    return (
        <div className="flex items-center gap-2 p-2 group m-2 border rounded-lg hover:bg-gray-50">
            <LinkIcon className="h-5 w-5 text-gray-600 flex-shrink-0" />
            <input 
                {...commonInputProps}
                type="url"
                className={`${commonInputProps.className} text-gray-600`}
                placeholder="Enter URL"
            />
            {typeof block.content === 'string' && block.content && (
                <Button
                    variant="ghost"
                    size="sm"
                    className=" h-8 px-2 ml-1 bg-black text-white font-semibold"
                    onClick={() => window.open(block.content as string, '_blank')}
                >
                    <LinkIcon className="h-4 w-4 mr-1" />
                    Open
                </Button>
            )}
        </div>
    );
            default:
                return null;
        }
    };

    return (
        <div className="w-full p-4">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext 
                    items={blocks.map(block => block.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {blocks.map((block) => (
                        <SortableBlock
                            key={block.id}
                            block={block}
                            renderBlock={renderBlockContent}
                            onAddBlock={addBlock}
                            onDeleteBlock={deleteBlock}
                        />
                    ))}
                </SortableContext>
            </DndContext>
        </div>
    );
};

export default External;