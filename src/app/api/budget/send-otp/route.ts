import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { budgetId, email, name } = await request.json()

    // Validate required fields
    if (!budgetId || !email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create supabase server client
    const supabase = createRouteHandlerClient({ cookies })

    // Generate a random 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Calculate max validity time (30 minutes from now)
    const maxValidityTime = new Date()
    maxValidityTime.setMinutes(maxValidityTime.getMinutes() + 30)
    
    // Create a new budget_approvals record with OTP
    const { error: insertError } = await supabase
      .from('budget_approvals')
      .insert({
        budget_id: budgetId,
        email: email,
        name: name,
        approved: false,
        otp_signature: otpCode,
        max_otp_validity_time: maxValidityTime.toISOString()
      })
      
    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'Error creating approval record' },
        { status: 500 }
      )
    }
    
    // Send the OTP via email
    const emailResponse = await fetch(new URL('/api/send-email', request.url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: 'Codice di verifica per approvazione preventivo',
        content: `
          <p>Ciao ${name},</p>
          <p>Ecco il tuo codice di verifica per approvare il preventivo:</p>
          <div style="
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
            padding: 15px;
            background-color: #f5f5f5;
            border-radius: 5px;
            text-align: center;
            letter-spacing: 5px;
          ">
            ${otpCode}
          </div>
          <p>Il codice è valido solo per 30 minuti.</p>
          <p>Se non hai richiesto questo codice, puoi ignorare questa email.</p>
        `
      })
    })
    
    if (!emailResponse.ok) {
      const errorData = await emailResponse.json()
      console.error('Email error:', errorData)
      return NextResponse.json(
        { error: 'Error sending OTP email' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 