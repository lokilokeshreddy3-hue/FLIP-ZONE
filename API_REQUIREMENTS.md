# Flip Zone Backend API Requirements

Base URL example: `http://localhost:8000/api/v1`

All JSON endpoints should return consistent JSON errors. Authenticated endpoints require:
`Authorization: Bearer <access_token>`

## Common conventions
- JSON request/response bodies; UTF-8.
- Use HTTPS outside local development.
- Enable CORS for the deployed frontend origin.
- Validate all input on the server; never trust frontend price/total values.
- Store passwords using Argon2id or bcrypt. Never return password hashes.
- Use integer minor currency units (e.g. paise) or a documented decimal format consistently.
- Paginate product and order lists.

## 1. Authentication

### POST `/auth/register`
Request:
```json
{"name":"Lokesh","email":"lokesh@example.com","password":"StrongPass123"}
```
Response `201`:
```json
{"user":{"id":12,"name":"Lokesh","email":"lokesh@example.com"},"access_token":"<jwt>","token_type":"Bearer"}
```
Validation: name 2–80 chars, valid unique email, password minimum 8 chars. Return `409` for an existing email and `422` for invalid fields.

### POST `/auth/login`
Request:
```json
{"email":"lokesh@example.com","password":"StrongPass123"}
```
Response `200`: same user/token shape as register. Return `401` for invalid credentials.

### GET `/auth/me` (authenticated)
Response:
```json
{"id":12,"name":"Lokesh","email":"lokesh@example.com"}
```

## 2. Products

### GET `/products`
Query parameters: `q`, `category`, `sort` (`featured|price_asc|price_desc`), `page`, `limit`.
Response:
```json
{"items":[{"id":101,"name":"Headphones","category":"Electronics","price":3499,"old_price":4999,"rating":4.7,"image_url":"https://...","description":"Wireless headphones","stock":25}],"page":1,"limit":12,"total":1}
```

### GET `/products/{product_id}`
Response: one product object with `id`, `name`, `category`, `price`, `old_price`, `rating`, `image_url`, `description`, `stock`, `sku`, and timestamps. Return `404` when missing.

## 3. Cart (authenticated)

### GET `/cart`
Response:
```json
{"items":[{"id":501,"product":{"id":101,"name":"Headphones","price":3499,"image_url":"https://..."},"quantity":2,"line_total":6998}],"subtotal":6998,"currency":"INR"}
```

### POST `/cart/items`
Request: `{"product_id":101,"quantity":1}`. Create or increment the cart line. Validate stock. Return updated cart.

### PATCH `/cart/items/{item_id}`
Request: `{"quantity":2}`. Quantity must be >= 1 and <= available stock. Return updated cart.

### DELETE `/cart/items/{item_id}`
Remove line; return `204` or updated cart.

## 4. Orders / checkout (authenticated)

### POST `/orders`
Request:
```json
{
  "shipping_address":{
    "full_name":"Lokesh","phone":"9999999999",
    "address":"12 Main Road","city":"Chittoor","postal_code":"517xxx"
  },
  "items":[{"product_id":101,"quantity":2}]
}
```
The backend must load current product prices and stock from its database, calculate totals, reserve/decrement inventory safely in a database transaction, and create the order. Do not accept a trusted total from the client.

Response `201`:
```json
{"id":9001,"status":"placed","currency":"INR","subtotal":6998,"shipping_fee":0,"total":6998,"created_at":"2026-11-16T10:00:00Z"}
```
For a real payment flow, add a payment provider integration and order states such as `pending_payment`, `paid`, `failed`, `cancelled`, `shipped`, `delivered`.

### GET `/orders` (authenticated)
Response:
```json
{"items":[{"id":9001,"status":"placed","total":6998,"currency":"INR","created_at":"2026-11-16T10:00:00Z"}],"page":1,"limit":10,"total":1}
```

### GET `/orders/{order_id}` (authenticated)
Return order details and line items. Users must only access their own orders; admins may have separate authorization.

## 5. Recommended additional endpoints
- `GET /categories` — categories for the Home page.
- `GET /health` — readiness/liveness health check.
- `POST /auth/refresh` and `POST /auth/logout` — refresh-token lifecycle if using refresh tokens.
- `POST /payments/create-intent` and payment webhook endpoint — payment processing.
- `GET /users/me/addresses` and `POST /users/me/addresses` — saved addresses.

## 6. Database entities
- `users`: id, name, email (unique), password_hash, created_at.
- `categories`: id, name, slug.
- `products`: id, category_id, name, description, sku, price, old_price, image_url, stock, is_active.
- `carts`: id, user_id (unique), updated_at.
- `cart_items`: id, cart_id, product_id, quantity.
- `orders`: id, user_id, status, subtotal, shipping_fee, total, currency, shipping_address JSON, created_at.
- `order_items`: id, order_id, product_id, product_name_snapshot, unit_price_snapshot, quantity, line_total.

## 7. Integration checklist
1. Agree on the base URL and response shapes.
2. Implement auth and token strategy.
3. Enable CORS for local Vite and production frontend domains.
4. Replace sample products with `productApi.list()` and `productApi.detail()`.
5. Replace local cart state with `cartApi.get/add/update/remove`; load cart after login.
6. Ensure checkout sends product IDs and quantities only; backend calculates totals.
7. Load orders from `orderApi.list()` and add order detail view.
8. Test 401, 403, 404, 409, 422, empty states, network failures and expired tokens.
