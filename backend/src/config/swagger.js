const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./index');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SK Mobility API',
      version: '1.0.0',
      description: 'EV Dealer Management & Service Management Platform REST API',
      contact: { name: 'SK Mobility', email: 'info@skmobility.com' },
    },
    servers: [
      { url: `http://localhost:${config.port}${config.apiPrefix}`, description: 'Development' },
      { url: '/api/v1', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: { email: { type: 'string' }, password: { type: 'string' } },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication' },
      { name: 'Dealers', description: 'Dealer management' },
      { name: 'Vehicles', description: 'Vehicle catalog' },
      { name: 'Orders', description: 'Order management' },
      { name: 'Payments', description: 'Payment processing' },
      { name: 'Inventory', description: 'Stock management' },
      { name: 'Leads', description: 'Lead management' },
      { name: 'Services', description: 'Service management' },
      { name: 'Spare Parts', description: 'Spare parts inventory' },
      { name: 'Billing', description: 'Billing & invoicing' },
      { name: 'Dashboard', description: 'Analytics & reports' },
      { name: 'Admin', description: 'System administration' },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

module.exports = swaggerJsdoc(options);
