ALTER TYPE public.admin_billing_provider ADD VALUE IF NOT EXISTS 'sumup';
COMMENT ON TABLE public.stripe_webhook_events IS 'DEPRECATED: Stripe removed, payments via SumUp';
COMMENT ON TABLE public.stripe_subscriptions IS 'DEPRECATED: Stripe removed, payments via SumUp';
COMMENT ON TABLE public.stripe_customers IS 'DEPRECATED: Stripe removed, payments via SumUp';
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_payment_transactions_reference ON public.user_payment_transactions (reference) WHERE reference <> '';