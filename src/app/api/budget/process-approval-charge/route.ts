import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

// Define interfaces for our data structures
interface QuoteItem {
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
}

interface QuoteTable {
  items: QuoteItem[];
  taxIncluded: boolean;
  currency?: string;
}

interface Block {
  type: string;
  metadata?: {
    quoteTable?: QuoteTable;
  };
}

interface BudgetBody {
  bella?: {
    blocks?: Block[];
  };
  blocks?: Block[];
}

// Funzione per calcolare il subtotale di un elemento
const calculateItemSubtotal = (item: QuoteItem): number => {
  const baseAmount = item.quantity * item.unitPrice;
  const discountAmount = baseAmount * (item.discount / 100);
  return baseAmount - discountAmount;
};

// Funzione per calcolare il totale della tabella quote inclusa IVA
const calculateTotalFromQuoteTable = (quoteTable: QuoteTable): number => {
  if (!quoteTable || !quoteTable.items || !Array.isArray(quoteTable.items)) {
    return 0;
  }
  
  return quoteTable.items.reduce((total: number, item: QuoteItem) => {
    let itemTotal = calculateItemSubtotal(item);
    
    // Se l'IVA non è inclusa, aggiungerla
    if (!quoteTable.taxIncluded) {
      const taxAmount = itemTotal * (item.tax / 100);
      itemTotal += taxAmount;
    }
    
    return total + itemTotal;
  }, 0);
};

// Funzione per estrarre il totale dal body del budget
const extractTotalFromBudgetBody = (body: BudgetBody): number => {
  try {
    // Cerca il blocco quote-table in bella
    if (body?.bella?.blocks && Array.isArray(body.bella.blocks)) {
      const quoteTableBlock = body.bella.blocks.find(
        (block: Block) => block.type === 'quote-table' && block.metadata?.quoteTable
      );
      
      if (quoteTableBlock && quoteTableBlock.metadata?.quoteTable) {
        return calculateTotalFromQuoteTable(quoteTableBlock.metadata.quoteTable);
      }
    }
    
    // Se non trovato in bella, cerca nei blocchi normali
    if (body?.blocks && Array.isArray(body.blocks)) {
      const quoteTableBlock = body.blocks.find(
        (block: Block) => block.type === 'quote-table' && block.metadata?.quoteTable
      );
      
      if (quoteTableBlock && quoteTableBlock.metadata?.quoteTable) {
        return calculateTotalFromQuoteTable(quoteTableBlock.metadata.quoteTable);
      }
    }
    
    // Fallback: nessuna tabella trovata
    return 0;
  } catch (error) {
    console.error('Error extracting total from budget body:', error);
    return 0;
  }
};

// Funzione per estrarre la currency dal body del budget
const extractCurrencyFromBudgetBody = (body: BudgetBody): string => {
  try {
    // Cerca il blocco quote-table in bella
    if (body?.bella?.blocks && Array.isArray(body.bella.blocks)) {
      const quoteTableBlock = body.bella.blocks.find(
        (block: Block) => block.type === 'quote-table' && block.metadata?.quoteTable?.currency
      );
      
      if (quoteTableBlock && quoteTableBlock.metadata?.quoteTable?.currency) {
        return quoteTableBlock.metadata.quoteTable.currency;
      }
    }
    
    // Se non trovato in bella, cerca nei blocchi normali
    if (body?.blocks && Array.isArray(body.blocks)) {
      const quoteTableBlock = body.blocks.find(
        (block: Block) => block.type === 'quote-table' && block.metadata?.quoteTable?.currency
      );
      
      if (quoteTableBlock && quoteTableBlock.metadata?.quoteTable?.currency) {
        return quoteTableBlock.metadata.quoteTable.currency;
      }
    }
    
    // Fallback: currency di default
    return 'EUR';
  } catch (error) {
    console.error('Error extracting currency from budget body:', error);
    return 'EUR';
  }
};

