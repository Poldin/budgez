'use client'

import React from 'react';
import type { Resource, Activity, GeneralDiscount } from '@/types/budget';
import {
  calculateGrandSubtotal,
  calculateGrandVat,
  calculateGrandTotalBeforeGeneralDiscount,
  calculateGeneralDiscountAmount,
  calculateGrandTotal,
  calculateTotalActivityDiscounts,
} from '@/lib/budget-calculations';
import { formatNumber } from '@/lib/budget-utils';
import { translations, type Language } from '@/lib/translations';

interface QuoteSummaryProps {
  resources: Resource[];
  activities: Activity[];
  generalDiscount: GeneralDiscount;
  currency: string;
  language?: Language;
}

export default function QuoteSummary({
  resources,
  activities,
  generalDiscount,
  currency,
  language = 'it'
}: QuoteSummaryProps) {
  const t = translations[language];
  const subtotal = calculateGrandSubtotal(resources, activities);
  const vatAmount = calculateGrandVat(resources, activities);
  const totalBeforeGeneralDiscount = calculateGrandTotalBeforeGeneralDiscount(resources, activities);
  const generalDiscountAmount = calculateGeneralDiscountAmount(resources, activities, generalDiscount);
  const total = calculateGrandTotal(resources, activities, generalDiscount);
  const totalActivityDiscounts = calculateTotalActivityDiscounts(resources, activities);

  return (
    <div className="mt-5">
      <table className="w-full border-collapse border-2 border-gray-900">
        <tbody>
          <tr className="bg-gray-100">
            <td className="w-[70%] p-2 text-right font-bold">{t.subtotal}:</td>
            <td className="w-[30%] p-2 text-right font-bold">{currency}{formatNumber(subtotal)}</td>
          </tr>
          <tr className="bg-gray-100">
            <td className="p-2 text-right font-bold">{t.vatAmount}:</td>
            <td className="p-2 text-right font-bold">{currency}{formatNumber(vatAmount)}</td>
          </tr>
          {totalActivityDiscounts > 0 && (
            <tr className="bg-amber-100 text-amber-900">
              <td className="p-2 text-right font-bold">
                {t.discount} {t.activities}:
              </td>
              <td className="p-2 text-right font-bold">
                -{currency}{formatNumber(totalActivityDiscounts)}
              </td>
            </tr>
          )}
          {generalDiscount.enabled && generalDiscountAmount > 0 && (
            <>
              <tr className="bg-gray-100">
                <td className="p-2 text-right font-bold">{t.beforeDiscount}:</td>
                <td className="p-2 text-right font-bold">
                  {currency}{formatNumber(totalBeforeGeneralDiscount)}
                </td>
              </tr>
              <tr className="bg-amber-100 text-amber-900">
                <td className="p-2 text-right font-bold">{t.generalDiscount}:</td>
                <td className="p-2 text-right font-bold">
                  -{currency}{formatNumber(generalDiscountAmount)}
                </td>
              </tr>
            </>
          )}
          <tr className="bg-gray-900 text-white">
            <td className="p-3 text-right font-bold text-base">{t.finalTotal}:</td>
            <td className="p-3 text-right font-bold text-base">{currency}{formatNumber(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

