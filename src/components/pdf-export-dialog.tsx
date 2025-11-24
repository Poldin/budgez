'use client'

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileDown, FileText, Upload, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { contractTemplates} from '@/lib/contract-templates';
import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, WidthType, AlignmentType, HeadingLevel, ImageRun } from 'docx';
import { saveAs } from 'file-saver';


interface Resource {
  id: string;
  name: string;
  costType: 'hourly' | 'quantity' | 'fixed';
  pricePerHour: number;
}

interface ResourceAssignment {
  resourceId: string;
  hours: number;
  fixedPrice: number;
}

interface ActivityDiscount {
  enabled: boolean;
  type: 'percentage' | 'fixed';
  value: number;
  applyOn: 'taxable' | 'withVat';
}

interface Activity {
  id: string;
  name: string;
  description: string;
  resources: ResourceAssignment[];
  vat: number;
  discount?: ActivityDiscount;
  startDate?: string;
  endDate?: string;
}

interface GeneralDiscount {
  enabled: boolean;
  type: 'percentage' | 'fixed';
  value: number;
  applyOn: 'taxable' | 'withVat';
}

interface PDFConfig {
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

interface PDFExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetName: string;
  currency: string;
  resources: Resource[];
  activities: Activity[];
  generalDiscount: GeneralDiscount;
  translations: {
    activityName: string;
    resourceName: string;
    subtotal: string;
    total: string;
    vatAmount: string;
    discount: string;
    activities: string;
    beforeDiscount: string;
    generalDiscount: string;
    finalTotal: string;
  };
  formatNumber: (num: number) => string;
  calculateResourceCost: (resourceId: string, hours: number, fixedPrice: number) => number;
  calculateActivityTotal: (activity: Activity) => number;
  calculateActivityDiscountAmount: (activity: Activity) => number;
  calculateActivityTotalWithVat: (activity: Activity) => number;
  calculateGrandSubtotal: () => number;
  calculateGrandVat: () => number;
  calculateGrandTotalBeforeGeneralDiscount: () => number;
  calculateGeneralDiscountAmount: () => number;
  calculateGrandTotal: () => number;
  calculateTotalActivityDiscounts: () => number;
  generateGanttHTML: () => string;
}

