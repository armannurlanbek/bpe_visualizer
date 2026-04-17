# Deploy Guide: BPE Lab

## 1) Deploy Backend to Render

1. Push repository to GitHub.
2. In Render, create a new **Web Service** from your repo.
3. Set Root Directory to `backend`.
4. Render can auto-read `backend/render.yaml`, or use:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn api:app --host 0.0.0.0 --port $PORT`
5. Deploy and copy your backend URL, for example:
   - `https://bpe-visualizer-api.onrender.com`

## 2) Deploy Frontend to Vercel

1. Import the same GitHub repo in Vercel.
2. Set Project Root to `frontend`.
3. Add environment variable:
   - `VITE_API_URL=https://your-render-backend-url.onrender.com`
4. Build command remains `npm run build`, output `dist`.
5. Deploy and copy your Vercel URL.

## 3) Update CORS In Backend

1. In Render environment variables, set:
   - `CORS_ORIGINS=http://localhost:5173,https://your-vercel-app.vercel.app`
2. Redeploy backend service.
3. Verify frontend requests to `/api/train`, `/api/encode`, and `/api/compare`.

## 4) Optional Custom Domain

1. Add your domain in Vercel (`bpe-lab.yourdomain.com`).
2. Configure DNS records in your domain provider.
3. Keep `VITE_API_URL` pointing to backend domain (Render or custom API domain).
