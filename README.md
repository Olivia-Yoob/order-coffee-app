# ☕️ Coffee Ordering App

## 1. Project Overview

### 1.1 Project Name
Coffee Ordering App

### 1.2 Project Objective
A simple full-stack web application that allows users to order coffee and enables administrators to manage orders.

### 1.3 Scope of Development
- Ordering screen (menu selection and cart functionality)
- Admin dashboard (inventory management and order status management)
- CRUD functionality (Create, Read, Update, Delete) for data handling

## 2. Tech Stack
- Frontend: HTML, CSS, React, JavaScript
- Backend: Node.js, Express
- Database: PostgreSQL

## 3. Basic Requirements
- Frontend and backend developed separately
- Use only fundamental web technologies
- For learning purposes, user authentication and payment features are excluded
- Menu includes only coffee items

## 4. Ordering Screen (Frontend)

### 4.1 Purpose and User Goals
The Ordering screen is the primary customer-facing view. Users browse the coffee menu, configure optional add-ons per drink, add items to the cart, review line totals, and submit an order. They can switch to the Admin screen from the same shell (global navigation).

### 4.2 Information Architecture
1. **Global header** — App branding and primary navigation between Ordering and Admin.
2. **Menu area** — Product cards in a responsive grid (wireframe shows three products in a row).
3. **Shopping cart** — Fixed or prominent region at the bottom listing cart lines, per-line prices, order total, and checkout action.

### 4.3 Header
| Element | Requirement |
|--------|---------------|
| App name | Display brand name **COZY** on the left. |
| **주문하기** (Order) | Tab or route for the Ordering screen; visually indicated as **active** when this screen is shown (e.g., bordered or highlighted). |
| **관리자** (Admin) | Link or tab to the Admin screen; inactive styling when Ordering is active. |

**Behavior:** Selecting **관리자** navigates away from Ordering to Admin without losing server-persisted state according to overall app rules (client state for the cart may reset or persist—define in implementation if backend cart exists later).

### 4.4 Product Card (Menu Item)
Each product card represents one menu SKU (e.g., 아메리카노(ICE), 아메리카노(HOT), 카페라떼).

| Element | Requirement |
|--------|---------------|
| Image | Placeholder acceptable in v1 (e.g., boxed area with placeholder graphic) until real assets exist. |
| Name | Product name, **bold**, Korean labels per menu. |
| Price | Base price in KRW with thousands separator (e.g., **4,000원**, **5,000원**). |
| Description | Short supporting text; wireframe uses **간단한 설명...** as placeholder—replace with real copy per item. |
| Options | Checkboxes (or equivalent) for labeled add-ons with **price delta** shown: e.g. **샷 추가 (+500원)**, **시럽 추가 (+0원)**. Options are **per card** before add; same product with different options creates **distinct cart lines** (see 4.6). |
| **담기** | Primary action adds **one unit** of this product with the **currently selected options** to the cart. |

**Reference menu (from wireframe):**
- 아메리카노(ICE) — 4,000원  
- 아메리카노(HOT) — 4,000원  
- 카페라떼 — 5,000원  

Additional options (example): shot +500원; syrup +0원 (configurable per product in data if extended later).

### 4.5 Option and Pricing Rules
- **Line unit price** = base price + sum of selected option prices for that configuration.
- **Line total** = line unit price × quantity for that cart line.
- **Order total** = sum of all line totals in the cart.
- Example from wireframe: 아메리카노(ICE) with shot → 4,000 + 500 = **4,500원** for quantity 1; 아메리카노(HOT) × 2 without extras → **8,000원**; **총 금액 12,500원**.

### 4.6 Shopping Cart
| Element | Requirement |
|--------|---------------|
| Title | **장바구니** visible at top of cart region. |
| Line items | Each line shows: product name, **parenthetical summary of selected paid/free options** where applicable (e.g., **(샷 추가)**), **quantity (× N)**, and **line total in KRW**. |
| Total | **총 금액** with summed total, right-aligned or in summary area per layout. |
| **주문하기** | CTA button to place the order; triggers order submission flow (API or local mock per backend PRD). |

**Cart line identity:** Treat each unique combination of `(product id, selected options set)` as one mergeable line. Re-adding the same configuration increments quantity; a different option set creates a new line.

