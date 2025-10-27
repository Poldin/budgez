'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from 'lucide-react';
import { type Language } from '@/lib/translations';

interface BudgetConfig {
  currency: string;
  defaultVat?: number;
  resources: unknown[];
  activities: unknown[];
  generalDiscount?: unknown;
}

export interface BudgetTemplate {
  id: string;
  name: string;
  description: string;
  tags: string[];
  config: BudgetConfig;
}

interface TemplatesSidebarProps {
  language: Language;
  onSelectTemplate: (config: BudgetConfig) => void;
  templates: BudgetTemplate[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TemplatesSidebar({ onSelectTemplate, templates, isOpen, onOpenChange }: TemplatesSidebarProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Estrai tutti i tag unici
  const allTags = Array.from(new Set(templates.flatMap(t => t.tags)));

  // Filtra template per tag selezionati
  const filteredTemplates = selectedTags.length === 0
    ? templates
    : templates.filter(template => 
        selectedTags.some(tag => template.tags.includes(tag))
      );

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <>
      {/* Sidebar */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => onOpenChange(false)}
          />
          
          {/* Sidebar Content */}
          <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Templates</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div className="p-4 border-b">
                <p className="text-xs font-semibold mb-2 text-gray-600">Filtra per tag:</p>
                <div className="overflow-x-auto">
                  <div className="flex gap-2 pb-1">
                    {allTags.map(tag => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer whitespace-nowrap flex-shrink-0 text-xs"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Templates List */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {filteredTemplates.map(template => (
                  <Card 
                    key={template.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => {
                      onSelectTemplate(template.config);
                      onOpenChange(false);
                    }}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {template.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {template.config.resources.length} risorse · {template.config.activities.length} attività
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredTemplates.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Nessun template trovato con questi tag
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </>
      )}
    </>
  );
}

