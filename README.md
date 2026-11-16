# Flip Zone — React E-commerce Frontend

Responsive React + Vite storefront with Home, Login, Registration, Product Listing, Product Details, Cart, Checkout and Orders pages.

## 1. Requirements
- Node.js 20 LTS or newer
- npm
- Backend API (see `API_REQUIREMENTS.md`)

## 2. Run locally
```bash
npm install
cp .env.example .env
npm run dev
```
Open the local URL printed by Vite (normally `http://localhost:5173`).

For Windows PowerShell, copy the environment file with:
```powershell
Copy-Item .env.example .env
```

## 3. Configure backend
Set `VITE_API_BASE_URL` in `.env`, for example:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```
Restart the Vite server after changing environment variables. The backend must allow CORS from the frontend origin.

## 4. Build
```bash
npm run build
npm run preview
```

## 5. GitHub
Create an empty GitHub repository named `flip-zone-frontend`, then:
```bash
git init
git add .
git commit -m "Initial Flip Zone React frontend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/flip-zone-frontend.git
git push -u origin main
```

## Notes
- Product cards currently use sample data in `src/data/products.js` so the UI runs before the API is ready.
- Cart actions currently persist to localStorage for a working frontend demo. Replace these actions with the cart endpoints for a server-authoritative cart.
- Login/register and order pages call the API services in `src/api/services.js`.
- Do not store passwords in localStorage. The backend should hash passwords and issue short-lived access tokens; use refresh-token rotation or secure HttpOnly cookies for production.
- Replace emoji product art with real product image URLs returned by the backend when product media is available.
