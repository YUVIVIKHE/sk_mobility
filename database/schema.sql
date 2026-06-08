-- SK Mobility EV Dealer Management Platform
-- MySQL 8.0+ Schema

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS sk_mobility CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sk_mobility;

-- ============================================================
-- ADMIN & AUTH
-- ============================================================

CREATE TABLE roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) DEFAULT NULL,
  is_system TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_roles_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE permissions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  module VARCHAR(50) NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_permissions_module (module),
  INDEX idx_permissions_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
  role_id INT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id INT UNSIGNED NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  avatar_url VARCHAR(500) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  is_verified TINYINT(1) DEFAULT 0,
  email_verified_at TIMESTAMP NULL DEFAULT NULL,
  last_login_at TIMESTAMP NULL DEFAULT NULL,
  refresh_token_hash VARCHAR(255) DEFAULT NULL,
  password_reset_token VARCHAR(255) DEFAULT NULL,
  password_reset_expires TIMESTAMP NULL DEFAULT NULL,
  email_verification_token VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  INDEX idx_users_email (email),
  INDEX idx_users_role (role_id),
  INDEX idx_users_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED DEFAULT NULL,
  action VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) DEFAULT NULL,
  entity_id INT UNSIGNED DEFAULT NULL,
  old_values JSON DEFAULT NULL,
  new_values JSON DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_module (module),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE system_settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type ENUM('string','number','boolean','json') DEFAULT 'string',
  description VARCHAR(255) DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  channel ENUM('in_app','email','sms','whatsapp') DEFAULT 'in_app',
  is_read TINYINT(1) DEFAULT 0,
  metadata JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user (user_id),
  INDEX idx_notifications_read (is_read)
) ENGINE=InnoDB;

-- ============================================================
-- MODULE 1: DEALER MANAGEMENT
-- ============================================================

CREATE TABLE dealers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED DEFAULT NULL,
  dealer_code VARCHAR(20) NOT NULL UNIQUE,
  business_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  gst_number VARCHAR(20) DEFAULT NULL,
  pan_number VARCHAR(15) DEFAULT NULL,
  status ENUM('pending','approved','rejected','suspended','inactive') DEFAULT 'pending',
  approval_notes TEXT DEFAULT NULL,
  approved_by INT UNSIGNED DEFAULT NULL,
  approved_at TIMESTAMP NULL DEFAULT NULL,
  performance_score DECIMAL(5,2) DEFAULT 0,
  total_orders INT UNSIGNED DEFAULT 0,
  total_revenue DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_dealers_status (status),
  INDEX idx_dealers_code (dealer_code)
) ENGINE=InnoDB;

CREATE TABLE dealer_addresses (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dealer_id INT UNSIGNED NOT NULL,
  address_type ENUM('billing','shipping','office') DEFAULT 'office',
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255) DEFAULT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  country VARCHAR(50) DEFAULT 'India',
  is_primary TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE,
  INDEX idx_dealer_addresses_dealer (dealer_id)
) ENGINE=InnoDB;

CREATE TABLE dealer_documents (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dealer_id INT UNSIGNED NOT NULL,
  document_type ENUM('gst','pan','aadhar','bank','license','other') NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT UNSIGNED DEFAULT NULL,
  verification_status ENUM('pending','verified','rejected') DEFAULT 'pending',
  verified_by INT UNSIGNED DEFAULT NULL,
  verified_at TIMESTAMP NULL DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_dealer_docs_dealer (dealer_id)
) ENGINE=InnoDB;

CREATE TABLE dealer_activities (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dealer_id INT UNSIGNED NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  metadata JSON DEFAULT NULL,
  created_by INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_dealer_activities_dealer (dealer_id),
  INDEX idx_dealer_activities_type (activity_type)
) ENGINE=InnoDB;

-- ============================================================
-- MODULE 2: VEHICLE CATALOG
-- ============================================================

CREATE TABLE vehicle_categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT DEFAULT NULL,
  icon_url VARCHAR(500) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vehicle_categories_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE vehicles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  brand VARCHAR(100) DEFAULT 'SK Mobility',
  description TEXT DEFAULT NULL,
  base_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  battery_capacity_kwh DECIMAL(6,2) DEFAULT NULL,
  charging_time_hours DECIMAL(4,2) DEFAULT NULL,
  range_km INT UNSIGNED DEFAULT NULL,
  top_speed_kmh INT UNSIGNED DEFAULT NULL,
  motor_power_kw DECIMAL(6,2) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  review_count INT UNSIGNED DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES vehicle_categories(id),
  INDEX idx_vehicles_category (category_id),
  INDEX idx_vehicles_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE vehicle_variants (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  sku VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(50) DEFAULT NULL,
  price DECIMAL(12,2) NOT NULL,
  battery_capacity_kwh DECIMAL(6,2) DEFAULT NULL,
  range_km INT UNSIGNED DEFAULT NULL,
  specifications JSON DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  INDEX idx_variants_vehicle (vehicle_id),
  INDEX idx_variants_sku (sku)
) ENGINE=InnoDB;

