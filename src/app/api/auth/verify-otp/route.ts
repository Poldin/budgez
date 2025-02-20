// app/api/auth/verify-otp/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { email, otp, password } = await request.json()
        
        // Create supabase server client
        const supabase = createRouteHandlerClient({ cookies })

        // 1. Verify OTP
        const { error: verifyError } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'signup'
        })

        if (verifyError) {
            console.error('Verify error:', verifyError)
            return NextResponse.json(
                { message: 'Codice OTP non valido' },
                { status: 400 }
            )
        }

        // 2. Sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (signInError) {
            console.error('Sign in error:', signInError)
            return NextResponse.json(
                { message: 'Errore durante il login automatico' },
                { status: 400 }
            )
        }

        return NextResponse.json({
            message: 'Verifica completata con successo',
            session: signInData.session
        })

    } catch (error) {
        console.error('Server error:', error)
        return NextResponse.json(
            { message: 'Errore interno del server' },
            { status: 500 }
        )
    }
}