
-- stripe_customers
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  stripe_customer_id text UNIQUE NOT NULL,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_email ON public.stripe_customers (lower(email));

ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view stripe_customers"
ON public.stripe_customers
FOR SELECT
TO authenticated
USING (public.current_admin_profile_id() IS NOT NULL);

-- stripe_subscriptions
CREATE TABLE IF NOT EXISTS public.stripe_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_price_id text,
  plan text,
  status text,
  current_period_end timestamptz,
  trial_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_customer ON public.stripe_subscriptions (stripe_customer_id);

ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view stripe_subscriptions"
ON public.stripe_subscriptions
FOR SELECT
TO authenticated
USING (public.current_admin_profile_id() IS NOT NULL);

-- stripe_webhook_events (idempotency)
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  status text NOT NULL DEFAULT 'received',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view stripe_webhook_events"
ON public.stripe_webhook_events
FOR SELECT
TO authenticated
USING (public.current_admin_profile_id() IS NOT NULL);
