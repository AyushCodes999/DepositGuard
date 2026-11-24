# DepositGuard — Prompt Engineering & Evolution Workflow

> **Repository**: DepositGuard  
> **Philosophy**: *"tamper-evident, not tamper-proof; documentation, not legal advice"*  
> **Core Focus**: Rental deposit protection for Indian PGs, flats, and apartments under Model Tenancy Act, 2021 (MTA) principles.

---

## 1. Overview & Prompting Philosophy

DepositGuard was engineered through a phased, contract-driven prompt workflow. In rental dispute management, precision and immutability are non-negotiable: a cryptographically sealed move-in baseline must **never** be corrupted, overwritten, or re-hashed by probabilistic AI models.

To ensure reliable code generation, robust security boundaries, and zero token waste, the development followed a structured progression:

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: Real-World Domain Research                         │
│ • MTA 2021 principles & Schedule II maintenance matrix      │
│ • 5 Room Inspection Checklists & Meter Photo protocols     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Prompt Evolution: v1 Monolith ──► v2 Two-Run Staged Plan    │
│ • Run 1: Foundation, Auth, Storage & Cryptographic Lock     │
│ • Run 2: Advisory AI, GuardBot, Before/After & PDF Export   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Iterative Refinement & Performance Engineering              │
│ • Targeted 6-area read-only diagnostic health check         │
│ • 4-part event-loop unblocking, batched AI & authenticated  │
│   PDF downloads                                             │
│ • Multi-turn conversational schema defense & retry hygiene  │
│ • Tier-1 Groq Primary + Gemini Fallback Multi-Provider      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Phase 1: Domain Research Grounding

Before writing prompts or application code, domain research was conducted on Indian residential rental dispute patterns across major metros (Bangalore, Mumbai, NCR, Pune, Hyderabad) and documented in `RESEARCH NOTES/Research notes.txt`.

### Key Legal & Practical Insights:
1. **Model Tenancy Act, 2021 (MTA) Schedule II**:
   - **Landlord Responsibilities**: Structural repairs, whitewashing, exterior painting, major electrical wiring, plumbing overhauls.
   - **Tenant Responsibilities**: Periodic maintenance, tap washer replacements, drain unblocking, switch/socket plate repairs, door knob/lock tightening.
   - **Deduction Standard**: Deductions must be backed by itemized receipts and dated photographic proof. Generic "painting charges" or arbitrary lump-sum deductions for lived-in properties are legally invalid.
2. **Pre-Populated 5-Suite Inspection Schema**:
   - **Bedroom**: Walls (nail holes vs gouges), doors/locks, wardrobe hinges, fan/lights.
   - **Bathroom**: WC seat/flush, washbasin, taps/pipes, geyser electrical/leaks, drains.
   - **Kitchen**: Countertop cracks, sink drainage, cabinets, chimney/exhaust, gas regulator.
   - **Living Area**: Wall discolouration, flooring/tile cracks, balcony railings, switchboards.
   - **Appliances & Utilities**: Refrigerator, washing machine, AC cooling, and **explicit baseline photos of electricity, water, and gas meter readings**.

---

## 3. Prompt Evolution: v1 Monolith vs. v2 Staged Runs

### The v1 Monolith Prompt (`PROMPTS/Prompt v1/Here is my v1 prompt.txt`)
The original v1 prompt attempted to instruct the AI agent to build the entire system in a single prompt:
- Full directory layout and database schemas
- Supabase Auth, PostgreSQL RLS, storage buckets, and SHA-256 locking
- 7 React pages with Tailwind styling
- Google Gen AI integration (GuardBot, note structuring, comparison)
- Python ReportLab PDF export engine

