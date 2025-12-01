'use client'

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import type { Resource, Activity, GeneralDiscount, GeneralMargin } from '@/types/budget';
import { formatNumber } from '@/lib/budget-utils';
import {
  calculateGrandSubtotal,
  calculateGrandVat,
  calculateTotalActivityDiscounts,
  calculateGeneralMarginAmount,
  calculateGeneralDiscountAmount,
  calculateGrandTotal,
  calculateTotalMarginAmount,
  calculateTotalMarginPercentage
} from '@/lib/budget-calculations';

interface FinalTotalCardProps {
  resources: Resource[];
  activities: Activity[];
  generalDiscount: GeneralDiscount;
  generalMargin?: GeneralMargin;
  currency: string;
  translations: any;
}

export default function FinalTotalCard({
  resources,
  activities,
  generalDiscount,
  generalMargin,
  currency,
  translations: t
}: FinalTotalCardProps) {
  const subtotal = calculateGrandSubtotal(resources, activities);
  const vatAmount = calculateGrandVat(resources, activities);
  const totalActivityDiscounts = calculateTotalActivityDiscounts(resources, activities);
  const generalMarginAmount = calculateGeneralMarginAmount(resources, activities, generalMargin);
  const generalDiscountAmount = calculateGeneralDiscountAmount(resources, activities, generalDiscount, generalMargin);
  const grandTotal = calculateGrandTotal(resources, activities, generalDiscount, generalMargin);
  
  // Calcola il margine totale assoluto e la percentuale finale
  const totalMarginAmount = calculateTotalMarginAmount(resources, activities, generalMargin);
  const totalMarginPercentage = calculateTotalMarginPercentage(resources, activities, generalMargin);

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
              {generalMargin?.enabled && generalMargin.value > 0 && (
                <>
                  <span>•</span>
                  <span className="text-blue-300">{t.generalMargin}: +{currency}{formatNumber(generalMarginAmount)}</span>
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
          {totalMarginAmount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex justify-center items-center gap-4 text-sm opacity-80">
                <span className="text-blue-300">
                  {t.margin}: +{currency}{formatNumber(totalMarginAmount)}
                </span>
                <span>•</span>
                <span className="text-blue-300">
                  {t.margin} {t.percentage}: {formatNumber(totalMarginPercentage)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

