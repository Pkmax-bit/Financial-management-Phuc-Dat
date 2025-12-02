-- Migration: Create company_settings table
-- Description: Add table to store company information for PDF exports
-- Date: 2025-12-02

-- Create company_settings table
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT DEFAULT 'Công ty TNHH Cửa Phúc Đạt',
  company_showroom TEXT,
  company_factory TEXT,
  company_website TEXT,
  company_hotline TEXT,
  company_logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default data if table is empty
INSERT INTO company_settings (
  company_name,
  company_showroom,
  company_factory,
  company_hotline
)
SELECT 
  'Công ty TNHH Cửa Phúc Đạt',
  'Showroom: Địa chỉ showroom',
  'Nhà máy: Địa chỉ nhà máy',
  'Hotline: Số điện thoại'
WHERE NOT EXISTS (SELECT 1 FROM company_settings LIMIT 1);

-- Add comment to table
COMMENT ON TABLE company_settings IS 'Stores company information for PDF exports and other documents';
COMMENT ON COLUMN company_settings.company_name IS 'Company name displayed on documents';
COMMENT ON COLUMN company_settings.company_showroom IS 'Showroom address';
COMMENT ON COLUMN company_settings.company_factory IS 'Factory address';
COMMENT ON COLUMN company_settings.company_website IS 'Company website URL';
COMMENT ON COLUMN company_settings.company_hotline IS 'Company hotline phone number';
COMMENT ON COLUMN company_settings.company_logo_url IS 'URL to company logo (can be Supabase Storage URL)';