#### Why v1 Failed & Needed Restructuring:
- **Context Overload & Hallucinations**: Asking for 15+ complex files across frontend and backend in one shot caused truncated outputs, missing imports, and incomplete state machines.
- **Architectural Violation Risk**: In a single monolithic build, AI agents frequently blur the boundary between immutable cryptographic records and probabilistic AI outputs (e.g. attempting to store AI triage results inside the locked inspection hash).
- **Testability Gap**: Foundational cryptographic determinism and immutability triggers could not be independently tested before layering on AI features.

---

### The v2 Staged Runs (`PROMPTS/Prompt v2/`)

To solve the limitations of v1, the architecture was split into two sequential runs with strict invariants:

#### Run 1: Foundation, Auth, and the Cryptographic Lock
- **File**: `PROMPTS/Prompt v2/Run 1 foundation, auth, and the loc.txt`
- **Scope**:
  - Supabase Auth with server-side role management (`tenant` vs `landlord` in `profiles`).
  - Private storage with client-side image compression and server-side byte hashing (SHA-256).
  - **Dual-Confirmation Lock State Machine**: `draft` $\to$ `pending_approval` $\to$ `locked` | `disputed`.
  - Canonical JSON serialization (sorted keys, compact delimiters) and SHA-256 sealing.
  - PostgreSQL immutability triggers rejecting `UPDATE`/`DELETE` on locked inspections.
  - Append-only `amendments` table chained to previous hash.
  - **Invariants**: Absolutely NO AI code in Run 1; only placeholder environment variables in `.env.example`.
  - **Verification**: `test_hash_determinism.py` and `test_post_lock_immutability.py`.

#### Run 2: AI, GuardBot, Comparison, and PDF Export
- **File**: `PROMPTS/Prompt v2/Run 2 AI, GuardBot, comparison, and.txt`
- **Scope**:
  - Official `google-genai` SDK implementation with strict environment-configured model IDs:
    - Primary Reasoning Model: `gemini-3.8-flash` (for GuardBot and comparison).
    - Fast Model: `gemini-3.5-flash-lite` (for note structuring).
  - **Strict Separation Invariant**: AI outputs are stored in a separate `ai_comparisons` table labeled `"AI suggestion"`; they are NEVER included in the locked Move-In hash.
  - **GuardBot Chatbot**: Authenticated `POST /api/guardbot/chat` endpoint with input sanitation (length 2-1000, letter check, mash detection), sliding-window rate limiting (20 req/min), system instruction defense, and zero prompt-content logging.
  - **Move-Out Condition Comparison**: Compares move-out photos and notes against the locked baseline under MTA wear-and-tear standards.
  - **ReportLab PDF Generation**: Generates formal tamper-evident PDF with SHA-256 seal, lock timestamps, dual approvals, room items, downsized photos, and legal disclaimers.

---

## 4. Iterative Refinement & Performance Prompts

During live testing of Run 2, multiple edge cases and performance bottlenecks were discovered. These were resolved using targeted refinement prompts:

### 1. Diagnostic Health-Check Prompt
- **Goal**: Perform an end-to-end, read-only latency and status check across 6 critical areas (Auth, Core Lock Flow, GuardBot, Note Structuring, Move-Out Comparison, PDF Export) without editing code.
- **Result**: Pinpointed the exact root causes behind 15s page freezes, 60s comparison timeouts, and 401 PDF export failures.

### 2. Four-Part Performance & PDF Fix Prompt
- **Unblocking Asyncio Event Loop**: Moved all synchronous `google-genai` calls off the event loop via `asyncio.to_thread(...)`, wrapped executions in `asyncio.wait_for(..., timeout=20.0)`, replaced `time.sleep` with `await asyncio.sleep`, and ensured startup checks run asynchronously.
- **N+1 Comparison Batching**: Refactored the serial 15-item API loop into a single batched JSON call (`batch_compare_item_conditions`), slashing comparison latency from >60s to <4s.
- **Authenticated PDF Downloads**: Replaced direct `<a href>` tags with an authenticated `fetch()` Blob pipeline in `client.js`, avoiding URL token leakage.
- **Duplicate Move-In Prevention**: Enforced a backend rule rejecting duplicate active move-ins per property with `HTTP 400` and updated the UI button to `"✓ Move-In Active"`.

