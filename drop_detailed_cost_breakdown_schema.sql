-- Script để xóa tất cả các bảng và view của hệ thống phân tích chi phí chi tiết
-- Chạy script này để xóa hoàn toàn hệ thống cost breakdown

-- Xóa các view trước
DROP VIEW IF EXISTS project_cost_by_category;
DROP VIEW IF EXISTS project_products_cost_detail;
DROP VIEW IF EXISTS project_cost_summary;

-- Xóa các bảng theo thứ tự (từ bảng con đến bảng cha)
-- Xóa bảng chi phí theo bên
DROP TABLE IF EXISTS product_cost_by_party;

-- Xóa bảng theo dõi chi phí dự án
DROP TABLE IF EXISTS project_cost_tracking;

-- Xóa bảng phân tích chi phí sản phẩm
DROP TABLE IF EXISTS product_cost_breakdown;

-- Xóa bảng cấu hình tỉ lệ chi phí
DROP TABLE IF EXISTS cost_ratio_config;

-- Xóa bảng loại chi phí chi tiết
DROP TABLE IF EXISTS detailed_cost_categories;

-- Xóa bảng các bên chi phí
DROP TABLE IF EXISTS cost_parties;

-- Xóa bảng sản phẩm từ hóa đơn
DROP TABLE IF EXISTS invoice_products;

-- Xóa các indexes (nếu còn tồn tại)
DROP INDEX IF EXISTS idx_invoice_products_invoice_id;
DROP INDEX IF EXISTS idx_product_cost_breakdown_project_id;
DROP INDEX IF EXISTS idx_product_cost_breakdown_invoice_product_id;
DROP INDEX IF EXISTS idx_project_cost_tracking_project_id;
DROP INDEX IF EXISTS idx_cost_ratio_config_project_id;

-- Xóa các indexes cho bảng product_cost_by_party (nếu có)
DROP INDEX IF EXISTS idx_product_cost_by_party_project_id;
DROP INDEX IF EXISTS idx_product_cost_by_party_invoice_product_id;
DROP INDEX IF EXISTS idx_product_cost_by_party_cost_party_id;
DROP INDEX IF EXISTS idx_product_cost_by_party_cost_category_id;

-- Xóa các indexes cho bảng cost_parties (nếu có)
DROP INDEX IF EXISTS idx_cost_parties_code;
DROP INDEX IF EXISTS idx_cost_parties_type;

-- Xóa các indexes cho bảng detailed_cost_categories (nếu có)
DROP INDEX IF EXISTS idx_detailed_cost_categories_code;
DROP INDEX IF EXISTS idx_detailed_cost_categories_parent_category;

-- Thông báo hoàn thành
SELECT 'All detailed cost breakdown tables, views, and indexes have been dropped successfully.' as message;
