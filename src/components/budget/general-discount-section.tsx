'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumberInput } from "@/components/ui/number-input";
import { Switch } from "@/components/ui/switch";
import type { GeneralDiscount, GeneralMargin, Resource, Activity } from '@/types/budget';
import { formatNumber } from '@/lib/budget-utils';
import {
  calculateGrandTotalBeforeGeneralDiscount,
  calculateGeneralDiscountAmount,
  calculateGrandTotal,
  calculateGrandSubtotal
} from '@/lib/budget-calculations';

interface GeneralDiscountSectionProps {
  generalDiscount: GeneralDiscount;
  generalMargin?: GeneralMargin;
  resources: Resource[];
  activities: Activity[];
  currency: string;
  onUpdate: (discount: GeneralDiscount) => void;
  translations: any;
}

export default function GeneralDiscountSection({
  generalDiscount,
  generalMargin,
  resources,
  activities,
  currency,
  onUpdate,
  translations: t
}: GeneralDiscountSectionProps) {
  const totalBeforeDiscount = calculateGrandTotalBeforeGeneralDiscount(resources, activities);
  
  // Calcola il totale dopo il margine (se presente)
  let totalAfterMargin = totalBeforeDiscount;
  if (generalMargin?.enabled && generalMargin.value > 0) {
    totalAfterMargin = totalBeforeDiscount * (1 + generalMargin.value / 100);
  }
  
  // Calcola lo sconto sul totale con margine
  let discountAmount = 0;
  if (generalDiscount.enabled && generalDiscount.value > 0) {
    const subtotal = calculateGrandSubtotal(resources, activities);
    const baseAmount = generalDiscount.applyOn === 'taxable' 
      ? subtotal
      : totalAfterMargin;
    
    if (generalDiscount.type === 'percentage') {
      discountAmount = baseAmount * generalDiscount.value / 100;
    } else {
      discountAmount = generalDiscount.value;
    }
  }
  
  const totalAfterDiscount = calculateGrandTotal(resources, activities, generalDiscount, generalMargin);

  return (
    <Card className="mb-6 border-2 border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={generalDiscount.enabled}
            onCheckedChange={(checked) => onUpdate({
              ...generalDiscount,
              enabled: checked
            })}
          />
          <CardTitle className="text-lg font-semibold">{t.generalDiscount}</CardTitle>
        </div>
      </CardHeader>
      
      {generalDiscount.enabled && (
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-gray-500">{t.discountType}</Label>
                <Select
                  value={generalDiscount.type}
                  onValueChange={(value: 'percentage' | 'fixed') => onUpdate({
                    ...generalDiscount,
                    type: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">{t.percentage}</SelectItem>
                    <SelectItem value="fixed">{t.fixedAmount}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-gray-500">
                  {generalDiscount.type === 'percentage' ? t.percentage : `${t.fixedAmount} (${currency})`}
                </Label>
                <NumberInput
                  value={generalDiscount.value}
                  onChange={(value) => onUpdate({
                    ...generalDiscount,
                    value
                  })}
                  placeholder="0"
                  min={0}
                />
              </div>

              <div>
                <Label className="text-gray-500">{t.applyDiscountOn}</Label>
                <Select
                  value={generalDiscount.applyOn}
                  onValueChange={(value: 'taxable' | 'withVat') => onUpdate({
                    ...generalDiscount,
                    applyOn: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="taxable">{t.taxableAmount}</SelectItem>
                    <SelectItem value="withVat">{t.totalWithVatAmount}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {generalDiscount.value > 0 && (
              <div className="bg-white p-4 rounded-lg border-2 border-amber-300">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {generalMargin?.enabled && generalMargin.value > 0 ? t.afterMargin || 'Dopo Margine' : t.beforeDiscount}:
                    </span>
                    <span className="font-semibold">{currency}{formatNumber(totalAfterMargin)}</span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>{t.discountAmount}:</span>
                    <span className="font-semibold">-{currency}{formatNumber(discountAmount)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-amber-200">
                    <span className="font-semibold">{t.afterDiscount}:</span>
                    <span className="text-lg font-bold text-green-700">{currency}{formatNumber(totalAfterDiscount)}</span>
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

