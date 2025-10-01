-- Create cost_categories table
CREATE TABLE IF NOT EXISTS public.cost_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default cost categories
INSERT INTO public.cost_categories (name, description) VALUES
('Phụ cấp đi lại', 'Chi phí đi lại, ăn uống, chỗ ở'),
('Vật tư tiêu hao', 'Vật tư, nguyên liệu tiêu hao'),
('Phần cứng', 'Thiết bị, máy móc, phần cứng'),
('Đào tạo nhân viên', 'Chi phí đào tạo, học tập'),
('Dịch vụ bên ngoài', 'Dịch vụ thuê ngoài, tư vấn'),
('Marketing', 'Chi phí quảng cáo, marketing'),
('Văn phòng', 'Chi phí văn phòng, điện nước'),
('Khác', 'Chi phí khác không phân loại')
ON CONFLICT (name) DO NOTHING;

-- Create project_costs table if not exists
CREATE TABLE IF NOT EXISTS public.project_costs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    cost_category_id UUID REFERENCES public.cost_categories(id),
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    expense_date DATE NOT NULL,
    vendor VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_confidence INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cost_allocations table if not exists
CREATE TABLE IF NOT EXISTS public.cost_allocations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_cost_id UUID REFERENCES public.project_costs(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    allocated_amount DECIMAL(15,2) NOT NULL,
    allocation_percentage DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_costs_project_id ON public.project_costs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_costs_expense_date ON public.project_costs(expense_date);
CREATE INDEX IF NOT EXISTS idx_project_costs_status ON public.project_costs(status);
CREATE INDEX IF NOT EXISTS idx_cost_allocations_project_id ON public.cost_allocations(project_id);
