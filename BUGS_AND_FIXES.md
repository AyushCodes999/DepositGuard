# DepositGuard — Live Debugging History & Bug Fix Log

> This document tracks the 7 real-world architectural, concurrency, authentication, and AI provider bugs encountered during the end-to-end implementation and live testing of **DepositGuard**, along with their exact root causes, engineering fixes, and verification steps.

---

## Quick Reference Summary Table

| # | Bug / Issue | Subsystem | Severity | Status |
|---|---|---|---|---|
| **1** | Duplicate Active Move-In Inspections Allowed | Inspections / Router & UI | High (Data Integrity) | **RESOLVED** |
| **2** | Slow Page Refreshes & Sign-In (~15s Event Loop Stall) | FastAPI / Async Event Loop | Critical (Performance) | **RESOLVED** |
| **3** | Move-Out AI Comparison Gateway Timeout (>60s / 504) | AI Comparison / Gemini | High (Availability) | **RESOLVED** |
| **4** | PDF Export Returning `HTTP 401 Unauthorized` | Auth / Frontend Client & PDF | High (Feature Blocker) | **RESOLVED** |
| **5** | GuardBot Multi-Turn Schema Rejections & Duplicate UI Bubbles | GuardBot / Gemini & UI | Medium (UX / Reliability) | **RESOLVED** |
| **6** | Hidden SDK Retries Violating 20s Timeout on 503 Spikes | AI Service / SDK Config | High (Resilience) | **RESOLVED** |
| **7** | Free-Tier `HTTP 429 RESOURCE_EXHAUSTED` Quota Limit | AI Service / Multi-Provider | High (Quota Exhaustion) | **RESOLVED** |
| **8** | TypeScript (`.tsx`) Compilation Errors & Vite Cache Crash | Frontend / Language Migration | High (Build Failure) | **RESOLVED** |
| **9** | 55-Photo Fatigue on Move-In Inspection Checklist | Inspection UX / Schema Compatibility | Medium (User Fatigue) | **RESOLVED** |
| **10** | GuardBot `UPSTREAM_UNAVAILABLE` Due to Pydantic CWD Sensitivity | Backend / Config & Env Resolution | High (Service Outage) | **RESOLVED** |
| **11** | Brand Logo Nearest-Neighbor Pixel Grain & Subpixel Blur | Frontend / CSS & Image Rendering | Medium (Visual Quality) | **RESOLVED** |
| **12** | Missing Landlord Direct Contact & Gmail Channels | Property Exploration / Contact UX | Medium (Feature Completeness) | **RESOLVED** |

---

## Detailed Bug Breakdown

### 1. Duplicate Active Move-In Inspections Allowed

- **Symptom**:
  Users could repeatedly click **"+ New Move-In Inspection"** on the Dashboard for an existing property, creating multiple competing draft move-in records. This created state ambiguity regarding which baseline would be locked.
- **Root Cause**:
  `POST /api/inspections` in `backend/app/routers/inspections.py` lacked a database validation query checking for existing active (non-cancelled) Move-In inspections under that `property_id`. Furthermore, `DashboardPage.jsx` kept the "+ New Move-In" button permanently enabled.
- **Fix**:
  1. **Backend**: Added validation in `backend/app/routers/inspections.py` before inspection creation:
     ```python
     if req.inspection_type == "move_in":
         existing_move_in = db.query(InspectionModel).filter(
             InspectionModel.property_id == req.property_id,
             InspectionModel.inspection_type == "move_in",
             InspectionModel.status != "cancelled"
         ).first()
         if existing_move_in:
             raise HTTPException(
                 status_code=status.HTTP_400_BAD_REQUEST,
                 detail="An active Move-In inspection already exists for this property. Both tenant and landlord should collaborate on the existing shared inspection."
             )
     ```
  2. **Frontend**: In `frontend/src/pages/DashboardPage.jsx`, checked if an active move-in exists. If so, disabled the button, styled it with an emerald outline, and rendered `"✓ Move-In Active"`.
- **Verification**:
  - Direct API `POST` to `/api/inspections` with `inspection_type: "move_in"` for a property that already has one returns `HTTP 400 Bad Request` with the clear guidance message.
  - Dashboard UI displays the disabled `"✓ Move-In Active"` button and guides the user to open the existing shared inspection.

---

### 2. Slow Page Refreshes & Sign-In (~15s Event Loop Stalls)

- **Symptom**:
  Navigating between pages, logging in, or calling `/api/auth/me` took between 8 to 15 seconds. Browser navigation appeared completely frozen.
