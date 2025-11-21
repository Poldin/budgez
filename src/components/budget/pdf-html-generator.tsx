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

export interface PDFConfig {
  companyLogo?: string;
  companyName: string;
  companyInfo: string;
  headerText: string;
  contractTerms: string;
  signatureSection: {
    companyName: string;
    signerName: string;
    signerRole: string;
    date: string;
    place: string;
  };
}

export const generateGanttHTML = (
  activities: Activity[]
): string => {
  // Filtra attività con date
  const activitiesWithDates = activities.filter(a => a.startDate && a.endDate);
  if (activitiesWithDates.length === 0) return '';

  // Calcola date min/max e scala temporale
  const dates = activitiesWithDates.flatMap(a => [
    new Date(a.startDate!),
    new Date(a.endDate!)
  ]);
  const rawMinDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const rawMaxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  
  const durationDays = Math.ceil((rawMaxDate.getTime() - rawMinDate.getTime()) / (1000 * 60 * 60 * 24));
  const paddingDays = Math.max(1, Math.ceil(durationDays * 0.05));
  
  const minDate = new Date(rawMinDate);
  minDate.setDate(minDate.getDate() - paddingDays);
  const maxDate = new Date(rawMaxDate);
  maxDate.setDate(maxDate.getDate() + paddingDays);
  
  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Genera barre Gantt
  const ganttBars = activitiesWithDates.map((activity, idx) => {
    const start = new Date(activity.startDate!);
    const end = new Date(activity.endDate!);
    const offsetDays = Math.max(0, Math.ceil((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
    const barDurationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const leftPercent = (offsetDays / totalDays) * 100;
    const widthPercent = (barDurationDays / totalDays) * 100;
    
    const hue = (idx * 360) / activitiesWithDates.length;
    
    return `
      <div style="display: flex; align-items: center; margin-bottom: 12px; page-break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact;">
        <div style="width: 200px; flex-shrink: 0; padding-right: 16px;">
          <div style="font-size: 12px; font-weight: 600;">${activity.name}</div>
          <div style="font-size: 10px; color: #666;">
            ${start.toLocaleDateString('it-IT')} - ${end.toLocaleDateString('it-IT')}
          </div>
        </div>
        <div style="flex: 1; position: relative; height: 40px; background: #f5f5f5; border-radius: 4px; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact;">
          <div style="position: absolute; left: ${leftPercent}%; width: ${widthPercent}%; height: 28px; top: 6px; background: hsl(${hue}, 70%, 60%); border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 600; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; padding: 0 8px; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact;">
            ${activity.name}
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="page-break-before: always; margin-top: 40px; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact;">
      <h2 style="color: #1a1a1a; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px; margin-bottom: 20px; font-size: 20px;">
        Timeline Progetto
      </h2>
      <div style="font-size: 11px; color: #666; margin-bottom: 16px;">
        Periodo: ${minDate.toLocaleDateString('it-IT')} - ${maxDate.toLocaleDateString('it-IT')} • Durata: ${totalDays} giorni
      </div>
      ${ganttBars}
    </div>
  `;
};

export const generatePDFHTML = (
  resources: Resource[],
  activities: Activity[],
  generalDiscount: GeneralDiscount,
  currency: string,
  budgetName: string,
  pdfConfig: PDFConfig,
  language: Language = 'it'
): string => {
  const t = translations[language];
  const total = calculateGrandTotal(resources, activities, generalDiscount);
  const subtotal = calculateGrandSubtotal(resources, activities);
  const vatAmount = calculateGrandVat(resources, activities);
  const totalBeforeGeneralDiscount = calculateGrandTotalBeforeGeneralDiscount(resources, activities);
  const generalDiscountAmount = calculateGeneralDiscountAmount(resources, activities, generalDiscount);
  const ganttHTML = generateGanttHTML(activities);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Budgez - ${budgetName}</title>
      <style>
        @page {
          margin: 0;
        }
        @media print {
          body {
            margin: 1.5cm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
        body {
          font-family: Arial, sans-serif;
          padding: 30px;
          max-width: 1000px;
          margin: 0 auto;
          font-size: 12px;
          line-height: 1.6;
        }
        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          gap: 40px;
        }
        .company-section {
          flex: 0 0 40%;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .logo-section {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 15px;
          background-color: #fafafa;
          border: 1px solid #e5e5e5;
          border-radius: 4px;
          min-height: 100px;
        }
        .logo-section img {
          max-width: 100%;
          max-height: 80px;
          object-fit: contain;
        }
        .company-name {
          font-size: 18px;
          font-weight: bold;
          color: #1a1a1a;
          text-align: left;
          padding: 10px;
        }
        .company-info {
          font-size: 10px;
          color: #555;
          text-align: left;
          white-space: pre-wrap;
          line-height: 1.6;
        }
        .header-text {
          flex: 0 0 50%;
          padding: 15px;
          background-color: #f9f9f9;
          border: 0.5px solid #cccccc;
          white-space: pre-wrap;
          font-size: 11px;
          text-align: right;
          align-self: flex-start;
        }
        h1 {
          color: #1a1a1a;
          padding-bottom: 8px;
          margin-bottom: 20px;
          font-size: 24px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        th {
          background-color: #1a1a1a;
          color: white;
          padding: 8px 10px;
          text-align: left;
          font-weight: bold;
          font-size: 11px;
          text-transform: uppercase;
        }
        td {
          padding: 6px 10px;
          border-bottom: 1px solid #e5e5e5;
        }
        .activity-header {
          background-color: #f5f5f5;
          font-weight: bold;
          font-size: 13px;
        }
        .activity-desc {
          font-size: 11px;
          color: #666;
          font-style: italic;
          padding: 4px 10px;
        }
        .resource-row td {
          padding-left: 20px;
        }
        .activity-total-row {
          background-color: #f9f9f9;
          font-weight: bold;
          border-top: 2px solid #ddd;
        }
        .activity-total-row td {
          padding: 8px 10px;
        }
        .summary-section {
          margin-top: 20px;
          border: 2px solid #1a1a1a;
        }
        .summary-row {
          background-color: #f5f5f5;
        }
        .summary-row td {
          padding: 8px 10px;
          font-weight: bold;
        }
        .discount-row {
          background-color: #fef3c7;
          color: #b45309;
        }
        .discount-row td {
          padding: 8px 10px;
          font-weight: bold;
        }
        .grand-total-row {
          background-color: #1a1a1a;
          color: white;
        }
        .grand-total-row td {
          padding: 12px 10px;
          font-size: 16px;
          font-weight: bold;
        }
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
        .smaller {
          font-size: 10px;
        }
        .discount-badge {
          color: #b45309;
          font-size: 10px;
        }
        .contract-terms {
          margin-top: 40px;
          page-break-before: always;
          padding: 20px;
        }
        .contract-terms h2 {
          color: #1a1a1a;
          padding-bottom: 8px;
          margin-bottom: 15px;
          font-size: 18px;
        }
        .contract-terms-content {
          white-space: pre-wrap;
          font-size: 11px;
          line-height: 1.8;
        }
      </style>
    </head>
    <body>
      ${pdfConfig.companyLogo || pdfConfig.companyName || pdfConfig.headerText ? `
        <div class="header-container">
          <div class="company-section">
            ${pdfConfig.companyLogo ? `
              <div class="logo-section">
                <img src="${pdfConfig.companyLogo}" alt="Company Logo" />
              </div>
            ` : ''}
            ${pdfConfig.companyName ? `
              <div class="company-name">${pdfConfig.companyName}</div>
            ` : ''}
            ${pdfConfig.companyInfo ? `
              <div class="company-info">${pdfConfig.companyInfo}</div>
            ` : ''}
          </div>
          
          ${pdfConfig.headerText ? `
            <div class="header-text">${pdfConfig.headerText}</div>
          ` : ''}
        </div>
      ` : ''}
      
      <h1>${budgetName}</h1>
      
      <table>
        <thead>
          <tr>
            <th style="width: 30%;">${t.activityName}</th>
            <th style="width: 25%;">${t.resourceName}</th>
            <th style="width: 15%;" class="text-center">Dettagli</th>
            <th style="width: 10%;" class="text-right">${t.subtotal}</th>
            <th style="width: 10%;" class="text-right">IVA</th>
            <th style="width: 10%;" class="text-right">${t.total}</th>
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
              const detailText = resource.costType === 'hourly' 
                ? `${assignment.hours}h × ${currency}${formatNumber(resource.pricePerHour)}/h`
                : resource.costType === 'quantity'
                ? `${assignment.hours} × ${currency}${formatNumber(resource.pricePerHour)}/u`
                : `${currency}${formatNumber(assignment.fixedPrice)}`;
              
              rows += `
                <tr class="resource-row">
                  ${resIndex === 0 ? `
                    <td rowspan="${activity.resources.length + (activity.description ? 1 : 0)}" class="activity-header">
                      ${activity.name} - ${currency}${formatNumber(activityTotalWithVat)}
                    </td>
                  ` : ''}
                  <td>${resource.name}</td>
                  <td class="text-center smaller">${detailText}</td>
                  <td class="text-right">${currency}${formatNumber(cost)}</td>
                  ${resIndex === 0 ? `
                    <td rowspan="${activity.resources.length + (activity.description ? 1 : 0)}" class="text-right" style="vertical-align: top;">
                      ${currency}${formatNumber(activitySubtotal * activity.vat / 100)}<br/>
                      <span class="smaller">(${activity.vat}%)</span>
                    </td>
                    <td rowspan="${activity.resources.length + (activity.description ? 1 : 0)}" class="text-right" style="font-weight: bold; vertical-align: top;">
                      ${currency}${formatNumber(activityTotalWithVat)}
                      ${activity.discount?.enabled && activityDiscountAmount > 0 ? `<br/><span class="discount-badge">-${currency}${formatNumber(activityDiscountAmount)} ${t.discount}</span>` : ''}
                    </td>
                  ` : ''}
                </tr>
              `;
            });
            
            if (activity.description) {
              rows += `
                <tr>
                  <td colspan="2" class="activity-desc">${activity.description}</td>
                </tr>
              `;
            }
            
            rows += `
              <tr class="activity-total-row">
                <td colspan="3" class="text-right">${t.total} ${activity.name}:</td>
                <td class="text-right">${currency}${formatNumber(activitySubtotal)}</td>
                <td class="text-right">${currency}${formatNumber(activitySubtotal * activity.vat / 100)}</td>
                <td class="text-right">${currency}${formatNumber(activityTotalWithVat)}</td>
              </tr>
            `;
            
            return rows;
          }).join('')}
        </tbody>
      </table>
      
      <table class="summary-section">
        <tbody>
          <tr class="summary-row">
            <td style="width: 70%;" class="text-right">${t.subtotal}:</td>
            <td style="width: 30%;" class="text-right">${currency}${formatNumber(subtotal)}</td>
          </tr>
          <tr class="summary-row">
            <td class="text-right">${t.vatAmount}:</td>
            <td class="text-right">${currency}${formatNumber(vatAmount)}</td>
          </tr>
          ${calculateTotalActivityDiscounts(resources, activities) > 0 ? `
            <tr class="discount-row">
              <td class="text-right">${t.discount} ${t.activities}:</td>
              <td class="text-right">-${currency}${formatNumber(calculateTotalActivityDiscounts(resources, activities))}</td>
            </tr>
          ` : ''}
          ${generalDiscount.enabled && generalDiscountAmount > 0 ? `
            <tr class="summary-row">
              <td class="text-right">${t.beforeDiscount}:</td>
              <td class="text-right">${currency}${formatNumber(totalBeforeGeneralDiscount)}</td>
            </tr>
            <tr class="discount-row">
              <td class="text-right">${t.generalDiscount}:</td>
              <td class="text-right">-${currency}${formatNumber(generalDiscountAmount)}</td>
            </tr>
          ` : ''}
          <tr class="grand-total-row">
            <td class="text-right">${t.finalTotal}:</td>
            <td class="text-right">${currency}${formatNumber(total)}</td>
          </tr>
        </tbody>
      </table>
      
      ${ganttHTML}
      
      ${pdfConfig.contractTerms ? `
        <div class="contract-terms">
          <h2>Condizioni Contrattuali</h2>
          <div class="contract-terms-content">${pdfConfig.contractTerms}</div>
        </div>
      ` : ''}
    </body>
    </html>
  `;
};

