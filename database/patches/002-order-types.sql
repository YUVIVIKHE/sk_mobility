-- Split orders into dealer vs direct customer orders
USE sk_mobility;

ALTER TABLE orders
  ADD COLUMN order_type ENUM('dealer', 'customer') NOT NULL DEFAULT 'dealer' AFTER order_number,
  ADD COLUMN customer_name VARCHAR(150) NULL AFTER dealer_id,
  ADD COLUMN customer_phone VARCHAR(20) NULL AFTER customer_name,
  ADD COLUMN customer_email VARCHAR(255) NULL AFTER customer_phone;

ALTER TABLE orders
  MODIFY dealer_id INT UNSIGNED NULL;

ALTER TABLE orders ADD INDEX idx_orders_type (order_type);
