'use client'

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumberInput } from "@/components/ui/number-input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2, ArrowUp, ArrowDown, Boxes } from 'lucide-react';
import type { Resource } from '@/types/budget';

interface ResourcesSectionProps {
  resources: Resource[];
  currency: string;
  onAdd: () => void;
  onUpdate: (id: string, field: keyof Resource, value: string | number) => void;
  onDelete: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  translations: {
    resources: string;
    addResource: string;
    resourceName: string;
    costType: string;
    hourly: string;
    quantity: string;
    fixed: string;
    pricePerHour: string;
    pricePerUnit: string;
    priceEnteredInActivity: string;
    priceWillBeSpecified: string;
    createResourcesFirst: string;
  };
}

export default function ResourcesSection({
  resources,
  currency,
  onAdd,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  translations: t
}: ResourcesSectionProps) {
  return (
    <AccordionItem value="resources">
      <div className="flex items-center justify-between gap-4 mb-4">
        <AccordionTrigger className="text-lg font-semibold hover:no-underline flex-1">
          <div className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-gray-500" />
            {t.resources}
          </div>
        </AccordionTrigger>
        <Button 
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }} 
          className="!w-fit shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t.addResource}
        </Button>
      </div>
      
      <AccordionContent>
        <div className="space-y-3">
          {resources.map((resource, index) => (
            <Card key={resource.id}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-12 gap-3 items-end">
                  {/* Nome e Tipo sulla stessa riga */}
                  <div className="col-span-5">
                    <Label className="text-gray-500">{t.resourceName}</Label>
                    <Input
                      value={resource.name}
                      onChange={(e) => onUpdate(resource.id, 'name', e.target.value)}
                      placeholder={t.resourceName}
                      className="font-bold"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label className="text-gray-500">{t.costType}</Label>
                    <Select
                      value={resource.costType}
                      onValueChange={(value) => onUpdate(resource.id, 'costType', value)}
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
                      <Label className="text-gray-500">{t.pricePerHour} ({currency})</Label>
                      <NumberInput
                        value={resource.pricePerHour}
                        onChange={(value) => onUpdate(resource.id, 'pricePerHour', value)}
                        placeholder="0"
                        min={0}
                      />
                    </div>
                  ) : resource.costType === 'quantity' ? (
                    <div className="col-span-3">
                      <Label className="text-gray-500">{t.pricePerUnit} ({currency})</Label>
                      <NumberInput
                        value={resource.pricePerHour}
                        onChange={(value) => onUpdate(resource.id, 'pricePerHour', value)}
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
                      onClick={() => onMoveUp(index)}
                      disabled={index === 0}
                      className="px-2"
                      title="Sposta su"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMoveDown(index)}
                      disabled={index === resources.length - 1}
                      className="px-2"
                      title="Sposta giù"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(resource.id)}
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
  );
}

