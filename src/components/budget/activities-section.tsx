'use client'

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, CheckSquare, Users } from 'lucide-react';
import type { Activity, Resource, ResourceAssignment } from '@/types/budget';
import ActivityCard from './activity-card';

interface ActivitiesSectionProps {
  activities: Activity[];
  resources: Resource[];
  currency: string;
  defaultVat: number;
  expandedActivities: Set<string>;
  onToggleActivity: (activityId: string) => void;
  onAdd: () => void;
  onUpdate: (id: string, field: keyof Activity, value: string | number | any) => void;
  onDelete: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onAddResource: (activityId: string) => void;
  onUpdateResource: (activityId: string, index: number, field: keyof ResourceAssignment, value: string | number) => void;
  onRemoveResource: (activityId: string, index: number) => void;
  hideMargin?: boolean;
  onExternalCompilation?: () => void;
  translations: any;
}

export default function ActivitiesSection({
  activities,
  resources,
  currency,
  defaultVat,
  expandedActivities,
  onToggleActivity,
  onAdd,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddResource,
  onUpdateResource,
  onRemoveResource,
  hideMargin = false,
  onExternalCompilation,
  translations: t
}: ActivitiesSectionProps) {
  return (
    <AccordionItem value="activities">
      <div className="flex items-center justify-between gap-4 mb-4">
        <AccordionTrigger className="text-lg font-semibold hover:no-underline flex-1">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-gray-500" />
            {t.activities}
          </div>
        </AccordionTrigger>
        <div className="flex items-center gap-2">
          {onExternalCompilation && (
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onExternalCompilation();
              }} 
              variant="outline"
              className="shrink-0"
            >
              <Users className="h-4 w-4 mr-2" />
              {t.externalCompilation || 'Compilazione collaborativa'}
            </Button>
          )}
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }} 
            disabled={resources.length === 0} 
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t.addActivity}
          </Button>
        </div>
      </div>

      <AccordionContent>
        <div className="space-y-4">
          {activities.map((activity, activityIndex) => {
            const isExpanded = expandedActivities.has(activity.id);
            return (
              <ActivityCard
                key={activity.id}
                activity={activity}
                activityIndex={activityIndex}
                resources={resources}
                currency={currency}
                defaultVat={defaultVat}
                isExpanded={isExpanded}
                onToggle={() => {
                  const newExpanded = new Set(expandedActivities);
                  if (isExpanded) {
                    newExpanded.delete(activity.id);
                  } else {
                    newExpanded.add(activity.id);
                  }
                  onToggleActivity(activity.id);
                }}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onAddResource={onAddResource}
                onUpdateResource={onUpdateResource}
                onRemoveResource={onRemoveResource}
                hideMargin={hideMargin}
                translations={t}
              />
            );
          })}

          {activities.length === 0 && resources.length > 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                <p>{t.createFirstActivity}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

