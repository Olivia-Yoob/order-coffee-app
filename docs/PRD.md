# Coffee Ordering App

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