export async function POST(request: Request) {
  try {
    const { approvalId } = await request.json();

    // Validate required fields
    if (!approvalId) {
      return NextResponse.json(
        { error: 'Missing required field: approvalId is required' },
        { status: 400 }
      );
    }

    console.log('Processing approval charge:', { approvalId });
    
    // Initialize Stripe with API key
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-03-31.basil',
    });

    // Create supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // 1. Fetch the approval data to get the budgetId and the body_approval
    const { data: approvalData, error: approvalError } = await supabase
      .from('budget_approvals')
      .select('budget_id, body_approval')
      .eq('id', approvalId)
      .single();

    if (approvalError || !approvalData) {
      console.error('Error fetching approval data:', approvalError);
      return NextResponse.json(
        { error: 'Error fetching approval data' },
        { status: 500 }
      );
    }

    const budgetId = approvalData.budget_id;
    
    // Get the budget name and public ID
    const { data: budgetInfo, error: budgetInfoError } = await supabase
      .from('budgets')
      .select('budget_name, public_id')
      .eq('id', budgetId)
      .single();
    
    if (budgetInfoError) {
      console.error('Error fetching budget info:', budgetInfoError);
    }
    
    const budgetName = budgetInfo?.budget_name || 'Preventivo';
    const budgetPublicId = budgetInfo?.public_id || budgetId;

    // 2. Extract total amount and currency from the approval body
    const approvalBody = approvalData.body_approval;
    
    // Calculate total amount from the approval body
    const totalAmount = extractTotalFromBudgetBody(approvalBody);
    console.log('Calculated total amount:', totalAmount);
    
    // If no total amount could be calculated, return error
    if (totalAmount <= 0) {
      console.warn('Approval has zero or missing total amount, skipping payment processing');
      return NextResponse.json(
        { error: 'No valid amount found in approval' },
        { status: 400 }
      );
    }

    // Extract currency from approval body
    const originalCurrency = extractCurrencyFromBudgetBody(approvalBody);
    console.log('Extracted currency:', originalCurrency);

    // 3. Get the budget owner information
    const { data: budgetOwnerData, error: budgetOwnerError } = await supabase
      .from('link_budget_users')
      .select('user_id')
      .eq('budget_id', budgetId)
      .eq('user_role', 'owner')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (budgetOwnerError || !budgetOwnerData) {
      console.error('Error fetching budget owner:', budgetOwnerError);
      return NextResponse.json(
        { error: 'Error fetching budget owner' },
        { status: 500 }
      );
    }

    const ownerId = budgetOwnerData.user_id;

    // 4. Get the owner's user settings to retrieve Stripe customer ID
    const { data: userSettings, error: userSettingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', ownerId)
      .single();

    if (userSettingsError || !userSettings) {
      console.error('Error fetching user settings:', userSettingsError);
      return NextResponse.json(
        { error: 'Error fetching user settings' },
        { status: 500 }
      );
    }

    // Check if the user has a Stripe customer ID
    const stripeCustomerId = userSettings.stripe_customer_id;
    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'No payment method set up for this user' },
        { status: 400 }
      );
    }

    // 5. Calculate the 0.1% fee amount in the original currency
    const feePercentage = 0.001; // 0.1%
    const feeAmountDecimal = totalAmount * feePercentage;
    
    // 6. Setup payment details - all payments are processed in EUR
    const paymentAmount = feeAmountDecimal;
    const paymentCurrency = 'eur'; // Always use EUR for the actual charge
    
    // Flag if we're converting from a different currency
    const isConvertingCurrency = originalCurrency.toUpperCase() !== 'EUR';

    // Check if the user has a payment method set up
    const hasPaymentMethod = userSettings.body?.stripe_payment_method ? true : false;
    
    // If no payment method found, save record with NPM status
    if (!hasPaymentMethod) {
      console.log('No payment method found for customer', { customerId: stripeCustomerId });
      
      // Save the record in the database without processing payment
      const { data: paymentRecord, error: paymentRecordError } = await supabase
        .from('budget_payments')
        .insert({
          budget_id: budgetId,
          user_id: ownerId,
          amount: feeAmountDecimal,
          currency: originalCurrency,
          payment_amount_eur: isConvertingCurrency ? null : feeAmountDecimal,
          payment_intent_id: null, // No payment intent created
          status: 'NPM', // No Payment Method
          approval_id: approvalId,
          payment_metadata: {
            feePercentage: '0.1%',
            originalAmount: totalAmount.toString(),
            originalCurrency: originalCurrency,
            isConverted: isConvertingCurrency ? 'true' : 'false'
          }
        })
        .select('id')
        .single();

      if (paymentRecordError) {
        console.error('Error storing no payment method record:', paymentRecordError);
      }

      return NextResponse.json({
        success: true,
        paymentId: paymentRecord?.id,
        amount: feeAmountDecimal,
        currency: originalCurrency,
        status: 'NPM',
        isConverted: isConvertingCurrency,
        message: 'No payment method found for customer'
      });
    }

    // Get payment method ID
    const paymentMethodId = userSettings.body?.stripe_payment_method?.id;

    // Check if amount is too small (less than 10 EUR)
    // If too small, save record with TSTBP status without attempting Stripe payment
    if (paymentAmount < 10) {
      console.log('Amount too small for processing', { amount: paymentAmount });
      
      // Save the record in the database without processing payment
      const { data: paymentRecord, error: paymentRecordError } = await supabase
        .from('budget_payments')
        .insert({
          budget_id: budgetId,
          user_id: ownerId,
          amount: feeAmountDecimal,
          currency: originalCurrency,
          payment_amount_eur: isConvertingCurrency ? null : feeAmountDecimal,
          payment_intent_id: null, // No payment intent created
          status: 'TSTBP', // Too Small To Be Paid
          approval_id: approvalId,
          payment_metadata: {
            feePercentage: '0.1%',
            originalAmount: totalAmount.toString(),
            originalCurrency: originalCurrency,
            isConverted: isConvertingCurrency ? 'true' : 'false'
          }
        })
        .select('id')
        .single();

      if (paymentRecordError) {
        console.error('Error storing small payment record:', paymentRecordError);
      }

      return NextResponse.json({
        success: true,
        paymentId: paymentRecord?.id,
        amount: feeAmountDecimal,
        currency: originalCurrency,
        status: 'TSTBP',
        isConverted: isConvertingCurrency,
        message: 'Amount too small for processing, saved for batch processing'
      });
    }
    
    // Convert to cents for Stripe (Stripe requires amount in smallest currency unit)
    const feeAmountCents = Math.round(paymentAmount * 100);

    // 7. Create PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: feeAmountCents,
      currency: paymentCurrency,
      customer: stripeCustomerId,
      payment_method: paymentMethodId,
      description: `Commissione approvazione preventivo "${budgetName}" (ID: ${budgetPublicId})`,
      payment_method_types: ['card'],
      confirm: true,
      off_session: true,
      metadata: {
        budgetId,
        budgetName,
        feePercentage: '0.1%',
        originalAmount: totalAmount.toString(),
        originalCurrency: originalCurrency,
        isConverted: isConvertingCurrency ? 'true' : 'false',
        approvalId: approvalId
      }
    });

    // 8. Store the payment record in the database
    const { data: paymentRecord, error: paymentRecordError } = await supabase
      .from('budget_payments')
      .insert({
        budget_id: budgetId,
        user_id: ownerId,
        amount: feeAmountDecimal,
        currency: originalCurrency,
        payment_amount_eur: isConvertingCurrency ? null : feeAmountDecimal, // If not converting, this is the same
        payment_intent_id: paymentIntent.id,
        status: paymentIntent.status,
        approval_id: approvalId,
        payment_metadata: paymentIntent
      })
      .select('id')
      .single();

    if (paymentRecordError) {
      console.error('Error storing payment record:', paymentRecordError);
    }

    return NextResponse.json({
      success: true,
      paymentId: paymentRecord?.id,
      paymentIntentId: paymentIntent.id,
      amount: feeAmountDecimal,
      currency: originalCurrency,
      status: paymentIntent.status,
      isConverted: isConvertingCurrency
    });
  } catch (error: unknown) {
    console.error('Payment processing error:', error);
    
    // Handle specific Stripe errors
    if (error instanceof Stripe.errors.StripeCardError) {
      return NextResponse.json(
        { 
          error: 'La carta è stata rifiutata',
          stripeError: error.message 
        },
        { status: 400 }
      );
    }
    
    // Handle authentication errors
    if (error instanceof Stripe.errors.StripeAuthenticationError) {
      return NextResponse.json(
        { error: 'Errore di autenticazione con Stripe' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Si è verificato un errore nell\'elaborazione del pagamento' },
      { status: 500 }
    );
  }
} 