### 4.7 States and Edge Cases
- **Empty cart:** Show empty state copy and disable or de-emphasize **주문하기** until at least one item exists (behavior to confirm in UI polish).
- **No options selected:** Line price equals base price only.
- **Localization:** UI copy in Korean for labels shown in wireframe; number formatting for KRW.

### 4.8 Out of Scope (Ordering Screen)
- User accounts, login, and payment processing (per §3).
- Admin workflows (covered under §5).

### 4.9 Acceptance Criteria (Summary)
1. Header shows COZY, **주문하기** (active on this screen), and **관리자** (navigates to Admin).
2. All menu products render with image placeholder, name, price, description, option checkboxes, and **담기**.
3. **담기** adds one item with current options; cart lists lines with correct option text, quantity, line totals, and **총 금액**.
4. Pricing matches base + options × quantity for every line and for the order total.
5. **주문하기** is available when the cart has items and initiates the defined order submission behavior.

## 5. Admin Screen (Frontend)

### 5.1 Purpose and User Goals
The Admin screen is the staff-facing view for **COZY**. Administrators see a snapshot of order volume by stage, adjust **per-SKU inventory** with simple controls, and act on **incoming orders** (accept into the workflow, then advance through later stages as implemented). They return to the customer Ordering screen via the same global header.

### 5.2 Information Architecture
Vertical stack of modules below the global header:
1. **관리자 대시보드** — aggregate order metrics.
2. **재고 현황** — one card per menu SKU with current stock and **+** / **−** controls.
3. **주문 현황** — list of orders with time, line summary, amount, and stage-appropriate actions.

### 5.3 Header
| Element | Requirement |
|--------|---------------|
| App name | **COZY** on the left (consistent with §4.3). |
| **주문하기** | Navigates to the Ordering screen; **inactive** styling while Admin is active. |
| **관리자** | Indicates the Admin screen; **active** styling (e.g., bordered) when this view is shown. |

### 5.4 Admin Dashboard (관리자 대시보드)
| Element | Requirement |
|--------|---------------|
| Title | **관리자 대시보드**. |
| Metrics row | Single summary line with four counts, separated visually (e.g., slashes) as in the wireframe: **총 주문**, **주문 접수**, **제조 중**, **제조 완료**. |

**Metric definitions (recommended model):**
- **총 주문** — Total number of orders in the system (or all non-cancelled orders), for the scope the product uses.
- **주문 접수** — Orders in status *pending acceptance* (new; awaiting **주문 접수**).
- **제조 중** — Orders accepted and currently being prepared.
- **제조 완료** — Orders marked ready / complete for handoff (final label aligns with backend enum).

**Behavior:** Counts **must stay consistent** with the **주문 현황** data: any status change from an order row or API refresh updates the dashboard numbers without requiring a full page reload if the app uses live updates; at minimum, after each successful action the UI reflects new counts.

### 5.5 Inventory Status (재고 현황)
| Element | Requirement |
|--------|---------------|
| Title | **재고 현황**. |
| Cards layout | One card per SKU in a horizontal group (wireframe: three products matching menu: 아메리카노 (ICE), 아메리카노 (HOT), 카페라떼). |
| Stock display | Current quantity with unit suffix **개** (e.g., **10개**). |
| **+** | Increments inventory for that SKU by 1 (persist via API). |
| **−** | Decrements by 1; **must not** go below **0** (disable **−** at zero or no-op with clear UX). |

**Note:** Relationship between **inventory** and **ordering** (e.g., blocking checkout when stock is 0) is a **backend/product rule**—Admin UI still shows true stock and allows manual correction.

### 5.6 Order Status (주문 현황)
| Element | Requirement |
|--------|---------------|
| Title | **주문 현황**. |
| Order row | At minimum: **timestamp** (localized, e.g. **7월 31일 13:00**), **line summary** (e.g. **아메리카노(ICE) x 1**; extend to multiple lines or option tags per payload), **price** in KRW with thousands separator (e.g. **4,000원**). |
| Primary action (wireframe) | **주문 접수** — moves the order from *new* to *accepted* / *제조 중* per unified status model (exact next state defined in API contract). |

