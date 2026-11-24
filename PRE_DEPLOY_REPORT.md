# DepositGuard — Pre-GitHub & Pre-Vercel Deployment Readiness Audit Report

> **Generated**: 2026-11-24  
> **Repository**: `DepositGuard` (`C:\MY_Works\DepositGuard`)  
> **Status**: **READY FOR GITHUB PUSH & VERCEL/RENDER DEPLOYMENT**  
> **Confidentiality Notice**: All credentials, tokens, and keys referenced in this report use safe redacted placeholders in accordance with strict security audit guidelines.

---

## 1. Executive Summary

DepositGuard has completed an end-to-end production readiness audit. The codebase was verified across database drivers, storage adapters, git hygiene, secrets protection, SPA routing rewrites, documentation currency, and automated verification suites:
- **Git Hygiene**: Clean. `.gitignore` strictly protects `.env`, `*.env`, `backend/.env`, `frontend/.env`, SQLite `.db` databases, local photo storage, virtual environments, and `node_modules`.
- **Secret Leaks**: 0 hardcoded API keys (`AIza`, `gsk_`, `eyJ`) found across tracked source files. Safe `.env.example` templates provided across both backend and frontend.
- **Frontend Deployment (Vercel)**: `frontend/vercel.json` configured with SPA fallback rewrite rules. Production bundle compiled cleanly in 5.73s (0 errors).
- **Backend Deployment (Render)**: `backend/requirements.txt` updated to include `psycopg2-binary` for Supabase PostgreSQL support alongside `fastapi`, `uvicorn`, `httpx`, `google-genai`, `reportlab`, and `pillow`. CORS configuration supports dynamic comma-separated origins with automatic trailing-slash sanitization.
- **Automated Tests**: 18/18 unit tests passed in 4.31s (`pytest -v`).

---

## 2. Database & Storage Production Readiness

### 2.1 Current Default vs. Production Target
- **Current Development Default**:
  - **Database**: Local SQLite via SQLAlchemy (`sqlite:///./depositguard.db`).
  - **Storage**: Local disk via `LOCAL_STORAGE_DIR = Path("./storage/inspection-photos")`, served through `/api/photos/view/{storage_path}`.
  - **Auth & Session**: Custom salted PBKDF2-SHA256 password hashing, server-side email OTP verification, and signed JWT tokens with 24-hour expiration.

### 2.2 Exact `.env` Keys Required for Supabase Production Deployment

To switch DepositGuard from local SQLite + disk storage to Supabase PostgreSQL + Supabase Storage in production (Render / Vercel), configure the following environment variables:

#### Backend Environment Variables (Render)
```ini
# Database Connection (Supabase PostgreSQL)
# Use direct connection on port 5432 or transaction pooler on port 6543
DATABASE_URL=postgresql://postgres:[YOUR-DB-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Supabase Project Credentials
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[YOUR-SUPABASE-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SUPABASE-SERVICE-ROLE-KEY]
SUPABASE_JWT_SECRET=[YOUR-SUPABASE-JWT-SECRET-MIN-32-BYTES]

# CORS Configuration (Allowed Production Frontend Origins)
CORS_ORIGINS=https://[YOUR-FRONTEND-APP].vercel.app,http://localhost:5173

# Multi-Provider AI Tiering
GROQ_API_KEY=[YOUR-GROQ-API-KEY]
GROQ_MODEL=openai/gpt-oss-20b
GEMINI_API_KEY=[YOUR-GEMINI-API-KEY]
GEMINI_MODEL_REASONING=gemini-3.8-flash
GEMINI_MODEL_FAST=gemini-3.5-flash-lite
```

#### Frontend Environment Variables (Vercel)
```ini
# FastAPI Backend API Base URL
VITE_API_URL=https://[YOUR-BACKEND-API].onrender.com/api

# Supabase Direct Client Configuration (Optional)
VITE_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR-SUPABASE-ANON-KEY]
```

---

## 3. Git Hygiene & Secret Leak Audit

### 3.1 `.gitignore` Rules & Coverage
Verified that the root `.gitignore` contains comprehensive exclusions for:
- **Secrets & Environment**: `.env`, `*.env`, `backend/.env`, `frontend/.env`, `.env.local`
- **Exemptions (Safe Examples Only)**: `!.env.example`, `!backend/.env.example`, `!frontend/.env.example`
- **Databases & Local State**: `*.db`, `*.sqlite`, `*.sqlite3`, `depositguard.db`, `backend/depositguard.db`
- **File Storage**: `storage/`, `backend/storage/`, `*.log`
- **Python**: `__pycache__/`, `*.py[cod]`, `.venv/`, `backend/.venv/`, `.pytest_cache/`
- **Node**: `node_modules/`, `frontend/node_modules/`, `dist/`, `frontend/dist/`

