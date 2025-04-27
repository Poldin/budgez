import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const budgetId = url.searchParams.get('budgetId')

    if (!budgetId) {
      return NextResponse.json(
        { error: 'Budget ID is required' },
        { status: 400 }
      )
    }

    // Create supabase server client
    const supabase = createRouteHandlerClient({ cookies })

    const { data, error } = await supabase
      .from('budget_approvals')
      .select('created_at, name, email')
      .eq('budget_id', budgetId)
      .eq('approved', true)
      .maybeSingle()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Error checking approval status' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 