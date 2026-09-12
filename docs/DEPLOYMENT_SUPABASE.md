# VIGIL — Supabase Storage, Backend & Frontend Complete Deployment Guide

> **All-In-One Production Deployment Architecture**  
> **Database:** Supabase PostgreSQL  
> **Backend:** Render / Railway / Docker  
> **Frontend:** Vercel  

---

## Part 1: Supabase Database Setup & Integration

### 1. Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and log in.
2. Click **New Project** -> Select your organization -> Enter project name `VIGIL-Security-DB`.
3. Set a strong Database Password.
4. Select a Region close to your users (e.g. `ap-south-1` Mumbai).
5. Click **Create new project**.

### 2. Obtain PostgreSQL Connection URI
1. In your Supabase Dashboard, navigate to **Project Settings** -> **Database**.
2. Under **Connection String**, select **Transaction Pooler** or **Direct Connection** (URI format).
3. Copy your URI. It will look like this:
   ```env
   DATABASE_URL=postgresql://postgres.your_project_ref:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   ```

### 3. Update VIGIL `.env` Configuration
In your backend environment file (`backend/.env`), set:
```env
DATABASE_URL=postgresql://postgres.your_project_ref:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
SECRET_KEY=generate_a_random_secret_32_chars
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

SQLAlchemy inside VIGIL automatically runs `Base.metadata.create_all(bind=engine)` on startup, automatically creating all 5 database tables (`users`, `speaker_profiles`, `analysis_sessions`, `alerts`, `audit_logs`) inside Supabase!

---

## Part 2: Backend Deployment (Render / Railway / Docker)

### Option A: Deploy on Render.com (Recommended Free/Simple Option)
1. Push your code repository to **GitHub**.
2. Sign in to [Render.com](https://render.com) -> Click **New** -> **Web Service**.
3. Connect your GitHub repository (`VIGIL`).
4. Set the following configuration parameters:
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `python -m pip install -r ../requirements.txt`
   - **Start Command:** `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Under **Environment Variables**, add:
   - `DATABASE_URL`: *(Your Supabase connection string)*
   - `SECRET_KEY`: `your_secure_jwt_secret`
6. Click **Create Web Service**. Render will deploy your FastAPI backend and issue your live URL (e.g., `https://vigil-backend.onrender.com`).

---

## Part 3: Frontend Deployment (Vercel)

### Deploy on Vercel.com
1. Sign in to [Vercel.com](https://vercel.com) -> Click **Add New...** -> **Project**.
2. Select your GitHub repository.
3. Configure project settings:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
4. Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://vigil-backend.onrender.com`
5. Click **Deploy**. Vercel will build and host your production dashboard at `https://vigil-security.vercel.app`.

---

## Part 4: Post-Deployment Verification Checklist

1. **Sign Up:** Navigate to your live frontend -> Click **Create VIGIL Account** -> Register a new user.
2. **Database Check:** Go to Supabase Dashboard -> **Table Editor** -> Inspect `users` table to verify your real user account is saved!
3. **Biometric Enrollment:** Go to **Speaker Verification** -> Enroll a new user voice profile -> Inspect `speaker_profiles` in Supabase.
4. **Live Monitor & Analysis:** Upload an audio file or trigger an SIH demo scenario -> Verify `analysis_sessions` and `alerts` tables update in real time!
