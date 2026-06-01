# PRD & Work Plan: Personal Invoice Generator (Toolbox Platform v1)

Status: DRAFT-REV3 (Architect + Critic ITERATE applied; user answers incorporated)
Date: 2026-06-01
Owner: Serhii Liamtsev (single user, personal use)

---

## 1. Context

Build a personal invoice generator web tool. This is the **first tool in a personal "toolbox" platform**: future tools will be added later, will NOT depend on each other.

Two real DOCX templates were provided (and verified from document.xml + screenshots):
`Invoice_OM_SWIFT_00039_SERHII_LIAMTSEV.docx` and `Invoice_PA_SWIFT_00038_SERHII_LIAMTSEV.docx`

### Shared static content (both templates)
- Seller: `Private Entrepreneur: LIAMTSEV SERHII`, `Tax Code: 3701600812`
- Address: `61039, Ukraine, region Kharkivska, city Kharkiv, street Pushkinska, build 79/5 str build. 79/5`
- Bank block (EURO): JSC UNIVERSAL BANK, BIC `UNJSUAUKXXX`, IBAN `UA413220010000026009330165611`, Ukraine
- Table header: `# | Item & Description Qty | Qty | Rate | Amount`
- Rate per hour: `28,00` (comma decimal). Currency: EUR

### OM-specific static content
- Recipient: `Finsupport Services OÜ`, Tallinn Estonia, Reg `17118728`, VAT `EE102801563`
- Description: `Custom software development as per annex dated 27.06.2025 to the contractor Agreement from 31.03.2025 ... - Omni Matrix`
- Total line suffix: `(100% Omni Matrix)` — appears in same run as total amount

### PA-specific static content (verified from screenshot + XML)
- Recipient: `Payoro Finance Ltd.`
- `Inc. # BC1439769`
- `Tax # 788927952 BC0001`
- Address: `22420 Dewdney Trunk Road, Suite 300, Maple Ridge BC V2X 3J5, Canada`
- `Registration number: 17118728` ← intentionally present (shared field, static, preserve as-is)
- `Director with signatory rights: Erling Andersen`
- `Company email: office@payoro.com`
- Description: `Custom software development as per Agreement from 01.10..2025 for the period {dates}` (note: `01.10..2025` double-dot is a source artifact — preserve exactly)
- No total suffix

### Variable fields per invoice
| Field | Occurrences | Notes |
|---|---|---|
| Balance Due (header) | 1 | Format: `€2464.00` (DOT decimal, no thousands separator) |
| Invoice Date | 1 | Format: `DD.MM.YYYY`, defaults to today |
| Invoice Number | 1 | Format: `INV-000XX`, shared counter, also drives filename |
| Qty (hours) | 1 | Format: `88.00 hrs` (DOT decimal + " hrs" suffix) |
| Items in Total (hours) | 1 | Format: `88,00` (COMMA decimal, NO "hrs" suffix — different from Qty) |
| Rate | 1 | Format: `28,00` (COMMA decimal, static default) |
| Line Amount | 1 | Format: `2464,00` (COMMA decimal, no thousands separator) |
| Sub Total | 1 | Format: `€2464.00` (euro + DOT decimal — same as Balance Due header) |
| Total | 1 | Format: `2464,00` (COMMA decimal) |
| Period (in description) | 1 | Embedded in description string: `...for the period DD.MM.YYYY-DD.MM.YYYY` |

**Number formatting rule (server-authoritative, 4 distinct formats):**
| Cell | Format | Example |
|---|---|---|
| Balance Due (header), Sub Total | `€` + dot decimal | `€2464.00` |
| Amount, Total, Rate, Bonus Rate/Amount | comma decimal | `2464,00` |
| Qty column | dot decimal + ` hrs` | `88.00 hrs` |
| Items in Total row | comma decimal, no suffix | `88,00` |

NO thousands separator anywhere.

**Optional bonus line:** `Appreciation bonus | Qty 1 | Rate 1000,00 | Amount 1000,00`
- Bonus Qty (`1`) does NOT add to "Items in Total" hours — hours row reflects work hours only
- Bonus adds to Sub Total and Total

**Output:** PDF, filename = `Invoice_{OM|PA}_SWIFT_{number}_SERHII_LIAMTSEV.pdf`

---

## 2. Work Objectives

