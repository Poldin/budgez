'use client'

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown } from 'lucide-react';
import type { Resource, Activity, GeneralDiscount, GeneralMargin } from '@/types/budget';
import { formatNumber } from '@/lib/budget-utils';
import { calculateGrandTotal } from '@/lib/budget-calculations';

interface FloatingTotalProps {
  resources: Resource[];
  activities: Activity[];
  generalDiscount: GeneralDiscount;
  generalMargin?: GeneralMargin;
  currency: string;
  show: boolean;
  onScrollToActions: () => void;
}

export default function FloatingTotal({
  resources,
  activities,
  generalDiscount,
  generalMargin,
  currency,
  show,
  onScrollToActions
}: FloatingTotalProps) {
  if (!show) return null;

  const total = calculateGrandTotal(resources, activities, generalDiscount, generalMargin);

  return (
    <div className="fixed bottom-6 right-6 z-40 animate-in slide-in-from-bottom-4 duration-300">
      <Card className="shadow-2xl border-2 border-gray-900 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <p className="text-2xl font-bold">
              {currency}{formatNumber(total)}
            </p>
            <Button 
              onClick={onScrollToActions} 
              size="sm" 
              variant="ghost"
              className="text-white hover:bg-gray-700 hover:text-white p-2"
              title="Vai ai tasti finali"
            >
              <FileDown className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

