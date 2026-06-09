-- SK Mobility Seed Data
USE sk_mobility;

-- Roles
INSERT INTO roles (name, slug, description, is_system) VALUES
('Super Admin', 'super_admin', 'Full system access', 1),
('Dealer', 'dealer', 'Dealer portal access', 1);

-- Permissions
INSERT INTO permissions (name, slug, module) VALUES
('View Dashboard', 'view_dashboard', 'dashboard'),
('Manage Users', 'manage_users', 'admin'),
('Manage Roles', 'manage_roles', 'admin'),
('Manage Dealers', 'manage_dealers', 'dealers'),
('Approve Dealers', 'approve_dealers', 'dealers'),
('View Dealers', 'view_dealers', 'dealers'),
('Manage Vehicles', 'manage_vehicles', 'vehicles'),
('View Vehicles', 'view_vehicles', 'vehicles'),
('Manage Orders', 'manage_orders', 'orders'),
('View Orders', 'view_orders', 'orders'),
('Approve Orders', 'approve_orders', 'orders'),
('Manage Payments', 'manage_payments', 'payments'),
('View Payments', 'view_payments', 'payments'),
('Manage Inventory', 'manage_inventory', 'inventory'),
('View Inventory', 'view_inventory', 'inventory'),
('Manage Leads', 'manage_leads', 'leads'),
('View Leads', 'view_leads', 'leads'),
('Manage Services', 'manage_services', 'services'),
('View Services', 'view_services', 'services'),
('Manage Spare Parts', 'manage_spare_parts', 'spare_parts'),
('View Spare Parts', 'view_spare_parts', 'spare_parts'),
('Manage Billing', 'manage_billing', 'billing'),
('View Billing', 'view_billing', 'billing'),
('View Reports', 'view_reports', 'reports'),
('Export Reports', 'export_reports', 'reports'),
('Manage Settings', 'manage_settings', 'admin'),
('View Audit Logs', 'view_audit_logs', 'admin');

-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Dealer permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE slug IN (
  'view_dashboard', 'view_dealers', 'view_vehicles', 'view_orders', 'manage_orders',
  'view_payments', 'view_inventory', 'manage_leads', 'view_leads', 'view_services',
  'manage_services', 'view_spare_parts', 'view_billing', 'view_reports'
);

-- Default Super Admin (password: Admin@123)
INSERT INTO users (role_id, email, password_hash, first_name, last_name, phone, is_active, is_verified, email_verified_at)
VALUES (1, 'admin@skmobility.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G2oQKqGqKqKqKq', 'Super', 'Admin', '9876543210', 1, 1, NOW());

-- Update with real bcrypt hash - will be set by seed script
-- Default password for all seed users: Admin@123

-- Lead Sources
INSERT INTO lead_sources (name, slug, description) VALUES
('Website', 'website', 'Website contact form'),
('QR Code', 'qr_code', 'QR code scan at events'),
('Walk-in', 'walk_in', 'Manual walk-in entry'),
('Referral', 'referral', 'Customer referral'),
('Social Media', 'social_media', 'Social media campaigns');

-- Vehicle Categories
INSERT INTO vehicle_categories (name, slug, description, sort_order) VALUES
('Two Wheelers', 'two-wheelers', 'Bikes and scooters', 1),
('Three Wheelers', 'three-wheelers', 'Auto rickshaws and commercial three wheelers', 2),
('Passenger Cars', 'passenger-cars', 'Hatchback, sedan, and SUV', 3),
('Commercial Vehicles', 'commercial-vehicles', 'Vans, pick-ups, and light commercial', 4),
('Trucks & Buses', 'trucks-buses', 'Heavy commercial vehicles', 5);

-- Sample Vehicles
INSERT INTO vehicles (category_id, name, slug, description, base_price) VALUES
(1, 'SK Street 125', 'sk-street-125', 'Reliable 125cc commuter bike\nYear: 2025 | Fuel: Petrol | Transmission: Manual | Engine: 125 cc | Seating: 2', 78999.00),
(2, 'SK Cargo Auto', 'sk-cargo-auto', 'Commercial three wheeler for goods transport\nYear: 2025 | Fuel: CNG | Transmission: Manual | Seating: 1', 245000.00),
(3, 'SK Comfort Sedan', 'sk-comfort-sedan', 'Family sedan with premium features\nYear: 2025 | Fuel: Petrol | Transmission: Automatic | Engine: 1498 cc | Seating: 5', 899999.00),
(4, 'SK Delivery Van', 'sk-delivery-van', 'Last-mile delivery commercial van\nYear: 2025 | Fuel: Diesel | Transmission: Manual | Engine: 1496 cc | Seating: 2', 1125000.00);

