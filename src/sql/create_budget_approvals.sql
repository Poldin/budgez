-- Create budget_approvals table
CREATE TABLE IF NOT EXISTS budget_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL, 
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  body_approval JSONB, -- Add JSON column to store budget snapshot
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add RLS policies
ALTER TABLE budget_approvals ENABLE ROW LEVEL SECURITY;

-- Allow read access to budget owners
CREATE POLICY "Budget owners can read approvals" 
  ON budget_approvals 
  FOR SELECT
  USING (
    budget_id IN (
      SELECT id FROM budgets WHERE owner_id = auth.uid()
    )
  );

-- Allow public read access (for checking if a budget is approved)
CREATE POLICY "Public can read approvals" 
  ON budget_approvals 
  FOR SELECT
  USING (TRUE);

-- Allow insert from authenticated users or anon (for public approval)
CREATE POLICY "Anyone can create approvals" 
  ON budget_approvals 
  FOR INSERT
  WITH CHECK (TRUE);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS budget_approvals_budget_id_idx ON budget_approvals(budget_id);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating timestamps
CREATE TRIGGER update_budget_approvals_updated_at
BEFORE UPDATE ON budget_approvals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 