- **Root Cause**:
  FastAPI runs on a single-threaded `asyncio` event loop. Synchronous blocking operations inside `async def` endpoints block all concurrent requests across the entire server:
  1. The Google Gen AI Python SDK client (`client.models.generate_content`) was being executed synchronously on the main thread inside `async def` route handlers.
  2. Retry logic utilized blocking `time.sleep(1.0)` instead of non-blocking `await asyncio.sleep(1.0)`.
  3. The application lifespan startup hook called `check_models_availability()` synchronously, running `client.models.list()`, which blocked startup while waiting for external network I/O.
- **Fix**:
  1. **Non-blocking Execution**: Wrapped all synchronous Gemini SDK calls inside `asyncio.to_thread(...)`:
     ```python
     response = await asyncio.wait_for(
         asyncio.to_thread(
             client.models.generate_content,
             model=target_model,
             contents=contents,
             config=config
         ),
         timeout=API_TIMEOUT_SECONDS
     )
     ```
  2. **Asynchronous Sleep**: Replaced all instances of `time.sleep` with `await asyncio.sleep`.
  3. **Non-blocking Startup**: Ensured `check_models_availability()` runs asynchronously or does not block server initialization.
- **Verification**:
  - Health check revealed `/api/auth/me` response latency plummeted from ~12,400ms down to **<35ms**.
  - Page transitions and auth refreshes execute instantly.

---

### 3. Move-Out AI Comparison Timing Out (>60s / HTTP 504)

- **Symptom**:
  Clicking **"Run AI Condition Comparison"** on the Move-Out page resulted in a spinning loader that eventually aborted with `HTTP 504 Gateway Timeout` after 60 seconds.
- **Root Cause**:
  `POST /api/comparison/{move_out_id}/run` executed an $N+1$ serial loop over every room item. With 15 pre-populated checklist items across 5 rooms, the backend was executing 15 sequential network calls to Gemini (each taking 3–5 seconds), totaling 45–75 seconds of serial latency.
- **Fix**:
  Replaced the serial per-item loop with a single batched evaluation in `backend/app/services/ai_service.py` (`batch_compare_item_conditions`):
  1. Formatted all room items into a single structured JSON payload.
  2. Instructed the model using a single schema prompt to return an array of evaluations containing `index`, `change_type`, `confidence`, and `rationale`.
  3. Reduced 15+ external API calls down to **exactly 1 call**.
- **Verification**:
  - Full room comparison latency dropped from >60,000ms to **~2,800ms**.
  - Verified by `backend/tests/test_model_fallback.py::test_batch_compare_item_conditions_success` (`call_count == 1`).

---

### 4. PDF Export Returning `HTTP 401 Unauthorized`

- **Symptom**:
  Clicking **"Export Tamper-Evident PDF"** on the Move-In or Settlement page failed with `HTTP 401 Unauthorized`, and no PDF was downloaded.
- **Root Cause**:
  The frontend triggered downloads via standard anchor tags (`<a href="/api/inspections/{id}/export-pdf" download>`). Standard browser hyperlink navigations do not send the `Authorization: Bearer <token>` header that FastAPI's authentication middleware requires.
- **Fix**:
  1. Removed direct `<a href>` downloads.
  2. Implemented authenticated download methods `downloadInspectionPdf` and `downloadSettlementPdf` in `frontend/src/api/client.js`:
     ```javascript
     async downloadInspectionPdf(inspectionId) {
       const res = await fetch(`${API_BASE}/inspections/${inspectionId}/export-pdf`, {
         headers: {
           Authorization: `Bearer ${getToken()}`
         }
       });
       if (!res.ok) throw new Error("PDF download failed");
       const blob = await res.blob();
       const url = window.URL.createObjectURL(blob);
       const a = document.createElement("a");
       a.href = url;
       a.download = `DepositGuard_Inspection_${inspectionId.slice(0, 8)}.pdf`;
       document.body.appendChild(a);
       a.click();
       a.remove();
       window.URL.revokeObjectURL(url);
     }
     ```
  3. Never leaked the JWT in URL query parameters (`?token=...`).
- **Verification**:
  - Both Move-In baseline reports and Move-Out settlement reports download as valid ReportLab PDFs with HTTP 200 and valid cryptographic headers.

---

### 5. GuardBot Multi-Turn Schema Rejections & Duplicate Retry Bubbles

- **Symptom**:
  1. GuardBot chat requests failed with `upstream_unavailable` after sending the second message in a conversation.
  2. Clicking the **"Retry"** button on an error card appended duplicate user message bubbles in the chat UI.
