import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { to, requestTitle, proposalTitle, proposalDescription, proposerEmail, attachmentUrl } = await request.json();

    if (!to || !requestTitle || !proposalTitle || !proposerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Template email per notifica proposta
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nuova proposta ricevuta</title>
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
                        🎉 Hai ricevuto una nuova proposta!
                      </h2>
                      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #4b5563;">
                        Qualcuno ha risposto alla tua richiesta su Budgez.
                      </p>
                      
                      <!-- Request Info -->
                      <div style="background-color: #f9fafb; border-left: 4px solid #111827; padding: 16px; margin-bottom: 24px;">
                        <p style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600;">
                          TUA RICHIESTA
                        </p>
                        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">
                          ${requestTitle}
                        </p>
                      </div>
                      
                      <!-- Proposal Info -->
                      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #111827;">
                          ${proposalTitle}
                        </h3>
                        <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 20px; color: #4b5563; white-space: pre-wrap;">
                          ${proposalDescription}
                        </p>
                        ${attachmentUrl ? `
                          <a href="${attachmentUrl}" style="display: inline-block; padding: 8px 16px; background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; color: #111827; text-decoration: none; font-size: 14px; font-weight: 500;">
                            📄 Visualizza allegato PDF
                          </a>
                        ` : ''}
                      </div>
                      
                      <!-- Contact Info -->
                      <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                        <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #166534;">
                          📧 Contatta il professionista
                        </p>
                        <p style="margin: 0; font-size: 14px; color: #166534;">
                          <a href="mailto:${proposerEmail}" style="color: #166534; text-decoration: underline;">
                            ${proposerEmail}
                          </a>
                        </p>
                      </div>
                      
                      <p style="margin: 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                        Puoi rispondere direttamente all'email del professionista per discutere i dettagli e finalizzare la collaborazione.
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
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: `Nuova proposta per: ${requestTitle}`,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
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