1. A local-first web app where the user fills both PA and OM invoices sequentially for a given month, then downloads each PDF.
2. Persisted invoice history (durable across restarts, re-downloadable).
3. A platform shell that hosts independent tools; invoice generator is the first plug-in tool.

---

## 3. Guardrails

**Must Have**
- Exact format/layout fidelity — achieved by filling the original DOCX files with `{{placeholders}}`; the DOCX structure (fonts, layout, static text) is never altered.
- DOCX → PDF conversion preserving layout (LibreOffice headless).
- Sequential PA→OM monthly flow: PA invoice first (gets next number), OM second (gets next+1).
- Total hours auto-calculated from weekdays (Mon–Fri × 8h) of the prior calendar month; editable.
- PA invoice is filled first (full hours); OM gets the remaining hours (totalHours − paHours), pre-filled in step 2.
- Totals auto-computed server-side; user never types amounts manually.
- Invoice number is a single shared counter (both templates); auto-suggested as last+1, editable.
- Persistence survives restarts (SQLite).
- Adding a future tool must NOT require touching invoice-tool code.

**Must NOT Have**
- No multi-user auth (single personal user).
- No cross-tool business-logic or data coupling (shared infrastructure singletons — DB, storage, shell — are permitted; tools must not import each other's domain code or read each other's DB tables).
- No editing of static seller/bank data through the UI in v1.
- No cloud dependency required to run locally.
- Live preview is a **nice-to-have only**, not a hard requirement.

---

## 4. Architecture

**Single Nuxt.js 3 app (full-stack via Nitro) + SQLite (Drizzle) + DOCX templating (docxtemplater) + LibreOffice headless PDF conversion.**

- **Framework:** Nuxt.js 3 — frontend (Vue 3) + backend (Nitro API routes) in one process. Zero monorepo overhead.
- **DB:** SQLite via Drizzle ORM (local-first, zero-config).
- **PDF pipeline:**
  1. Original `.docx` files stored in `assets/templates/` with `{{placeholder}}` tokens injected via one-time manual edit (see section 8 for run-merge requirements).
  2. `docxtemplater` fills placeholders at runtime.
  3. `soffice --headless --convert-to pdf` converts filled DOCX → PDF (serialized — see concurrency note below).
  4. PDF saved to `data/invoices/`, served for download.
- **Concurrency / profile-lock:** LibreOffice uses a user profile dir that can only be held by one process. All conversions are serialized via an in-process queue (or `--env:UserInstallation=file:///tmp/soffice-{uuid}` per invocation to isolate profiles). Since this is single-user and conversions are infrequent, either approach is fine.
- **Tool plugin contract:** future tool = a self-contained page + server-route module under `tools/<name>/`. Platform shell reads a static tool registry. Tools do not import each other's code.

**Why DOCX→LibreOffice over HTML→Chromium:** The DOCX files are the ground-truth layout the user already uses. Recreating them in HTML/CSS adds layout-drift risk and double-maintenance. LibreOffice rendering is an approximation of Word's, but verified empirically before code is written (see task 2.0 below).

**Why Nuxt.js:** User preference for a single framework on a personal tool. Simplicity over architectural purity.

---

## 5. Data Model

```sql
invoices
  id              text PRIMARY KEY  -- uuid
  template        text NOT NULL     -- 'OM' | 'PA'
  invoice_number  text NOT NULL UNIQUE  -- 'INV-00039' (shared counter)
  invoice_date    text NOT NULL     -- 'DD.MM.YYYY'
  period_start    text NOT NULL     -- 'DD.MM.YYYY'
  period_end      text NOT NULL     -- 'DD.MM.YYYY'
  hours           real NOT NULL     -- 88.00
  rate            real NOT NULL DEFAULT 28.00
  bonus_enabled   integer NOT NULL DEFAULT 0  -- 0|1
  bonus_amount    real NOT NULL DEFAULT 1000.00
  status          text NOT NULL DEFAULT 'draft'  -- 'draft' | 'issued'
  pdf_path        text              -- relative path; non-null only when status='issued' AND file verified non-empty
  created_at      text NOT NULL
  updated_at      text NOT NULL

-- Derived at render time (never stored as columns):
-- line_amount   = hours * rate
-- sub_total     = line_amount + (bonus_enabled ? bonus_amount : 0)
-- balance_due   = sub_total
```

