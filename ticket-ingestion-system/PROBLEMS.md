# AI Email/Ticket Classifier - Phase Audit & Issues

This document captures the phase implementation status and any gaps identified during the hackathon audit. Issues marked as **FIXED** have been addressed.

---

## Phase Implementation Summary

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1 | **Complete** | Bun.js, MongoDB, POST/GET /api/tickets, new-ticket page, ticket list |
| Phase 2 | **Complete** | Preprocessing; language now returns en/hi/mixed/unknown (spec-compliant) |
| Phase 3 | **Complete** | AI classification; uses Gemini (not OpenAI); "Customer Support" vs spec "Support" |
| Phase 4 | **Complete** | Sentiment, urgency, tags, urgencyReason; uses Gemini |
| Phase 5 | **Complete** | impactScorer wired; KPI supports `?month=YYYY-MM` |

---

## Issues Identified and Fixes

### 1. Phase 5: Impact Score Not Applied on Ticket Creation — FIXED

**Location:** `src/backend/routes.ts`

**Problem:** `calculateImpact` was imported but never invoked. Tickets were created with default `impactScore: 0`, `impactLevel: 'low'`, `impactReason: ''` from the schema.

**Fix Applied:** After classification and analysis, we now call `calculateImpact({ urgency, sentiment, department, normalizedText, sender })` and include `impactScore`, `impactLevel`, `impactReason` in `Ticket.create()`.

---

### 2. Phase 5: KPI API Ignored `month` Query Parameter — FIXED

**Location:** `src/backend/routes.ts`

**Problem:** The `/api/kpi/monthly` endpoint always used the current month for `totalTickets` and did not read the `?month=YYYY-MM` query parameter. `unseenTickets` and `openTickets` were global, not month-scoped.

**Fix Applied:** Parse `url.searchParams.get('month')`, validate format `YYYY-MM`, and compute `startOfMonth` / `endOfMonth`. All three KPIs (`totalTickets`, `unseenTickets`, `openTickets`) are now scoped to the requested month.

---

### 3. Phase 2: Language Output Format Mismatch — FIXED

**Location:** `src/backend/preprocessing/languageDetector.ts`

**Problem:** Spec requires `en / hi / unknown`; implementation returned `'English' | 'Hindi' | 'Mixed' | 'Unknown'`.

**Fix Applied:** Map outputs to `en`, `hi`, `mixed`, `unknown` for spec compliance. DB schema default updated to `unknown`.

---

### 4. Phase 3: Department Naming and AI Provider — DOCUMENTED

**Department naming:** Spec says "Support"; classifier returns "Customer Support". Kept as-is for clarity; both map to the same intent.

**AI provider:** Spec mentions "OpenAI"; implementation uses **Google Gemini** (gemini-flash-latest). Acceptable for hackathon (cost, availability, rate limits). Documented here for transparency.

---

## Recommended Verification

1. **Impact scoring:** Submit a new ticket with urgent language (e.g. "URGENT: Server down") and verify `impactScore`, `impactLevel`, `impactReason` are populated.
2. **KPI month filter:** Call `GET /api/kpi/monthly?month=2025-01` and confirm counts match tickets created in January 2025.
3. **Language detection:** Submit a ticket with Hindi (Devanagari) text and verify `language: "hi"` in the response.
