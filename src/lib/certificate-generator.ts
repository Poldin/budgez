import type { Resource, Activity, GeneralDiscount, GeneralMargin } from '@/types/budget';
import { formatNumber } from '@/lib/budget-utils';
import {
  calculateGrandSubtotal,
  calculateGrandTotal,
  calculateGeneralDiscountAmount,
  calculateGrandTotalBeforeGeneralDiscount,
  calculateGrandVat,
} from '@/lib/budget-calculations';

export interface CertificateData {
  quoteId: string;
  quoteName: string;
  quoteDescription?: string;
  signerEmail: string;
  signedAt: string;
  createdAt?: string;
  resources: Resource[];
  activities: Activity[];
  generalDiscount: GeneralDiscount;
  generalMargin?: GeneralMargin;
  currency: string;
  defaultVat?: number;
  companyName?: string;
  companyInfo?: string;
  headerText?: string; // Destinatario
}

// Genera un hash semplificato per integrità documento (non crittografico, solo identificativo)
function generateDocumentHash(data: CertificateData): string {
  const hashString = `${data.quoteId}-${data.quoteName}-${data.signerEmail}-${data.signedAt}-${data.activities.length}-${data.resources.length}`;
  let hash = 0;
  for (let i = 0; i < hashString.length; i++) {
    const char = hashString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
}

// Estrae il periodo del progetto dalle date delle attività
function getProjectPeriod(activities: Activity[]): { start: string | null, end: string | null } {
  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  activities.forEach(act => {
    if (act.startDate) {
      const start = new Date(act.startDate);
      if (!minDate || start < minDate) minDate = start;
    }
    if (act.endDate) {
      const end = new Date(act.endDate);
      if (!maxDate || end > maxDate) maxDate = end;
    }
  });

  const formatDate = (d: Date) => d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return {
    start: minDate ? formatDate(minDate) : null,
    end: maxDate ? formatDate(maxDate) : null,
  };
}

// Estrae info essenziali dal headerText (destinatario) in modo pulito
function parseRecipientInfo(headerText?: string): { name: string | null, address: string | null } {
  if (!headerText) return { name: null, address: null };
  
  const lines = headerText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  // Solitamente: "Spett.le", poi nome azienda, poi indirizzo
  let name: string | null = null;
  let address: string | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.toLowerCase().includes('spett.le') || line.toLowerCase().includes('alla cortese')) continue;
    if (!name && !line.includes('@') && !line.includes('CF/P.IVA') && !line.match(/^\d/)) {
      name = line;
    } else if (name && !address && (line.match(/^Via|^Viale|^Piazza|^Corso|^\d/) || line.includes('(') && line.includes(')'))) {
      address = line;
      break;
    }
  }
  
  return { name, address };
}

