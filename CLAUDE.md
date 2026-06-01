# Invoice Generator — Project Context

Personal toolbox platform. Invoice generator is the first tool. Future tools live under `tools/<name>/` and are fully independent.

## Stack

Nuxt.js 4 (4.4.6, full-stack) · Vue 3 · Tailwind CSS v4 · Drizzle ORM · SQLite (`data/db.sqlite`) · docxtemplater · LibreOffice headless PDF

## Running

```bash
npm run dev        # dev server on port 3000
npm test           # vitest (formatter unit tests)
```

LibreOffice must be installed: `sudo apt install libreoffice`

## Key files

| File | Purpose |
|---|---|
| `scripts/patch-templates.mjs` | One-time script — injects `{{placeholders}}` into DOCX source files → `assets/templates/` |
| `server/utils/invoice-renderer.ts` | Fills DOCX templates with docxtemplater |
| `server/utils/pdf-converter.ts` | `soffice --headless` conversion, unique `UserInstallation` per call |
| `server/utils/formatters.ts` | 4 number formatters (see below) |
| `server/api/invoices/generate.post.ts` | Main generate endpoint |
| `composables/useInvoiceSession.ts` | PA→OM session state, reactive hours, computed totals |
| `db/schema.ts` | Drizzle schema — invoices table |

## Number formats (server-authoritative)

| Cell | Format | Example |
|---|---|---|
| Balance Due header, Sub Total | `fmtHeader` | `€2464.00` |
| Amount, Total, Rate | `fmtTable` | `2464,00` |
| Qty column | `fmtHours` | `88.00 hrs` |
| Items in Total row | `fmtItemsTotal` | `88,00` |

No thousands separator anywhere.

## Invoice flow

PA fills first (full hours) → OM fills second (remaining = totalHours − paHours).
Single shared invoice number counter. PA typically gets even numbers, OM odd.

## DOCX templates

Source files are Google Docs exports with fragmented XML runs — fragile. `patch-templates.mjs` handles run-merging programmatically. Patched templates live in `assets/templates/`. Never edit the originals.

## TODO

See `docs/todo.md` for planned features, including the custom extra rows / bonus system.
