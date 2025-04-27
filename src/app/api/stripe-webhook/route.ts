import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { headers } from 'next/headers';

// Inizializza Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
});

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    // Verifica la firma dell'evento con il segreto webhook
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`Webhook error: ${error.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }

  console.log(`Event received: ${event.type}`);

  // Gestisci eventi diversi
  try {
    if (event.type === 'customer.updated') {
      await handleCustomerUpdated(event.data.object as Stripe.Customer);
    } else if (event.type === 'customer.tax_id.created' || event.type === 'customer.tax_id.updated') {
      await handleTaxIdUpdated(event);
    } else if (event.type === 'payment_method.attached') {
      await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
    } else if (event.type === 'setup_intent.succeeded') {
      await handleSetupIntentSucceeded(event.data.object as Stripe.SetupIntent);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}

// Gestisce l'aggiornamento del cliente
async function handleCustomerUpdated(customer: Stripe.Customer) {
  console.log('Customer updated:', customer.id);
  
  // Creiamo il client Supabase all'interno della funzione
  const supabase = createRouteHandlerClient({ cookies });

  // Trova l'utente nel database tramite il customer ID
  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('*')
    .filter('body->stripe_customer_id', 'eq', customer.id);

  if (!userSettings || userSettings.length === 0) {
    console.log('No user found with this customer ID');
    return;
  }

  for (const settings of userSettings) {
    // Aggiorna le informazioni nel database
    await supabase
      .from('user_settings')
      .update({
        body: {
          ...settings.body,
          is_payment_set: true, // Se il cliente è stato aggiornato, probabilmente ha un metodo di pagamento
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', settings.id);
  }
}

// Gestisce l'aggiornamento dell'ID fiscale
async function handleTaxIdUpdated(event: Stripe.Event) {
  const taxId = event.data.object as Stripe.TaxId;
  const customerId = taxId.customer as string;
  console.log('Tax ID updated for customer:', customerId);
  
  // Creiamo il client Supabase all'interno della funzione
  const supabase = createRouteHandlerClient({ cookies });

  // Recupera i dettagli fiscali
  const fiscalCode = taxId.value;
  
  // Trova l'utente nel database tramite il customer ID
  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('*')
    .filter('body->stripe_customer_id', 'eq', customerId);

  if (!userSettings || userSettings.length === 0) {
    console.log('No user found with this customer ID');
    return;
  }

  for (const settings of userSettings) {
    // Aggiorna le informazioni fiscali nel database
    await supabase
      .from('user_settings')
      .update({
        body: {
          ...settings.body,
          fiscal_code: fiscalCode,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', settings.id);
  }
}

// Gestisce l'aggiunta di un metodo di pagamento
async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  const customerId = paymentMethod.customer as string;
  console.log('Payment method attached for customer:', customerId);
  
  // Creiamo il client Supabase all'interno della funzione
  const supabase = createRouteHandlerClient({ cookies });

  // Verifica che sia una carta
  if (paymentMethod.type !== 'card' || !paymentMethod.card) {
    return;
  }

  // Crea oggetto con informazioni della carta
  const cardInfo = {
    id: paymentMethod.id,
    brand: paymentMethod.card.brand,
    last4: paymentMethod.card.last4,
    expMonth: paymentMethod.card.exp_month,
    expYear: paymentMethod.card.exp_year
  };

  // Trova l'utente nel database tramite il customer ID
  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('*')
    .filter('body->stripe_customer_id', 'eq', customerId);

  if (!userSettings || userSettings.length === 0) {
    console.log('No user found with this customer ID');
    return;
  }

  for (const settings of userSettings) {
    // Aggiorna le informazioni della carta nel database
    await supabase
      .from('user_settings')
      .update({
        body: {
          ...settings.body,
          is_payment_set: true,
          stripe_payment_method: cardInfo,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', settings.id);
  }
}

// Gestisce il successo di una setup intent
async function handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent) {
  const customerId = setupIntent.customer as string;
  console.log('Setup intent succeeded for customer:', customerId);
  
  // Creiamo il client Supabase all'interno della funzione
  const supabase = createRouteHandlerClient({ cookies });

  if (!setupIntent.payment_method) {
    return;
  }

  // Recupera i dettagli del metodo di pagamento
  const paymentMethod = await stripe.paymentMethods.retrieve(
    setupIntent.payment_method as string
  );

  // Recupera i tax IDs
  const taxIds = await stripe.customers.listTaxIds(customerId);
  const fiscalCode = taxIds.data.length > 0 ? taxIds.data[0].value : null;

  // Verifica che sia una carta
  if (paymentMethod.type !== 'card' || !paymentMethod.card) {
    return;
  }

  // Crea oggetto con informazioni della carta
  const cardInfo = {
    id: paymentMethod.id,
    brand: paymentMethod.card.brand,
    last4: paymentMethod.card.last4,
    expMonth: paymentMethod.card.exp_month,
    expYear: paymentMethod.card.exp_year
  };

  // Trova l'utente nel database tramite il customer ID
  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('*')
    .filter('body->stripe_customer_id', 'eq', customerId);

  if (!userSettings || userSettings.length === 0) {
    console.log('No user found with this customer ID');
    return;
  }

  for (const settings of userSettings) {
    // Aggiorna tutte le informazioni nel database
    await supabase
      .from('user_settings')
      .update({
        body: {
          ...settings.body,
          is_payment_set: true,
          stripe_payment_method: cardInfo,
          fiscal_code: fiscalCode || settings.body?.fiscal_code,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', settings.id);
  }
} 