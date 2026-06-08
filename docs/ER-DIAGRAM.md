# SK Mobility - Database ER Diagram

## Entity Relationship Overview

```mermaid
erDiagram
    users ||--o{ dealers : "manages"
    roles ||--{ users : "has"
    roles ||--{ role_permissions : "has"
    permissions ||--{ role_permissions : "grants"

    dealers ||--{ dealer_addresses : "has"
    dealers ||--{ dealer_documents : "has"
    dealers ||--{ dealer_activities : "tracks"
    dealers ||--{ orders : "places"
    dealers ||--{ leads : "assigned"
    dealers ||--{ payments : "makes"

    vehicle_categories ||--{ vehicles : "contains"
    vehicles ||--{ vehicle_variants : "has"
    vehicles ||--{ vehicle_images : "has"
    vehicles ||--{ vehicle_reviews : "receives"

    orders ||--{ order_items : "contains"
    orders ||--{ order_status_history : "tracks"
    orders ||--o{ payments : "paid_by"
    order_items }o--|| vehicle_variants : "references"

    warehouses ||--{ inventory : "stores"
    vehicle_variants ||--{ inventory : "stocked_as"
    inventory ||--{ stock_movements : "logs"

    lead_sources ||--{ leads : "sources"
    leads ||--{ lead_followups : "has"

    service_requests ||--{ job_cards : "generates"
    service_requests ||--{ service_records : "records"
    technicians ||--o{ job_cards : "assigned"

    spare_part_categories ||--{ spare_parts : "groups"
    spare_parts ||--{ spare_stock : "stocked"
    spare_parts ||--{ spare_usage : "consumed"

    bills ||--{ bill_items : "contains"
    payments ||--o{ invoices : "generates"
    payments ||--{ refunds : "refunded"
```

## Module Table Groups

| Module | Tables |
|--------|--------|
| Auth & Admin | users, roles, permissions, role_permissions, audit_logs, system_settings, notifications |
| Dealers | dealers, dealer_addresses, dealer_documents, dealer_activities |
| Vehicles | vehicle_categories, vehicles, vehicle_variants, vehicle_images, vehicle_reviews |
| Orders | orders, order_items, order_status_history |
| Payments | payments, invoices, refunds |
| Inventory | warehouses, inventory, stock_movements |
| Leads | lead_sources, leads, lead_followups |
| Services | technicians, service_requests, job_cards, service_records |
| Spare Parts | spare_part_categories, spare_parts, spare_stock, spare_usage |
| Billing | taxes, bills, bill_items |

## Key Relationships

- **users.role_id** → roles (RBAC foundation)
- **dealers.user_id** → users (dealer portal login)
- **orders.dealer_id** → dealers (dealer purchase orders)
- **order_items.variant_id** → vehicle_variants (multi-variant orders)
- **inventory(warehouse_id, variant_id)** → unique stock per warehouse
- **leads.converted_order_id** → orders (conversion tracking)
- **job_cards.service_request_id** → service_requests (service workflow)
