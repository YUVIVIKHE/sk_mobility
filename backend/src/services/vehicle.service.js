const db = require('../config/database');
const path = require('path');
const { AppError, paginate, paginatedResponse } = require('../utils/helpers');

const imageSubquery = `(SELECT vi.image_url FROM vehicle_images vi
  WHERE vi.vehicle_id = v.id ORDER BY vi.is_primary DESC, vi.sort_order ASC, vi.id ASC LIMIT 1)`;

const listCategories = async () => {
  const [rows] = await db.query('SELECT * FROM vehicle_categories WHERE is_active = 1 ORDER BY sort_order');
  return rows;
};

const listVehicles = async (filters = {}) => {
  const { page, limit, offset } = paginate(filters.page, filters.limit);
  let where = 'WHERE v.is_active = 1';
  const params = [];
  if (filters.categoryId) { where += ' AND v.category_id = ?'; params.push(filters.categoryId); }
  if (filters.search) { where += ' AND v.name LIKE ?'; params.push(`%${filters.search}%`); }

  const [count] = await db.query(`SELECT COUNT(*) AS total FROM vehicles v ${where}`, params);
  const [rows] = await db.query(
    `SELECT v.*, c.name AS category_name, ${imageSubquery} AS primary_image
     FROM vehicles v JOIN vehicle_categories c ON v.category_id = c.id ${where}
     ORDER BY v.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return paginatedResponse(rows, count[0].total, page, limit);
};

const getVehicle = async (id) => {
  const [vehicles] = await db.query(
    `SELECT v.*, c.name AS category_name FROM vehicles v
     JOIN vehicle_categories c ON v.category_id = c.id WHERE v.id = ?`, [id]
  );
  if (!vehicles.length) throw new AppError('Vehicle not found', 404);

  const [variants] = await db.query('SELECT * FROM vehicle_variants WHERE vehicle_id = ? AND is_active = 1', [id]);
  const [images] = await db.query('SELECT * FROM vehicle_images WHERE vehicle_id = ? ORDER BY sort_order', [id]);
  const [reviews] = await db.query(
    'SELECT * FROM vehicle_reviews WHERE vehicle_id = ? AND is_approved = 1 ORDER BY created_at DESC LIMIT 20', [id]
  );
  return { ...vehicles[0], variants, images, reviews };
};

const buildDescription = (data) => {
  const specParts = [];
  if (data.modelYear) specParts.push(`Year: ${data.modelYear}`);
  if (data.fuelType) specParts.push(`Fuel: ${data.fuelType}`);
  if (data.transmission) specParts.push(`Transmission: ${data.transmission}`);
  if (data.engineCc) specParts.push(`Engine: ${data.engineCc} cc`);
  if (data.seatingCapacity) specParts.push(`Seating: ${data.seatingCapacity}`);
  return [data.description, specParts.length ? specParts.join(' | ') : null].filter(Boolean).join('\n') || null;
};

const createVehicle = async (data) => {
  const slug = `${data.name}-${Date.now()}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const fullDescription = buildDescription(data);

  const [result] = await db.query(
    `INSERT INTO vehicles (category_id, name, slug, brand, description, base_price, is_active)
     VALUES (?,?,?,?,?,?,1)`,
    [data.categoryId, data.name, slug, data.brand || 'SK Mobility', fullDescription, data.basePrice]
  );
  return getVehicle(result.insertId);
};

const updateVehicle = async (id, data) => {
  await getVehicle(id);
  const fullDescription = buildDescription(data);

  await db.query(
    `UPDATE vehicles SET category_id = ?, name = ?, brand = ?, description = ?, base_price = ?, updated_at = NOW()
     WHERE id = ? AND is_active = 1`,
    [data.categoryId, data.name, data.brand || 'SK Mobility', fullDescription, data.basePrice, id]
  );
  return getVehicle(id);
};

const deleteVehicle = async (id) => {
  await getVehicle(id);
  await db.query('UPDATE vehicles SET is_active = 0, updated_at = NOW() WHERE id = ?', [id]);
  return { message: 'Vehicle deleted successfully' };
};

const createVariant = async (vehicleId, data) => {
  const [result] = await db.query(
    `INSERT INTO vehicle_variants (vehicle_id, name, sku, color, price, battery_capacity_kwh, range_km, specifications, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [vehicleId, data.name, data.sku, data.color, data.price, data.batteryCapacity, data.rangeKm,
     data.specifications ? JSON.stringify(data.specifications) : null]
  );
  return { id: result.insertId };
};

const addReview = async (vehicleId, data, userId) => {
  await db.query(
    'INSERT INTO vehicle_reviews (vehicle_id, user_id, dealer_id, rating, title, review_text) VALUES (?,?,?,?,?,?)',
    [vehicleId, userId, data.dealerId, data.rating, data.title, data.reviewText]
  );
  await db.query(
    `UPDATE vehicles SET avg_rating = (SELECT AVG(rating) FROM vehicle_reviews WHERE vehicle_id = ? AND is_approved = 1),
     review_count = (SELECT COUNT(*) FROM vehicle_reviews WHERE vehicle_id = ? AND is_approved = 1) WHERE id = ?`,
    [vehicleId, vehicleId, vehicleId]
  );
};

const toPublicImageUrl = (filePath) => {
  const normalized = filePath.replace(/\\/g, '/');
  const idx = normalized.indexOf('uploads/');
  return idx >= 0 ? normalized.slice(idx) : `uploads/${path.basename(normalized)}`;
};

const addImage = async (vehicleId, file, variantId = null, replacePrimary = false) => {
  const imageUrl = toPublicImageUrl(file.path);
  const [existing] = await db.query('SELECT COUNT(*) AS count FROM vehicle_images WHERE vehicle_id = ?', [vehicleId]);
  let isPrimary = existing[0].count === 0 ? 1 : 0;

  if (replacePrimary) {
    await db.query('UPDATE vehicle_images SET is_primary = 0 WHERE vehicle_id = ?', [vehicleId]);
    isPrimary = 1;
  }

  const [result] = await db.query(
    'INSERT INTO vehicle_images (vehicle_id, variant_id, image_url, is_primary) VALUES (?, ?, ?, ?)',
    [vehicleId, variantId, imageUrl, isPrimary]
  );
  return { id: result.insertId, imageUrl };
};

module.exports = {
  listCategories, listVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle,
  createVariant, addReview, addImage,
};
