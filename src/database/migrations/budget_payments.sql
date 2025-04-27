-- Create budget_payments table for storing payment records
-- This table stores records of payments processed for budget approvals

CREATE TABLE IF NOT EXISTS budget_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    payment_amount_eur DECIMAL(10, 2),
    payment_intent_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_budget_payments_budget_id ON budget_payments(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_payments_user_id ON budget_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_payments_payment_intent_id ON budget_payments(payment_intent_id);

-- Add comment to table
COMMENT ON TABLE budget_payments IS 'Records of payments processed for budget approvals (0.1% fee)';
COMMENT ON COLUMN budget_payments.amount IS 'Amount in original currency as specified in the budget';
COMMENT ON COLUMN budget_payments.currency IS 'Currency code from the budget (EUR, USD, GBP, etc.)';
COMMENT ON COLUMN budget_payments.payment_amount_eur IS 'Amount in EUR after conversion (if needed). Null if conversion rate not available.'; 