**Invoice number sequence:** single shared counter across both templates. `next-number = MAX(invoice_number) + 1`. PA invoice in a monthly session gets the lower number (filled first), OM gets +1.

**`status = 'issued'`** is set only after the PDF file is confirmed to exist on disk and is non-zero bytes. If LibreOffice conversion fails, row stays `draft` and an error is returned.

---

## 6. UI / UX Flows

### Monthly invoice session (primary flow — PA first, then OM)

```
Launch → "New Month" → auto-fill: period (prev month), total hours (weekday count × 8)
  │
  ├─ Step 1: PA Invoice
  │    Auto-fill: invoiceNumber = last+1, date = today, period, hours = totalHours
  │    User edits: hours, optional bonus toggle + amount
  │    Read-only computed: Amount, Sub Total, Balance Due
  │    → "Generate PA PDF" → PDF downloaded + saved to history → proceed to step 2
  │
  └─ Step 2: OM Invoice
       Auto-fill: invoiceNumber = PA_number + 1, date = today, period
       Hours = (totalHours − paHours) [auto-prefilled, editable]
       → "Generate OM PDF" → PDF downloaded + saved to history
```

### Supporting flows
- **History:** table of past invoices (number, template, date, total, re-download). Sorted descending.
- **Platform launcher:** grid of tool cards (Invoice Generator in v1).
- **Preview (optional v2):** modal showing HTML render or PDF blob before final download.

---

## 7. Hours Auto-Calculation

```
prevMonth     = first day of current month − 1 day  → get year/month
weekdays      = count Mon–Fri in prevMonth (no public holiday adjustment — single user, manual override available)
totalHours    = weekdays × 8
```

Triggered on "New Month" session start. User may override the total hours freely before generating either invoice.

---

## 8. DOCX Placeholder Map + Run-Merge Requirements

### CRITICAL: Run-merge requirement

The DOCX files are Google Docs exports where text values are fragmented across multiple XML `<w:r>` runs (e.g. `INV-000` and `39` are separate runs; the invoice date is split into 6 runs). `docxtemplater` requires each `{{token}}` to exist as a single contiguous run.

**One-time manual edit procedure for each template:**
1. Open the `.docx` in LibreOffice Writer or Word.
2. For each target value: select and **delete** the entire existing value (do not edit in-place — editing can preserve run boundaries).
3. **Type** the `{{placeholder}}` token from scratch as a single keystroke sequence. This forces a new single run.
4. Save. Then verify in `word/document.xml` that the token appears as one contiguous `<w:t>` text node — no split across `<w:r>` boundaries.

**Post-edit verification (required before task 2 is marked done):**
- Programmatic check: open the edited `.docx`, extract all `<w:t>` text nodes, confirm each `{{token}}` from the table below appears as a complete token in a single node (no partial `{{` or `}}` spans).
- Zero residual unfilled `{{` or `}}` characters in the rendered output.

### Placeholder table

| Placeholder | Where | Output example |
|---|---|---|
| `{{invoiceNumber}}` | Invoice Number field | `INV-00039` |
| `{{invoiceDate}}` | Invoice Date field | `01.05.2026` |
| `{{balanceDue}}` | Header Balance Due | `€2464.00` |
| `{{periodDescription}}` | Embedded in description string | `for the period 01.04.2026-30.04.2026` |
| `{{hoursQty}}` | Qty column | `88.00 hrs` |
| `{{itemsTotal}}` | Items in Total row | `88,00` (comma, no suffix) |
| `{{lineAmount}}` | Amount column | `2464,00` |
| `{{subTotal}}` | Sub Total row | `€2464.00` (euro + dot, same as Balance Due) |
| `{{total}}` | Total row (OM: number only; suffix `(100% Omni Matrix)` stays static in DOCX) | `2464,00` |
| `{{bonusQty}}` | Bonus line Qty (conditional row) | `1` |
| `{{bonusRate}}` | Bonus line Rate | `1000,00` |
| `{{bonusAmount}}` | Bonus line Amount | `1000,00` |

**OM total suffix:** `(100% Omni Matrix)` sits in the same XML run as the total value. The `{{total}}` placeholder replaces only the numeric value; the suffix must be handled by restructuring that run into two parts: `{{total}} (100% Omni Matrix)` — or by using docxtemplater's raw-xml approach if run-structure prevents it.

