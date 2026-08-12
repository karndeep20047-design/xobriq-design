-- Migration: Add M-Pesa STK Push transaction tracking table
-- Run this in the Supabase SQL editor or via a migration tool.

-- This table stores the state of each STK Push request, linking it to
-- the existing kyc_wallet_topup_requests table for wallet crediting.
CREATE TABLE IF NOT EXISTS mpesa_stk_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  phone_number TEXT NOT NULL,
  merchant_request_id TEXT,
  checkout_request_id TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING | SUCCESS | FAILED
  result_code TEXT,
  result_desc TEXT,
  mpesa_receipt_number TEXT,
  topup_request_id UUID REFERENCES kyc_wallet_topup_requests(id),
  raw_callback JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for callback lookups (Safaricom sends CheckoutRequestID)
CREATE INDEX IF NOT EXISTS idx_mpesa_stk_checkout ON mpesa_stk_transactions(checkout_request_id);

-- Index for user status polling
CREATE INDEX IF NOT EXISTS idx_mpesa_stk_user ON mpesa_stk_transactions(user_id, created_at DESC);

-- Index for org-level queries (audit, history)
CREATE INDEX IF NOT EXISTS idx_mpesa_stk_org ON mpesa_stk_transactions(organization_id, created_at DESC);

-- Also add a 'pending_payment' status option to kyc_wallet_topup_requests
-- if it doesn't already support it. The existing statuses are likely
-- 'pending', 'approved', 'rejected'. We add 'pending_payment' for the
-- window between STK push initiation and callback receipt.
-- (This is a no-op if the column is TEXT and already allows any value.)
COMMENT ON TABLE mpesa_stk_transactions IS
  'Tracks M-Pesa STK Push transactions initiated via the billing/top-up page. '
  'Each row links to a kyc_wallet_topup_requests row. '
  'On successful callback from Safaricom, the wallet is auto-credited.';
