const db = require('../config/database');
const XLSX = require('xlsx');

const getSuperAdminDashboard = async () => {
  const [stats] = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM dealers WHERE status = 'approved') AS total_dealers,
      (SELECT COUNT(*) FROM orders WHERE status = 'delivered') AS total_vehicles_sold,
      (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') AS total_revenue,
      (SELECT COUNT(*) FROM leads) AS total_leads,
      (SELECT COUNT(*) FROM service_requests WHERE status IN ('requested','scheduled','in_progress')) AS service_requests,
      (SELECT COUNT(*) FROM inventory WHERE quantity <= low_stock_threshold) AS low_stock_items
  `);

  const [monthlySales] = await db.query(`
    SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS orders, SUM(total_amount) AS revenue
    FROM orders WHERE status != 'cancelled' AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
    GROUP BY month ORDER BY month
  `);

  const [recentOrders] = await db.query(`
    SELECT o.order_number, o.total_amount, o.status, d.business_name
    FROM orders o JOIN dealers d ON o.dealer_id = d.id ORDER BY o.created_at DESC LIMIT 10
  `);

  return { stats: stats[0], monthlySales, recentOrders };
};

const getDealerDashboard = async (dealerId) => {
  const [stats] = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM orders WHERE dealer_id = ? AND status != 'cancelled') AS total_orders,
      (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE dealer_id = ? AND status = 'delivered') AS revenue,
      (SELECT COUNT(*) FROM leads WHERE dealer_id = ?) AS total_leads,
      (SELECT COUNT(*) FROM service_requests WHERE dealer_id = ? AND status IN ('requested','in_progress')) AS service_requests
  `, [dealerId, dealerId, dealerId, dealerId]);

  const [orderStatus] = await db.query(
    'SELECT status, COUNT(*) AS count FROM orders WHERE dealer_id = ? GROUP BY status', [dealerId]
  );

  return { stats: stats[0], orderStatus };
};

const exportReport = async (type, filters = {}) => {
  let data = [];
  let sheetName = 'Report';

  switch (type) {
    case 'sales':
      [data] = await db.query(`
        SELECT o.order_number, d.business_name, o.status, o.total_amount, o.created_at
        FROM orders o JOIN dealers d ON o.dealer_id = d.id
        WHERE o.status != 'cancelled' ORDER BY o.created_at DESC LIMIT 5000
      `);
      sheetName = 'Sales Report';
      break;
    case 'revenue':
      [data] = await db.query(`
        SELECT p.payment_number, d.business_name, p.amount, p.payment_method, p.status, p.paid_at
        FROM payments p JOIN dealers d ON p.dealer_id = d.id ORDER BY p.created_at DESC LIMIT 5000
      `);
      sheetName = 'Revenue Report';
      break;
    case 'inventory':
      [data] = await db.query(`
        SELECT w.name AS warehouse, v.name AS vehicle, vv.sku, i.quantity, i.low_stock_threshold
        FROM inventory i JOIN warehouses w ON i.warehouse_id = w.id
        JOIN vehicle_variants vv ON i.variant_id = vv.id JOIN vehicles v ON vv.vehicle_id = v.id
      `);
      sheetName = 'Inventory Report';
      break;
    case 'leads':
      [data] = await db.query(`
        SELECT l.lead_number, l.customer_name, ls.name AS source, l.status, d.business_name, l.created_at
        FROM leads l LEFT JOIN lead_sources ls ON l.source_id = ls.id
        LEFT JOIN dealers d ON l.dealer_id = d.id ORDER BY l.created_at DESC LIMIT 5000
      `);
      sheetName = 'Lead Conversion Report';
      break;
    case 'dealers':
      [data] = await db.query(`
        SELECT dealer_code, business_name, status, total_orders, total_revenue, performance_score, created_at
        FROM dealers ORDER BY total_revenue DESC
      `);
      sheetName = 'Dealer Performance';
      break;
    default:
      throw new (require('../utils/helpers').AppError)('Invalid report type', 400);
  }

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  if (filters.format === 'csv') {
    return { buffer: XLSX.utils.sheet_to_csv(ws), contentType: 'text/csv', filename: `${type}-report.csv` };
  }

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return { buffer, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: `${type}-report.xlsx` };
};

module.exports = { getSuperAdminDashboard, getDealerDashboard, exportReport };
