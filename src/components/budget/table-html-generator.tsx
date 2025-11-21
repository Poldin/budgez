import type { Resource, Activity, GeneralDiscount } from '@/types/budget';
import type { Language } from '@/lib/translations';
import { translations } from '@/lib/translations';
import { formatNumber } from '@/lib/budget-utils';
import {
  calculateResourceCost,
  calculateActivityTotal,
  calculateActivityDiscountAmount,
  calculateActivityTotalWithVat,
  calculateGrandSubtotal,
  calculateGrandVat,
  calculateGrandTotalBeforeGeneralDiscount,
  calculateGeneralDiscountAmount,
  calculateGrandTotal,
  calculateTotalActivityDiscounts
} from '@/lib/budget-calculations';

export const generateTableHTML = (
  resources: Resource[],
  activities: Activity[],
  generalDiscount: GeneralDiscount,
  currency: string,
  language: Language = 'it'
): string => {
  const t = translations[language];
  const subtotal = calculateGrandSubtotal(resources, activities);
  const vatAmount = calculateGrandVat(resources, activities);
  const totalBeforeGeneralDiscount = calculateGrandTotalBeforeGeneralDiscount(resources, activities);
  const generalDiscountAmount = calculateGeneralDiscountAmount(resources, activities, generalDiscount);
  const total = calculateGrandTotal(resources, activities, generalDiscount);
  
  return `
    <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px;">
      <thead>
        <tr>
          <th style="background-color: #1a1a1a; color: white; padding: 8px 10px; text-align: left; font-weight: bold; border: 1px solid #ddd;">${t.activityName}</th>
          <th style="background-color: #1a1a1a; color: white; padding: 8px 10px; text-align: left; font-weight: bold; border: 1px solid #ddd;">${t.resourceName}</th>
          <th style="background-color: #1a1a1a; color: white; padding: 8px 10px; text-align: right; font-weight: bold; border: 1px solid #ddd;">${t.subtotal}</th>
          <th style="background-color: #1a1a1a; color: white; padding: 8px 10px; text-align: right; font-weight: bold; border: 1px solid #ddd;">IVA</th>
          <th style="background-color: #1a1a1a; color: white; padding: 8px 10px; text-align: right; font-weight: bold; border: 1px solid #ddd;">${t.total}</th>
        </tr>
      </thead>
      <tbody>
        ${activities.map((activity) => {
          const activitySubtotal = calculateActivityTotal(resources, activity);
          const activityDiscountAmount = calculateActivityDiscountAmount(resources, activity);
          const activityTotalWithVat = calculateActivityTotalWithVat(resources, activity);
          
          let rows = '';
          
          activity.resources.forEach((assignment, resIndex) => {
            const resource = resources.find(r => r.id === assignment.resourceId);
            if (!resource) return;
            
            const cost = calculateResourceCost(resources, assignment.resourceId, assignment.hours, assignment.fixedPrice);
            
            // Formatta le date se presenti
            let dateRange = '';
            if (activity.startDate && activity.endDate) {
              const startDate = new Date(activity.startDate);
              const endDate = new Date(activity.endDate);
              dateRange = `<div style="font-size: 10px; color: #666; font-weight: normal; margin-top: 2px;">${startDate.toLocaleDateString('it-IT')} - ${endDate.toLocaleDateString('it-IT')}</div>`;
            }
            
            rows += `
              <tr>
                ${resIndex === 0 ? `
                  <td rowspan="${activity.resources.length + (activity.description ? 1 : 0)}" style="background-color: #f5f5f5; font-weight: bold; padding: 6px 10px; border: 1px solid #ddd;">
                    <div>${activity.name}</div>
                    ${dateRange}
                  </td>
                ` : ''}
                <td style="padding: 6px 10px 6px 20px; border: 1px solid #ddd;">${resource.name}</td>
                <td style="text-align: right; padding: 6px 10px; border: 1px solid #ddd;">${currency}${formatNumber(cost)}</td>
                ${resIndex === 0 ? `
                  <td rowspan="${activity.resources.length + (activity.description ? 1 : 0)}" style="text-align: right; padding: 6px 10px; border: 1px solid #ddd; vertical-align: top;">
                    <div>${currency}${formatNumber(activitySubtotal * activity.vat / 100)}</div>
                    <div style="font-size: 10px;">(${activity.vat}%)</div>
                  </td>
                  <td rowspan="${activity.resources.length + (activity.description ? 1 : 0)}" style="text-align: right; padding: 6px 10px; border: 1px solid #ddd; vertical-align: top;">
                    ${currency}${formatNumber(activityTotalWithVat)}
                    ${activity.discount?.enabled && activityDiscountAmount > 0 ? `<div style="font-size: 10px; color: #b45309;">-${currency}${formatNumber(activityDiscountAmount)} ${t.discount}</div>` : ''}
                  </td>
                ` : ''}
              </tr>
            `;
          });
          
          if (activity.description) {
            rows += `
              <tr>
                <td colspan="2" style="font-size: 11px; color: #666; font-style: italic; padding: 4px 10px; border: 1px solid #ddd;">
                  ${activity.description}
                </td>
              </tr>
            `;
          }
          
          rows += `
            <tr style="background-color: #f9f9f9; font-weight: bold;">
              <td colspan="2" style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;"></td>
              <td style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${currency}${formatNumber(activitySubtotal)}</td>
              <td style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${currency}${formatNumber(activitySubtotal * activity.vat / 100)}</td>
              <td style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${currency}${formatNumber(activityTotalWithVat)}</td>
            </tr>
          `;
          
          return rows;
        }).join('')}
      </tbody>
      <tfoot>
        <tr style="background-color: #f5f5f5; font-weight: bold;">
          <td colspan="4" style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${t.subtotal}:</td>
          <td style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${currency}${formatNumber(subtotal)}</td>
        </tr>
        <tr style="background-color: #f5f5f5; font-weight: bold;">
          <td colspan="4" style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${t.vatAmount}:</td>
          <td style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${currency}${formatNumber(vatAmount)}</td>
        </tr>
        ${calculateTotalActivityDiscounts(resources, activities) > 0 ? `
          <tr style="background-color: #fef3c7; font-weight: bold; color: #b45309;">
            <td colspan="4" style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${t.discount} ${t.activities}:</td>
            <td style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">-${currency}${formatNumber(calculateTotalActivityDiscounts(resources, activities))}</td>
          </tr>
        ` : ''}
        ${generalDiscount.enabled && generalDiscountAmount > 0 ? `
          <tr style="background-color: #fef3c7; font-weight: bold;">
            <td colspan="4" style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${t.beforeDiscount}:</td>
            <td style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${currency}${formatNumber(totalBeforeGeneralDiscount)}</td>
          </tr>
          <tr style="background-color: #fef3c7; font-weight: bold; color: #b45309;">
            <td colspan="4" style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">${t.generalDiscount}:</td>
            <td style="text-align: right; padding: 8px 10px; border: 1px solid #ddd;">-${currency}${formatNumber(generalDiscountAmount)}</td>
          </tr>
        ` : ''}
        <tr style="background-color: #1a1a1a; color: white; font-weight: bold;">
          <td colspan="4" style="text-align: right; padding: 12px 10px; font-size: 16px; border: 1px solid #ddd;"></td>
          <td style="text-align: right; padding: 12px 10px; font-size: 16px; border: 1px solid #ddd;">${currency}${formatNumber(total)}</td>
        </tr>
      </tfoot>
    </table>
  `;
};

