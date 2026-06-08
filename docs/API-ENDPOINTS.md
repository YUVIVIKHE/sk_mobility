# SK Mobility API Endpoints

Base URL: `/api/v1`

## Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login with email/password |
| POST | `/auth/refresh` | Public | Refresh access token |
| POST | `/auth/verify-email` | Public | Verify email token |
| POST | `/auth/forgot-password` | Public | Request password reset |
| POST | `/auth/reset-password` | Public | Reset password with token |
| POST | `/auth/logout` | JWT | Logout and invalidate refresh token |
| GET | `/auth/profile` | JWT | Get current user profile |
| PUT | `/auth/profile` | JWT | Update profile |
| PUT | `/auth/change-password` | JWT | Change password |

## Dealers

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | `/dealers/register` | Public | Submit dealer registration |
| GET | `/dealers` | view_dealers | List all dealers |
| GET | `/dealers/me` | Dealer | Get own dealer profile |
| GET | `/dealers/:id` | view_dealers | Get dealer details |
| PATCH | `/dealers/:id/approve` | approve_dealers | Approve/reject dealer |
| POST | `/dealers/:id/documents` | manage_dealers | Upload KYC document |
| GET | `/dealers/:id/performance` | view_reports | Dealer performance metrics |

## Vehicles

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/vehicles/catalog` | Public | Public vehicle catalog |
| GET | `/vehicles/categories` | Public | Vehicle categories |
| GET | `/vehicles` | view_vehicles | List vehicles (paginated) |
| GET | `/vehicles/:id` | Public | Vehicle details with variants |
| POST | `/vehicles` | manage_vehicles | Create vehicle |
| POST | `/vehicles/:id/variants` | manage_vehicles | Add variant |
| POST | `/vehicles/:id/images` | manage_vehicles | Upload image |
| POST | `/vehicles/:id/reviews` | view_vehicles | Submit review |

## Orders

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/orders` | view_orders | List orders |
| GET | `/orders/:id` | view_orders | Order details with items |
| POST | `/orders` | manage_orders | Create multi-variant order |
| PATCH | `/orders/:id/status` | approve_orders | Update order status |

## Payments

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/payments` | view_payments | List payments |
| POST | `/payments` | manage_payments | Create payment (Razorpay/UPI/Cash) |
| POST | `/payments/verify-razorpay` | manage_payments | Verify Razorpay signature |
| POST | `/invoices` | manage_payments | Generate invoice |
| POST | `/payments/:id/refund` | manage_payments | Process refund |

## Inventory

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/warehouses` | view_inventory | List warehouses |
| GET | `/inventory` | view_inventory | Stock levels |
| POST | `/inventory/adjust` | manage_inventory | Stock adjustment |
| POST | `/inventory/transfer` | manage_inventory | Inter-warehouse transfer |

## Leads

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | `/leads/capture` | Public | Website/QR lead capture |
| GET | `/leads` | view_leads | List leads |
| POST | `/leads` | manage_leads | Manual lead entry |
| PATCH | `/leads/:id/status` | manage_leads | Update lead status |
| POST | `/leads/:id/followups` | manage_leads | Add follow-up |
| GET | `/leads/analytics` | view_reports | Lead source analytics |
| GET | `/leads/sources` | view_leads | Lead sources |

## Services

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/services` | view_services | List service requests |
| POST | `/services` | manage_services | Create service booking |
| POST | `/services/:id/job-cards` | manage_services | Create job card |
| PATCH | `/job-cards/:id` | manage_services | Update job card |
| GET | `/services/technicians` | view_services | List technicians |
| GET | `/services/history/:vin` | view_services | Vehicle service history |

## Spare Parts

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/spare-parts` | view_spare_parts | Parts catalog |
| GET | `/spare-parts/stock` | view_spare_parts | Stock levels |
| GET | `/spare-parts/categories` | view_spare_parts | Categories |
| POST | `/spare-parts/usage` | manage_spare_parts | Record consumption |

## Billing

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/bills` | view_billing | List bills |
| POST | `/bills` | manage_billing | Create bill with GST |
| GET | `/bills/:id/pdf` | view_billing | Download PDF invoice |
| GET | `/taxes` | view_billing | Tax rates |

## Dashboard & Reports

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/dashboard/admin` | super_admin | Admin dashboard stats |
| GET | `/dashboard/dealer` | view_dashboard | Dealer dashboard |
| GET | `/dashboard/service` | view_services | Service dashboard |
| GET | `/reports/export/:type` | export_reports | Export Excel/CSV |

## Admin

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/admin/users` | manage_users | List users |
| POST | `/admin/users` | manage_users | Create user |
| GET | `/admin/roles` | manage_roles | Roles with permissions |
| GET | `/admin/permissions` | manage_roles | All permissions |
| PUT | `/admin/roles/:id/permissions` | manage_roles | Update role permissions |
| GET | `/admin/audit-logs` | view_audit_logs | Audit trail |
| GET | `/admin/settings` | manage_settings | System settings |
| PUT | `/admin/settings/:key` | manage_settings | Update setting |

## Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | JWT | List notifications |
| GET | `/notifications/unread-count` | JWT | Unread count |
| PATCH | `/notifications/:id/read` | JWT | Mark as read |
| PATCH | `/notifications/read-all` | JWT | Mark all read |

## Swagger Documentation

Interactive API docs available at: `http://localhost:5000/api-docs`