### 3.2 Workspace Scan for Hardcoded Secrets & Stray Scripts
- **Scan Query**: Scanned all tracked Python, JavaScript, JSX, JSON, and Markdown files for regex signatures:
  - Google API Keys: `AIza[0-9A-Za-z-_]{35}`
  - Groq API Keys: `gsk_[0-9A-Za-z]{20,}`
  - JWT Tokens: `eyJ[a-zA-Z0-9_-]{20,}\.eyJ[a-zA-Z0-9_-]{20,}`
- **Scan Result**: **0 hardcoded secrets found in tracked repository code.**
- **Stray Scripts**: Removed all temporary diagnostic test scripts (`test_guardbot_http.py`, `test_shield_mask.png`, `test_composite_*.png`). Root directory is clean.

### 3.3 Safe Example Templates
- `backend/.env.example`: Present and contains only safe placeholder values.
- `frontend/.env.example`: Present and contains only safe placeholder values.
- `.env.example` (root): Created and aligned with backend template.

---

## 4. Vercel & Render Deployment Configuration

### 4.1 Vercel SPA Routing Configuration
Created `frontend/vercel.json` with SPA rewrite rules to ensure client-side React Router navigation (e.g. `/`, `/dashboard`, `/auth`, `/inspection/:id`, `/comparison/:id`) resolves cleanly to `index.html` without returning `HTTP 404 Not Found` on page refresh:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 4.2 Render Backend Dependencies (`backend/requirements.txt`)
Verified all required dependencies are specified with minimum version bounds:
- `fastapi>=0.110.0`
- `uvicorn[standard]>=0.28.0`
- `pydantic[email]>=2.6.0`
- `email-validator>=2.0.0`
- `pydantic-settings>=2.2.0`
- `sqlalchemy>=2.0.28`
- `psycopg2-binary>=2.9.9` *(Added for Supabase PostgreSQL support)*
- `pyjwt>=2.8.0`
- `python-multipart>=0.0.9`
- `pytest>=8.0.0`
- `httpx>=0.27.0`
- `google-genai>=1.0.0`
- `reportlab>=4.0.0`
- `pillow>=9.0.0`

### 4.3 CORS Configuration
- In `backend/app/config.py`: The `CORS_ORIGINS` setting accepts comma-separated origins.
- The `cors_origins_list` property automatically strips whitespace and trailing slashes (`origin.strip().rstrip("/")`), ensuring seamless cross-origin communication between the Vercel frontend and Render backend.

---

## 5. Documentation & Screenshot Inventory

### 5.1 Documentation Alignment
- **`README.md`**: Updated with full tech stack, 18 passed automated tests, directory layout, multi-provider Groq + Gemini architecture, Indian architectural design system, pure `.jsx` stack, and the Landlord Profile Pop-Out feature.
- **`BUGS_AND_FIXES.md`**: Expanded from 7 bugs to **12 real-world architectural bugs and engineering fixes**, documenting:
  - Bug 8: TypeScript `.tsx` to `.jsx` migration & stale Vite pre-bundling cache purge.
  - Bug 9: Move-in inspection 55-photo fatigue resolved with Room Overview + Exception Proofing model.
  - Bug 10: GuardBot `UPSTREAM_UNAVAILABLE` resolved by fixing Pydantic CWD `.env` resolution.
  - Bug 11: Logo nearest-neighbor pixel grain resolved by swapping `image-rendering: crisp-edges` for smooth bicubic anti-aliasing.
  - Bug 12: Interactive Landlord Profile Pop-Out with direct Gmail & WhatsApp contact channels.
- **`PROMPTS.md`**: Updated with Sections 5 and 6 documenting the prompt workflows for checklist UX streamlining, architectural heritage branding, and landlord profile integration.

### 5.2 Screenshot Inventory

#### Baseline Screenshots (`baseline_screenshots/`)
1. `baseline_screenshots/Screenshot (106).png` — Landing page & auth baseline flow.
2. `baseline_screenshots/Screenshot (107).png` — Initial room inspection checklist.
3. `baseline_screenshots/Screenshot (108).png` — Move-in lock state.

