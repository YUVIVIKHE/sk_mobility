# SK Mobility — EV Dealer Management & Service Platform

Enterprise-grade web platform for managing EV dealers, vehicle catalog, orders, payments, inventory, leads, service operations, spare parts, and billing.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, Vite, Material UI, Redux Toolkit, React Query, Axios, React Router, Chart.js, Recharts |
| Backend | Node.js, Express, JWT, RBAC, Multer, Swagger |
| Database | MySQL 8.0 |
| Infrastructure | Docker, Docker Compose, Nginx |

## Project Structure

```
sk-mobility/
├── backend/                 # Node.js REST API
│   ├── src/
│   │   ├── config/          # App, DB, Swagger config
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth, RBAC, validation, upload
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic layer
│   │   └── utils/           # JWT, email, audit, helpers
│   ├── uploads/             # File upload storage
│   └── Dockerfile
├── frontend/                # React SPA
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── layouts/         # App shell / sidebar
│   │   ├── pages/           # Route pages per module
│   │   ├── services/        # API client layer
│   │   └── store/           # Redux Toolkit store
│   └── Dockerfile
├── database/
│   ├── schema.sql           # Full MySQL schema
│   └── seed.sql             # Seed data
├── nginx/                   # Reverse proxy config
├── docs/                    # API docs, ER diagram
└── docker-compose.yml
```

## Modules

1. **Dealer Management** — Registration, KYC, approval workflow, performance
2. **Vehicle Catalog** — Categories, models, variants, specs, images, reviews
3. **Order Management** — Multi-variant orders, status workflow, tracking
4. **Payment Management** — Razorpay, UPI, cash, partial/advance payments, refunds
5. **Inventory Management** — Warehouses, stock, transfers, low-stock alerts
6. **Lead Management** — Website/QR capture, follow-ups, conversion analytics
7. **Service Management** — Bookings, job cards, technicians, warranty/AMC
8. **Spare Parts** — Catalog, stock, consumption tracking
9. **Billing & Invoicing** — GST billing, PDF generation
10. **Dashboard & Analytics** — Role-based dashboards, Excel/CSV export

## Quick Start (Development)

### Prerequisites

- Node.js 18+
- MySQL 8.0
- npm

### 1. Database Setup

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
cd backend && npm install && npm run seed
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials and JWT secrets
npm install
npm run dev
```

API: http://localhost:5000  
Swagger: http://localhost:5000/api-docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@skmobility.com | Admin@123 |
| Demo Dealer | dealer@skmobility.com | Dealer@123 |

## Docker Deployment

```bash
cp .env.example .env
# Configure production secrets in .env
docker-compose up -d --build
```

Services:
- **Nginx** (port 80) — Reverse proxy
- **Frontend** — React production build
- **Backend** (port 5000) — API server
- **MySQL** (port 3306) — Database

After first run, seed the admin password:

```bash
docker exec -it sk-backend node src/utils/seed.js
```

## Production Best Practices

### Security
- Change all JWT secrets and DB passwords before deployment
- Use HTTPS with valid SSL certificates (configure in Nginx)
- Enable rate limiting (configured in backend)
- Keep Razorpay keys in environment variables only
- Review RBAC permissions for each role

### Performance
- MySQL connection pooling (20 connections default)
- Frontend code splitting (vendor, MUI, charts chunks)
- Gzip compression via Nginx
- Database indexes on all foreign keys and filter columns

### Monitoring
- Health check: `GET /health`
- Audit logs for all admin actions
- Winston structured logging in backend

### Scaling
- Run multiple backend instances behind Nginx load balancer
- Use managed MySQL (RDS/Aurora) for production
- Store uploads on S3/MinIO instead of local disk
- Add Redis for session/token caching at scale

## API Documentation

- Interactive Swagger UI: `/api-docs`
- Full endpoint reference: [docs/API-ENDPOINTS.md](docs/API-ENDPOINTS.md)
- ER Diagram: [docs/ER-DIAGRAM.md](docs/ER-DIAGRAM.md)

## User Roles

| Role | Access |
|------|--------|
| Super Admin | Full platform access, dealer approval, inventory, reports, admin panel |
| Dealer | Orders, leads, services, payments, own dashboard |

## License

Proprietary — SK Mobility © 2026
"# sk_mobility" 
