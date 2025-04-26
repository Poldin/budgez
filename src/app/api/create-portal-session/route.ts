import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

// Genera una sessione personalizzata per il portal di billing
export async function POST() {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-03-31.basil',
    });

    // Ottieni l'utente autenticato da Supabase
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json(
        { error: 'Utente non autenticato o email mancante' },
        { status: 401 }
      );
    }

    // Cerca il cliente in Stripe usando l'email
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    // Se il cliente non esiste in Stripe
    if (customers.data.length === 0) {
      return NextResponse.json(
        { error: 'Nessun account cliente trovato in Stripe' },
        { status: 404 }
      );
    }

    const customerId = customers.data[0].id;
    
    // Crea una sessione del portal di billing
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    });

    // Ritorna l'URL della sessione
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Si è verificato un errore durante la creazione della sessione del portal' },
      { status: 500 }
    );
  }
} 