#### Final Application Screenshots (`final_screenshots/`)
1. `final_screenshots/01_landing_hero.png` — Indian architectural sky artwork, animated ultra-res brand emblem, and full-width header.
2. `final_screenshots/02_how_it_protects_4steps.jpg` — 4-step cryptographic workflow with connecting timeline.
3. `final_screenshots/03_inspection_suites_room_by_room.png` — 5 essential pre-populated inspection suites with interactive item drawer.
4. `final_screenshots/04_verified_properties_landlord_cards.jpg` — MTA 2021 verified landlord listings with interactive profile buttons.
5. `final_screenshots/05_guardbot_ai_concierge.png` — Floating GuardBot concierge widget powered by Groq (`openai/gpt-oss-20b`).
6. `final_screenshots/06_move_in_inspection_checklist.png` — Streamlined Room Overview + Exception Proofing inspection interface.

---

## 6. Automated Verification Results

### 6.1 Backend Test Suite (`pytest -v`)
- **Environment**: Python 3.14.2, pytest-9.2.0, anyio-4.16.0
- **Command**: `python -m pytest -v backend/tests`
- **Result**: **18 PASSED in 4.31s (100% Pass Rate)**

```text
backend\tests\test_guardbot_validation.py::test_guardbot_input_validation PASSED [  5%]
backend\tests\test_guardbot_validation.py::test_guardbot_rate_limiting PASSED [ 11%]
backend\tests\test_hash_determinism.py::test_canonical_hash_determinism PASSED [ 16%]
backend\tests\test_model_fallback.py::test_guardbot_429_immediate_fallback PASSED [ 22%]
backend\tests\test_model_fallback.py::test_guardbot_503_fallback PASSED [ 27%]
backend\tests\test_model_fallback.py::test_batch_compare_item_conditions_success PASSED [ 33%]
backend\tests\test_model_fallback.py::test_batch_compare_429_fallback PASSED [ 38%]
backend\tests\test_model_fallback.py::test_compare_item_conditions_503_fallback PASSED [ 44%]
backend\tests\test_model_fallback.py::test_guardbot_groq_primary_success PASSED [ 50%]
backend\tests\test_model_fallback.py::test_guardbot_groq_failure_gemini_fallback PASSED [ 55%]
backend\tests\test_model_fallback.py::test_batch_compare_no_photos_groq_primary PASSED [ 61%]
backend\tests\test_model_fallback.py::test_batch_compare_photos_gemini_first_groq_fallback PASSED [ 66%]
backend\tests\test_otp_and_security.py::test_salted_password_hashing PASSED [ 72%]
backend\tests\test_otp_and_security.py::test_otp_flow_and_registration_enforcement PASSED [ 77%]
backend\tests\test_otp_and_security.py::test_jwt_signature_enforcement PASSED [ 83%]
backend\tests\test_post_lock_immutability.py::test_post_lock_immutability PASSED [ 88%]
backend\tests\test_structured_output_fallback.py::test_structured_output_success PASSED [ 94%]
backend\tests\test_structured_output_fallback.py::test_structured_output_retry_and_fallback PASSED [100%]

======================== 18 passed, 1 warning in 4.31s ========================
```

### 6.2 Frontend Production Build (`npm run build`)
- **Environment**: Node.js, Vite 5.4.21
- **Command**: `npm --prefix frontend run build`
- **Result**: **SUCCESS in 5.73s (0 Errors)**

```text
vite v5.4.21 building for production...
transforming...
✓ 2608 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.55 kB │ gzip:   0.37 kB
dist/assets/index-4X39vuu6.css  108.07 kB │ gzip:  16.08 kB
dist/assets/index-BhIvR-U5.js   758.59 kB │ gzip: 227.58 kB
✓ built in 5.73s
```

---

## 7. Pre-Deployment Command Runbook

### Step 1: Git Add & Commit
```bash
git add .
git commit -m "feat: complete production readiness audit, vercel config, and documentation alignment"
```

### Step 2: Push to GitHub
```bash
git remote add origin https://github.com/[YOUR-USERNAME]/DepositGuard.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy Frontend to Vercel
1. Import repository on [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Set **Build Command** to `npm run build` and **Output Directory** to `dist`.
4. Add Environment Variable:
   - `VITE_API_URL`: URL of your deployed FastAPI backend.
5. Deploy.

### Step 4: Deploy Backend to Render
1. Create a **Web Service** on [Render](https://render.com).
2. Set **Root Directory** to `backend`.
3. Set **Runtime** to `Python 3`.
4. Set **Build Command** to `pip install -r requirements.txt`.
5. Set **Start Command** to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
6. Configure Environment Variables in Render Dashboard (`DATABASE_URL`, `CORS_ORIGINS`, `GROQ_API_KEY`, `GEMINI_API_KEY`, etc.).
7. Deploy.
