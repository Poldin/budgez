// app/api/auth/verify-otp/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { email, otp, password } = await request.json();

        // 1. Verifica OTP
        const { error: verifyError } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'signup'
        });

        if (verifyError) {
            let errorMessage = 'Errore durante la verifica';
            if (verifyError.message.includes('Invalid OTP')) {
                errorMessage = 'Codice OTP non valido';
            }
            return NextResponse.json({ message: errorMessage }, { status: 400 });
        }

        // 2. Esegui il login automatico
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (signInError) {
            return NextResponse.json(
                { message: 'Errore durante il login automatico' },
                { status: 400 }
            );
        }

        // 3. Restituisci i dati della sessione
        return NextResponse.json({
            message: 'Verifica completata e login effettuato con successo',
            session: signInData.session
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        return NextResponse.json(
            { message: 'Errore interno del server' },
            { status: 500 }
        );
    }
}