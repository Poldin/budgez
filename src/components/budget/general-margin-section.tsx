'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { Switch } from "@/components/ui/switch";
import type { GeneralMargin, Resource, Activity } from '@/types/budget';
import { formatNumber } from '@/lib/budget-utils';
import {
  calculateGrandTotalBeforeGeneralDiscount,
  calculateGeneralDiscountAmount,
  calculateGrandTotal
} from '@/lib/budget-calculations';
import type { GeneralDiscount } from '@/types/budget';

interface GeneralMarginSectionProps {
  generalMargin: GeneralMargin;
  generalDiscount: GeneralDiscount;
  resources: Resource[];
  activities: Activity[];
  currency: string;
  onUpdate: (margin: GeneralMargin) => void;
  translations: any;
}

export default function GeneralMarginSection({
  generalMargin,
  generalDiscount,
  resources,
  activities,
  currency,
  onUpdate,
  translations: t
}: GeneralMarginSectionProps) {
  const totalBeforeDiscount = calculateGrandTotalBeforeGeneralDiscount(resources, activities);
  const totalAfterMargin = generalMargin.enabled && generalMargin.value > 0
    ? totalBeforeDiscount * (1 + generalMargin.value / 100)
    : totalBeforeDiscount;
  const marginAmount = generalMargin.enabled && generalMargin.value > 0 
    ? totalBeforeDiscount * (generalMargin.value / 100)
    : 0;
  const totalAfterDiscount = calculateGrandTotal(resources, activities, generalDiscount, generalMargin);

  return (
    <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={generalMargin.enabled}
            onCheckedChange={(checked) => onUpdate({
              ...generalMargin,
              enabled: checked
            })}
          />
          <CardTitle className="text-lg font-semibold">{t.generalMargin}</CardTitle>
        </div>
      </CardHeader>
      
      {generalMargin.enabled && (
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500">{t.percentage}</Label>
                <div className="max-w-20">
                  <NumberInput
                    value={generalMargin.value}
                    onChange={(value) => onUpdate({
                      ...generalMargin,
                      value: value || 0
                    })}
                    placeholder="0"
                    min={0}
                    max={100}
                  />
                </div>
              </div>
            </div>

            {generalMargin.value > 0 && (
              <div className="bg-white p-4 rounded-lg border-2 border-blue-300">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.beforeDiscount}:</span>
                    <span className="font-semibold">{currency}{formatNumber(totalBeforeDiscount)}</span>
                  </div>
                  <div className="flex justify-between text-blue-700">
                    <span>{t.margin}:</span>
                    <span className="font-semibold">+{currency}{formatNumber(marginAmount)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-200">
                    <span className="font-semibold">{t.afterMargin || 'Dopo Margine'}:</span>
                    <span className="text-lg font-bold text-green-700">{currency}{formatNumber(totalAfterMargin)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

