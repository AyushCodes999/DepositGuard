# DepositGuard 🛡️
> **"tamper-evident, not tamper-proof; documentation, not legal advice"**

A production-ready rental deposit documentation and dispute prevention platform designed specifically for Indian rental flats, apartments, and PG accommodations (Bangalore, Mumbai, NCR, Pune, Hyderabad). Grounded in the **Model Tenancy Act, 2021 (MTA)** principles and field research, DepositGuard provides a cryptographically sealed digital record of move-in and move-out conditions, dual-confirmation locking (SHA-256), multi-provider AI damage triage, a live tenancy assistant chatbot (**GuardBot**), deposit settlement ledgers, and formal ReportLab PDF exports.

---

> [!IMPORTANT]
> **Legal Disclaimer & Core Philosophy**:  
> DepositGuard records are **tamper-evident, not tamper-proof; documentation, not legal advice**. DepositGuard provides a neutral, mutual factual record of agreed property conditions. It does not replace formal lease agreements or constitute legal dispute adjudication.

---

## 1. Table of Contents
- [Core Architecture & Invariants](#2-core-architecture--invariants)
- [Multi-Provider AI Tiering Architecture](#3-multi-provider-ai-tiering-architecture)
- [Directory Layout](#4-directory-layout)
- [Tech Stack](#5-tech-stack)
- [Screenshots & Visual Evidence](#6-screenshots--visual-evidence)
- [Local Installation & Setup](#7-local-installation--setup)
- [Running the Test Suite](#8-running-the-test-suite)
- [Live Verification Walkthrough](#9-live-verification-walkthrough)
- [Project Documentation](#10-project-documentation)

---

## 2. Core Architecture & Invariants

| Feature | Engine / Layer | Architectural Invariant |
|---|---|---|
| **Dual-Confirmation Lock** | Python SHA-256 + Postgres Triggers | Both tenant and landlord must approve the baseline before cryptographic sealing; locked records are 100% immutable. |
| **Tamper Verification** | `/api/inspections/{id}/verify` | Canonical JSON serialization (sorted keys, compact delimiters) re-hashes the record on demand to detect bit-level tampering. |
| **Append-Only Amendments** | Cryptographic Hash Chain | Post-lock maintenance updates are appended to an `amendments` table chained to the previous hash, requiring co-party acknowledgment. |
| **Room-by-Room Checklist** | 5 Suites Pre-Populated from Research | Covers Bedroom, Bathroom, Kitchen, Living Area, Appliances/Electricals (including baseline electricity/water/gas meter photos). |
| **Room Overview + Exception Proofing** | Compact UX + Multi-Shot Panoramic Card | Eliminates "55-photo fatigue": auto-collapses photo uploaders for `Clean & Functional` items, highlighting uploads only for defects/meters while preserving SHA-256 schema lock compatibility. |
| **Indian Heritage Design System** | High-DPI Brand Crest + Multi-Layer SVG Artwork | Custom Indian architectural gateway artwork (`IndianArchitectureArtwork.jsx`), Mehrab arch & stepped ghats crest, and zero-blur High-DPI master assets with royal sunbeam sheen. |
| **Landlord Profile Pop-Out** | Direct Contact & Verification Modal | Clicking any landlord name opens an interactive profile pop-out featuring verified MTA compliance badges, Gmail composition, and WhatsApp contact channels. |
| **Pure JavaScript Stack** | 100% Native React `.jsx` Components | Clean, zero-friction Vite build without TypeScript conversion lag, type discrepancies, or stale module caching. |
| **Strict AI Isolation** | Relational Separation | **AI outputs are never hashed into or written into the locked Move-In baseline.** All triage is advisory and stored in a separate `ai_comparisons` table. |
| **Duplicate Prevention** | Backend Guard + Dynamic UI | Blocks duplicate active move-ins per property with `HTTP 400` and displays `"✓ Move-In Active"`. |
| **Formal PDF Export** | ReportLab Document Engine | Authenticated Blob download of tamper-evident PDF featuring SHA-256 seal, lock timestamps, dual approvals, item notes, downsized photos, and MTA disclaimers. |

---

## 3. Multi-Provider AI Tiering Architecture

DepositGuard implements a high-performance, quota-resilient multi-provider routing hierarchy designed to prevent rate-limit bottlenecks and eliminate event loop stalls:

```
                               ┌────────────────────────────────┐
                               │   Incoming AI Request          │
                               └───────────────┬────────────────┘
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       ▼                                               ▼
             [Text-Only Operations]                        [Condition Comparison]
             • GuardBot Live Chat                          • Move-Out vs Move-In
             • Fast Note Structuring                                   │
                       │                                               │
                       ▼                                               ▼
         ┌───────────────────────────┐                     Has Photos Attached?
         │ Tier 1: Groq Primary      │                     ├── YES: Call Gemini Vision First
         │ model: openai/gpt-oss-20b │                     │   (gemini-3.8-flash -> gemini-3.5-flash-lite)
         │ latency: ~400ms           │                     │   Fallback to Groq on 429/503/timeout
         └─────────────┬─────────────┘                     └── NO:  Call Groq Primary First
                       │ (on failure / unconfigured)
                       ▼
         ┌───────────────────────────┐
         │ Tier 2: Gemini Fallback   │
         │ Reasoning: gemini-3.8-flash
         │ Fast:      gemini-3.5-flash-lite
         │ Non-blocking asyncio      │
         └───────────────────────────┘
```

- **GuardBot Chatbot**: Authenticated non-streaming chat with pre-model sanitation (length 2–1000, letter enforcement, mash rejection), 20 req/min sliding-window rate limit, system instruction defense, and zero message-content logging.
- **Fast Note Structuring**: Automatically extracts structured conditions (`clean_functional`, `minor_wear`, `damaged`, etc.) and tags from rough notes under MTA 2021 principles.
- **Batched Condition Comparison**: Evaluates 15+ room items in a single batched JSON call, avoiding serial $N+1$ timeouts.

---

## 4. Directory Layout

```
DepositGuard/
├── .gitignore                      # Strictly ignores .env, *.env, .venv, node_modules
├── README.md                       # Main project documentation & portfolio overview
├── PROMPTS.md                      # Prompt engineering workflow & evolution history
├── BUGS_AND_FIXES.md               # 7 real bugs diagnosed, fixed, and verified
├── baseline_screenshots/           # Screenshots from baseline evaluation
│   ├── Screenshot (106).png
│   ├── Screenshot (107).png
│   └── Screenshot (108).png
├── final_screenshots/              # Screenshots of completed Run 2 application
├── supabase/
│   ├── schema.sql                  # Run 1 tables, RLS, immutability triggers, lock RPC
│   └── migration_run2.sql          # Run 2 ai_comparisons table & RLS policies
├── backend/
│   ├── .env.example                # Config with Groq, Gemini & Supabase variables
│   ├── requirements.txt            # FastAPI, httpx, google-genai, reportlab, sqlalchemy
│   ├── pytest.ini
│   ├── app/
│   │   ├── main.py                 # FastAPI application with CORS & lifespan model checks
│   │   ├── config.py               # Pydantic v2 settings (Groq & Gemini model IDs)
│   │   ├── database.py             # ORM models (Inspection, Room, Photo, AIComparison, Settlement)
│   │   ├── models/
│   │   │   └── schemas.py          # Pydantic schemas for GuardBot, notes, comparison, settlements
│   │   ├── middleware/
│   │   │   └── auth.py             # Supabase JWT decode & property membership authorization
│   │   ├── routers/
│   │   │   ├── auth.py             # Registration & login with server-side roles
│   │   │   ├── properties.py       # Property management & invite codes
│   │   │   ├── inspections.py      # Move-in/out inspections & PDF export (blocks duplicate move-ins)
│   │   │   ├── photos.py           # Photo uploads with server-side SHA-256 calculation
│   │   │   ├── approvals.py        # Dual-confirmation lock state machine
│   │   │   ├── amendments.py       # Append-only post-lock amendment chain
│   │   │   ├── verify.py           # Canonical rehash & tamper verification
│   │   │   ├── guardbot.py         # Live GuardBot chat & fast note structuring
│   │   │   ├── comparison.py       # Batched AI before/after condition triage
│   │   │   └── settlements.py      # Settlement calculations & ReportLab PDF download
│   │   └── services/
│   │       ├── canonical.py        # Canonical JSON serialization & SHA-256 hashing
│   │       ├── storage.py          # Photo storage & byte hashing
│   │       ├── room_templates.py   # Pre-populated research checklist items
│   │       ├── ai_service.py       # Multi-provider AI service (Groq + Gemini fallback)
│   │       └── pdf_service.py      # ReportLab PDF report generation engine
│   └── tests/
│       ├── conftest.py             # Isolated SQLite in-memory fixtures
│       ├── test_hash_determinism.py           # Deterministic canonical hashing test
│       ├── test_post_lock_immutability.py     # Immutability & amendment chain test
│       ├── test_guardbot_validation.py        # GuardBot length, letter & rate-limit validation
│       ├── test_structured_output_fallback.py # Note structuring retry & fallback test
│       └── test_model_fallback.py             # Groq primary & Gemini 429/503 fallback tests
└── frontend/
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx                 # Routing & state management
        ├── main.jsx
        ├── api/
        │   └── client.js           # Full REST API client with authenticated Blob PDF download
        ├── context/
        │   └── AuthContext.jsx     # Tenant / Landlord authentication state
        ├── components/
        │   ├── Navbar.jsx          # Header with role badges & navigation
        │   ├── Footer.jsx          # Legal notice & tamper-evident banner
        │   ├── HashBadge.jsx       # SHA-256 badge & live verification check
        │   ├── AmendmentModal.jsx  # Append-only post-lock amendment dialog
        │   └── GuardBotWidget.jsx  # Floating chatbot with live model badge & retry hygiene
        ├── pages/
        │   ├── LandingPage.jsx     # Indian rental market guide & value proposition
        │   ├── AuthPage.jsx        # Login & registration with role selector
        │   ├── DashboardPage.jsx   # Properties, duplicate check bug fix, move-out buttons
        │   ├── InspectionDetailPage.jsx # Room checklist, photo uploads, AI note structuring
        │   ├── ComparisonPage.jsx  # Move-out vs locked move-in AI triage
        │   └── SettlementPage.jsx  # Deduction breakdown & ReportLab PDF trigger
        └── data/
            └── defaultChecklist.js # Pre-populated research items (5 rooms)
```

---

## 5. Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React icons.
- **Backend**: Python 3.14+, FastAPI, Pydantic v2, SQLAlchemy ORM, ReportLab PDF Engine, `httpx` async client.
- **Database & Auth**: Supabase PostgreSQL, Row Level Security (RLS) policies, GoTrue JWT authentication, Supabase Storage.
- **AI Providers**:
  - **Groq API**: `openai/gpt-oss-20b` (Primary text provider).
  - **Google Gen AI**: `gemini-3.8-flash` (Primary reasoning / vision) and `gemini-3.5-flash-lite` (Fast model).

---

## 6. Screenshots & Visual Evidence

### Baseline UI Screenshots
Visual evidence of the baseline foundation:

| Landing & Auth Flow | Property & Room Checklist |
|:---:|:---:|
| ![Landing Page](baseline_screenshots/Screenshot%20(106).png) | ![Inspection Checklist](baseline_screenshots/Screenshot%20(107).png) |

| Move-In Lock State |
|:---:|
| ![Lock State](baseline_screenshots/Screenshot%20(108).png) |

### Final Application Screenshots (`final_screenshots/`)
- **Landing Page Hero & Indian Architecture Artwork**: `final_screenshots/01_landing_hero.png`
- **How It Protects (4-Step Cryptographic Workflow)**: `final_screenshots/02_how_it_protects_4steps.jpg`
- **5 Essential Pre-Populated Inspection Suites**: `final_screenshots/03_inspection_suites_room_by_room.png`
- **Verified Properties & Interactive Landlord Cards**: `final_screenshots/04_verified_properties_landlord_cards.jpg`
- **GuardBot AI Concierge (Groq Primary / Gemini Vision)**: `final_screenshots/05_guardbot_ai_concierge.png`
- **Move-In Checklist & Meter Photo Baseline (Room Overview UX)**: `final_screenshots/06_move_in_inspection_checklist.png`

---

## 7. Local Installation & Setup

### Prerequisites
- Node.js 18+ & npm
- Python 3.11+
- Git

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/DepositGuard.git
cd DepositGuard
```

### Step 2: Configure Backend Environment
```bash
cd backend
cp .env.example .env
```
Fill in the configuration variables in `backend/.env`:
```ini
APP_NAME=DepositGuard
ENVIRONMENT=development
DATABASE_URL=sqlite:///./depositguard.db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Supabase Auth & Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret_min32bytes

# AI Provider Configuration
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-20b
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL_REASONING=gemini-3.8-flash
GEMINI_MODEL_FAST=gemini-3.5-flash-lite
```

### Step 3: Set up Backend Virtual Environment
```powershell
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

### Step 4: Configure Frontend Environment
```bash
cd ../frontend
cp .env.example .env
npm install
```

---

## 8. Running the Test Suite

DepositGuard includes a comprehensive suite of 18 automated unit tests covering cryptographic determinism, post-lock immutability, OTP verification, salted password hashing, JWT enforcement, GuardBot input validation, rate limiting, structured note structuring, and multi-provider fallback.

Run the test suite from the repository root:
```powershell
cd backend
.\.venv\Scripts\python -m pytest -v
```

### Expected Output:
```text
backend\tests\test_guardbot_validation.py::test_guardbot_input_validation PASSED
backend\tests\test_guardbot_validation.py::test_guardbot_rate_limiting PASSED
backend\tests\test_hash_determinism.py::test_canonical_hash_determinism PASSED
backend\tests\test_model_fallback.py::test_guardbot_429_immediate_fallback PASSED
backend\tests\test_model_fallback.py::test_guardbot_503_fallback PASSED
backend\tests\test_model_fallback.py::test_batch_compare_item_conditions_success PASSED
backend\tests\test_model_fallback.py::test_batch_compare_429_fallback PASSED
backend\tests\test_model_fallback.py::test_compare_item_conditions_503_fallback PASSED
backend\tests\test_model_fallback.py::test_guardbot_groq_primary_success PASSED
backend\tests\test_model_fallback.py::test_guardbot_groq_failure_gemini_fallback PASSED
backend\tests\test_model_fallback.py::test_batch_compare_no_photos_groq_primary PASSED
backend\tests\test_model_fallback.py::test_batch_compare_photos_gemini_first_groq_fallback PASSED
backend\tests\test_otp_and_security.py::test_salted_password_hashing PASSED
backend\tests\test_otp_and_security.py::test_otp_flow_and_registration_enforcement PASSED
backend\tests\test_otp_and_security.py::test_jwt_signature_enforcement PASSED
backend\tests\test_post_lock_immutability.py::test_post_lock_immutability PASSED
backend\tests\test_structured_output_fallback.py::test_structured_output_success PASSED
backend\tests\test_structured_output_fallback.py::test_structured_output_retry_and_fallback PASSED

============================= 18 passed in 4.26s =============================
```

---

## 9. Live Verification Walkthrough

### 1. Launch Servers
**Terminal 1 (Backend):**
```powershell
cd backend
.\.venv\Scripts\python -m uvicorn app.main:app --port 8000 --reload
```
Swagger UI available at: `http://localhost:8000/docs`

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run dev
```
Web app available at: `http://localhost:5173`

### 2. Walkthrough Steps
1. **Sign Up & Property Setup**: Register a Landlord account, create a property, and note the auto-generated invite code. Register a Tenant account to join.
2. **Move-In Inspection & Meter Photos**: Fill in the 5 pre-populated room suites. Upload utility meter readings. Test rough note structuring by typing *"switchboard loose, wall paint dull near window"* and clicking **"✨ AI Structure (Fast)"**.
3. **Dual-Confirmation Lock**: Have both landlord and tenant review and approve. Observe the real-time SHA-256 seal computation and timestamp generation.
4. **GuardBot Assistant**: Open the floating GuardBot widget in the bottom-right corner. Ask: *"Is natural wall paint fading considered chargeable damage under MTA 2021?"* Test input sanitization by sending `"aaaaaaa"`; verify the client catches invalid input without making an upstream API call.
5. **Move-Out & Batched AI Comparison**: Initiate Move-Out inspection, document move-out conditions, and click **"🔍 Run AI Condition Comparison"**. Observe rapid batched evaluation labeling items as `none`, `normal_wear`, or `possible_damage`.
6. **Settlement Ledger & ReportLab PDF Export**: Review deduction ledger, add agreed amounts, and click **"Export Tamper-Evident PDF"** to download the formal report.

---

## 10. Project Documentation

For deeper architectural breakdowns, design decisions, and debugging history, refer to:
- 📖 [PROMPTS.md](file:///c:/MY_Works/DepositGuard/PROMPTS.md): Complete prompt engineering evolution, domain research notes, and iterative refinement prompts.
- 🛠️ [BUGS_AND_FIXES.md](file:///c:/MY_Works/DepositGuard/BUGS_AND_FIXES.md): Exhaustive log of the 7 real-world concurrency, event loop, and provider bugs discovered and resolved during live testing.