CREATE TABLE vehicle_images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT UNSIGNED NOT NULL,
  variant_id INT UNSIGNED DEFAULT NULL,
  image_url VARCHAR(500) NOT NULL,
  is_primary TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES vehicle_variants(id) ON DELETE SET NULL,
  INDEX idx_vehicle_images_vehicle (vehicle_id)
) ENGINE=InnoDB;

CREATE TABLE vehicle_reviews (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED DEFAULT NULL,
  dealer_id INT UNSIGNED DEFAULT NULL,
  rating TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(200) DEFAULT NULL,
  review_text TEXT DEFAULT NULL,
  is_approved TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE SET NULL,
  INDEX idx_reviews_vehicle (vehicle_id)
) ENGINE=InnoDB;

-- ============================================================
-- MODULE 3: ORDER MANAGEMENT
-- ============================================================

CREATE TABLE orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(30) NOT NULL UNIQUE,
  order_type ENUM('dealer', 'customer') NOT NULL DEFAULT 'dealer',
  dealer_id INT UNSIGNED DEFAULT NULL,
  customer_name VARCHAR(150) DEFAULT NULL,
  customer_phone VARCHAR(20) DEFAULT NULL,
  customer_email VARCHAR(255) DEFAULT NULL,
  status ENUM('pending','approved','processing','shipped','delivered','cancelled') DEFAULT 'pending',
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  notes TEXT DEFAULT NULL,
  approved_by INT UNSIGNED DEFAULT NULL,
  approved_at TIMESTAMP NULL DEFAULT NULL,
  delivery_address TEXT DEFAULT NULL,
  expected_delivery_date DATE DEFAULT NULL,
  actual_delivery_date DATE DEFAULT NULL,
  tracking_number VARCHAR(100) DEFAULT NULL,
  created_by INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_orders_dealer (dealer_id),
  INDEX idx_orders_type (order_type),
  INDEX idx_orders_status (status),
  INDEX idx_orders_number (order_number)
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  vehicle_id INT UNSIGNED NOT NULL,
  variant_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (variant_id) REFERENCES vehicle_variants(id),
  INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB;

CREATE TABLE order_status_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  from_status VARCHAR(30) DEFAULT NULL,
  to_status VARCHAR(30) NOT NULL,
  notes TEXT DEFAULT NULL,
  changed_by INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_order_status_order (order_id)
) ENGINE=InnoDB;

-- ============================================================
-- MODULE 4: PAYMENT MANAGEMENT
-- ============================================================

CREATE TABLE payments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_number VARCHAR(30) NOT NULL UNIQUE,
  order_id INT UNSIGNED DEFAULT NULL,
  dealer_id INT UNSIGNED NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_type ENUM('full','partial','advance','refund') DEFAULT 'full',
  payment_method ENUM('razorpay','upi','cash','bank_transfer','cheque') NOT NULL,
  status ENUM('pending','completed','failed','refunded') DEFAULT 'pending',
  razorpay_order_id VARCHAR(100) DEFAULT NULL,
  razorpay_payment_id VARCHAR(100) DEFAULT NULL,
  razorpay_signature VARCHAR(255) DEFAULT NULL,
  transaction_ref VARCHAR(100) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  paid_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY (dealer_id) REFERENCES dealers(id),
  INDEX idx_payments_dealer (dealer_id),
  INDEX idx_payments_order (order_id),
  INDEX idx_payments_status (status)
) ENGINE=InnoDB;

CREATE TABLE invoices (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(30) NOT NULL UNIQUE,
  order_id INT UNSIGNED DEFAULT NULL,
  payment_id INT UNSIGNED DEFAULT NULL,
  dealer_id INT UNSIGNED NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  status ENUM('draft','issued','paid','cancelled') DEFAULT 'draft',
  pdf_path VARCHAR(500) DEFAULT NULL,
  issued_at TIMESTAMP NULL DEFAULT NULL,
  due_date DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
  FOREIGN KEY (dealer_id) REFERENCES dealers(id),
  INDEX idx_invoices_dealer (dealer_id),
  INDEX idx_invoices_number (invoice_number)
) ENGINE=InnoDB;

