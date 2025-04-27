import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

// Recupera informazioni sul cliente Stripe
export async function GET() {
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

    // Cerca il cliente direttamente in Stripe usando l'email
    try {
      // Ricerca del cliente per email
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      // Se il cliente non esiste in Stripe
      if (customers.data.length === 0) {
        return NextResponse.json({ 
          exists: false,
          hasPaymentMethod: false 
        });
      }

      const customer = customers.data[0];
      
      // Salva o aggiorna lo stripe_customer_id nelle user_settings (opzionale)
      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (userSettings && (!userSettings.body?.stripe_customer_id || userSettings.body.stripe_customer_id !== customer.id)) {
        await supabase
          .from('user_settings')
          .update({
            body: {
              ...userSettings.body,
              stripe_customer_id: customer.id,
            },
          })
          .eq('user_id', user.id);
      }

      // Verifica i metodi di pagamento
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customer.id,
        type: 'card',
      });
      
      // Get tax IDs (fiscal code)
      const taxIds = await stripe.customers.listTaxIds(customer.id);
      const fiscalCode = taxIds.data.length > 0 ? taxIds.data[0].value : null;
      
      // Recupera le info sulla carta se disponibile
      const hasPaymentMethod = paymentMethods.data.length > 0;
      const cardInfo = hasPaymentMethod ? {
        id: paymentMethods.data[0].id,
        brand: paymentMethods.data[0].card?.brand,
        last4: paymentMethods.data[0].card?.last4,
        expMonth: paymentMethods.data[0].card?.exp_month,
        expYear: paymentMethods.data[0].card?.exp_year
      } : null;
      
      return NextResponse.json({
        exists: true,
        hasPaymentMethod,
        cardInfo,
        fiscalCode,
        customer: {
          email: customer.email,
          name: customer.name
        }
      });
    } catch (error) {
      console.error('Error retrieving customer info from Stripe:', error);
      return NextResponse.json({ 
        exists: false,
        hasPaymentMethod: false 
      });
    }
  } catch (error) {
    console.error('Error retrieving customer info:', error);
    return NextResponse.json(
      { error: 'Si è verificato un errore nel recupero delle informazioni' },
      { status: 500 }
    );
  }
}

// Crea una sessione di checkout
export async function POST() {
  try {
    // Inizializza Stripe
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

    // Cerca prima il cliente in Stripe per email
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });
    
    let customerId;
    
    // Se il cliente esiste già in Stripe
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Crea un nuovo cliente in Stripe
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      
      customerId = newCustomer.id;
    }
    
    // Aggiorna lo stripe_customer_id nelle user_settings
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (userSettings) {
      await supabase
        .from('user_settings')
        .update({
          body: {
            ...userSettings.body,
            stripe_customer_id: customerId,
          },
        })
        .eq('user_id', user.id);
    }

    // Crea una sessione di setup per il metodo di pagamento
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'setup',
      customer: customerId,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?payment_success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?payment_cancelled=true`,
      // Abilita la raccolta di informazioni fiscali
      tax_id_collection: {
        enabled: true
      },
      // Campi aggiuntivi da raccogliere
      customer_update: {
        name: 'auto',
        address: 'auto',
      },
      billing_address_collection: 'required',
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Si è verificato un errore durante la creazione della sessione di checkout' },
      { status: 500 }
    );
  }
} 