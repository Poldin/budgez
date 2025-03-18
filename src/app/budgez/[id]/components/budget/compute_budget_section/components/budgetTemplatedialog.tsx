import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Types
export interface TemplateItem {
  id: string;
  name: string;
  description?: string;
  body: unknown;
}

interface TemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplates: (templates: TemplateItem[]) => void;
  type: "section" | "resource";
}

const TemplateSelector: React.FC<TemplateDialogProps> = ({
  isOpen,
  onClose,
  onSelectTemplates,
  type,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      // Reset selections when dialog opens
      setSelectedTemplates({});
    }
  }, [isOpen, type]);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Assuming you have access to Supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );
      
      const { data, error } = await supabase
        .from('db_projectbudget')
        .select('id, name, description, body, type')
        .eq('type', type === 'section' ? 'section' : 'resource');
      
      if (error) throw error;
      
      console.log('Templates loaded:', data?.length || 0);
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load templates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const toggleTemplateSelection = (id: string) => {
    console.log('Toggling selection for template:', id, 'Current state:', selectedTemplates[id]);
    setSelectedTemplates(prev => {
      const updated = {
        ...prev,
        [id]: !prev[id]
      };
      console.log('Updated selection state:', updated);
      return updated;
    });
  };

  const handleConfirm = () => {
    const selected = templates.filter(template => selectedTemplates[template.id]);
    console.log('Selected templates:', selected.length);
    onSelectTemplates(selected);
    setSelectedTemplates({});
    onClose();
  };

  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="lg:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Select {type === "section" ? "Section" : "Resource"} Templates</DialogTitle>
          <DialogDescription>
            Choose templates to add to your budget. You can select multiple items.
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative my-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder={`Search ${type === "section" ? "sections" : "resources"}...`}
            value={searchQuery}
            onChange={handleSearch}
            className="pl-8"
          />
        </div>
        
        {loading ? (
          <div className="py-4 text-center">Loading templates...</div>
        ) : error ? (
          <div className="py-4 text-center text-red-500">{error}</div>
        ) : filteredTemplates.length === 0 ? (
          <div className="py-4 text-center">No templates found</div>
        ) : (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-2">
              {filteredTemplates.map((template) => (
                <div 
                  key={template.id} 
                  className="flex items-start gap-2 p-2 border rounded hover:bg-gray-50"
                >
                  <div 
                    className="flex items-center h-full cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTemplateSelection(template.id);
                    }}
                  >
                    <Checkbox 
                      id={`template-${template.id}`}
                      checked={!!selectedTemplates[template.id]}
                      onCheckedChange={() => toggleTemplateSelection(template.id)}
                    />
                  </div>
                  <div 
                    className="flex-1 cursor-pointer" 
                    onClick={() => toggleTemplateSelection(template.id)}
                  >
                    <label 
                      htmlFor={`template-${template.id}`} 
                      className="font-medium cursor-pointer block"
                    >
                      {template.name}
                    </label>
                    {template.description && (
                      <p className="text-sm text-gray-500">{template.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        <div className="text-sm text-gray-500 pt-2">
          {Object.keys(selectedTemplates).filter(id => selectedTemplates[id]).length} templates selected
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={Object.keys(selectedTemplates).filter(id => selectedTemplates[id]).length === 0}
          >
            Add Selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateSelector;