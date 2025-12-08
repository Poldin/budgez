import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { generateCertificateHTML, type CertificateData } from '@/lib/certificate-generator';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { 
      to, 
      quoteName, 
      quoteId, 
      signerEmail, 
      signedAt,
      // Nuovi campi per il certificato
      certificateData
    } = await request.json();

    if (!to || !quoteName || !quoteId || !signerEmail || !signedAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Genera il PDF del certificato se abbiamo i dati
    let certificatePdfBase64: string | null = null;
    if (certificateData) {
      const certificateHTML = generateCertificateHTML({
        quoteId,
        quoteName,
        quoteDescription: certificateData.quoteDescription,
        signerEmail,
        signedAt,
        createdAt: certificateData.createdAt,
        resources: certificateData.resources || [],
        activities: certificateData.activities || [],
        generalDiscount: certificateData.generalDiscount || { enabled: false, type: 'percentage', value: 0, applyOn: 'taxable' },
        generalMargin: certificateData.generalMargin,
        currency: certificateData.currency || '€',
        defaultVat: certificateData.defaultVat,
        companyName: certificateData.companyName,
        companyInfo: certificateData.companyInfo,
        headerText: certificateData.headerText,
      });
      
      // Converti HTML in base64 per allegato (il client può usare html-pdf o servizio esterno)
      certificatePdfBase64 = Buffer.from(certificateHTML).toString('base64');
    }

    // Formatta la data di firma
    const signedDate = new Date(signedAt);
    const formattedDate = signedDate.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // URL del preventivo
    const quoteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/v/${quoteId}`;

    // Template email per notifica firma preventivo
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Preventivo firmato</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #ffffff; padding: 32px 40px; border-bottom: 1px solid #e5e7eb;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #111827;">
                        B) Budgez
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 40px;">
                      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111827;">
                        ✅ Preventivo firmato
                      </h2>
                      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #4b5563;">
                        Il tuo preventivo è stato firmato dal cliente.
                      </p>
                      
                      <!-- Quote Info -->
                      <div style="background-color: #f9fafb; border-left: 4px solid #111827; padding: 16px; margin-bottom: 24px;">
                        <p style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600;">
                          PREVENTIVO
                        </p>
                        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">
                          ${quoteName}
                        </p>
                      </div>
                      
                      <!-- Signature Info -->
                      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #111827;">
                          Dettagli firma
                        </h3>
                        <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 20px; color: #4b5563;">
                          <strong style="color: #111827;">Firmato da:</strong> ${signerEmail}
                        </p>
                        <p style="margin: 0; font-size: 14px; line-height: 20px; color: #4b5563;">
                          <strong style="color: #111827;">Data e ora:</strong> ${formattedDate}
                        </p>
                      </div>
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 24px 0;">
                            <a href="${quoteUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                              Visualizza preventivo
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                        Puoi visualizzare il preventivo firmato cliccando sul pulsante sopra o visitando direttamente il link.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
                        Grazie per aver scelto Budgez
                      </p>
                      <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                        © ${new Date().getFullYear()} Budgez. Tutti i diritti riservati.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Budgez <team@budgez.xyz>';
    
    // 1. Invia email al possessore del preventivo (con certificato allegato se disponibile)
    const ownerEmailOptions: any = {
      from: fromEmail,
      to: [to],
      subject: `Preventivo "${quoteName}" firmato`,
      html: htmlContent,
    };

    // Aggiungi certificato come allegato HTML se disponibile
    if (certificatePdfBase64) {
      ownerEmailOptions.attachments = [{
        filename: `Certificato-${quoteId}.html`,
        content: certificatePdfBase64,
        contentType: 'text/html',
      }];
    }

    const { data, error } = await resend.emails.send(ownerEmailOptions);

    if (error) {
      console.error('Resend error (owner):', error);
      return NextResponse.json(
        { error: 'Failed to send email to owner' },
        { status: 500 }
      );
    }

    // 2. Invia email di conferma al firmatario con certificato allegato
    if (signerEmail && certificatePdfBase64) {
      const signerHtmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Conferma firma preventivo</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background-color: #ffffff; padding: 32px 40px; border-bottom: 1px solid #e5e7eb;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #111827;">
                          B) Budgez
                        </h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 40px;">
                        <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111827;">
                          🔒 Firma completata con successo
                        </h2>
                        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #4b5563;">
                          La tua firma sul preventivo è stata registrata correttamente.
                        </p>
                        
                        <!-- Quote Info -->
                        <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin-bottom: 24px;">
                          <p style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; color: #166534; font-weight: 600;">
                            ✓ PREVENTIVO FIRMATO
                          </p>
                          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">
                            ${quoteName}
                          </p>
                        </div>
                        
                        <!-- Signature Info -->
                        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                          <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #111827;">
                            📋 Dettagli della firma
                          </h3>
                          <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 20px; color: #4b5563;">
                            <strong style="color: #111827;">Email:</strong> ${signerEmail}
                          </p>
                          <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 20px; color: #4b5563;">
                            <strong style="color: #111827;">Data e ora:</strong> ${formattedDate}
                          </p>
                          <p style="margin: 0; font-size: 14px; line-height: 20px; color: #4b5563;">
                            <strong style="color: #111827;">Metodo:</strong> Verifica OTP via email
                          </p>
                        </div>

                        <!-- Certificate Notice -->
                        <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                          <p style="margin: 0; font-size: 14px; line-height: 20px; color: #92400e;">
                            <strong>📎 Certificato allegato:</strong> In allegato trovi il certificato di firma digitale. Aprilo nel browser e stampalo come PDF per conservarlo.
                          </p>
                        </div>
                        
                        <!-- CTA Button -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 24px 0;">
                              <a href="${quoteUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                                Visualizza preventivo
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
                          Grazie per aver scelto Budgez
                        </p>
                        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                          © ${new Date().getFullYear()} Budgez. Tutti i diritti riservati.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;

      try {
        await resend.emails.send({
          from: fromEmail,
          to: [signerEmail],
          subject: `Conferma firma: "${quoteName}"`,
          html: signerHtmlContent,
          attachments: [{
            filename: `Certificato-${quoteId}.html`,
            content: certificatePdfBase64,
            contentType: 'text/html',
          }],
        });
      } catch (signerError) {
        // Non blocchiamo se l'email al firmatario fallisce
        console.error('Error sending confirmation to signer:', signerError);
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

