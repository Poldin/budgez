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
  signatureData?: { email: string; signedAt: string } | null;
}

// Helper function to format signature date
const formatSignatureDate = (dateString: string) => {
  const date = new Date(dateString);
  const dateStr = date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const hourStr = date.getHours().toString().padStart(2, '0');
  const minuteStr = date.getMinutes().toString().padStart(2, '0');
  return `${dateStr} ${hourStr}:${minuteStr}`;
};

export default function FloatingTotal({
  resources,
  activities,
  generalDiscount,
  generalMargin,
  currency,
  show,
  onScrollToActions,
  signatureData
}: FloatingTotalProps) {
  if (!show) return null;

  const total = calculateGrandTotal(resources, activities, generalDiscount, generalMargin);

  return (
    <div className="fixed bottom-6 right-6 z-40 animate-in slide-in-from-bottom-4 duration-300">
      <Card className={`shadow-2xl border-2 ${signatureData ? 'border-green-600 bg-gradient-to-r from-green-700 to-green-600' : 'border-gray-900 bg-gradient-to-r from-gray-900 to-gray-800'} text-white`}>
        <CardContent className="p-4">
          {signatureData ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎉</span>
                <p className="text-xl font-bold">
                  {currency}{formatNumber(total)}
                </p>
                <Button 
                  onClick={onScrollToActions} 
                  size="sm" 
                  variant="ghost"
                  className="text-white hover:bg-green-800 hover:text-white p-2 ml-auto"
                  title="Vai ai tasti finali"
                >
                  <FileDown className="h-5 w-5" />
                </Button>
              </div>
              <div className="text-xs text-green-100 border-t border-green-500 pt-2">
                <p className="font-medium">Firmato da {signatureData.email}</p>
                <p>{formatSignatureDate(signatureData.signedAt)}</p>
              </div>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

