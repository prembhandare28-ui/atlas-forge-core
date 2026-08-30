-- ============ ENUMS ============
CREATE TYPE public.offer_status AS ENUM ('draft','active','paused','retired');
CREATE TYPE public.offer_pricing_model AS ENUM ('one_time','subscription','retainer','usage_based','custom');
CREATE TYPE public.offer_billing_interval AS ENUM ('none','monthly','quarterly','annual');
CREATE TYPE public.lead_status AS ENUM ('new','contacted','qualified','unqualified','converted','archived');
CREATE TYPE public.lead_source AS ENUM ('website','referral','outbound','inbound','partner','event','atlas_research','other');
CREATE TYPE public.opportunity_stage AS ENUM ('lead','qualified','discovery','proposal','negotiation','won','onboarding','delivery','retention','expansion','lost');
CREATE TYPE public.customer_lifecycle AS ENUM ('prospect','customer','onboarding','active_delivery','completed','retention','expansion','churned');
CREATE TYPE public.proposal_status AS ENUM ('draft','in_review','approved','sent','accepted','rejected');
CREATE TYPE public.payment_status AS ENUM ('pending','requires_action','processing','succeeded','failed','refunded','cancelled');
CREATE TYPE public.revenue_event_kind AS ENUM ('booking','invoice','payment','recurring','expansion','refund','churn');

-- ============ OFFERS ============
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text,
  description text,
  target_customer text,
  pricing_model public.offer_pricing_model NOT NULL DEFAULT 'one_time',
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  billing_interval public.offer_billing_interval NOT NULL DEFAULT 'none',
  delivery_model text,
  delivery_duration_days integer,
  features text[] NOT NULL DEFAULT '{}',
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  onboarding_requirements text[] NOT NULL DEFAULT '{}',
  case_studies text[] NOT NULL DEFAULT '{}',
  cta_label text,
  status public.offer_status NOT NULL DEFAULT 'draft',
  is_public boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offers_select" ON public.offers FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "offers_insert" ON public.offers FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "offers_update" ON public.offers FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "offers_delete" ON public.offers FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER offers_updated_at BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ LEADS ============
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  company text,
  email text NOT NULL,
  phone text,
  website text,
  company_size text,
  role_title text,
  source public.lead_source NOT NULL DEFAULT 'website',
  source_detail text,
  problem text,
  message text,
  interested_offer_id uuid REFERENCES public.offers(id) ON DELETE SET NULL,
  consent boolean NOT NULL DEFAULT false,
  status public.lead_status NOT NULL DEFAULT 'new',
  score integer NOT NULL DEFAULT 0,
  tags text[] NOT NULL DEFAULT '{}',
  next_action text,
  next_action_at timestamptz,
  last_contacted_at timestamptz,
  notes text,
  qualification jsonb NOT NULL DEFAULT '{}'::jsonb,
  mission_id uuid REFERENCES public.mission_runs(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX leads_status_idx ON public.leads (status, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_select" ON public.leads FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "leads_insert" ON public.leads FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "leads_update" ON public.leads FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "leads_delete" ON public.leads FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ CUSTOMERS ============
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_name text,
  contact_email text,
  website text,
  industry text,
  lifecycle public.customer_lifecycle NOT NULL DEFAULT 'prospect',
  offer_id uuid REFERENCES public.offers(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  mrr numeric NOT NULL DEFAULT 0,
  total_revenue numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  delivery_status text,
  health text,
  started_at timestamptz,
  renewal_at timestamptz,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  onboarding_mission_id uuid REFERENCES public.mission_runs(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_select" ON public.customers FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "customers_insert" ON public.customers FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "customers_update" ON public.customers FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "customers_delete" ON public.customers FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ OPPORTUNITIES ============
CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text,
  contact_name text,
  contact_email text,
  source public.lead_source NOT NULL DEFAULT 'inbound',
  problem text,
  offer_id uuid REFERENCES public.offers(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  value numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  stage public.opportunity_stage NOT NULL DEFAULT 'lead',
  probability integer NOT NULL DEFAULT 10,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  next_action text,
  next_action_at timestamptz,
  last_contacted_at timestamptz,
  expected_close_at timestamptz,
  closed_at timestamptz,
  lost_reason text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  mission_id uuid REFERENCES public.mission_runs(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX opportunities_stage_idx ON public.opportunities (stage, updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opportunities_select" ON public.opportunities FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "opportunities_insert" ON public.opportunities FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "opportunities_update" ON public.opportunities FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "opportunities_delete" ON public.opportunities FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER opportunities_updated_at BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ PROPOSALS ============
CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  offer_id uuid REFERENCES public.offers(id) ON DELETE SET NULL,
  title text NOT NULL,
  status public.proposal_status NOT NULL DEFAULT 'draft',
  customer_summary text,
  detected_problem text,
  recommended_solution text,
  expected_workflow text,
  implementation_plan jsonb NOT NULL DEFAULT '[]'::jsonb,
  pricing_draft jsonb NOT NULL DEFAULT '{}'::jsonb,
  assumptions text[] NOT NULL DEFAULT '{}',
  next_steps text[] NOT NULL DEFAULT '{}',
  generated_by text,
  mission_id uuid REFERENCES public.mission_runs(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  sent_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals TO authenticated;
GRANT ALL ON public.proposals TO service_role;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposals_select" ON public.proposals FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "proposals_insert" ON public.proposals FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "proposals_update" ON public.proposals FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "proposals_delete" ON public.proposals FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER proposals_updated_at BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ REVENUE EVENTS ============
CREATE TABLE public.revenue_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.revenue_event_kind NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  is_recurring boolean NOT NULL DEFAULT false,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  offer_id uuid REFERENCES public.offers(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX revenue_events_occurred_idx ON public.revenue_events (occurred_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.revenue_events TO authenticated;
GRANT ALL ON public.revenue_events TO service_role;
ALTER TABLE public.revenue_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "revenue_events_select" ON public.revenue_events FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "revenue_events_insert" ON public.revenue_events FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "revenue_events_update" ON public.revenue_events FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "revenue_events_delete" ON public.revenue_events FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER revenue_events_updated_at BEFORE UPDATE ON public.revenue_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ PAYMENTS ============
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'manual',
  provider_customer_ref text,
  provider_payment_ref text,
  provider_subscription_ref text,
  invoice_ref text,
  invoice_url text,
  status public.payment_status NOT NULL DEFAULT 'pending',
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  offer_id uuid REFERENCES public.offers(id) ON DELETE SET NULL,
  confirmed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_select" ON public.payments FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "payments_insert" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "payments_update" ON public.payments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "payments_delete" ON public.payments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();