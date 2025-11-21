'use client'

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import type { Resource, Activity, GeneralDiscount } from '@/types/budget';
import { formatNumber } from '@/lib/budget-utils';
import {
  calculateGrandSubtotal,
  calculateGrandVat,
  calculateTotalActivityDiscounts,
  calculateGeneralDiscountAmount,
  calculateGrandTotal
} from '@/lib/budget-calculations';

interface FinalTotalCardProps {
  resources: Resource[];
  activities: Activity[];
  generalDiscount: GeneralDiscount;
  currency: string;
  translations: any;
}

export default function FinalTotalCard({
  resources,
  activities,
  generalDiscount,
  currency,
  translations: t
}: FinalTotalCardProps) {
  const subtotal = calculateGrandSubtotal(resources, activities);
  const vatAmount = calculateGrandVat(resources, activities);
  const totalActivityDiscounts = calculateTotalActivityDiscounts(resources, activities);
  const generalDiscountAmount = calculateGeneralDiscountAmount(resources, activities, generalDiscount);
  const grandTotal = calculateGrandTotal(resources, activities, generalDiscount);

  return (
    <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white mb-8">
      <CardContent className="pt-8 pb-8">
        <div className="text-center">
          <div className="space-y-3 mb-4">
            <div className="flex justify-center items-center gap-4 text-sm opacity-80 flex-wrap">
              <span>{t.subtotal}: {currency}{formatNumber(subtotal)}</span>
              <span>•</span>
              <span>{t.vatAmount}: {currency}{formatNumber(vatAmount)}</span>
              {totalActivityDiscounts > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-300">{t.discount} {t.activities}: -{currency}{formatNumber(totalActivityDiscounts)}</span>
                </>
              )}
              {generalDiscount.enabled && generalDiscount.value > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-300">{t.generalDiscount}: -{currency}{formatNumber(generalDiscountAmount)}</span>
                </>
              )}
            </div>
          </div>
          <p className="text-sm font-medium mb-2 opacity-90">{t.finalTotal}</p>
          <p className="text-6xl font-bold">
            {currency}{formatNumber(grandTotal)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

