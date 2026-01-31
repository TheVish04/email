# Email Master

## Quick Start (Local)

To run the app locally, you need **both** the backend and frontend running.

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env and set MONGODB_URI (required)
npm install
npm run dev
```

The backend runs on **port 3001**. The frontend proxies `/api` requests to it.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on **port 5173**.

If you see errors like "Backend not reachable" or "Unexpected token" when registering, ensure the backend is running first.

---

## Deployment (Render + Vercel)

- **Backend (Render)**: `https://email-7vph.onrender.com`
- **Frontend (Vercel)**: `https://email-pi-three.vercel.app`

### Vercel – Required env variable

For the frontend to reach the backend, set this in Vercel:

1. Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://email-7vph.onrender.com`
3. Redeploy so the new env is applied.

### Render

- Ensure `MONGODB_URI`, `JWT_SECRET`, and any other required vars are set in Render’s environment.
- Free tier services sleep after inactivity; the first request may take ~30–60 seconds to wake up.
