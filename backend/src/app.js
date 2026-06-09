const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const config = require('./config');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const authRoutes = require('./routes/auth.routes');
const dealerRoutes = require('./routes/dealer.routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

require('./config/database');

const app = express();

// Trust Hostinger's reverse proxy (required for express-rate-limit and real IP detection)
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(compression());
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use('/uploads', express.static(path.join(process.cwd(), config.upload.dir)));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'sk-mobility-api', timestamp: new Date().toISOString() }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'SK Mobility API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
}));

app.use(`${config.apiPrefix}/auth`, authRoutes);
app.use(`${config.apiPrefix}/dealers`, dealerRoutes);
app.use(config.apiPrefix, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
