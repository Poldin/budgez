//api/send-email/route.ts

import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Type definition for expected request body
interface EmailRequest {
  to: string;
  subject: string;
  content: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as EmailRequest;
    const { to, subject, content } = body;

    // Validate required fields
    if (!to || !subject || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'team@budgez.xyz',
      to: [to],
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
          </head>
          <body style="
            font-family: Manrope, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
          ">
            <div style="
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 8px;
              padding: 20px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            ">
              
              <h1 style="color: #333; margin-bottom: 20px;">${subject}</h1>
              
              <div style="color: #555; font-size: 16px;">
                ${content}
              </div>
              <p>\n\n</p>
              <div style="color: #888; font-size: 12px;">
                se questo messaggio non ti riguarda o non sai a cosa fa riferimento, non considerarlo.
              </div>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              
              <footer style="color: #888; font-size: 16px; text-align: center;">
                <p>Budgez - mi mandi un preventivo?</p>
                <p>
                  <a href="https://budgez.xyz" style="color: #000; text-decoration: none;">⚡Budgez.xyz</a>
                </p>
              </footer>
            </div>
          </body>
        </html>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Error sending email' },
      { status: 500 }
    );
  }
}