CREATE TABLE refunds (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  refund_number VARCHAR(30) NOT NULL UNIQUE,
  payment_id INT UNSIGNED NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  reason TEXT DEFAULT NULL,
  status ENUM('pending','processed','failed') DEFAULT 'pending',
  razorpay_refund_id VARCHAR(100) DEFAULT NULL,
  processed_at TIMESTAMP NULL DEFAULT NULL,
  created_by INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_refunds_payment (payment_id)
) ENGINE=InnoDB;

-- ============================================================
-- MODULE 5: INVENTORY MANAGEMENT
-- ============================================================

CREATE TABLE warehouses (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  manager_name VARCHAR(150) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_warehouses_code (code)
) ENGINE=InnoDB;

CREATE TABLE inventory (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  warehouse_id INT UNSIGNED NOT NULL,
  variant_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 0,
  reserved_quantity INT UNSIGNED DEFAULT 0,
  low_stock_threshold INT UNSIGNED DEFAULT 5,
  last_restocked_at TIMESTAMP NULL DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_inventory_warehouse_variant (warehouse_id, variant_id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (variant_id) REFERENCES vehicle_variants(id),
  INDEX idx_inventory_warehouse (warehouse_id)
) ENGINE=InnoDB;

CREATE TABLE stock_movements (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  inventory_id INT UNSIGNED NOT NULL,
  movement_type ENUM('in','out','transfer','adjustment','allocation') NOT NULL,
  quantity INT NOT NULL,
  from_warehouse_id INT UNSIGNED DEFAULT NULL,
  to_warehouse_id INT UNSIGNED DEFAULT NULL,
  dealer_id INT UNSIGNED DEFAULT NULL,
  reference_type VARCHAR(50) DEFAULT NULL,
  reference_id INT UNSIGNED DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_by INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inventory_id) REFERENCES inventory(id),
  FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL,
  FOREIGN KEY (to_warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL,
  FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_stock_movements_inventory (inventory_id),
  INDEX idx_stock_movements_type (movement_type)
) ENGINE=InnoDB;

-- ============================================================
-- MODULE 6: LEAD MANAGEMENT
-- ============================================================

CREATE TABLE lead_sources (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE leads (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lead_number VARCHAR(30) NOT NULL UNIQUE,
  source_id INT UNSIGNED DEFAULT NULL,
  dealer_id INT UNSIGNED DEFAULT NULL,
  assigned_to INT UNSIGNED DEFAULT NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_email VARCHAR(255) DEFAULT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  vehicle_interest_id INT UNSIGNED DEFAULT NULL,
  status ENUM('new','contacted','interested','test_drive','negotiation','converted','lost') DEFAULT 'new',
  notes TEXT DEFAULT NULL,
  converted_order_id INT UNSIGNED DEFAULT NULL,
  qr_code_id VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (source_id) REFERENCES lead_sources(id) ON DELETE SET NULL,
  FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (vehicle_interest_id) REFERENCES vehicles(id) ON DELETE SET NULL,
  FOREIGN KEY (converted_order_id) REFERENCES orders(id) ON DELETE SET NULL,
  INDEX idx_leads_status (status),
  INDEX idx_leads_dealer (dealer_id),
  INDEX idx_leads_source (source_id)
) ENGINE=InnoDB;

CREATE TABLE lead_followups (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lead_id INT UNSIGNED NOT NULL,
  followup_type ENUM('call','email','visit','test_drive','other') NOT NULL,
  notes TEXT NOT NULL,
  next_followup_date DATETIME DEFAULT NULL,
  status_before VARCHAR(30) DEFAULT NULL,
  status_after VARCHAR(30) DEFAULT NULL,
  created_by INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_followups_lead (lead_id)
) ENGINE=InnoDB;

-- ============================================================
-- MODULE 7: SERVICE MANAGEMENT
-- ============================================================

CREATE TABLE technicians (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED DEFAULT NULL,
  employee_code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) DEFAULT NULL,
  specialization VARCHAR(100) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_technicians_code (employee_code)
) ENGINE=InnoDB;

CREATE TABLE service_requests (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  request_number VARCHAR(30) NOT NULL UNIQUE,
  dealer_id INT UNSIGNED DEFAULT NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255) DEFAULT NULL,
  vehicle_id INT UNSIGNED DEFAULT NULL,
  variant_id INT UNSIGNED DEFAULT NULL,
  vin_number VARCHAR(50) DEFAULT NULL,
  service_type ENUM('general','repair','warranty','amc','inspection') NOT NULL,
  status ENUM('requested','scheduled','in_progress','completed','cancelled') DEFAULT 'requested',
  scheduled_date DATETIME DEFAULT NULL,
  completed_date DATETIME DEFAULT NULL,
  description TEXT DEFAULT NULL,
  warranty_expiry DATE DEFAULT NULL,
  amc_expiry DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE SET NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
  FOREIGN KEY (variant_id) REFERENCES vehicle_variants(id) ON DELETE SET NULL,
  INDEX idx_service_requests_status (status),
  INDEX idx_service_requests_dealer (dealer_id)
) ENGINE=InnoDB;

