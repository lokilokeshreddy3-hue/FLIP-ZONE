# Flip Zone Backend (FastAPI + SQLite)

This backend matches the API routes documented in the frontend's `API_REQUIREMENTS.md`.

## Requirements
- Python 3.10+
- PowerShell on Windows (commands below)

## 1. Create and activate a virtual environment

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation for this terminal, run:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

## 2. Install packages and configure environment

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
```

For local development, the example JWT secret works. Replace it with a long random secret before deployment.

## 3. Start the API

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open:
- API health: http://127.0.0.1:8000/api/v1/health
- Interactive Swagger docs: http://127.0.0.1:8000/docs

The first startup creates `flipzone.db` and seeds eight demo products.

## API routes
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/products` and `GET /api/v1/products/{id}`
- `GET /api/v1/cart`
- `POST /api/v1/cart/items`
- `PATCH /api/v1/cart/items/{item_id}`
- `DELETE /api/v1/cart/items/{item_id}`
- `POST /api/v1/orders`
- `GET /api/v1/orders` and `GET /api/v1/orders/{id}`

## Important
- This is a local development/demo backend using SQLite.
- Product prices are represented as whole INR rupees in this starter.
- Checkout recalculates totals from database prices and decrements stock.
- No real payment gateway is connected; orders are marked `placed`.
- Do not deploy with the sample JWT secret. Use HTTPS, managed secrets, a production database, migrations, rate limiting, and payment-provider webhooks before production.