**Subsequent actions (implementation):** After acceptance, the same row (or expanded detail) should expose actions to advance to **제조 완료** (and optionally archive/deliver) so dashboard tallies for **제조 중** and **제조 완료** are meaningful. Wireframe shows only the first step; full lifecycle should match §5.4.

**Ordering of rows:** Newest first unless product standard says otherwise.

### 5.7 States and Edge Cases
- **No orders:** **주문 현황** shows an empty state; dashboard shows zeros where appropriate.
- **Multiple line items:** One order may list several products; display should not truncate required billing info (total per order vs. per line—follow API).
- **Localization:** Korean labels as in wireframe; dates/times in a consistent locale format.

### 5.8 Out of Scope (Admin Screen)
- Staff login, roles, and audit logs (per §3).
- Payment, refunds, and customer notifications.

### 5.9 Acceptance Criteria (Summary)
1. On Admin, header shows **관리자** active and **주문하기** navigates to Ordering.
2. **관리자 대시보드** displays four metrics and they match the current order dataset after actions or refresh.
3. **재고 현황** lists all menu SKUs with **개** counts and working **+** / **−** with floor at 0.
4. **주문 현황** lists orders with time, summary, KRW amount, and **주문 접수** (or equivalent primary action) wired to status updates.
5. Advancing an order updates the dashboard breakdown (주문 접수 / 제조 중 / 제조 완료) without stale numbers.

## 6. Backend PRD

### 6.1 Purpose
The backend provides menu/option/order data to the frontend, persists orders, updates inventory after checkout, and supports admin operations for order status transitions.

### 6.2 Data Models

#### 6.2.1 Menus
Represents coffee products shown on Ordering/Admin screens.

| Field | Type | Constraints / Notes |
|--------|------|---------------------|
| `id` | UUID (PK) | Server-generated unique identifier |
| `name` | VARCHAR | Coffee name (e.g., 아메리카노(ICE), 카페라떼) |
| `description` | TEXT | Product description |
| `price` | INTEGER | Base price in KRW (non-negative) |
| `image_url` | TEXT | Image path or public URL |
| `stock_quantity` | INTEGER | Current inventory count (`>= 0`) |
| `is_active` | BOOLEAN | Soft visibility flag for menu listing |
| `created_at` | TIMESTAMP | Created time |
| `updated_at` | TIMESTAMP | Updated time |

#### 6.2.2 Options
Represents option metadata and relation to one or more menus.

| Field | Type | Constraints / Notes |
|--------|------|---------------------|
| `id` | UUID (PK) | Server-generated unique identifier |
| `name` | VARCHAR | Option name (e.g., 샷 추가, 시럽 추가) |
| `price` | INTEGER | Option price in KRW (can be 0) |
| `created_at` | TIMESTAMP | Created time |
| `updated_at` | TIMESTAMP | Updated time |

**Menu-Option relation** (recommended):
- `menu_options` join table
  - `menu_id` (FK -> `menus.id`)
  - `option_id` (FK -> `options.id`)
  - composite unique key: (`menu_id`, `option_id`)

#### 6.2.3 Orders
Represents customer checkout records.

| Field | Type | Constraints / Notes |
|--------|------|---------------------|
| `id` | UUID (PK) | Server-generated unique identifier |
| `ordered_at` | TIMESTAMP | Order placed time |
| `status` | ENUM | `주문 접수` / `제조 중` / `완료` |
| `total_amount` | INTEGER | Sum of order line totals in KRW |
| `created_at` | TIMESTAMP | Created time |
| `updated_at` | TIMESTAMP | Updated time |

**Order items** (for 주문 내용: 메뉴, 수량, 옵션, 금액):
- `order_items`
  - `id` (UUID, PK)
  - `order_id` (FK -> `orders.id`)
  - `menu_id` (FK -> `menus.id`)
  - `menu_name_snapshot` (VARCHAR)
  - `base_price_snapshot` (INTEGER)
  - `quantity` (INTEGER, `> 0`)
  - `line_total` (INTEGER)
- `order_item_options`
  - `id` (UUID, PK)
  - `order_item_id` (FK -> `order_items.id`)
  - `option_id` (FK -> `options.id`)
  - `option_name_snapshot` (VARCHAR)
  - `option_price_snapshot` (INTEGER)

