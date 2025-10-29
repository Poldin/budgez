import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { to, subject, otpCode } = await request.json();

    if (!to || !subject || !otpCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Template email con design simile a header/footer
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
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
                        Codice di verifica
                      </h2>
                      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #4b5563;">
                        Usa questo codice per verificare la tua email e completare la pubblicazione della richiesta su Budgez.
                      </p>
                      
                      <!-- OTP Code Box -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 32px 0;">
                            <div style="background-color: #f3f4f6; border: 2px solid #e5e7eb; border-radius: 8px; padding: 24px; display: inline-block;">
                              <p style="margin: 0; font-size: 48px; font-weight: bold; letter-spacing: 8px; color: #111827; font-family: 'Courier New', monospace;">
                                ${otpCode}
                              </p>
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                        Questo codice è valido per 10 minuti. Se non hai richiesto questo codice, puoi ignorare questa email.
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

    // Usa email configurata o fallback alla sandbox per test
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Budgez <team@budgez.xyz>';
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: subject,
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