**Bonus rows:** `docxtemplater` conditional logic (`{#bonusEnabled}...{/bonusEnabled}`) hides/shows the entire bonus table row. Bonus does NOT add to `{{hoursQty}}` or `{{itemsTotal}}`.

**Server-side formatters (TypeScript):**
```ts
const fmtHeader     = (n: number) => `€${n.toFixed(2)}`             // €2464.00  — Balance Due, Sub Total
const fmtTable      = (n: number) => n.toFixed(2).replace('.', ',')  // 2464,00   — Amount, Total, Rate
const fmtHours      = (n: number) => `${n.toFixed(2)} hrs`           // 88.00 hrs — Qty column
const fmtItemsTotal = (n: number) => n.toFixed(2).replace('.', ',')  // 88,00     — Items in Total row
```

---

## 9. API Design (Nuxt server routes)

```
GET  /api/invoices                  → list history (sorted desc)
GET  /api/invoices/next-number      → { next: "INV-00040" }  (single shared counter)
GET  /api/invoices/month-defaults   → { totalHours, periodStart, periodEnd }
POST /api/invoices/generate         → body: InvoiceInput → generates PDF, saves record
                                      returns { id, downloadUrl, filename }
GET  /api/invoices/:id/download     → serves PDF file
DELETE /api/invoices/:id            → remove record + PDF file
```

**Generate endpoint contract:**
1. Validate inputs (hours > 0, rate > 0, invoiceNumber unique).
2. Compute all derived amounts server-side.
3. Fill `docxtemplater` with all placeholders.
4. Convert via LibreOffice (serialized queue).
5. Verify output PDF exists and is non-zero bytes.
6. Set `status = 'issued'`, save `pdf_path`.
7. Return `{ downloadUrl }`. On any step failure: return error, leave record as `draft` or delete it.

---

## 10. Deployment

**Local-first.** `npm run dev` starts everything. SQLite at `data/db.sqlite` (git-ignored). PDFs at `data/invoices/` (git-ignored). DOCX templates at `assets/templates/` (git-tracked after placeholder edit).

**LibreOffice prerequisite (NOT pre-installed on this WSL2 host — must be installed first):**
```bash
sudo apt update && sudo apt install -y libreoffice
soffice --version  # verify: LibreOffice 7.x.x
```

**Optional:** Dockerfile with `FROM node:22` + `apt-get install -y libreoffice --no-install-recommends` for a pinned, reproducible build that avoids `apt upgrade` rendering drift.

---

## 11. Extensibility for Future Tools

- New tool = new folder under `tools/<name>/` with its own Vue pages + Nitro server routes.
- No invoice code is touched. Platform shell reads a static tool registry object.
- Shared infrastructure (DB singleton, file storage utility, shell layout components) lives in `utils/` — tools consume it but never import each other's domain code or access each other's DB tables.
- A new tool can ship with zero DB usage (opting out of the DB singleton is fine).

---

## 12. Task Flow

### Task 1 — Scaffold Nuxt.js app + shell

Set up Nuxt 3, Tailwind, Drizzle + SQLite, platform launcher page with tool registry card.

**Acceptance:**
- `npm run dev` boots without errors.
- Launcher page shows "Invoice Generator" card that routes to the invoice tool.
- `GET /api/health` returns `{ status: 'ok', db: 'connected', libreoffice: '<version string>' }`.
- **LibreOffice gate:** health endpoint calls `soffice --headless --convert-to pdf` on a trivial test DOCX and confirms non-zero output. If this fails, the endpoint reports the failure clearly (setup is blocked until resolved).

---

### Task 2.0 — LibreOffice fidelity spike (before writing any templating code)

Convert the two **untouched original** DOCX files to PDF using the installed LibreOffice version. User visually inspects both outputs against opening the DOCX directly.

**Acceptance:**
- Both PDFs open and show layout visually matching the DOCX (fonts, table structure, spacing).
- If layout diverges materially → evaluate whether to reconsider rendering approach before proceeding.
- Result documented (pass/fail + LibreOffice version) in `docs/fidelity-spike.md`.

---

### Task 2 — Prepare DOCX templates + implement PDF pipeline

1. Follow the run-merge procedure (section 8) to add all `{{placeholders}}` to both templates.
2. Programmatically verify token presence (no split tokens in `word/document.xml`).
3. Implement `docxtemplater` fill function with all formatters.
4. Implement `soffice` conversion with serialization (queue or unique profile dir).
5. Wire `POST /api/invoices/generate`.

