-- =====================================================
-- BỔ SUNG DATABASE SCHEMA
-- Các bảng và chức năng còn thiếu
-- =====================================================

-- =====================================================
-- AI CHAT & ASSISTANT
-- =====================================================

-- Chat sessions
CREATE TABLE chat_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    context_data JSONB DEFAULT '{}', -- Store relevant business context
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    response TEXT,
    message_type VARCHAR(20) DEFAULT 'user', -- user, assistant, system
    tokens_used INTEGER DEFAULT 0,
    response_time_ms INTEGER,
    context_entities JSONB DEFAULT '[]', -- Referenced entities (customers, projects, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ADVANCED FINANCIAL TRACKING
-- =====================================================

-- Budget planning
CREATE TABLE budgets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL, -- project, department, annual, monthly
    entity_id UUID, -- project_id, department_id, null for company-wide
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    planned_amount DECIMAL(12,2) NOT NULL,
    actual_amount DECIMAL(12,2) DEFAULT 0,
    variance DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- active, completed, cancelled
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budget line items
CREATE TABLE budget_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    planned_amount DECIMAL(12,2) NOT NULL,
    actual_amount DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cash flow tracking
CREATE TABLE cash_flow_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    type VARCHAR(20) NOT NULL, -- inflow, outflow
    category VARCHAR(50) NOT NULL, -- sales, expenses, investment, loan, etc.
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    reference_type VARCHAR(50), -- invoice, expense, payment, etc.
    reference_id UUID,
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- WORKFLOW & APPROVALS
-- =====================================================

-- Approval workflows
CREATE TABLE approval_workflows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- expense, invoice, project, etc.
    conditions JSONB NOT NULL, -- Conditions to trigger workflow
    steps JSONB NOT NULL, -- Approval steps configuration
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Approval requests
CREATE TABLE approval_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workflow_id UUID REFERENCES approval_workflows(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
    current_step INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- REPORTS & TEMPLATES
-- =====================================================

-- Custom report templates
CREATE TABLE report_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- financial, project, customer, employee
    description TEXT,
    query_config JSONB NOT NULL, -- SQL query configuration
    chart_config JSONB, -- Chart visualization settings
    filters JSONB DEFAULT '[]', -- Available filters
    schedule JSONB, -- Auto-generation schedule
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated reports
CREATE TABLE generated_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_id UUID REFERENCES report_templates(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parameters JSONB DEFAULT '{}',
    file_path TEXT,
    file_size BIGINT,
    generation_time_ms INTEGER,
    generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- EMAIL & COMMUNICATIONS
-- =====================================================

-- Email templates
CREATE TABLE email_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- invoice, reminder, welcome, etc.
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    variables JSONB DEFAULT '[]', -- Available template variables
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email logs
CREATE TABLE email_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
    to_email VARCHAR(255) NOT NULL,
    cc_emails TEXT[], -- Array of CC emails
    subject VARCHAR(255) NOT NULL,
    body TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed, bounced
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    entity_type VARCHAR(50), -- invoice, expense, etc.
    entity_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INTEGRATION & API
-- =====================================================

-- API keys for external integrations
CREATE TABLE api_integrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- banking, payment, accounting, etc.
    config JSONB NOT NULL, -- Integration configuration
    credentials JSONB NOT NULL, -- Encrypted credentials
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync logs for integrations
CREATE TABLE sync_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    integration_id UUID REFERENCES api_integrations(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL, -- full, incremental, manual
    status VARCHAR(20) NOT NULL, -- success, failed, partial
    records_processed INTEGER DEFAULT 0,
    records_success INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_details JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- PERFORMANCE OPTIMIZATION TABLES
-- =====================================================

-- Materialized view for dashboard metrics (refresh periodically)
CREATE MATERIALIZED VIEW dashboard_metrics AS
SELECT 
    'today' as period,
    CURRENT_DATE as date,
    COALESCE(SUM(CASE WHEN i.payment_status = 'paid' AND i.paid_date = CURRENT_DATE THEN i.total_amount END), 0) as daily_revenue,
    COALESCE(SUM(CASE WHEN e.status = 'approved' AND e.expense_date = CURRENT_DATE THEN e.amount END), 0) as daily_expenses,
    COUNT(CASE WHEN i.status = 'overdue' THEN 1 END) as overdue_invoices,
    COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_projects,
    COUNT(CASE WHEN c.created_at::date = CURRENT_DATE THEN 1 END) as new_customers_today
FROM invoices i
FULL OUTER JOIN expenses e ON true
FULL OUTER JOIN projects p ON true  
FULL OUTER JOIN customers c ON true

UNION ALL

SELECT 
    'month' as period,
    DATE_TRUNC('month', CURRENT_DATE) as date,
    COALESCE(SUM(CASE WHEN i.payment_status = 'paid' AND DATE_TRUNC('month', i.paid_date) = DATE_TRUNC('month', CURRENT_DATE) THEN i.total_amount END), 0) as monthly_revenue,
    COALESCE(SUM(CASE WHEN e.status = 'approved' AND DATE_TRUNC('month', e.expense_date) = DATE_TRUNC('month', CURRENT_DATE) THEN e.amount END), 0) as monthly_expenses,
    COUNT(CASE WHEN i.status = 'overdue' THEN 1 END) as overdue_invoices,
    COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_projects,
    COUNT(CASE WHEN DATE_TRUNC('month', c.created_at) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as new_customers_month
FROM invoices i
FULL OUTER JOIN expenses e ON true
FULL OUTER JOIN projects p ON true
FULL OUTER JOIN customers c ON true;

-- Index for materialized view
CREATE UNIQUE INDEX idx_dashboard_metrics_period ON dashboard_metrics(period);

-- =====================================================
-- ADDITIONAL INDEXES
-- =====================================================

-- Chat indexes
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- Budget indexes
CREATE INDEX idx_budgets_entity ON budgets(type, entity_id);
CREATE INDEX idx_budgets_period ON budgets(period_start, period_end);

-- Cash flow indexes
CREATE INDEX idx_cash_flow_date ON cash_flow_entries(date);
CREATE INDEX idx_cash_flow_type ON cash_flow_entries(type, category);

-- Approval indexes
CREATE INDEX idx_approval_requests_status ON approval_requests(status);
CREATE INDEX idx_approval_requests_entity ON approval_requests(entity_type, entity_id);

-- Email indexes
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_entity ON email_logs(entity_type, entity_id);

-- =====================================================
-- RLS POLICIES FOR NEW TABLES
-- =====================================================

-- Enable RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Users can read own chat sessions" ON chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read own chat messages" ON chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can read budgets" ON budgets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read cash flow" ON cash_flow_entries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read approvals" ON approval_requests FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read reports" ON report_templates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read email logs" ON email_logs FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================
-- TRIGGER FUNCTIONS
-- =====================================================

-- Function to refresh dashboard metrics
CREATE OR REPLACE FUNCTION refresh_dashboard_metrics()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW dashboard_metrics;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers to refresh metrics when data changes
CREATE TRIGGER refresh_metrics_on_invoice_change
    AFTER INSERT OR UPDATE OR DELETE ON invoices
    FOR EACH STATEMENT EXECUTE FUNCTION refresh_dashboard_metrics();

CREATE TRIGGER refresh_metrics_on_expense_change
    AFTER INSERT OR UPDATE OR DELETE ON expenses
    FOR EACH STATEMENT EXECUTE FUNCTION refresh_dashboard_metrics();

-- Function to auto-generate budget variance
CREATE OR REPLACE FUNCTION calculate_budget_variance()
RETURNS trigger AS $$
BEGIN
    NEW.variance = NEW.actual_amount - NEW.planned_amount;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_budget_variance_trigger
    BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION calculate_budget_variance();

-- =====================================================
-- SAMPLE DATA FOR NEW TABLES
-- =====================================================

-- Sample email templates
INSERT INTO email_templates (name, type, subject, body_html, body_text, variables) VALUES
('Invoice Reminder', 'reminder', 'Payment Reminder - Invoice {{invoice_number}}', 
 '<h1>Payment Reminder</h1><p>Dear {{customer_name}},</p><p>Invoice {{invoice_number}} is overdue. Please pay {{amount}} by {{due_date}}.</p>',
 'Dear {{customer_name}}, Invoice {{invoice_number}} is overdue. Please pay {{amount}} by {{due_date}}.', 
 '["customer_name", "invoice_number", "amount", "due_date"]'::jsonb),

('Welcome Email', 'welcome', 'Welcome to Phuc Dat Financial Management', 
 '<h1>Welcome!</h1><p>Hello {{user_name}}, welcome to our financial management system.</p>',
 'Hello {{user_name}}, welcome to our financial management system.',
 '["user_name"]'::jsonb);

-- Sample approval workflow
INSERT INTO approval_workflows (name, entity_type, conditions, steps, is_active) VALUES
('Expense Approval', 'expense', 
 '{"min_amount": 1000000, "categories": ["equipment", "training"]}'::jsonb,
 '[{"level": 1, "role": "manager", "required": true}, {"level": 2, "role": "admin", "required": false}]'::jsonb,
 true);

-- Sample report template
INSERT INTO report_templates (name, type, description, query_config, created_by) VALUES
('Monthly Revenue Report', 'financial', 'Monthly revenue breakdown by project',
 '{"base_query": "SELECT p.name, SUM(i.total_amount) as revenue FROM invoices i JOIN projects p ON i.project_id = p.id", "filters": ["date_range", "project_status"], "group_by": "p.name"}'::jsonb,
 NULL);

-- =====================================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- =====================================================

-- Function to get user dashboard data
CREATE OR REPLACE FUNCTION get_user_dashboard_data(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_revenue', COALESCE(SUM(CASE WHEN i.payment_status = 'paid' THEN i.total_amount END), 0),
        'pending_invoices', COUNT(CASE WHEN i.status = 'sent' THEN 1 END),
        'overdue_invoices', COUNT(CASE WHEN i.status = 'overdue' THEN 1 END),
        'active_projects', (SELECT COUNT(*) FROM projects WHERE status = 'active'),
        'recent_expenses', (
            SELECT jsonb_agg(jsonb_build_object('description', description, 'amount', amount, 'date', expense_date))
            FROM expenses 
            WHERE employee_id IN (SELECT id FROM employees WHERE user_id = user_uuid)
            ORDER BY created_at DESC LIMIT 5
        )
    ) INTO result
    FROM invoices i;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;