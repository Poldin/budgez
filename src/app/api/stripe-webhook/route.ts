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

  // Trova l'utente nel database tramite lo stripe_customer_id
  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('stripe_customer_id', customer.id);

  if (!userSettings || userSettings.length === 0) {
    console.log('No user found with stripe_customer_id:', customer.id);
    
    // Se non troviamo il record con stripe_customer_id, proviamo a cercarlo con i metadata userId come fallback
    if (customer.metadata && customer.metadata.userId) {
      const { data: userSettingsByUserId } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', customer.metadata.userId);
        
      if (!userSettingsByUserId || userSettingsByUserId.length === 0) {
        console.log('No user found with user_id:', customer.metadata.userId);
        return;
      }
      
      // Aggiorna i record trovati con il customer ID
      for (const settings of userSettingsByUserId) {
        await supabase
          .from('user_settings')
          .update({
            body: {
              ...settings.body,
              is_payment_set: true,
            },
            stripe_customer_id: customer.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id);
      }
      return;
    }
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
  
  // Trova l'utente nel database tramite lo stripe_customer_id
  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('stripe_customer_id', customerId);

  if (!userSettings || userSettings.length === 0) {
    console.log('No user found with stripe_customer_id:', customerId);
    
    // Se non troviamo il record con stripe_customer_id, recuperiamo customer e proviamo con i metadata userId
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer || customer.deleted) {
      console.log('Customer not found or deleted');
      return;
    }
    
    if (customer.metadata && customer.metadata.userId) {
      const { data: userSettingsByUserId } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', customer.metadata.userId);
        
      if (!userSettingsByUserId || userSettingsByUserId.length === 0) {
        console.log('No user found with user_id:', customer.metadata.userId);
        return;
      }
      
      // Aggiorna i record trovati con il customer ID e il codice fiscale
      for (const settings of userSettingsByUserId) {
        await supabase
          .from('user_settings')
          .update({
            body: {
              ...settings.body,
              fiscal_code: fiscalCode,
            },
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id);
      }
      return;
    }
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
  console.log('====== DEBUG: handlePaymentMethodAttached ======');
  console.log('Payment method attached for customer:', customerId);
  console.log('Payment method details:', {
    id: paymentMethod.id,
    type: paymentMethod.type,
    card: paymentMethod.card ? {
      brand: paymentMethod.card.brand,
      last4: paymentMethod.card.last4
    } : 'N/A'
  });
  
  // Creiamo il client Supabase all'interno della funzione
  const supabase = createRouteHandlerClient({ cookies });

  // Verifica che sia una carta
  if (paymentMethod.type !== 'card' || !paymentMethod.card) {
    console.log('DEBUG: Not a card payment method, exiting');
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
  console.log('DEBUG: Card info prepared:', cardInfo);

  // Trova l'utente nel database tramite lo stripe_customer_id
  console.log('DEBUG: Searching for user with stripe_customer_id:', customerId);
  const { data: userSettings, error: userSettingsError } = await supabase
    .from('user_settings')
    .select('*')
    .eq('stripe_customer_id', customerId);
  
  console.log('DEBUG: Query result:', { 
    found: userSettings ? userSettings.length : 0, 
    error: userSettingsError ? userSettingsError.message : 'none' 
  });
  
  if (userSettings) {
    console.log('DEBUG: Records found:', userSettings.length);
    if (userSettings.length > 0) {
      console.log('DEBUG: First record id:', userSettings[0].id);
      console.log('DEBUG: User ID in first record:', userSettings[0].user_id);
    }
  }

  if (!userSettings || userSettings.length === 0) {
    console.log('DEBUG: No user found with stripe_customer_id:', customerId);
    
    // Proviamo a fare una query generica sulla tabella per vedere se esistono record
    console.log('DEBUG: Checking if table has any records');
    const { data: allSettings, error: allSettingsError } = await supabase
      .from('user_settings')
      .select('id, user_id, stripe_customer_id')
      .limit(5);
    
    console.log('DEBUG: Sample records in table:', allSettings);
    if (allSettingsError) {
      console.log('DEBUG: Error querying table:', allSettingsError.message);
    }
    
    // Se non troviamo il record con stripe_customer_id, recuperiamo customer e proviamo con i metadata userId
    console.log('DEBUG: Retrieving customer from Stripe to get metadata');
    try {
      const customer = await stripe.customers.retrieve(customerId);
      
      if (!customer || 'deleted' in customer) {
        console.log('DEBUG: Customer not found or deleted');
        return;
      }
      
      console.log('DEBUG: Customer retrieved:', { 
        id: customer.id, 
        metadata: customer.metadata
      });
      
      console.log('DEBUG: Customer metadata:', customer.metadata);
      
      if (customer.metadata && customer.metadata.userId) {
        console.log('DEBUG: Found userId in metadata:', customer.metadata.userId);
        const { data: userSettingsByUserId, error: userIdQueryError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', customer.metadata.userId);
        
        console.log('DEBUG: Query by user_id result:', {
          found: userSettingsByUserId ? userSettingsByUserId.length : 0,
          error: userIdQueryError ? userIdQueryError.message : 'none'
        });
          
        if (!userSettingsByUserId || userSettingsByUserId.length === 0) {
          console.log('DEBUG: No user found with user_id:', customer.metadata.userId);
          return;
        }
        
        // Aggiorna i record trovati con il customer ID e i dati della carta
        console.log('DEBUG: Updating records found by user_id');
        for (const settings of userSettingsByUserId) {
          console.log('DEBUG: Updating record id:', settings.id);
          const { error: updateError } = await supabase
            .from('user_settings')
            .update({
              body: {
                ...settings.body,
                is_payment_set: true,
                stripe_payment_method: cardInfo,
              },
              stripe_customer_id: customerId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', settings.id);
            
          console.log('DEBUG: Update result:', updateError ? `Error: ${updateError.message}` : 'Success');
        }
        return;
      } else {
        console.log('DEBUG: No userId found in customer metadata');
      }
    } catch (error) {
      console.error('DEBUG: Error retrieving customer:', error);
    }
    
    console.log('DEBUG: Could not find user by stripe_customer_id or metadata.userId, exiting');
    return;
  }

  console.log('DEBUG: Updating records found by stripe_customer_id');
  for (const settings of userSettings) {
    console.log('DEBUG: Updating record id:', settings.id);
    const { error: updateError } = await supabase
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
      
    console.log('DEBUG: Update result:', updateError ? `Error: ${updateError.message}` : 'Success');
  }
  console.log('====== END DEBUG: handlePaymentMethodAttached ======');
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

  // Trova l'utente nel database tramite lo stripe_customer_id
  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('stripe_customer_id', customerId);

  if (!userSettings || userSettings.length === 0) {
    console.log('No user found with stripe_customer_id:', customerId);
    
    // Se non troviamo il record con stripe_customer_id, recuperiamo customer e proviamo con i metadata userId
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer || customer.deleted) {
      console.log('Customer not found or deleted');
      return;
    }
    
    if (customer.metadata && customer.metadata.userId) {
      const { data: userSettingsByUserId } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', customer.metadata.userId);
        
      if (!userSettingsByUserId || userSettingsByUserId.length === 0) {
        console.log('No user found with user_id:', customer.metadata.userId);
        return;
      }
      
      // Aggiorna i record trovati con il customer ID, codice fiscale e dati della carta
      for (const settings of userSettingsByUserId) {
        await supabase
          .from('user_settings')
          .update({
            body: {
              ...settings.body,
              is_payment_set: true,
              stripe_payment_method: cardInfo,
              fiscal_code: fiscalCode || settings.body?.fiscal_code,
            },
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id);
      }
      return;
    }
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