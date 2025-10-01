-- Tạo schema cho quản lý chi phí dự án với AI
-- File: create_project_costs_schema.sql

-- Bảng danh mục chi phí
CREATE TABLE IF NOT EXISTS cost_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type cost_type NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enum cho loại chi phí
CREATE TYPE IF NOT EXISTS cost_type AS ENUM (
    'labor', 'material', 'service', 'overhead', 'contingency'
);

-- Enum cho trạng thái chi phí
CREATE TYPE IF NOT EXISTS cost_status AS ENUM (
    'pending', 'approved', 'rejected', 'paid'
);

-- Bảng chi phí dự án
CREATE TABLE IF NOT EXISTS project_costs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    cost_category_id UUID REFERENCES cost_categories(id),
    employee_id UUID REFERENCES employees(id),
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    vendor VARCHAR(255),
    cost_date DATE NOT NULL,
    receipt_url TEXT,
    status cost_status DEFAULT 'pending',
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_confidence INTEGER DEFAULT 0,
    created_by UUID REFERENCES employees(id),
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bảng phân bổ chi phí (cho chi phí chung)
CREATE TABLE IF NOT EXISTS cost_allocations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_cost_id UUID REFERENCES project_costs(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    allocation_percentage DECIMAL(5,2) NOT NULL,
    allocated_amount DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample cost categories
INSERT INTO cost_categories (name, type, description) VALUES
('Lương cơ bản', 'labor', 'Lương cơ bản của nhân viên'),
('Phụ cấp đi lại', 'labor', 'Phụ cấp đi lại, ăn uống'),
('Bảo hiểm xã hội', 'labor', 'Bảo hiểm xã hội, y tế, thất nghiệp'),
('Đào tạo nhân viên', 'labor', 'Chi phí đào tạo, chứng chỉ'),
('Phần cứng', 'material', 'Máy tính, server, thiết bị'),
('Phần mềm', 'material', 'Licenses, tools, cloud services'),
('Vật tư tiêu hao', 'material', 'Giấy, mực, vật tư văn phòng'),
('Dịch vụ bên ngoài', 'service', 'Outsourcing, consulting'),
('Dịch vụ kỹ thuật', 'service', 'Cloud hosting, APIs, monitoring'),
('Dịch vụ hỗ trợ', 'service', 'Support, maintenance, updates'),
('Chi phí quản lý', 'overhead', 'Quản lý dự án, QA, risk management'),
('Chi phí cơ sở hạ tầng', 'overhead', 'Văn phòng, điện, internet'),
('Chi phí pháp lý', 'overhead', 'Hợp đồng, tuân thủ, bảo hiểm'),
('Dự phòng', 'contingency', 'Dự phòng cho rủi ro, thay đổi')
ON CONFLICT DO NOTHING;

-- Tạo indexes để tối ưu performance
CREATE INDEX IF NOT EXISTS idx_project_costs_project_id ON project_costs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_costs_date ON project_costs(cost_date);
CREATE INDEX IF NOT EXISTS idx_project_costs_status ON project_costs(status);
CREATE INDEX IF NOT EXISTS idx_project_costs_ai_generated ON project_costs(ai_generated);
CREATE INDEX IF NOT EXISTS idx_cost_allocations_project_id ON cost_allocations(project_id);

-- Tạo view để tính toán chi phí dự án
CREATE OR REPLACE VIEW project_cost_summary AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.project_code,
    p.budget as project_budget,
    COALESCE(SUM(pc.amount), 0) as total_actual_cost,
    COALESCE(SUM(CASE WHEN pc.status = 'approved' THEN pc.amount ELSE 0 END), 0) as approved_cost,
    COALESCE(SUM(CASE WHEN pc.status = 'pending' THEN pc.amount ELSE 0 END), 0) as pending_cost,
    COALESCE(SUM(CASE WHEN pc.ai_generated = true THEN pc.amount ELSE 0 END), 0) as ai_generated_cost,
    COALESCE(AVG(pc.ai_confidence), 0) as avg_ai_confidence,
    p.budget - COALESCE(SUM(pc.amount), 0) as budget_variance
FROM projects p
LEFT JOIN project_costs pc ON p.id = pc.project_id
GROUP BY p.id, p.name, p.project_code, p.budget;

-- Tạo view cho breakdown chi phí theo loại
CREATE OR REPLACE VIEW project_cost_breakdown AS
SELECT 
    pc.project_id,
    p.name as project_name,
    cc.type as cost_type,
    cc.name as category_name,
    COALESCE(SUM(pc.amount), 0) as total_amount,
    COUNT(pc.id) as cost_count,
    COALESCE(AVG(pc.ai_confidence), 0) as avg_confidence
FROM project_costs pc
JOIN projects p ON pc.project_id = p.id
JOIN cost_categories cc ON pc.cost_category_id = cc.id
GROUP BY pc.project_id, p.name, cc.type, cc.name;

-- Tạo function để tính toán ROI
CREATE OR REPLACE FUNCTION calculate_project_roi(project_uuid UUID)
RETURNS TABLE (
    project_id UUID,
    project_name VARCHAR,
    total_revenue DECIMAL,
    total_cost DECIMAL,
    gross_profit DECIMAL,
    roi_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        COALESCE(p.budget, 0) as total_revenue,
        COALESCE(SUM(pc.amount), 0) as total_cost,
        COALESCE(p.budget, 0) - COALESCE(SUM(pc.amount), 0) as gross_profit,
        CASE 
            WHEN COALESCE(SUM(pc.amount), 0) > 0 
            THEN ((COALESCE(p.budget, 0) - COALESCE(SUM(pc.amount), 0)) / COALESCE(SUM(pc.amount), 0)) * 100
            ELSE 0 
        END as roi_percentage
    FROM projects p
    LEFT JOIN project_costs pc ON p.id = pc.project_id AND pc.status = 'approved'
    WHERE p.id = project_uuid
    GROUP BY p.id, p.name, p.budget;
END;
$$ LANGUAGE plpgsql;

-- Tạo trigger để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_costs_updated_at
    BEFORE UPDATE ON project_costs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cost_categories_updated_at
    BEFORE UPDATE ON cost_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Tạo RLS policies cho security
ALTER TABLE project_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_allocations ENABLE ROW LEVEL SECURITY;

-- Policy cho project_costs
CREATE POLICY "Users can view project costs" ON project_costs
    FOR SELECT USING (true);

CREATE POLICY "Users can insert project costs" ON project_costs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update project costs" ON project_costs
    FOR UPDATE USING (true);

-- Policy cho cost_categories
CREATE POLICY "Users can view cost categories" ON cost_categories
    FOR SELECT USING (true);

-- Policy cho cost_allocations
CREATE POLICY "Users can view cost allocations" ON cost_allocations
    FOR SELECT USING (true);

CREATE POLICY "Users can insert cost allocations" ON cost_allocations
    FOR INSERT WITH CHECK (true);

-- Insert sample project costs (optional - for testing)
-- INSERT INTO project_costs (project_id, cost_category_id, amount, description, vendor, cost_date, status, ai_generated, ai_confidence) VALUES
-- ((SELECT id FROM projects LIMIT 1), (SELECT id FROM cost_categories WHERE name = 'Lương cơ bản'), 5000000, 'Lương tháng 1', 'Công ty ABC', '2024-01-15', 'approved', false, 0),
-- ((SELECT id FROM projects LIMIT 1), (SELECT id FROM cost_categories WHERE name = 'Phần cứng'), 2000000, 'Mua laptop', 'Tech Store', '2024-01-20', 'approved', true, 95);

COMMENT ON TABLE project_costs IS 'Bảng lưu trữ chi phí của các dự án';
COMMENT ON TABLE cost_categories IS 'Bảng danh mục các loại chi phí';
COMMENT ON TABLE cost_allocations IS 'Bảng phân bổ chi phí chung cho nhiều dự án';
COMMENT ON VIEW project_cost_summary IS 'View tổng hợp chi phí dự án';
COMMENT ON VIEW project_cost_breakdown IS 'View phân tích chi phí theo loại';
COMMENT ON FUNCTION calculate_project_roi IS 'Function tính toán ROI của dự án';