**Acceptance:**
- Token-presence check passes: zero split `{{` / `}}` in both edited templates.
- `POST /api/invoices/generate` with `{ template: 'PA', hours: 88, rate: 28, invoiceNumber: 'INV-00038', invoiceDate: '01.05.2026', ... }` returns a downloadable PDF.
- PDF text content matches all five distinct value formats (verified by text extraction or visual inspection):
  - Balance Due header: `€2464.00`
  - Sub Total: `€2464.00`
  - Qty column: `88.00 hrs`
  - Items in Total: `88,00`
  - Amount / Total: `2464,00` · Rate: `28,00`
- Filename = `Invoice_PA_SWIFT_00038_SERHII_LIAMTSEV.pdf`.
- Unit tests: `fmtHeader(2464) === '€2464.00'`, `fmtTable(2464) === '2464,00'`, `fmtHours(88) === '88.00 hrs'`, `fmtItemsTotal(88) === '88,00'`.
- Bonus case: bonus row appears; Sub Total = `€3464.00`; Balance Due = `€3464.00`; `hoursQty` = `88.00 hrs`; `itemsTotal` = `88,00` (unchanged).

---

### Task 3 — Build the invoice form + monthly session flow

Two-step form (PA → OM), weekday auto-calculation, reactive remaining hours, bonus toggle.

**Acceptance:**
- "New Month" correctly calculates `totalHours` for the previous calendar month (tested: running in June 2026 → May 2026 = 21 weekdays × 8 = 168h; running in May 2026 → April 2026 = 22 weekdays × 8 = 176h).
- Step 1 (PA): invoice number auto-fills as `last+1`; changing PA hours live-updates the read-only computed amounts.
- Step 2 (OM): hours field pre-filled as `totalHours − paHours`; updates reactively when PA hours change.
- Bonus toggle adds `bonusAmount` to Sub Total / Total but not to hours display.
- Both PDFs generated, correct filenames, saved to history.

---

### Task 4 — Invoice history + re-download

List view with all issued invoices, re-download by ID.

**Acceptance:**
- After `npm restart`, all previously issued invoices visible with correct number/template/date/total.
- Re-download yields the same PDF (served from `pdf_path`).
- Records with `status = 'draft'` (failed generation) are not shown in history (or shown with error indicator).

---

### Task 5 (Optional) — Preview + packaging

Optional PDF-in-iframe preview before download. README. Optional Docker support.

**Acceptance:**
- Fresh clone → `npm i && sudo apt install libreoffice && npm run dev` → works end-to-end.
- Adding a second stub tool under `tools/demo/` appears in the launcher without touching invoice tool code.

---

## 13. Success Criteria

- User generates both PA and OM PDFs for a given month in under 2 minutes.
- PDFs pass fidelity check: all variable values correct and all static text preserved.
- Invoice numbers auto-increment on a single shared counter; history durable across restarts.
- A second stub tool appears in the launcher without modifying invoice code.

---

## 14. ADR (finalized pending Architect/Critic ratification)

**Decision:** Nuxt.js 3 (full-stack) + SQLite/Drizzle + DOCX placeholders (docxtemplater) + LibreOffice headless PDF.

**Drivers:**
1. Template fidelity — DOCX is the ground-truth layout; no re-creation risk.
2. Single-framework simplicity for a personal tool.
3. Local-first, zero cloud dependency.

**Alternatives considered:**
- HTML→Chromium (Option A): stronger reproducibility/version-pinning, but requires recreating layout from scratch → drift risk + double maintenance. Rejected.
- Cloud DOCX→PDF API: highest Word-fidelity, but adds network dependency. Rejected.
- Next.js: equivalent to Nuxt; user preference tips to Nuxt.

**Risks acknowledged:**
- LibreOffice rendering is an approximation of Word's — mitigated by empirical fidelity spike (task 2.0) before code is written.
- Rendering drift on `apt upgrade` — mitigated by optional Docker with pinned version.
- Profile-lock on concurrent conversions — mitigated by serialization queue.

**Open (user-resolved):**
- Invoice number sequence: **shared single counter** (confirmed).
- PA "Registration number: 17118728": **intentional, preserve** (confirmed).
- Bonus + "Items in Total": **bonus does NOT add to hours** (confirmed).
- PA description double-dot `01.10..2025`: **preserve as-is** (source artifact in the original template).