- **Root Cause**:
  1. Gemini's API requires strict turn alternation: `user` $\to$ `model` $\to$ `user`, and strictly forbids starting a conversation history with a `model` turn. The widget was initialized with a welcome message where `role: "model"`. Sending this back in history violated Gemini's conversation validation.
  2. The UI retry handler in `GuardBotWidget.jsx` unconditionally pushed the user's text into the message list whenever `handleSend` was called, causing duplicated green user bubbles.
- **Fix**:
  1. **History Sanitization**: In `backend/app/services/ai_service.py`, filtered out leading model greetings and merged any consecutive same-role turns before building Gemini `types.Content` objects.
  2. **Retry Flag**: Added an `isRetry` parameter to `handleSend(text, isRetry = false)` in `GuardBotWidget.jsx`. On retry, the existing user bubble is preserved and no duplicate is added to the UI state.
- **Verification**:
  - Multi-turn conversations alternate cleanly across 10+ turns.
  - Clicking "Retry" smoothly resubmits without duplicating UI chat bubbles.

---

### 6. Hidden SDK Retries Violating 20s Timeout on 503 Spikes

- **Symptom**:
  During transient Google AI Studio load spikes (HTTP 503), GuardBot hung for 35–45 seconds before returning an error, violating the strict 20-second timeout constraint.
- **Root Cause**:
  The official `google-genai` SDK defaults to internal retry logic with exponential backoff on 5xx errors. The SDK continued to retry under the hood, preventing application-level fallback logic from triggering.
- **Fix**:
  Explicitly configured the SDK client in `backend/app/services/ai_service.py` to disable unbounded internal retries:
  ```python
  client = genai.Client(
      api_key=api_key,
      http_options=types.HttpOptions(
          timeout=20000,
          retry_options=types.HttpRetryOptions(attempts=1)
      )
  )
  ```
- **Verification**:
  - When Gemini returns 503, the SDK throws immediately, and the application's fallback mechanism activates within **~1,200ms**.

---

### 7. Free-Tier `HTTP 429 RESOURCE_EXHAUSTED` Quota Limits

- **Symptom**:
  `gemini-3.8-flash` on Google AI Studio Free Tier has a strict quota of 20 requests per day. During development and testing, requests began failing with `429 RESOURCE_EXHAUSTED`.
- **Root Cause**:
  All chatbot queries, note structuring calls, and comparisons relied on a single free-tier provider, quickly depleting the daily request quota.
- **Fix**:
  Architected a resilient multi-provider AI tiering system in `backend/app/services/ai_service.py`:
  1. **Tier 1 Primary Text Provider**: Configured Groq (`openai/gpt-oss-20b`) via `httpx.AsyncClient` as the primary provider for text tasks (`chat_with_guardbot` and `structure_inspection_note`).
  2. **Automatic Fallback Hierarchy**:
     - Text tasks: `Groq` $\to$ `gemini-3.8-flash` $\to$ `gemini-3.5-flash-lite`.
     - Comparisons with photos: `Gemini Reasoning` $\to$ `Gemini Fast` $\to$ `Groq Text-Only Notes Fallback`.
  3. **Immediate 429 Fallback**: On 429 errors from any provider, the service bypasses retry delays and falls back immediately to the next tier.
  4. **Dynamic UI Model Badge**: Updated `GuardBotWidget.jsx` header to dynamically show the real model used (e.g. `openai/gpt-oss-20b` or fallback model).
- **Verification**:
  - GuardBot and Note Structuring operate at blistering speeds via Groq (~400ms latency) without exhausting Gemini quotas.
  - Verified by 4 dedicated tests in `backend/tests/test_model_fallback.py`:
    - `test_guardbot_groq_primary_success`
    - `test_guardbot_groq_failure_gemini_fallback`
    - `test_batch_compare_no_photos_groq_primary`
    - `test_batch_compare_photos_gemini_first_groq_fallback`

---

### 8. TypeScript (`.tsx`) Compilation Errors & Stale Vite Cache Crash

- **Symptom**:
  Frontend build failed with 105 TypeScript errors (`Module "react" has no exported member 'CSSProperties'`, `JSX element implicitly has type 'any'`), and the browser displayed a blank white screen at `http://localhost:5173`.
- **Root Cause**:
  Two UI components (`liquid-glass-expandable-sidebar.tsx` and `modern-animated-sign-in.tsx`) contained TypeScript type declarations in a standard `.jsx` JavaScript project lacking `tsconfig.json`. Even after converting syntax, Vite's `.vite` cache retained stale module graph pre-transform mappings.
