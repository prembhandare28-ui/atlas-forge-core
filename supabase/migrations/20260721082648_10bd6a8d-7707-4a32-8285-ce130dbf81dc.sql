
-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.brain_status AS ENUM ('draft','published','stable','experimental','archived');
CREATE TYPE public.brain_category AS ENUM ('sales','support','operations','marketing','research','finance','growth','recruitment','executive','custom');
CREATE TYPE public.brain_visibility AS ENUM ('private','organization','public');
CREATE TYPE public.brain_tone AS ENUM ('formal','friendly','concise','persuasive','empathetic','analytical','playful');
CREATE TYPE public.brain_decision_style AS ENUM ('conservative','balanced','aggressive','data_driven','intuitive');
CREATE TYPE public.brain_response_depth AS ENUM ('brief','standard','detailed','exhaustive');
CREATE TYPE public.brain_assignment_target AS ENUM ('employee','workflow');

CREATE TYPE public.knowledge_source_type AS ENUM ('pdf','docx','markdown','text','faq','sop','pricing','policy','notes','url');
CREATE TYPE public.knowledge_category AS ENUM ('general','product','sales','support','marketing','operations','finance','hr','legal','engineering','custom');
CREATE TYPE public.knowledge_status AS ENUM ('draft','active','archived');

CREATE TYPE public.skill_category AS ENUM ('sales','support','research','marketing','recruitment','operations','finance','negotiation','planning','analysis','writing','translation','coding','custom');
CREATE TYPE public.skill_difficulty AS ENUM ('beginner','intermediate','advanced','expert');

CREATE TYPE public.tool_auth_type AS ENUM ('none','api_key','oauth2','basic','custom');
CREATE TYPE public.tool_status AS ENUM ('inactive','active','deprecated');
CREATE TYPE public.tool_health AS ENUM ('unknown','healthy','degraded','down');
CREATE TYPE public.tool_environment AS ENUM ('development','staging','production');

CREATE TYPE public.marketplace_license AS ENUM ('proprietary','mit','apache_2','commercial','custom');
CREATE TYPE public.marketplace_pricing_model AS ENUM ('free','one_time','subscription','usage_based','enterprise');

-- ============================================================
-- BRAINS
-- ============================================================
CREATE TABLE public.brains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identity
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  status public.brain_status NOT NULL DEFAULT 'draft',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category public.brain_category NOT NULL DEFAULT 'custom',
  tags TEXT[] NOT NULL DEFAULT '{}',
  avatar_url TEXT,
  -- Mission
  mission TEXT,
  goals TEXT[] NOT NULL DEFAULT '{}',
  success_definition TEXT,
  kpis JSONB NOT NULL DEFAULT '[]'::jsonb,
  expected_roi NUMERIC,
  -- Behaviour
  tone public.brain_tone NOT NULL DEFAULT 'friendly',
  decision_style public.brain_decision_style NOT NULL DEFAULT 'balanced',
  creativity_level INTEGER NOT NULL DEFAULT 50 CHECK (creativity_level BETWEEN 0 AND 100),
  risk_level INTEGER NOT NULL DEFAULT 30 CHECK (risk_level BETWEEN 0 AND 100),
  response_depth public.brain_response_depth NOT NULL DEFAULT 'standard',
  -- Rules
  always_do TEXT[] NOT NULL DEFAULT '{}',
  never_do TEXT[] NOT NULL DEFAULT '{}',
  escalation_rules TEXT,
  approval_rules TEXT,
  -- Memory
  session_memory_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  long_term_memory_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  context_window_tokens INTEGER NOT NULL DEFAULT 8000,
  memory_retention_days INTEGER NOT NULL DEFAULT 30,
  -- Security
  visibility public.brain_visibility NOT NULL DEFAULT 'organization',
  organization_id UUID,
  -- Marketplace
  marketplace_ready BOOLEAN NOT NULL DEFAULT FALSE,
  marketplace_author TEXT,
  marketplace_license public.marketplace_license,
  marketplace_pricing_model public.marketplace_pricing_model,
  marketplace_price NUMERIC,
  marketplace_dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
  marketplace_install_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  compatibility_version TEXT NOT NULL DEFAULT '1.0.0',
  -- Runtime hooks (future)
  brain_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  template_id UUID,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX brains_status_idx ON public.brains(status);
