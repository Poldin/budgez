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
      
      // Salva o aggiorna lo stripe_customer_id nella colonna dedicata delle user_settings
      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (userSettings && (userSettings.stripe_customer_id !== customer.id)) {
        await supabase
          .from('user_settings')
          .update({
            stripe_customer_id: customer.id
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
  console.log('===== INIZIO CREATE-CHECKOUT-SESSION =====');
  try {
    // Inizializza Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-03-31.basil',
    });
    console.log('Stripe inizializzato');

    // Ottieni l'utente autenticato da Supabase
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Utente autenticato:', user ? { id: user.id, email: user.email } : 'nessun utente');

    if (!user || !user.email) {
      console.log('Errore: utente non autenticato o email mancante');
      return NextResponse.json(
        { error: 'Utente non autenticato o email mancante' },
        { status: 401 }
      );
    }

    // Cerca prima il cliente in Stripe per email
    console.log('Ricerca cliente con email:', user.email);
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });
    console.log('Risultati ricerca cliente:', customers.data.length > 0 ? 'trovato' : 'non trovato');
    
    let customerId;
    
    // Se il cliente esiste già in Stripe
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log('Cliente esistente ID:', customerId);
      
      // Verifica se i metadata contengono userId
      console.log('Recupero dettagli cliente per verificare metadata...');
      const customer = await stripe.customers.retrieve(customerId);
      
      // Cast del customer come Stripe.Customer per accedere ai metadata in sicurezza
      const customerData = customer as Stripe.Customer;
      console.log('Metadata cliente:', customerData.metadata || 'nessun metadata');
      
      // Se non ha metadata.userId, aggiornalo
      if (!customer.deleted && (!customerData.metadata || !customerData.metadata.userId)) {
        console.log('Metadata userId mancante, aggiorno...');
        await stripe.customers.update(customerId, {
          metadata: {
            ...customerData.metadata,
            userId: user.id,
          },
        });
        console.log('Metadata aggiornati con userId:', user.id);
      } else if (customerData.metadata && customerData.metadata.userId) {
        console.log('Metadata userId già presente:', customerData.metadata.userId);
      }
    } else {
      // Crea un nuovo cliente in Stripe
      console.log('Creazione nuovo cliente con userId nei metadata:', user.id);
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      
      customerId = newCustomer.id;
      console.log('Nuovo cliente creato ID:', customerId);
      console.log('Metadata nuovo cliente:', newCustomer.metadata);
    }
    
    // Aggiorna lo stripe_customer_id nella colonna dedicata delle user_settings
    console.log('Recupero user_settings per utente ID:', user.id);
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    console.log('User settings trovato:', userSettings ? 'sì' : 'no');
    
    if (userSettings) {
      console.log('Aggiorno stripe_customer_id in user_settings');
      await supabase
        .from('user_settings')
        .update({
          stripe_customer_id: customerId
        })
        .eq('user_id', user.id);
      console.log('User settings aggiornato con customer_id:', customerId);
    } else {
      console.log('ATTENZIONE: User settings non trovato per utente ID:', user.id);
    }

    // Crea una sessione di setup per il metodo di pagamento
    console.log('Creazione sessione checkout per customer ID:', customerId);
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
    console.log('Sessione checkout creata, ID:', session.id);
    console.log('URL sessione:', session.url);
    console.log('===== FINE CREATE-CHECKOUT-SESSION =====');

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    console.log('===== ERRORE CREATE-CHECKOUT-SESSION =====');
    return NextResponse.json(
      { error: 'Si è verificato un errore durante la creazione della sessione di checkout' },
      { status: 500 }
    );
  }
} 