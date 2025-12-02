import type { Resource, Activity, GeneralDiscount } from '@/types/budget';
import { formatNumber } from '@/lib/budget-utils';
import {
  calculateGrandSubtotal,
  calculateGrandTotal,
  calculateGeneralDiscountAmount,
  calculateGrandTotalBeforeGeneralDiscount,
} from '@/lib/budget-calculations';

export interface CertificateData {
  quoteId: string;
  quoteName: string;
  signerEmail: string;
  signedAt: string;
  resources: Resource[];
  activities: Activity[];
  generalDiscount: GeneralDiscount;
  currency: string;
  companyName?: string;
  companyInfo?: string;
}

export function generateCertificateHTML(data: CertificateData): string {
  const {
    quoteId,
    quoteName,
    signerEmail,
    signedAt,
    resources,
    activities,
    generalDiscount,
    currency,
    companyName,
    companyInfo,
  } = data;

  // Calculate financial summaries
  const subtotal = calculateGrandSubtotal(resources, activities);
  const totalBeforeDiscount = calculateGrandTotalBeforeGeneralDiscount(resources, activities);
  const generalDiscountAmount = calculateGeneralDiscountAmount(resources, activities, generalDiscount);
  const grandTotal = calculateGrandTotal(resources, activities, generalDiscount);

  // Format the signed date
  const signedDate = new Date(signedAt);
  const formattedDate = signedDate.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = signedDate.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Generate unique certificate number
  const certNumber = `CERT-${quoteId.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Certificato di Firma - ${quoteName}</title>
      <style>
        @page {
          margin: 0;
          size: A4;
        }
        @media print {
          body {
            margin: 0;
            padding: 40px;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
          font-size: 12px;
          line-height: 1.6;
          color: #1a1a1a;
          background: #ffffff;
        }
        
        .certificate-container {
          border: 3px solid #1a1a1a;
          padding: 40px;
          position: relative;
          background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
        }
        
        .certificate-border {
          position: absolute;
          top: 8px;
          left: 8px;
          right: 8px;
          bottom: 8px;
          border: 1px solid #1a1a1a;
          pointer-events: none;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #1a1a1a;
        }
        
        .logo-text {
          font-size: 28px;
          font-weight: bold;
          color: #1a1a1a;
          margin-bottom: 5px;
          letter-spacing: 2px;
        }
        
        .certificate-title {
          font-size: 24px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 20px 0 10px 0;
          text-transform: uppercase;
          letter-spacing: 3px;
        }
        
        .certificate-subtitle {
          font-size: 14px;
          color: #666;
          margin-bottom: 10px;
        }
        
        .cert-number {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          color: #888;
          background: #f5f5f5;
          padding: 5px 15px;
          border-radius: 4px;
          display: inline-block;
          margin-top: 10px;
        }
        
        .content-section {
          margin: 30px 0;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e5e5;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        .info-box {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #1a1a1a;
        }
        
        .info-label {
          font-size: 10px;
          text-transform: uppercase;
          color: #666;
          font-weight: 600;
          margin-bottom: 4px;
          letter-spacing: 0.5px;
        }
        
        .info-value {
          font-size: 14px;
          color: #1a1a1a;
          font-weight: 500;
        }
        
        .signature-section {
          margin-top: 30px;
          background: #f0f9f0;
          border: 2px solid #22c55e;
          border-radius: 8px;
          padding: 20px;
        }
        
        .signature-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .verified-badge {
          background: #22c55e;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .signature-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        
        .signature-item {
          padding: 10px;
          background: white;
          border-radius: 4px;
        }
        
        .financial-summary {
          margin-top: 30px;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .financial-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 20px;
          border-bottom: 1px solid #e5e5e5;
        }
        
        .financial-row:last-child {
          border-bottom: none;
        }
        
        .financial-row.total {
          background: #1a1a1a;
          color: white;
          font-weight: bold;
          font-size: 16px;
        }
        
        .financial-row.discount {
          background: #fef3c7;
          color: #b45309;
        }
        
        .financial-label {
          font-weight: 500;
        }
        
        .financial-value {
          font-weight: 600;
          font-family: 'Courier New', monospace;
        }
        
        .footer {
          margin-top: 40px;
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #e5e5e5;
        }
        
        .footer-text {
          font-size: 10px;
          color: #888;
          line-height: 1.8;
        }
        
        .security-note {
          margin-top: 20px;
          padding: 15px;
          background: #f5f5f5;
          border-radius: 6px;
          font-size: 10px;
          color: #666;
          text-align: center;
        }
        
        .lock-icon {
          display: inline-block;
          width: 14px;
          height: 14px;
          margin-right: 6px;
          vertical-align: middle;
        }
      </style>
    </head>
    <body>
      <div class="certificate-container">
        <div class="certificate-border"></div>
        
        <div class="header">
          <div class="logo-text">B) BUDGEZ</div>
          <div class="certificate-title">Certificato di Firma Digitale</div>
          <div class="certificate-subtitle">Verifica OTP (One-Time Password)</div>
          <div class="cert-number">${certNumber}</div>
        </div>
        
        <div class="content-section">
          <div class="section-title">Informazioni Preventivo</div>
          <div class="info-grid">
            <div class="info-box">
              <div class="info-label">Nome Preventivo</div>
              <div class="info-value">${quoteName}</div>
            </div>
            <div class="info-box">
              <div class="info-label">ID Preventivo</div>
              <div class="info-value" style="font-family: 'Courier New', monospace; font-size: 12px;">${quoteId}</div>
            </div>
            ${companyName ? `
            <div class="info-box">
              <div class="info-label">Emesso da</div>
              <div class="info-value">${companyName}</div>
            </div>
            ` : ''}
            ${companyInfo ? `
            <div class="info-box">
              <div class="info-label">Informazioni Azienda</div>
              <div class="info-value" style="font-size: 11px; white-space: pre-line;">${companyInfo}</div>
            </div>
            ` : ''}
          </div>
        </div>
        
        <div class="signature-section">
          <div class="signature-header">
            <svg class="lock-icon" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <circle cx="12" cy="16" r="1"></circle>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span class="verified-badge">✓ Firma Verificata</span>
          </div>
          <div class="signature-details">
            <div class="signature-item">
              <div class="info-label">Firmato da</div>
              <div class="info-value">${signerEmail}</div>
            </div>
            <div class="signature-item">
              <div class="info-label">Metodo di Verifica</div>
              <div class="info-value">OTP via Email</div>
            </div>
            <div class="signature-item">
              <div class="info-label">Data Firma</div>
              <div class="info-value">${formattedDate}</div>
            </div>
            <div class="signature-item">
              <div class="info-label">Ora Firma</div>
              <div class="info-value">${formattedTime}</div>
            </div>
          </div>
        </div>
        
        <div class="content-section">
          <div class="section-title">Riepilogo Economico</div>
          <div class="financial-summary">
            <div class="financial-row">
              <span class="financial-label">Imponibile</span>
              <span class="financial-value">${currency} ${formatNumber(subtotal)}</span>
            </div>
            ${generalDiscount.enabled && generalDiscountAmount > 0 ? `
            <div class="financial-row discount">
              <span class="financial-label">Sconto Generale (${generalDiscount.type === 'percentage' ? generalDiscount.value + '%' : currency + ' ' + formatNumber(generalDiscount.value)})</span>
              <span class="financial-value">-${currency} ${formatNumber(generalDiscountAmount)}</span>
            </div>
            ` : ''}
            <div class="financial-row total">
              <span class="financial-label">TOTALE</span>
              <span class="financial-value">${currency} ${formatNumber(grandTotal)}</span>
            </div>
          </div>
        </div>
        
        <div class="security-note">
          <svg style="display: inline-block; width: 12px; height: 12px; vertical-align: middle; margin-right: 4px;" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          Questo certificato attesta che il preventivo è stato firmato digitalmente tramite verifica OTP.
          La firma è stata verificata al momento dell'invio del codice all'indirizzo email indicato.
        </div>
        
        <div class="footer">
          <div class="footer-text">
            Documento generato automaticamente da Budgez<br>
            © ${new Date().getFullYear()} Budgez. Tutti i diritti riservati.<br>
            <span style="color: #aaa;">Generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}</span>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

