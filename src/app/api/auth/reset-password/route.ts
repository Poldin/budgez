// app/api/auth/reset-password/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const { email } = requestData;

    if (!email) {
      return NextResponse.json(
        { message: 'Email non fornita' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Formato email non valido' },
        { status: 400 }
      );
    }

    // Ottieni i cookies in modo asincrono
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { redirectUrl } = requestData;
    if (!redirectUrl) {
      return NextResponse.json(
        { message: 'URL di redirect non fornito' },
        { status: 400 }
      );
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    if (error) {
      console.error('Errore nel reset della password:', error);
      return NextResponse.json(
        { 
          message: 'Errore nell\'invio dell\'email di reset',
          error: error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Email di reset inviata con successo' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Errore nel gestore della richiesta:', error);
    return NextResponse.json(
      { message: 'Errore interno del server' },
      { status: 500 }
    );
  }
}