-- Vehicle Variants
INSERT INTO vehicle_variants (vehicle_id, name, sku, color, price) VALUES
(1, 'Street 125 - Black', 'SKS125-BLK', 'Black', 78999.00),
(1, 'Street 125 - Red', 'SKS125-RED', 'Red', 78999.00),
(2, 'Cargo Auto - Green', 'SKCA-GRN', 'Green', 245000.00),
(3, 'Comfort Sedan - White', 'SKCS-WHT', 'White', 899999.00),
(4, 'Delivery Van - White', 'SKDV-WHT', 'White', 1125000.00);

-- Warehouses
INSERT INTO warehouses (name, code, address, city, state, pincode, manager_name, phone) VALUES
('Mumbai Central Warehouse', 'WH-MUM-01', 'Plot 45, MIDC Andheri East', 'Mumbai', 'Maharashtra', '400093', 'Rajesh Kumar', '9876500001'),
('Delhi NCR Warehouse', 'WH-DEL-01', 'Sector 63, Noida', 'Noida', 'Uttar Pradesh', '201301', 'Amit Sharma', '9876500002'),
('Bangalore Hub', 'WH-BLR-01', 'Electronic City Phase 1', 'Bangalore', 'Karnataka', '560100', 'Priya Nair', '9876500003');

-- Inventory
INSERT INTO inventory (warehouse_id, variant_id, quantity, low_stock_threshold) VALUES
(1, 1, 50, 10), (1, 2, 35, 10), (1, 3, 80, 15),
(2, 1, 40, 10), (2, 4, 25, 5),
(3, 5, 10, 3);

-- Tax rates (GST India)
INSERT INTO taxes (name, tax_type, rate, effective_from) VALUES
('GST 5%', 'gst', 5.00, '2024-01-01'),
('GST 12%', 'gst', 12.00, '2024-01-01'),
('GST 18%', 'gst', 18.00, '2024-01-01'),
('GST 28%', 'gst', 28.00, '2024-01-01'),
('CGST 9%', 'cgst', 9.00, '2024-01-01'),
('SGST 9%', 'sgst', 9.00, '2024-01-01');

-- Spare Part Categories
INSERT INTO spare_part_categories (name, slug) VALUES
('Battery', 'battery'),
('Motor', 'motor'),
('Controller', 'controller'),
('Brakes', 'brakes'),
('Tyres', 'tyres'),
('Body Parts', 'body-parts');

-- Sample Spare Parts
INSERT INTO spare_parts (category_id, part_number, name, unit_price, description) VALUES
(1, 'BAT-3.2KWH', '3.2 kWh Lithium Battery Pack', 25000.00, 'Compatible with SK Zoom Pro'),
(2, 'MTR-3.5KW', '3.5 kW BLDC Motor', 12000.00, 'High efficiency motor'),
(4, 'BRK-DISC-F', 'Front Disc Brake Assembly', 2500.00, 'Front disc brake kit'),
(5, 'TYR-10IN', '10 inch Tubeless Tyre', 1800.00, 'Premium tubeless tyre');

-- Spare Stock
INSERT INTO spare_stock (warehouse_id, spare_part_id, quantity, low_stock_threshold) VALUES
(1, 1, 20, 5), (1, 2, 15, 5), (1, 3, 50, 10), (1, 4, 100, 20),
(2, 1, 15, 5), (2, 3, 30, 10);

-- Technicians
INSERT INTO technicians (employee_code, name, phone, email, specialization) VALUES
('TECH-001', 'Suresh Patel', '9876510001', 'suresh@skmobility.com', 'EV Motor Specialist'),
('TECH-002', 'Ravi Mehta', '9876510002', 'ravi@skmobility.com', 'Battery Systems'),
('TECH-003', 'Anil Das', '9876510003', 'anil@skmobility.com', 'General Service');

-- System Settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('company_name', 'SK Mobility Pvt. Ltd.', 'string', 'Company display name'),
('company_address', 'Plot 45, MIDC Andheri East, Mumbai, Maharashtra - 400093', 'string', 'Company address'),
('company_email', 'info@skmobility.com', 'string', 'Primary contact email'),
('company_phone', '1800-756-6624', 'string', 'Support phone'),
('gst_number', '27AABCS1234M1Z5', 'string', 'Company GST number'),
('pan_number', 'AABCS1234M', 'string', 'Company PAN number'),
('bank_name', 'HDFC Bank', 'string', 'Bank name'),
('bank_account', '50200012345678', 'string', 'Bank account number'),
('bank_ifsc', 'HDFC0001234', 'string', 'Bank IFSC code'),
('low_stock_alert_email', 'inventory@skmobility.com', 'string', 'Low stock alert recipient'),
('razorpay_enabled', 'true', 'boolean', 'Enable Razorpay payments'),
('default_gst_rate', '18', 'number', 'Default GST rate percentage');