CREATE INDEX brains_category_idx ON public.brains(category);
CREATE INDEX brains_owner_idx ON public.brains(owner_id);
CREATE INDEX brains_tags_gin_idx ON public.brains USING GIN(tags);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brains TO authenticated;
GRANT ALL ON public.brains TO service_role;
ALTER TABLE public.brains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brains_read_all_auth" ON public.brains FOR SELECT TO authenticated USING (true);
CREATE POLICY "brains_write_managers" ON public.brains FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "brains_update_managers" ON public.brains FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "brains_delete_managers" ON public.brains FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE TRIGGER brains_set_updated_at BEFORE UPDATE ON public.brains
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- BRAIN VERSIONS
-- ============================================================
CREATE TABLE public.brain_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brain_id UUID NOT NULL REFERENCES public.brains(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  status public.brain_status NOT NULL DEFAULT 'draft',
  snapshot JSONB NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(brain_id, version)
);
CREATE INDEX brain_versions_brain_idx ON public.brain_versions(brain_id, version DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brain_versions TO authenticated;
GRANT ALL ON public.brain_versions TO service_role;
ALTER TABLE public.brain_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brain_versions_read_all" ON public.brain_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "brain_versions_write_managers" ON public.brain_versions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "brain_versions_delete_admin" ON public.brain_versions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- ============================================================
-- BRAIN ANALYTICS (daily rollup foundation)
-- ============================================================
CREATE TABLE public.brain_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brain_id UUID NOT NULL REFERENCES public.brains(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  execution_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  avg_response_ms INTEGER,
  revenue_influence NUMERIC,
  csat_score NUMERIC,
  estimated_roi NUMERIC,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(brain_id, day)
);
CREATE INDEX brain_analytics_brain_day_idx ON public.brain_analytics_daily(brain_id, day DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brain_analytics_daily TO authenticated;
GRANT ALL ON public.brain_analytics_daily TO service_role;
ALTER TABLE public.brain_analytics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brain_analytics_read_all" ON public.brain_analytics_daily FOR SELECT TO authenticated USING (true);
CREATE POLICY "brain_analytics_write_service" ON public.brain_analytics_daily FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============================================================
-- BRAIN ACTIVITY
-- ============================================================
CREATE TABLE public.brain_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brain_id UUID NOT NULL REFERENCES public.brains(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX brain_activity_brain_idx ON public.brain_activity(brain_id, created_at DESC);
GRANT SELECT, INSERT ON public.brain_activity TO authenticated;
GRANT ALL ON public.brain_activity TO service_role;
ALTER TABLE public.brain_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brain_activity_read_all" ON public.brain_activity FOR SELECT TO authenticated USING (true);
CREATE POLICY "brain_activity_insert_auth" ON public.brain_activity FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- KNOWLEDGE PACKS
-- ============================================================
CREATE TABLE public.knowledge_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  category public.knowledge_category NOT NULL DEFAULT 'general',
  version INTEGER NOT NULL DEFAULT 1,
  source_type public.knowledge_source_type NOT NULL DEFAULT 'text',
  source_url TEXT,
  content TEXT,
  file_path TEXT,
  file_size_bytes BIGINT,
  status public.knowledge_status NOT NULL DEFAULT 'active',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID,
  visibility public.brain_visibility NOT NULL DEFAULT 'organization',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX knowledge_packs_category_idx ON public.knowledge_packs(category);
CREATE INDEX knowledge_packs_status_idx ON public.knowledge_packs(status);
CREATE INDEX knowledge_packs_tags_gin_idx ON public.knowledge_packs USING GIN(tags);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_packs TO authenticated;
GRANT ALL ON public.knowledge_packs TO service_role;
ALTER TABLE public.knowledge_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kp_read_all" ON public.knowledge_packs FOR SELECT TO authenticated USING (true);
CREATE POLICY "kp_write_managers" ON public.knowledge_packs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "kp_update_managers" ON public.knowledge_packs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "kp_delete_managers" ON public.knowledge_packs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE TRIGGER kp_set_updated_at BEFORE UPDATE ON public.knowledge_packs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Knowledge versions
CREATE TABLE public.knowledge_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_id UUID NOT NULL REFERENCES public.knowledge_packs(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(knowledge_id, version)
);
GRANT SELECT, INSERT ON public.knowledge_versions TO authenticated;
GRANT ALL ON public.knowledge_versions TO service_role;
ALTER TABLE public.knowledge_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kv_read_all" ON public.knowledge_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "kv_insert_managers" ON public.knowledge_versions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- ============================================================
-- SKILLS
-- ============================================================
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category public.skill_category NOT NULL DEFAULT 'custom',
  description TEXT,
  difficulty public.skill_difficulty NOT NULL DEFAULT 'intermediate',
  required_knowledge UUID[] NOT NULL DEFAULT '{}',
  required_tools UUID[] NOT NULL DEFAULT '{}',
  dependencies UUID[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX skills_category_idx ON public.skills(category);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skills TO authenticated;
GRANT ALL ON public.skills TO service_role;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skills_read_all" ON public.skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "skills_write_managers" ON public.skills FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "skills_update_managers" ON public.skills FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "skills_delete_managers" ON public.skills FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE TRIGGER skills_set_updated_at BEFORE UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TOOLS
-- ============================================================
CREATE TABLE public.tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  description TEXT,
  auth_type public.tool_auth_type NOT NULL DEFAULT 'none',
  scopes TEXT[] NOT NULL DEFAULT '{}',
  permissions TEXT[] NOT NULL DEFAULT '{}',
  status public.tool_status NOT NULL DEFAULT 'inactive',
  health public.tool_health NOT NULL DEFAULT 'unknown',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  environment public.tool_environment NOT NULL DEFAULT 'development',
  icon TEXT,
  base_url TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  runtime_ready BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX tools_provider_idx ON public.tools(provider);
CREATE INDEX tools_status_idx ON public.tools(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tools TO authenticated;
GRANT ALL ON public.tools TO service_role;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tools_read_all" ON public.tools FOR SELECT TO authenticated USING (true);
CREATE POLICY "tools_write_managers" ON public.tools FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "tools_update_managers" ON public.tools FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "tools_delete_admin" ON public.tools FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER tools_set_updated_at BEFORE UPDATE ON public.tools
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- BRAIN TEMPLATES
-- ============================================================
CREATE TABLE public.brain_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category public.brain_category NOT NULL DEFAULT 'custom',
  tags TEXT[] NOT NULL DEFAULT '{}',
  snapshot JSONB NOT NULL,
  is_official BOOLEAN NOT NULL DEFAULT FALSE,
  author TEXT,
  usage_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX brain_templates_category_idx ON public.brain_templates(category);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brain_templates TO authenticated;
GRANT ALL ON public.brain_templates TO service_role;
ALTER TABLE public.brain_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bt_read_all" ON public.brain_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "bt_write_managers" ON public.brain_templates FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "bt_update_managers" ON public.brain_templates FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "bt_delete_admin" ON public.brain_templates FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER bt_set_updated_at BEFORE UPDATE ON public.brain_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- FK for brains.template_id (added now that table exists)
ALTER TABLE public.brains ADD CONSTRAINT brains_template_id_fkey
  FOREIGN KEY (template_id) REFERENCES public.brain_templates(id) ON DELETE SET NULL;

-- ============================================================
-- JUNCTION TABLES
-- ============================================================
CREATE TABLE public.brain_knowledge (
  brain_id UUID NOT NULL REFERENCES public.brains(id) ON DELETE CASCADE,
  knowledge_id UUID NOT NULL REFERENCES public.knowledge_packs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (brain_id, knowledge_id)
);
GRANT SELECT, INSERT, DELETE ON public.brain_knowledge TO authenticated;
GRANT ALL ON public.brain_knowledge TO service_role;
ALTER TABLE public.brain_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bk_read_all" ON public.brain_knowledge FOR SELECT TO authenticated USING (true);
CREATE POLICY "bk_write_managers" ON public.brain_knowledge FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "bk_delete_managers" ON public.brain_knowledge FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE TABLE public.brain_skills (
  brain_id UUID NOT NULL REFERENCES public.brains(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (brain_id, skill_id)
);
GRANT SELECT, INSERT, DELETE ON public.brain_skills TO authenticated;
GRANT ALL ON public.brain_skills TO service_role;
ALTER TABLE public.brain_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bs_read_all" ON public.brain_skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "bs_write_managers" ON public.brain_skills FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "bs_delete_managers" ON public.brain_skills FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE TABLE public.brain_tools (
  brain_id UUID NOT NULL REFERENCES public.brains(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (brain_id, tool_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brain_tools TO authenticated;
GRANT ALL ON public.brain_tools TO service_role;
ALTER TABLE public.brain_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bt2_read_all" ON public.brain_tools FOR SELECT TO authenticated USING (true);
CREATE POLICY "bt2_write_managers" ON public.brain_tools FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE TABLE public.brain_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brain_id UUID NOT NULL REFERENCES public.brains(id) ON DELETE CASCADE,
  target_type public.brain_assignment_target NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (target_type = 'employee' AND employee_id IS NOT NULL AND workflow_id IS NULL) OR
    (target_type = 'workflow' AND workflow_id IS NOT NULL AND employee_id IS NULL)
  )
);
CREATE UNIQUE INDEX ba_employee_uniq ON public.brain_assignments(brain_id, employee_id) WHERE employee_id IS NOT NULL;
CREATE UNIQUE INDEX ba_workflow_uniq ON public.brain_assignments(brain_id, workflow_id) WHERE workflow_id IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brain_assignments TO authenticated;
GRANT ALL ON public.brain_assignments TO service_role;
ALTER TABLE public.brain_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ba_read_all" ON public.brain_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "ba_write_managers" ON public.brain_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- ============================================================
-- SEED: Starter Skills, Tools, and Brain Templates
-- ============================================================
INSERT INTO public.skills (name, category, description, difficulty) VALUES
  ('Outbound Prospecting','sales','Identify and reach out to qualified prospects','intermediate'),
  ('Discovery Calls','sales','Run structured discovery to qualify pain and fit','advanced'),
  ('Objection Handling','sales','Handle common buyer objections with framing','advanced'),
  ('Ticket Triage','support','Classify, prioritize, and route inbound tickets','beginner'),
  ('Customer Empathy','support','Acknowledge and de-escalate frustrated customers','intermediate'),
  ('Market Research','research','Analyze market segments and competitor moves','advanced'),
  ('Content Writing','writing','Draft long-form and marketing copy','intermediate'),
  ('Copy Editing','writing','Refine tone, grammar, and clarity','intermediate'),
  ('Campaign Planning','marketing','Design multi-channel campaigns with KPIs','advanced'),
  ('Candidate Screening','recruitment','Review resumes and score against JD','intermediate'),
  ('Financial Modeling','finance','Build 3-statement and scenario models','expert'),
  ('Data Analysis','analysis','Explore datasets and surface insight','advanced'),
  ('Negotiation','negotiation','Multi-party value negotiation','expert'),
  ('Sprint Planning','planning','Break down goals into scoped sprints','intermediate'),
  ('Code Review','coding','Review PRs for quality and correctness','advanced'),
  ('Translation','translation','Multi-language content translation','intermediate');

INSERT INTO public.tools (name, provider, auth_type, status, health, environment, runtime_ready, description) VALUES
  ('Gmail','google','oauth2','inactive','unknown','production',FALSE,'Send and read email'),
  ('Google Drive','google','oauth2','inactive','unknown','production',FALSE,'Read and write documents'),
  ('Google Calendar','google','oauth2','inactive','unknown','production',FALSE,'Schedule and manage events'),
  ('Slack','slack','oauth2','inactive','unknown','production',FALSE,'Send channel and DM messages'),
  ('WhatsApp','meta','api_key','inactive','unknown','production',FALSE,'Send WhatsApp business messages'),
  ('Stripe','stripe','api_key','inactive','unknown','production',FALSE,'Payments and subscriptions'),
  ('HubSpot','hubspot','oauth2','inactive','unknown','production',FALSE,'CRM contacts and deals'),
  ('Notion','notion','oauth2','inactive','unknown','production',FALSE,'Docs and databases'),
  ('Internal API','internal','api_key','inactive','unknown','development',FALSE,'Company internal REST API');

INSERT INTO public.brain_templates (name, description, category, tags, is_official, snapshot) VALUES
  ('Sales Brain','Outbound + inbound sales assistant that qualifies leads and books meetings.','sales',ARRAY['sales','revenue'],TRUE,
   '{"mission":"Book qualified meetings for the sales team","tone":"persuasive","decision_style":"data_driven","goals":["Qualify inbound leads","Book demos","Nurture pipeline"],"always_do":["Confirm budget and timeline","Log every touchpoint"],"never_do":["Discount without approval"]}'::jsonb),
  ('Support Brain','Front-line support agent for triage, empathy, and resolution.','support',ARRAY['support','csat'],TRUE,
   '{"mission":"Resolve customer issues fast with empathy","tone":"empathetic","decision_style":"conservative","goals":["Reduce first-response time","Improve CSAT"],"always_do":["Acknowledge frustration","Confirm the fix"],"never_do":["Promise timelines you cannot keep"]}'::jsonb),
  ('Operations Brain','Runs SOPs and coordinates cross-team ops workflows.','operations',ARRAY['ops'],TRUE,
   '{"mission":"Keep operations running smoothly","tone":"concise","decision_style":"balanced","goals":["Ensure SOP compliance","Reduce cycle time"]}'::jsonb),
  ('Marketing Brain','Plans and executes multi-channel marketing campaigns.','marketing',ARRAY['marketing','growth'],TRUE,
   '{"mission":"Drive qualified pipeline through marketing","tone":"friendly","decision_style":"data_driven","goals":["Grow MQL volume","Improve LTV"]}'::jsonb),
  ('CEO Assistant','Executive assistant for strategic prioritization and briefings.','executive',ARRAY['ceo','executive'],TRUE,
   '{"mission":"Amplify the CEO with prep, briefs, and prioritization","tone":"formal","decision_style":"balanced","response_depth":"detailed"}'::jsonb),
  ('Research Assistant','Deep research and synthesis on demand.','research',ARRAY['research'],TRUE,
   '{"mission":"Deliver deep, cited research quickly","tone":"analytical","decision_style":"data_driven","response_depth":"exhaustive"}'::jsonb),
  ('Finance Assistant','Financial analysis, modeling, and reporting.','finance',ARRAY['finance'],TRUE,
   '{"mission":"Own numbers and financial insight","tone":"analytical","decision_style":"conservative"}'::jsonb),
  ('Growth Assistant','Experimentation and growth-loop optimization.','growth',ARRAY['growth','experiments'],TRUE,
   '{"mission":"Compound growth via experiments","tone":"analytical","decision_style":"aggressive"}'::jsonb),
  ('Recruitment Assistant','Sourcing, screening, and candidate outreach.','recruitment',ARRAY['recruiting'],TRUE,
   '{"mission":"Fill roles with high-quality candidates fast","tone":"friendly","decision_style":"balanced"}'::jsonb);