### 6.3 User Flow for Schema (Data Lifecycle)

1. **Menus 조회 및 화면 표시**
   - Frontend calls backend to fetch `menus` (+ `options` mapped by menu).
   - Ordering screen shows menu name/설명/가격/이미지.
   - Admin screen additionally shows `stock_quantity` from `menus`.

2. **사용자 메뉴 선택 및 장바구니 반영**
   - User selects menu and options in UI.
   - Cart is maintained on frontend until checkout.
   - Backend is not required to persist draft cart in v1.

3. **주문하기 클릭 시 Orders 저장**
   - Frontend sends checkout payload (line items, selected options, quantity).
   - Backend validates pricing and stock, then creates:
     - `orders` row (`ordered_at`, `status='주문 접수'`, `total_amount`)
     - `order_items` rows
     - `order_item_options` rows
   - In same transaction, backend decrements `menus.stock_quantity` by ordered quantity.

4. **관리자 주문 현황 표시 및 상태 변경**
   - Admin screen reads `orders` with item summary and amount.
   - Default status is `주문 접수`.
   - Status transitions:
     - `주문 접수` -> `제조 중`
     - `제조 중` -> `완료`
   - Dashboard counts are derived from `orders.status`.

### 6.4 API Design

#### 6.4.1 Menu list for Ordering screen
- **GET** `/api/menus`
- **Purpose:** Load coffee menu list from DB when user enters **주문하기**.
- **Response (example):**
  - menu id, name, description, price, image_url
  - option list per menu (id, name, price)
  - (optional) stock flag for sold-out handling

#### 6.4.2 Create order (checkout)
- **POST** `/api/orders`
- **Purpose:** Save order info when user clicks **주문하기**.
- **Request body (example shape):**
  - `items[]` with `menu_id`, `quantity`, `option_ids[]`
- **Server actions:**
  1. Validate menu/option relationship and stock availability
  2. Calculate totals server-side (do not trust client totals)
  3. Insert into `orders`, `order_items`, `order_item_options`
  4. Update menu inventory
- **Response:**
  - `order_id`, `ordered_at`, `status`, `total_amount`, ordered item summary

#### 6.4.3 Update inventory based on orders
- Inventory is updated in the **same DB transaction** as order creation.
- If any validation or DB step fails, entire checkout is rolled back.

#### 6.4.4 Get order by ID
- **GET** `/api/orders/:orderId`
- **Purpose:** Return detail for one order by order ID.
- **Response includes:**
  - order header (`id`, `ordered_at`, `status`, `total_amount`)
  - order item lines (`menu`, `quantity`, `options`, `line_total`)

#### 6.4.5 Admin order list and status transitions
- **GET** `/api/admin/orders`
  - Returns paginated list for 관리자 주문 현황 (newest first).
- **PATCH** `/api/admin/orders/:orderId/status`
  - Body: `{ "status": "제조 중" }` or `{ "status": "완료" }`
  - Enforce valid transition sequence only.

### 6.5 Backend Validation and Rules
- `stock_quantity` cannot be negative.
- Order quantity must be positive integer.
- Option IDs must belong to the selected menu.
- Price used for billing is always computed on backend from DB snapshots.
- Status transition must be sequential (`주문 접수` -> `제조 중` -> `완료`).

### 6.6 Acceptance Criteria (Backend)
1. `GET /api/menus` returns menus/options needed for Ordering screen rendering.
2. `POST /api/orders` creates order records and decreases stock atomically.
3. `GET /api/orders/:orderId` returns full order detail by ID.
4. Admin can read order list and update status through defined transition APIs.
5. Dashboard counts can be derived reliably from order statuses in DB.



<img width="1005" height="688" alt="image" src="https://github.com/user-attachments/assets/e86f7d02-4055-4e9a-a4f9-b14401631a2d" />
<img width="1054" height="701" alt="image" src="https://github.com/user-attachments/assets/f5d278e5-dd87-4bef-9f47-e1a23d9a3f2d" />
<img width="1054" height="888" alt="image" src="https://github.com/user-attachments/assets/ffb03f6b-459e-4ae2-8385-3555db7ca382" />