### 3. GuardBot Multi-Turn Turn Order & Retry Fix Prompt
- **Gemini Conversation Defense**: Filtered out initial `role: "model"` greeting messages from chat history to comply with Gemini's mandatory alternating `user -> model` schema.
- **Retry Bubble Hygiene**: Added an `isRetry` flag to `GuardBotWidget.jsx` preventing duplicate user bubbles when retrying a failed prompt.
- **SDK Retries**: Configured `genai.Client` with `types.HttpRetryOptions(attempts=1)` to stop internal exponential backoffs from violating the 20s timeout requirement.

### 4. Multi-Provider Groq Primary + Gemini Fallback Routing Prompt
- **Motivation**: Free-tier Google AI Studio limits `gemini-3.8-flash` to 20 requests/day, triggering `429 RESOURCE_EXHAUSTED` during development.
- **Routing Implementation**:
  - Integrated Groq (`openai/gpt-oss-20b`) via `httpx.AsyncClient` as Tier 1 primary for all text-only tasks (`chat_with_guardbot` and `structure_inspection_note`).
  - Implemented automatic fallback: `Groq` $\to$ `gemini-3.8-flash` $\to$ `gemini-3.5-flash-lite`.
  - For batched comparison: If no photos are attached, use Groq; if photos are attached, use Gemini for vision, with Groq text-only comparison as emergency fallback if Gemini 429/503 limits are reached.
  - Dynamically displayed the active model badge in the GuardBot UI header.

### 5. Move-In Checklist UX Refactor (Room Overview + Exception Proofing)
- **Motivation**: Address user fatigue from 55 mandatory photo upload cards without breaking backend schema or SHA-256 canonical hashing.
- **Implementation**:
  - Added Room Overview panoramic cards (2–3 wide shots per room).
  - Auto-collapsed photo uploaders for `Clean & Functional` items, highlighting uploads only for defects, meter readings, or existing photos.
  - Room tab progress indicators showing photo count and defect flags.

### 6. Design System & Brand Identity Polish
- **Motivation**: Replace generic aesthetics with a culturally grounded, high-trust Indian architectural visual language.
- **Implementation**:
  - Created `IndianArchitectureArtwork.jsx` with layered SVG parallax and ambient glowing windows.
  - Developed `BrandLogo.jsx` with Indian heritage shield emblem (Mehrab arch, stepped ghats, brass padlock, and key).
  - Built High-DPI super-sampled master assets (`depositguard-logo-ultra.png`) and resolved browser nearest-neighbor grain artifacts.
  - Converted all legacy TypeScript `.tsx` files to pure `.jsx` and cleared stale Vite module caches.
  - Added interactive Landlord Profile Pop-Out with direct Gmail and WhatsApp contact channels.

---

## 5. Summary of Prompt Artifacts in Workspace

| Artifact | Location | Purpose |
|---|---|---|
| **Domain Research Notes** | `RESEARCH NOTES/Research notes.txt` | Legal grounding under MTA 2021 & room checklist items |
| **Prompt v1 (Monolith)** | `PROMPTS/Prompt v1/Here is my v1 prompt.txt` | Historical reference of the initial all-in-one prompt |
| **Prompt v2 (Run 1)** | `PROMPTS/Prompt v2/Run 1 foundation, auth, and the loc.txt` | Foundation, Auth, Storage, and Cryptographic Lock |
| **Prompt v2 (Run 2)** | `PROMPTS/Prompt v2/Run 2 AI, GuardBot, comparison, and.txt` | AI Service, GuardBot, Comparison, and PDF Export |
| **Refinement Prompts** | `PROMPTS.md` (this document) | Health-check, event-loop unblocking, Groq Tier-1 routing |
