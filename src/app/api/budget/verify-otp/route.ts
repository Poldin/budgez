import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { budgetId, email, otp } = await request.json()

    // Validate required fields
    if (!budgetId || !email || !otp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create supabase server client
    const supabase = createRouteHandlerClient({ cookies })

    // Check for valid OTP in budget_approvals
    const now = new Date().toISOString()
    
    // Debugging: log the actual request parameters
    console.log('Verifying OTP with params:', { budgetId, email, otp, now })
    
    const { data: approvalData, error: approvalError } = await supabase
      .from('budget_approvals')
      .select('id, name')
      .eq('budget_id', budgetId)
      .eq('email', email)
      .eq('otp_signature', otp)
      .eq('approved', false)
      .gt('max_otp_validity_time', now)
      .single()
    
    // Log the result of the query for debugging
    console.log('OTP verification result:', { data: !!approvalData, error: approvalError })
      
    if (approvalError || !approvalData) {
      console.error('Approval error:', approvalError)
      return NextResponse.json(
        { error: 'Codice OTP non valido o scaduto' },
        { status: 400 }
      )
    }
    
    // Get the current budget data to store as a snapshot
    const { data: budgetData, error: budgetError } = await supabase
      .from('budgets')
      .select('body, budget_name, public_id')
      .eq('id', budgetId)
      .single()
      
    if (budgetError || !budgetData || !budgetData.body) {
      console.error('Budget error:', budgetError)
      return NextResponse.json(
        { error: 'Errore nel recupero dei dati del preventivo' },
        { status: 500 }
      )
    }
    
    // Update the approval record
    const { error: updateError } = await supabase
      .from('budget_approvals')
      .update({
        approved: true,
        body_approval: budgetData.body
      })
      .eq('id', approvalData.id)
      
    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Errore nell\'aggiornamento dell\'approvazione' },
        { status: 500 }
      )
    }
    
    // Trigger the approval charge processing without waiting for response
    // Extract the origin from the request
    const requestUrl = new URL(request.url)
    const origin = requestUrl.origin
    
    // Build the absolute URL to the API
    const chargeApiUrl = `${origin}/api/budget/process-approval-charge`
    
    console.log('Triggering payment processing at:', chargeApiUrl)
    
    // Fire and forget - don't await the response
    fetch(chargeApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        approvalId: approvalData.id
      }),
    }).then(response => {
      if (!response.ok) {
        console.error('Payment processing error:', response.status, response.statusText)
      } else {
        console.log('Payment processing request sent successfully')
      }
    }).catch(error => {
      console.error('Exception starting payment processing:', error)
    })
    
    // Send confirmation email to the signer
    const formattedDate = new Date().toLocaleDateString()
    const formattedTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    const budgetName = budgetData.budget_name || 'Preventivo'
    const budgetLink = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/public/${budgetData.public_id}`
    
    const signerEmailResponse = await fetch(new URL('/api/send-email', request.url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: `Conferma approvazione preventivo "${budgetName}"`,
        content: `
          <p>Gentile ${approvalData.name},</p>
          <p>Ti confermiamo che hai approvato con successo il preventivo <strong>"${budgetName}"</strong>.</p>
          <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
            <p><strong>Dettagli approvazione:</strong></p>
            <p>Data: ${formattedDate}</p>
            <p>Ora: ${formattedTime}</p>
            <p><strong>Codice di certificazione: ${approvalData.id}</strong></p>
            <p>Si prega di conservare questo codice come prova dell'avvenuta approvazione.</p>
          </div>
          <p>Puoi visualizzare il preventivo approvato al seguente link:</p>
          <p><a href="${budgetLink}" style="display: inline-block; background-color: #000000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0;">Visualizza Preventivo</a></p>
          <p>È stata salvata una copia del preventivo al momento dell'approvazione. Anche in caso di modifiche future al preventivo originale, la versione da te approvata rimarrà invariata.</p>
        `
      })
    })
    
    if (!signerEmailResponse.ok) {
      console.error('Signer email error:', await signerEmailResponse.json())
    }
    
    // Fetch all connected users who should be notified (owner, editor, viewer roles)
    const { data: connectedUsers, error: usersError } = await supabase
      .from('link_budget_users')
      .select('user_id, external_email, user_role')
      .eq('budget_id', budgetId)
      .in('user_role', ['owner', 'editor', 'viewer'])
    
    if (usersError) {
      console.error('Users error:', usersError)
    }

    // Send notifications to connected users
    if (connectedUsers && connectedUsers.length > 0) {
      for (const user of connectedUsers) {
        let recipientEmail = user.external_email;
        
        // If external_email is not available but we have a user_id, fetch from auth.users
        if (!recipientEmail && user.user_id) {
          const { data: userData, error: userError } = await supabase
            .from('auth.users')
            .select('email')
            .eq('id', user.user_id)
            .single()
            
          if (userError) {
            console.error('User error:', userError)
            continue // Skip this user and continue with the next one
          }
          
          if (userData) {
            recipientEmail = userData.email
          }
        }
        
        // Send notification email if we have a valid email
        if (recipientEmail) {
          await fetch(new URL('/api/send-email', request.url).toString(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: recipientEmail,
              subject: `Preventivo "${budgetName}" approvato`,
              content: `
                <p>Gentile utente,</p>
                <p>Ti informiamo che il preventivo <strong>"${budgetName}"</strong> è stato approvato.</p>
                <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
                  <p><strong>Dettagli approvazione:</strong></p>
                  <p>Data: ${formattedDate}</p>
                  <p>Ora: ${formattedTime}</p>
                  <p>Nome: ${approvalData.name}</p>
                  <p>Email: ${email}</p>
                </div>
                <p>Puoi visualizzare il preventivo approvato al seguente link:</p>
                <p><a href="${budgetLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0;">Visualizza Preventivo</a></p>
                <p>È stata salvata una copia del preventivo al momento dell'approvazione. Anche in caso di modifiche future al preventivo originale, la versione approvata rimarrà invariata.</p>
              `
            }),
          }).catch(err => {
            console.error(`Error sending notification to ${recipientEmail}:`, err)
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      approvalDate: now,
      name: approvalData.name
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 