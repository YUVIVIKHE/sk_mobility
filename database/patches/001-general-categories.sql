-- Update vehicle categories from EV-focused to general mobility (run once on existing DB)
USE sk_mobility;

UPDATE vehicle_categories SET name = 'Two Wheelers', slug = 'two-wheelers', description = 'Bikes and scooters', sort_order = 1 WHERE id = 1;
UPDATE vehicle_categories SET name = 'Three Wheelers', slug = 'three-wheelers', description = 'Auto rickshaws and commercial three wheelers', sort_order = 2 WHERE id = 2;
UPDATE vehicle_categories SET name = 'Passenger Cars', slug = 'passenger-cars', description = 'Hatchback, sedan, and SUV', sort_order = 3 WHERE id = 3;
UPDATE vehicle_categories SET name = 'Commercial Vehicles', slug = 'commercial-vehicles', description = 'Vans, pick-ups, and light commercial', sort_order = 4 WHERE id = 4;

INSERT INTO vehicle_categories (name, slug, description, sort_order)
SELECT 'Trucks & Buses', 'trucks-buses', 'Heavy commercial vehicles', 5
WHERE NOT EXISTS (SELECT 1 FROM vehicle_categories WHERE slug = 'trucks-buses');