export default function PDFExportDialog({
  open,
  onOpenChange,
  budgetName,
  currency,
  resources,
  activities,
  generalDiscount,
  translations: t,
  formatNumber,
  calculateResourceCost,
  calculateActivityTotal,
  calculateActivityDiscountAmount,
  calculateActivityTotalWithVat,
  calculateGrandSubtotal,
  calculateGrandVat,
  calculateGrandTotalBeforeGeneralDiscount,
  calculateGeneralDiscountAmount,
  calculateGrandTotal,
  calculateTotalActivityDiscounts,
  generateGanttHTML,
}: PDFExportDialogProps) {
  const [pdfConfig, setPdfConfig] = useState<PDFConfig>({
    companyName: '',
    companyInfo: `[Nome Azienda]
P. IVA [Partita IVA]
[Indirizzo]
[CAP] - [Città] ([Provincia])
Tel. [Telefono]
[www.sitoweb.it]
[email@azienda.it]`,
    headerText: `Spett.le
[NOME AZIENDA/ENTE]
[INDIRIZZO]
[CAP] [CITTÀ] ([PROVINCIA])
CF/P.IVA: [CODICE FISCALE]

Alla cortese attenzione di [NOME REFERENTE]`,
    contractTerms: `CONDIZIONI DI PAGAMENTO:
• Acconto del 30% alla firma del contratto
• Saldo alla consegna del progetto/servizio
• Pagamenti tramite bonifico bancario entro [GIORNI] giorni dalla data fattura

VALIDITÀ DELL'OFFERTA:
• La presente offerta ha validità di [GIORNI] giorni dalla data di emissione

TERMINI DI CONSEGNA:
• Il completamento del progetto è previsto entro [TEMPO] dalla firma del contratto
• Eventuali ritardi dovuti a causa di forza maggiore non sono imputabili al fornitore

GARANZIA:
• [MESI] mesi di garanzia su difetti di fabbricazione o malfunzionamenti


________________________________________________________________________________________


FIRMA PER ACCETTAZIONE


Data ________________________


Nome del firmatario _______________________________

Firma _______________________________`,
    signatureSection: {
      companyName: '[NOME AZIENDA]',
      signerName: '[NOME E COGNOME]',
      signerRole: '[RUOLO]',
      date: new Date().toLocaleDateString('it-IT'),
      place: '[CITTÀ]',
    },
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setPdfConfig({ ...pdfConfig, companyLogo: result, companyName: '' }); // Rimuove il nome se c'è il logo
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setPdfConfig({ ...pdfConfig, companyLogo: undefined });
  };

  const handleCompanyNameChange = (value: string) => {
    if (value) {
      // Se viene inserito il nome, rimuove il logo
      setLogoPreview(null);
      setPdfConfig({ ...pdfConfig, companyName: value, companyLogo: undefined });
    } else {
      setPdfConfig({ ...pdfConfig, companyName: value });
    }
  };

  const generatePDFHTML = (): string => {
    const total = calculateGrandTotal();
    const subtotal = calculateGrandSubtotal();
    const vatAmount = calculateGrandVat();
    const totalBeforeGeneralDiscount = calculateGrandTotalBeforeGeneralDiscount();
    const generalDiscountAmount = calculateGeneralDiscountAmount();
    const ganttHTML = generateGanttHTML();

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
          .signature-section {
            margin-top: 50px;
            page-break-inside: avoid;
          }
          .signature-section h2 {
            color: #1a1a1a;
            border-bottom: 2px solid #1a1a1a;
            padding-bottom: 8px;
            margin-bottom: 20px;
            font-size: 18px;
          }
          .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-top: 20px;
          }
          .signature-box {
            padding: 20px;
            border: 1px solid #ddd;
            background-color: #fafafa;
          }
          .signature-field {
            margin-bottom: 15px;
          }
          .signature-field label {
            font-weight: bold;
            font-size: 10px;
            text-transform: uppercase;
            color: #666;
            display: block;
            margin-bottom: 4px;
          }
          .signature-field .value {
            font-size: 12px;
            color: #1a1a1a;
          }
          .signature-line {
            margin-top: 40px;
            border-top: 2px solid #1a1a1a;
            padding-top: 8px;
            text-align: center;
            font-size: 10px;
            color: #666;
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
              const activitySubtotal = calculateActivityTotal(activity);
              const activityDiscountAmount = calculateActivityDiscountAmount(activity);
              const activityTotalWithVat = calculateActivityTotalWithVat(activity);
              
              let rows = '';
              
              // Activity resources
              activity.resources.forEach((assignment, resIndex) => {
                const resource = resources.find(r => r.id === assignment.resourceId);
                if (!resource) return;
                
                const cost = calculateResourceCost(assignment.resourceId, assignment.hours, assignment.fixedPrice);
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
              
              // Activity description (if exists)
              if (activity.description) {
                rows += `
                  <tr>
                    <td colspan="2" class="activity-desc">${activity.description}</td>
                  </tr>
                `;
              }
              
              // Activity total row
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
            ${calculateTotalActivityDiscounts() > 0 ? `
              <tr class="discount-row">
                <td class="text-right">${t.discount} ${t.activities}:</td>
                <td class="text-right">-${currency}${formatNumber(calculateTotalActivityDiscounts())}</td>
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

  const handleExportDocx = async () => {
    try {
      const total = calculateGrandTotal();
      const subtotal = calculateGrandSubtotal();
      const vatAmount = calculateGrandVat();
      const totalBeforeGeneralDiscount = calculateGrandTotalBeforeGeneralDiscount();
      const generalDiscountAmount = calculateGeneralDiscountAmount();

      // Crea il documento
      const docChildren: (Paragraph | Table)[] = [];

      // Header section
      const headerParagraphs: Paragraph[] = [];
      
      // Company info (left side)
      if (pdfConfig.companyLogo) {
        try {
          // Converti base64 in blob per l'immagine
          const mimeType = pdfConfig.companyLogo.split(',')[0].split(':')[1].split(';')[0];
          
          // Fetch per convertire in Blob
          const response = await fetch(pdfConfig.companyLogo);
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const imageBuffer = new Uint8Array(arrayBuffer);
          
          headerParagraphs.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: imageBuffer,
                  transformation: {
                    width: 200,
                    height: 80,
                  },
                  type: mimeType.includes('png') ? 'png' : 'jpg',
                }),
              ],
            })
          );
        } catch (error) {
          console.error('Error adding logo to DOCX:', error);
        }
      }
      
      if (pdfConfig.companyName) {
        headerParagraphs.push(
          new Paragraph({
            text: pdfConfig.companyName,
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          })
        );
      }
      
      if (pdfConfig.companyInfo) {
        pdfConfig.companyInfo.split('\n').forEach(line => {
          headerParagraphs.push(
            new Paragraph({
              text: line,
              spacing: { after: 100 },
            })
          );
        });
      }

      // Header text (right side) 
      if (pdfConfig.headerText) {
        headerParagraphs.push(
          new Paragraph({
            text: '',
            spacing: { after: 200 },
          })
        );
        pdfConfig.headerText.split('\n').forEach(line => {
          headerParagraphs.push(
            new Paragraph({
              text: line,
              alignment: AlignmentType.RIGHT,
              spacing: { after: 100 },
            })
          );
        });
      }

      docChildren.push(...headerParagraphs);

      // Title
      docChildren.push(
        new Paragraph({
          text: budgetName,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 400 },
        })
      );

      // Activities table
      const tableRows: TableRow[] = [];

      // Header row
      tableRows.push(
        new TableRow({
          tableHeader: true,
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: t.activityName, bold: true, color: 'FFFFFF' })] })],
              width: { size: 30, type: WidthType.PERCENTAGE },
              shading: { fill: '1a1a1a' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: t.resourceName, bold: true, color: 'FFFFFF' })] })],
              width: { size: 25, type: WidthType.PERCENTAGE },
              shading: { fill: '1a1a1a' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Dettagli', bold: true, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
              width: { size: 15, type: WidthType.PERCENTAGE },
              shading: { fill: '1a1a1a' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: t.subtotal, bold: true, color: 'FFFFFF' })], alignment: AlignmentType.RIGHT })],
              width: { size: 10, type: WidthType.PERCENTAGE },
              shading: { fill: '1a1a1a' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'IVA', bold: true, color: 'FFFFFF' })], alignment: AlignmentType.RIGHT })],
              width: { size: 10, type: WidthType.PERCENTAGE },
              shading: { fill: '1a1a1a' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: t.total, bold: true, color: 'FFFFFF' })], alignment: AlignmentType.RIGHT })],
              width: { size: 10, type: WidthType.PERCENTAGE },
              shading: { fill: '1a1a1a' },
            }),
          ],
        })
      );

      // Activity rows
      activities.forEach((activity) => {
        const activitySubtotal = calculateActivityTotal(activity);
        const activityDiscountAmount = calculateActivityDiscountAmount(activity);
        const activityTotalWithVat = calculateActivityTotalWithVat(activity);

        // Resources
        activity.resources.forEach((assignment, resIndex) => {
          const resource = resources.find(r => r.id === assignment.resourceId);
          if (!resource) return;

          const cost = calculateResourceCost(assignment.resourceId, assignment.hours, assignment.fixedPrice);
          const detailText = resource.costType === 'hourly' 
            ? `${assignment.hours}h × ${currency}${formatNumber(resource.pricePerHour)}/h`
            : resource.costType === 'quantity'
            ? `${assignment.hours} × ${currency}${formatNumber(resource.pricePerHour)}/u`
            : `${currency}${formatNumber(assignment.fixedPrice)}`;

          const rowCells: TableCell[] = [];

          if (resIndex === 0) {
            rowCells.push(
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `${activity.name} - ${currency}${formatNumber(activityTotalWithVat)}`,
                        bold: true,
                      }),
                    ],
                  }),
                ],
                rowSpan: activity.resources.length + (activity.description ? 1 : 0),
                shading: { fill: 'f5f5f5' },
              })
            );
          }

          rowCells.push(
            new TableCell({
              children: [new Paragraph({ text: resource.name })],
            }),
            new TableCell({
              children: [new Paragraph({ text: detailText, alignment: AlignmentType.CENTER })],
            }),
            new TableCell({
              children: [new Paragraph({ text: `${currency}${formatNumber(cost)}`, alignment: AlignmentType.RIGHT })],
            })
          );

          if (resIndex === 0) {
            rowCells.push(
              new TableCell({
                children: [
                  new Paragraph({ 
                    text: `${currency}${formatNumber(activitySubtotal * activity.vat / 100)}`, 
                    alignment: AlignmentType.RIGHT 
                  }),
                  new Paragraph({ 
                    text: `(${activity.vat}%)`, 
                    alignment: AlignmentType.RIGHT 
                  }),
                ],
                rowSpan: activity.resources.length + (activity.description ? 1 : 0),
              }),
              new TableCell({
                children: [
                  new Paragraph({ 
                    children: [
                      new TextRun({
                        text: `${currency}${formatNumber(activityTotalWithVat)}`,
                        bold: true,
                      }),
                    ],
                    alignment: AlignmentType.RIGHT,
                  }),
                  ...(activity.discount?.enabled && activityDiscountAmount > 0 ? [
                    new Paragraph({ 
                      text: `-${currency}${formatNumber(activityDiscountAmount)} ${t.discount}`, 
                      alignment: AlignmentType.RIGHT,
                    })
                  ] : []),
                ],
                rowSpan: activity.resources.length + (activity.description ? 1 : 0),
              })
            );
          }

          tableRows.push(new TableRow({ children: rowCells }));
        });

        // Description row
        if (activity.description) {
          tableRows.push(
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: activity.description, italics: true })] })],
                  columnSpan: 2,
                }),
              ],
            })
          );
        }

        // Activity total row
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: `${t.total} ${activity.name}:`, bold: true })], alignment: AlignmentType.RIGHT })],
                columnSpan: 3,
                shading: { fill: 'f9f9f9' },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: `${currency}${formatNumber(activitySubtotal)}`, bold: true })], alignment: AlignmentType.RIGHT })],
                shading: { fill: 'f9f9f9' },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: `${currency}${formatNumber(activitySubtotal * activity.vat / 100)}`, bold: true })], alignment: AlignmentType.RIGHT })],
                shading: { fill: 'f9f9f9' },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: `${currency}${formatNumber(activityTotalWithVat)}`, bold: true })], alignment: AlignmentType.RIGHT })],
                shading: { fill: 'f9f9f9' },
              }),
            ],
          })
        );
      });

      const activitiesTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows,
      });

      docChildren.push(activitiesTable);

      // Summary table
      const summaryRows: TableRow[] = [];

      summaryRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `${t.subtotal}:`, bold: true })], alignment: AlignmentType.RIGHT })],
              width: { size: 70, type: WidthType.PERCENTAGE },
              shading: { fill: 'f5f5f5' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `${currency}${formatNumber(subtotal)}`, bold: true })], alignment: AlignmentType.RIGHT })],
              width: { size: 30, type: WidthType.PERCENTAGE },
              shading: { fill: 'f5f5f5' },
            }),
          ],
        })
      );

      summaryRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `${t.vatAmount}:`, bold: true })], alignment: AlignmentType.RIGHT })],
              shading: { fill: 'f5f5f5' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `${currency}${formatNumber(vatAmount)}`, bold: true })], alignment: AlignmentType.RIGHT })],
              shading: { fill: 'f5f5f5' },
            }),
          ],
        })
      );

      if (calculateTotalActivityDiscounts() > 0) {
        summaryRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: `${t.discount} ${t.activities}:`, bold: true })], alignment: AlignmentType.RIGHT })],
                shading: { fill: 'fef3c7' },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: `-${currency}${formatNumber(calculateTotalActivityDiscounts())}`, bold: true })], alignment: AlignmentType.RIGHT })],
                shading: { fill: 'fef3c7' },
              }),
            ],
          })
        );
      }

      if (generalDiscount.enabled && generalDiscountAmount > 0) {
        summaryRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: `${t.beforeDiscount}:`, bold: true })], alignment: AlignmentType.RIGHT })],
                shading: { fill: 'f5f5f5' },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: `${currency}${formatNumber(totalBeforeGeneralDiscount)}`, bold: true })], alignment: AlignmentType.RIGHT })],
                shading: { fill: 'f5f5f5' },
              }),
            ],
          })
        );
        summaryRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: `${t.generalDiscount}:`, bold: true })], alignment: AlignmentType.RIGHT })],
                shading: { fill: 'fef3c7' },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: `-${currency}${formatNumber(generalDiscountAmount)}`, bold: true })], alignment: AlignmentType.RIGHT })],
                shading: { fill: 'fef3c7' },
              }),
            ],
          })
        );
      }

      summaryRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `${t.finalTotal}:`, bold: true, color: 'FFFFFF' })], alignment: AlignmentType.RIGHT })],
              shading: { fill: '1a1a1a' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `${currency}${formatNumber(total)}`, bold: true, color: 'FFFFFF' })], alignment: AlignmentType.RIGHT })],
              shading: { fill: '1a1a1a' },
            }),
          ],
        })
      );

      const summaryTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: summaryRows,
      });

      docChildren.push(
        new Paragraph({ text: '', spacing: { before: 400 } }),
        summaryTable
      );

      // Contract terms
      if (pdfConfig.contractTerms) {
        docChildren.push(
          new Paragraph({
            text: '',
            pageBreakBefore: true,
            spacing: { before: 400 },
          }),
          new Paragraph({
            text: 'Condizioni Contrattuali',
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 300 },
          })
        );

        pdfConfig.contractTerms.split('\n').forEach(line => {
          docChildren.push(
            new Paragraph({
              text: line,
              spacing: { after: 100 },
            })
          );
        });
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: docChildren,
        }],
      });

      // Genera e salva il file
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${budgetName}.docx`);
    } catch (error) {
      console.error('Error generating DOCX:', error);
      alert('Errore durante la generazione del file DOCX');
    }
  };

  const handleExport = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const html = generatePDFHTML();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[60vw] max-w-[90vw] h-[95vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl">Configura esportazione</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <Tabs defaultValue="header" className="w-full">
            <TabsList className="mb-6 sticky top-0 bg-white z-10 w-fit">
              <TabsTrigger 
                value="header"
                className="data-[state=active]:bg-gray-900 data-[state=active]:text-white"
              >
                Intestazione
              </TabsTrigger>
              <TabsTrigger 
                value="terms"
                className="data-[state=active]:bg-gray-900 data-[state=active]:text-white"
              >
                Condizioni
              </TabsTrigger>
            </TabsList>

            {/* Intestazione Tab */}
            <TabsContent value="header" className="space-y-6">
              {/* Layout controlli: Mittente Sx | Destinatario Dx */}
              <div className="grid grid-cols-2 gap-6">
                {/* Colonna Sinistra - Mittente */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Mittente</Label>
                  
                  {/* Nome Azienda o Logo */}
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-sm font-medium">Nome Azienda</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="companyName"
                        value={pdfConfig.companyName}
                        onChange={(e) => handleCompanyNameChange(e.target.value)}
                        placeholder="Es. ABC Solutions S.r.l."
                        disabled={!!logoPreview}
                        className="flex-1"
                      />
                      <span className="text-xs text-gray-500">o</span>
                      {logoPreview ? (
                        <div className="relative flex-shrink-0">
                          <div className="border-2 border-gray-200 rounded p-1 bg-white flex items-center justify-center w-20 h-10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={logoPreview} 
                              alt="Logo" 
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute -top-1 -right-1 h-5 w-5 p-0"
                            onClick={removeLogo}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex-shrink-0">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                            id="logo-upload"
                            disabled={!!pdfConfig.companyName}
                          />
                          <label 
                            htmlFor="logo-upload" 
                            className={`cursor-pointer flex items-center gap-1 px-2 py-2 border-2 border-dashed rounded transition-colors ${pdfConfig.companyName ? 'opacity-50 cursor-not-allowed border-gray-200' : 'border-gray-300 hover:border-gray-400'}`}
                          >
                            <Upload className="h-4 w-4 text-gray-500" />
                            <span className="text-xs text-gray-600">Logo</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dati Azienda */}
                  <div className="space-y-2">
                    <Label htmlFor="companyInfo" className="text-sm font-medium">Dati Azienda</Label>
                    <Textarea
                      id="companyInfo"
                      value={pdfConfig.companyInfo}
                      onChange={(e) => setPdfConfig({ ...pdfConfig, companyInfo: e.target.value })}
                      placeholder="P. IVA, Indirizzo, Contatti..."
                      rows={8}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Colonna Destra - Destinatario */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Destinatario</Label>
                  
                  {/* Textarea Destinatario */}
                  <div className="space-y-2">
                    <Label htmlFor="headerText" className="text-sm font-medium">Testo</Label>
                    <Textarea
                      id="headerText"
                      value={pdfConfig.headerText}
                      onChange={(e) => setPdfConfig({ ...pdfConfig, headerText: e.target.value })}
                      placeholder="Inserisci destinatario..."
                      rows={8}
                      className="text-xs font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Anteprima sotto */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-center block">Anteprima Intestazione</Label>
                <div className="border-2 border-gray-900 rounded-lg bg-white p-6 shadow-lg">
                  <div className="flex justify-between items-start gap-8">
                    {/* Sezione Mittente (Sinistra) - Allineato a sinistra */}
                    <div className="flex-shrink-0 w-[40%] space-y-2 text-left">
                      {logoPreview && (
                        <div className="mb-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={logoPreview} 
                            alt="Logo" 
                            className="max-w-[150px] max-h-[60px] object-contain"
                          />
                        </div>
                      )}
                      {pdfConfig.companyName && (
                        <div>
                          <p className="font-bold text-base text-gray-900">{pdfConfig.companyName}</p>
                        </div>
                      )}
                      {pdfConfig.companyInfo && (
                        <div>
                          <pre className="font-sans text-xs text-gray-600 whitespace-pre-wrap">{pdfConfig.companyInfo}</pre>
                        </div>
                      )}
                      {!logoPreview && !pdfConfig.companyName && (
                        <div className="text-gray-400 text-xs italic py-8">
                          Inserisci logo o nome azienda
                        </div>
                      )}
                    </div>

                    {/* Sezione Destinatario (Destra) - Senza bordo */}
                    <div className="flex-1 text-right">
                      <pre className="font-sans text-xs whitespace-pre-wrap text-right text-gray-700">{pdfConfig.headerText}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Condizioni Contrattuali Tab */}
            <TabsContent value="terms" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="contractTerms" className="text-base font-semibold">
                    Condizioni Contrattuali
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Scegli un template o personalizza le condizioni
                  </p>
                </div>

                {/* Template e Textarea affiancati */}
                <div className="flex gap-3">
                  {/* Template verticali a sinistra */}
                  <div className="flex-shrink-0 w-40 space-y-1">
                    {contractTemplates.map((template) => (
                      <Button
                        key={template.id}
                        variant="outline"
                        size="sm"
                        className="w-full h-auto py-2 px-2 text-xs justify-start"
                        onClick={() => setPdfConfig({ ...pdfConfig, contractTerms: template.content })}
                        title={template.description}
                      >
                        <span className="font-medium truncate">{template.name}</span>
                      </Button>
                    ))}
                  </div>

                  {/* Textarea a destra */}
                  <Textarea
                    id="contractTerms"
                    value={pdfConfig.contractTerms}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, contractTerms: e.target.value })}
                    placeholder="Scegli un template o scrivi le tue condizioni personalizzate..."
                    className="flex-1 font-mono text-xs resize-none"
                    style={{ height: 'auto', minHeight: '200px' }}
                    rows={pdfConfig.contractTerms.split('\n').length + 1}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer con azioni */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annulla
          </Button>
          <div className="flex gap-3">
            <Button
              onClick={handleExportDocx}
              size="lg"
              variant="outline"
              className="gap-2"
            >
              <FileText className="h-5 w-5" />
              Esporta DOCX
            </Button>
            <Button
              onClick={handleExport}
              size="lg"
              className="gap-2"
            >
              <FileDown className="h-5 w-5" />
              Esporta PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