CREATE TABLE job_cards (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_number VARCHAR(30) NOT NULL UNIQUE,
  service_request_id INT UNSIGNED NOT NULL,
  technician_id INT UNSIGNED DEFAULT NULL,
  status ENUM('open','in_progress','on_hold','completed','cancelled') DEFAULT 'open',
  diagnosis TEXT DEFAULT NULL,
  work_done TEXT DEFAULT NULL,
  labour_charges DECIMAL(10,2) DEFAULT 0,
  parts_charges DECIMAL(10,2) DEFAULT 0,
  total_charges DECIMAL(10,2) DEFAULT 0,
  started_at TIMESTAMP NULL DEFAULT NULL,
  completed_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE SET NULL,
  INDEX idx_job_cards_service (service_request_id),
  INDEX idx_job_cards_technician (technician_id)
) ENGINE=InnoDB;

CREATE TABLE service_records (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  service_request_id INT UNSIGNED NOT NULL,
  job_card_id INT UNSIGNED DEFAULT NULL,
  record_type ENUM('inspection','repair','maintenance','warranty_claim') NOT NULL,
  description TEXT NOT NULL,
  parts_used JSON DEFAULT NULL,
  cost DECIMAL(10,2) DEFAULT 0,
  odometer_reading INT UNSIGNED DEFAULT NULL,
  performed_by INT UNSIGNED DEFAULT NULL,
  service_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE SET NULL,
  FOREIGN KEY (performed_by) REFERENCES technicians(id) ON DELETE SET NULL,
  INDEX idx_service_records_request (service_request_id)
) ENGINE=InnoDB;

-- ============================================================
-- MODULE 8: SPARE PARTS MANAGEMENT
-- ============================================================

CREATE TABLE spare_part_categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE spare_parts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  part_number VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT DEFAULT NULL,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  compatible_vehicles JSON DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES spare_part_categories(id),
  INDEX idx_spare_parts_category (category_id),
  INDEX idx_spare_parts_number (part_number)
) ENGINE=InnoDB;

CREATE TABLE spare_stock (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  warehouse_id INT UNSIGNED NOT NULL,
  spare_part_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 0,
  low_stock_threshold INT UNSIGNED DEFAULT 10,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_spare_stock (warehouse_id, spare_part_id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id),
  INDEX idx_spare_stock_warehouse (warehouse_id)
) ENGINE=InnoDB;

CREATE TABLE spare_usage (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  spare_part_id INT UNSIGNED NOT NULL,
  job_card_id INT UNSIGNED DEFAULT NULL,
  warehouse_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  unit_cost DECIMAL(10,2) DEFAULT 0,
  notes TEXT DEFAULT NULL,
  used_by INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id),
  FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE SET NULL,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_spare_usage_part (spare_part_id)
) ENGINE=InnoDB;

-- ============================================================
-- MODULE 9: BILLING & INVOICING
-- ============================================================

CREATE TABLE taxes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  tax_type ENUM('gst','cgst','sgst','igst','cess','other') NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  effective_from DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE bills (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bill_number VARCHAR(30) NOT NULL UNIQUE,
  bill_type ENUM('vehicle','service','spare_parts','combined') NOT NULL,
  dealer_id INT UNSIGNED DEFAULT NULL,
  order_id INT UNSIGNED DEFAULT NULL,
  service_request_id INT UNSIGNED DEFAULT NULL,
  subtotal DECIMAL(15,2) NOT NULL,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  status ENUM('draft','issued','paid','cancelled') DEFAULT 'draft',
  pdf_path VARCHAR(500) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  issued_at TIMESTAMP NULL DEFAULT NULL,
  created_by INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE SET NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_bills_dealer (dealer_id),
  INDEX idx_bills_number (bill_number)
) ENGINE=InnoDB;

CREATE TABLE bill_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bill_id INT UNSIGNED NOT NULL,
  item_type ENUM('vehicle','service','spare_part','labour','other') NOT NULL,
  description VARCHAR(255) NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  reference_id INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
  INDEX idx_bill_items_bill (bill_id)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