export function generateCertificateHTML(data: CertificateData): string {
  const {
    quoteId,
    quoteName,
    quoteDescription,
    signerEmail,
    signedAt,
    createdAt,
    resources,
    activities,
    generalDiscount,
    generalMargin,
    currency,
    defaultVat,
    companyName,
    companyInfo,
    headerText,
  } = data;

  // Calculate financial summaries
  const subtotal = calculateGrandSubtotal(resources, activities);
  const vatAmount = calculateGrandVat(resources, activities);
  const totalBeforeDiscount = calculateGrandTotalBeforeGeneralDiscount(resources, activities);
  const generalDiscountAmount = calculateGeneralDiscountAmount(resources, activities, generalDiscount);
  const grandTotal = calculateGrandTotal(resources, activities, generalDiscount, generalMargin);

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

  // Format created date if available
  let formattedCreatedDate = null;
  if (createdAt) {
    const created = new Date(createdAt);
    formattedCreatedDate = created.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  // Generate unique certificate number
  const certNumber = `CERT-${quoteId.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  
  // Generate document hash for integrity
  const documentHash = generateDocumentHash(data);
  
  // Get project period
  const projectPeriod = getProjectPeriod(activities);
  
  // Parse recipient info
  const recipient = parseRecipientInfo(headerText);
  
  // Verification URL
  const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://budgez.it'}/v/${quoteId}`;

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
          margin: 25px 0;
        }
        
        .section-title {
          font-size: 13px;
          font-weight: 600;
          color: #1a1a1a;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
          padding-bottom: 6px;
          border-bottom: 1px solid #e5e5e5;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        
        .info-grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 15px;
        }
        
        .info-box {
          background: #f9f9f9;
          padding: 12px;
          border-radius: 6px;
          border-left: 4px solid #1a1a1a;
        }
        
        .info-box.full-width {
          grid-column: span 2;
        }
        
        .info-box.highlight {
          border-left-color: #22c55e;
          background: #f0fdf4;
        }
        
        .info-label {
          font-size: 9px;
          text-transform: uppercase;
          color: #666;
          font-weight: 600;
          margin-bottom: 3px;
          letter-spacing: 0.5px;
        }
        
        .info-value {
          font-size: 13px;
          color: #1a1a1a;
          font-weight: 500;
        }
        
        .info-value.small {
          font-size: 11px;
        }
        
        .info-value.mono {
          font-family: 'Courier New', monospace;
          font-size: 11px;
        }
        
        .parties-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 25px 0;
        }
        
        .party-box {
          padding: 15px;
          border-radius: 8px;
        }
        
        .party-box.sender {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
        }
        
        .party-box.recipient {
          background: #fef3c7;
          border: 1px solid #fcd34d;
        }
        
        .party-title {
          font-size: 10px;
          text-transform: uppercase;
          font-weight: 600;
          color: #666;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }
        
        .party-name {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 4px;
        }
        
        .party-details {
          font-size: 11px;
          color: #4b5563;
          white-space: pre-line;
          line-height: 1.5;
        }
        
        .signature-section {
          margin-top: 25px;
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
          gap: 12px;
        }
        
        .signature-item {
          padding: 10px;
          background: white;
          border-radius: 4px;
        }
        
        .financial-summary {
          margin-top: 25px;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .financial-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 16px;
          border-bottom: 1px solid #e5e5e5;
        }
        
        .financial-row:last-child {
          border-bottom: none;
        }
        
        .financial-row.total {
          background: #1a1a1a;
          color: white;
          font-weight: bold;
          font-size: 15px;
        }
        
        .financial-row.subtotal {
          background: #f9fafb;
        }
        
        .financial-row.discount {
          background: #fef3c7;
          color: #b45309;
        }
        
        .financial-row.vat {
          background: #f0f9ff;
          color: #0369a1;
        }
        
        .financial-label {
          font-weight: 500;
        }
        
        .financial-value {
          font-weight: 600;
          font-family: 'Courier New', monospace;
        }
        
        .project-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-top: 20px;
        }
        
        .stat-box {
          background: #f9f9f9;
          padding: 12px;
          border-radius: 6px;
          text-align: center;
        }
        
        .stat-value {
          font-size: 20px;
          font-weight: bold;
          color: #1a1a1a;
        }
        
        .stat-label {
          font-size: 9px;
          text-transform: uppercase;
          color: #666;
          margin-top: 4px;
        }
        
        .footer {
          margin-top: 30px;
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #e5e5e5;
        }
        
        .footer-text {
          font-size: 10px;
          color: #888;
          line-height: 1.8;
        }
        
        .security-section {
          margin-top: 20px;
          padding: 15px;
          background: #f5f5f5;
          border-radius: 6px;
        }
        
        .security-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        
        .security-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        
        .security-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          margin-top: 2px;
        }
        
        .security-text {
          font-size: 10px;
          color: #666;
          line-height: 1.4;
        }
        
        .verification-box {
          margin-top: 15px;
          padding: 12px;
          background: white;
          border: 1px dashed #d1d5db;
          border-radius: 6px;
          text-align: center;
        }
        
        .verification-label {
          font-size: 9px;
          text-transform: uppercase;
          color: #666;
          margin-bottom: 4px;
        }
        
        .verification-url {
          font-size: 10px;
          color: #2563eb;
          word-break: break-all;
        }
        
        .hash-box {
          margin-top: 10px;
          padding: 8px 12px;
          background: #1a1a1a;
          border-radius: 4px;
          display: inline-block;
        }
        
        .hash-label {
          font-size: 8px;
          text-transform: uppercase;
          color: #888;
          margin-bottom: 2px;
        }
        
        .hash-value {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          color: #22c55e;
          letter-spacing: 1px;
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
        
        <!-- Informazioni Preventivo -->
        <div class="content-section">
          <div class="section-title">Informazioni Documento</div>
          <div class="info-grid">
            <div class="info-box">
              <div class="info-label">Nome Preventivo</div>
              <div class="info-value">${quoteName}</div>
            </div>
            <div class="info-box">
              <div class="info-label">ID Documento</div>
              <div class="info-value mono">${quoteId}</div>
            </div>
            ${quoteDescription ? `
            <div class="info-box full-width">
              <div class="info-label">Descrizione</div>
              <div class="info-value small">${quoteDescription.length > 200 ? quoteDescription.slice(0, 200) + '...' : quoteDescription}</div>
            </div>
            ` : ''}
          </div>
        </div>
        
        <!-- Parti Coinvolte -->
        ${(companyName || recipient.name) ? `
        <div class="parties-section">
          ${companyName ? `
          <div class="party-box sender">
            <div class="party-title">📤 Mittente / Fornitore</div>
            <div class="party-name">${companyName}</div>
            ${companyInfo ? `<div class="party-details">${companyInfo.split('\\n').slice(0, 3).join('\n')}</div>` : ''}
          </div>
          ` : '<div></div>'}
          ${recipient.name ? `
          <div class="party-box recipient">
            <div class="party-title">📥 Destinatario / Cliente</div>
            <div class="party-name">${recipient.name}</div>
            ${recipient.address ? `<div class="party-details">${recipient.address}</div>` : ''}
          </div>
          ` : '<div></div>'}
        </div>
        ` : ''}
        
        <!-- Statistiche Progetto -->
        <div class="project-stats">
          <div class="stat-box">
            <div class="stat-value">${activities.length}</div>
            <div class="stat-label">Attività</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${resources.length}</div>
            <div class="stat-label">Risorse</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${defaultVat || 22}%</div>
            <div class="stat-label">IVA Applicata</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${currency}</div>
            <div class="stat-label">Valuta</div>
          </div>
        </div>
        
        ${(projectPeriod.start || projectPeriod.end) ? `
        <div class="content-section">
          <div class="section-title">Periodo Progetto</div>
          <div class="info-grid">
            ${projectPeriod.start ? `
            <div class="info-box">
              <div class="info-label">Data Inizio</div>
              <div class="info-value">${projectPeriod.start}</div>
            </div>
            ` : ''}
            ${projectPeriod.end ? `
            <div class="info-box">
              <div class="info-label">Data Fine</div>
              <div class="info-value">${projectPeriod.end}</div>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}
        
        <!-- Firma Digitale -->
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
              <div class="info-value">${formattedDate} alle ${formattedTime}</div>
            </div>
            ${formattedCreatedDate ? `
            <div class="signature-item">
              <div class="info-label">Data Creazione Preventivo</div>
              <div class="info-value">${formattedCreatedDate}</div>
            </div>
            ` : ''}
          </div>
        </div>
        
        <!-- Riepilogo Economico -->
        <div class="content-section">
          <div class="section-title">Riepilogo Economico Certificato</div>
          <div class="financial-summary">
            <div class="financial-row subtotal">
              <span class="financial-label">Imponibile</span>
              <span class="financial-value">${currency} ${formatNumber(subtotal)}</span>
            </div>
            <div class="financial-row vat">
              <span class="financial-label">IVA</span>
              <span class="financial-value">${currency} ${formatNumber(vatAmount)}</span>
            </div>
            ${generalDiscount.enabled && generalDiscountAmount > 0 ? `
            <div class="financial-row discount">
              <span class="financial-label">Sconto Generale (${generalDiscount.type === 'percentage' ? generalDiscount.value + '%' : currency + ' ' + formatNumber(generalDiscount.value)})</span>
              <span class="financial-value">-${currency} ${formatNumber(generalDiscountAmount)}</span>
            </div>
            ` : ''}
            <div class="financial-row total">
              <span class="financial-label">TOTALE CERTIFICATO</span>
              <span class="financial-value">${currency} ${formatNumber(grandTotal)}</span>
            </div>
          </div>
        </div>
        
        <!-- Sicurezza e Verifica -->
        <div class="security-section">
          <div class="security-grid">
            <div class="security-item">
              <svg class="security-icon" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <div class="security-text">
                <strong>Firma OTP Verificata</strong><br>
                La firma è stata verificata tramite codice OTP inviato all'email del firmatario.
              </div>
            </div>
            <div class="security-item">
              <svg class="security-icon" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              <div class="security-text">
                <strong>Documento Integro</strong><br>
                Il contenuto del preventivo non è stato modificato dopo la firma.
              </div>
            </div>
          </div>
          
          <div class="verification-box">
            <div class="verification-label">Link di Verifica Online</div>
            <div class="verification-url">${verificationUrl}</div>
          </div>
          
          <div style="text-align: center; margin-top: 15px;">
            <div class="hash-box">
              <div class="hash-label">Impronta Documento</div>
              <div class="hash-value">${documentHash}</div>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text">
            Questo certificato attesta l'avvenuta firma digitale del preventivo tramite verifica OTP.<br>
            La firma elettronica semplice ha valore legale ai sensi del Regolamento eIDAS (UE) 910/2014.<br><br>
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
