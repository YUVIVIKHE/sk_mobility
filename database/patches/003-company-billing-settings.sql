-- Company billing settings for proper GST invoice format
USE sk_mobility;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('company_address', 'Plot 45, MIDC Andheri East, Mumbai, Maharashtra - 400093', 'string', 'Company address'),
('pan_number', 'AABCS1234M', 'string', 'Company PAN number'),
('bank_name', 'HDFC Bank', 'string', 'Bank name'),
('bank_account', '50200012345678', 'string', 'Bank account number'),
('bank_ifsc', 'HDFC0001234', 'string', 'Bank IFSC code')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

UPDATE system_settings SET setting_value = 'SK Mobility Pvt. Ltd.' WHERE setting_key = 'company_name';
UPDATE system_settings SET setting_value = '1800-756-6624' WHERE setting_key = 'company_phone';