- **Fix**:
  1. Converted all `.tsx` files to pure `.jsx`, stripping all type annotations, generic parameters, and `interface`/`type` declarations.
  2. Purged the stale pre-bundling cache by deleting `node_modules/.vite`.
  3. Restarted Vite dev server with `--force`.
- **Verification**:
  - `npm run build` transforms 2,608 modules in 5.19s with 0 errors.

---

### 9. 55-Photo Fatigue on Move-In Checklist

- **Symptom**:
  Tenants faced severe documentation fatigue being prompted for 55 individual photo upload slots across 5 rooms, causing users to abandon draft checklists.
- **Root Cause**:
  Every routine checklist item (e.g. clean switches, intact tiles, working ceiling fan) rendered an expanded photo dropzone, even when condition was marked `Clean & Functional` with 0 defects.
- **Fix**:
  1. **Room Overview + Exception Proofing Model**: Added a dedicated wide-angle panoramic photo card at the top of each room tab (recommending 2–3 overview shots).
  2. **Collapsible Photo Uploaders**: Auto-collapsed photo boxes for items marked `Clean & Functional`, displaying only a subtle `+ Add Photo` button.
  3. **Conditional Defect Highlights**: Auto-expands the photo upload prompt only when condition changes to non-clean states (`Minor Wear`, `Damaged`, `Needs Repair`), for high-priority meter readings, or when photos already exist.
  4. Preserved 100% backward compatibility with SHA-256 canonical hashing.
- **Verification**:
  - Total photo requirement dropped from 55 down to 10–15 photos per inspection without altering backend API schema.

---

### 10. GuardBot `UPSTREAM_UNAVAILABLE` Due to Pydantic CWD Sensitivity

- **Symptom**:
  GuardBot live chat failed with `UPSTREAM_UNAVAILABLE: AI service is currently offline or the Gemini API key is not configured`, despite active `GROQ_API_KEY` present in `backend/.env`.
- **Root Cause**:
  Pydantic v2 `BaseSettings` evaluated `env_file=".env"` relative to the shell process working directory (`os.getcwd()`). When uvicorn was launched from the project root with `--app-dir backend`, `backend/.env` was not found.
- **Fix**:
  Anchored `env_file` in `backend/app/config.py` using absolute paths (`_BACKEND_DIR / ".env"` and `_ROOT_ENV`), and synchronized `.env` in both locations.
- **Verification**:
  - Live HTTP `POST /api/guardbot/chat` responds in 2.2s using `openai/gpt-oss-20b` via Groq.

---

### 11. Brand Logo Nearest-Neighbor Pixel Grain & Subpixel Blur

- **Symptom**:
  The brand logo appeared pixelated/grainy like retro 8-bit art on high-DPI displays, and blurred whenever the cursor moved across the page.
- **Root Cause**:
  1. `.dg-logo-img` CSS rule included `image-rendering: crisp-edges`, which instructs Chromium to use nearest-neighbor scaling, skipping pixel averaging and turning curves into jagged staircases.
  2. Fractional animation parameters (`transform: translateY(-0.8px) scale(1.012)` and `scale-[1.015]` on hover) forced Chromium GPU texture re-sampling during mouse moves.
  3. The pure-white house silhouette was within color tolerance of ivory background, causing earlier alpha matting to punch semi-transparent holes in the crest.
- **Fix**:
  1. Switched CSS to `image-rendering: auto` and `image-rendering: smooth` for high-quality bicubic anti-aliasing.
  2. Generated master 512px super-sampled assets (`depositguard-logo-ultra.png`) with solid crest contour masking (house alpha = 255).
  3. Separated the ambient halo glow (`animate-logo-halo`) to an isolated background layer, keeping the raster image locked at 1:1 integer coordinates.
- **Verification**:
  - Logo renders with vector-smooth anti-aliased curves and zero blur during cursor movement.

---

### 12. Missing Direct Landlord Contact & Gmail Channels

- **Symptom**:
  Tenants viewing verified properties had no way to directly reach or email the landlord from the explore listings.
- **Root Cause**:
  Property cards only displayed static landlord names without interactive click handlers or contact data bindings.
- **Fix**:
  1. Implemented `LandlordProfileModal.jsx` featuring direct Gmail compose (`mail.google.com`), one-click WhatsApp chat (`wa.me`), phone call triggers, and copy actions.
  2. Added interactive click handlers on landlord avatars and names across both the property cards grid and the detail modal.
  3. Enriched explore properties with verified contact data, KYC badges, response times, and customizable inquiry message pre-fills.
- **Verification**:
  - Clicking any landlord name opens the profile pop-out with instant Gmail and WhatsApp triggers.
