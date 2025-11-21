'use client'

import React from 'react';
import type { Resource, Activity } from '@/types/budget';
import { formatNumber } from '@/lib/budget-utils';
import {
  calculateResourceCost,
  calculateActivityTotal,
  calculateActivityDiscountAmount,
  calculateActivityTotalWithVat,
} from '@/lib/budget-calculations';
import { translations, type Language } from '@/lib/translations';

interface QuoteActivitiesTableProps {
  resources: Resource[];
  activities: Activity[];
  currency: string;
  language?: Language;
}

export default function QuoteActivitiesTable({
  resources,
  activities,
  currency,
  language = 'it'
}: QuoteActivitiesTableProps) {
  const t = translations[language];

  return (
    <div className="mb-8">
      <table className="w-full border-collapse my-4">
        <thead>
          <tr>
            <th className="w-[30%] bg-gray-900 text-white p-2 text-left font-bold text-xs uppercase">
              {t.activityName}
            </th>
            <th className="w-[25%] bg-gray-900 text-white p-2 text-left font-bold text-xs uppercase">
              {t.resourceName}
            </th>
            <th className="w-[15%] bg-gray-900 text-white p-2 text-center font-bold text-xs uppercase">
              Dettagli
            </th>
            <th className="w-[10%] bg-gray-900 text-white p-2 text-right font-bold text-xs uppercase">
              {t.subtotal}
            </th>
            <th className="w-[10%] bg-gray-900 text-white p-2 text-right font-bold text-xs uppercase">
              IVA
            </th>
            <th className="w-[10%] bg-gray-900 text-white p-2 text-right font-bold text-xs uppercase">
              {t.total}
            </th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity) => {
            const activitySubtotal = calculateActivityTotal(resources, activity);
            const activityDiscountAmount = calculateActivityDiscountAmount(resources, activity);
            const activityTotalWithVat = calculateActivityTotalWithVat(resources, activity);
            const rowSpan = activity.resources.length + (activity.description ? 1 : 0);
            
            return (
              <React.Fragment key={activity.id}>
                {activity.resources.map((assignment, resIndex) => {
                  const resource = resources.find(r => r.id === assignment.resourceId);
                  if (!resource) return null;
                  
                  const cost = calculateResourceCost(resources, assignment.resourceId, assignment.hours, assignment.fixedPrice);
                  const detailText = resource.costType === 'hourly' 
                    ? `${assignment.hours}h × ${currency}${formatNumber(resource.pricePerHour)}/h`
                    : resource.costType === 'quantity'
                    ? `${assignment.hours} × ${currency}${formatNumber(resource.pricePerHour)}/u`
                    : `${currency}${formatNumber(assignment.fixedPrice)}`;
                  
                  if (resIndex === 0) {
                    return (
                      <tr key={`${activity.id}-${resIndex}`} className="bg-gray-100 font-bold text-sm">
                        <td rowSpan={rowSpan} className="p-2 align-top">
                          {activity.name} - {currency}{formatNumber(activityTotalWithVat)}
                        </td>
                        <td className="p-2 pl-5">{resource.name}</td>
                        <td className="p-2 text-center text-xs">{detailText}</td>
                        <td className="p-2 text-right">{currency}{formatNumber(cost)}</td>
                        <td rowSpan={rowSpan} className="p-2 text-right align-top">
                          {currency}{formatNumber(activitySubtotal * activity.vat / 100)}
                          <br/>
                          <span className="text-xs">({activity.vat}%)</span>
                        </td>
                        <td rowSpan={rowSpan} className="p-2 text-right font-bold align-top">
                          {currency}{formatNumber(activityTotalWithVat)}
                          {activity.discount?.enabled && activityDiscountAmount > 0 && (
                            <>
                              <br/>
                              <span className="text-xs text-amber-700">
                                -{currency}{formatNumber(activityDiscountAmount)} {t.discount}
                              </span>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  }
                  
                  return (
                    <tr key={`${activity.id}-${resIndex}`}>
                      <td className="p-2 pl-5">{resource.name}</td>
                      <td className="p-2 text-center text-xs">{detailText}</td>
                      <td className="p-2 text-right">{currency}{formatNumber(cost)}</td>
                    </tr>
                  );
                })}
                
                {activity.description && (
                  <tr>
                    <td colSpan={3} className="p-1 pl-5 text-xs text-gray-600 italic">
                      {activity.description}
                    </td>
                  </tr>
                )}
                
                <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                  <td colSpan={3} className="p-2 text-right">
                    {t.total} {activity.name}:
                  </td>
                  <td className="p-2 text-right">{currency}{formatNumber(activitySubtotal)}</td>
                  <td className="p-2 text-right">{currency}{formatNumber(activitySubtotal * activity.vat / 100)}</td>
                  <td className="p-2 text-right">{currency}{formatNumber(activityTotalWithVat)}</td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

