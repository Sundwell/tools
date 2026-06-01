# TODO

## Custom line items / extra rows

Allow adding extra rows to an invoice beyond the main work hours row.

**Design decisions for v2:**
- The first (work hours) row is always auto-generated from hours × rate — not customizable
- Extra rows are user-defined: description, qty, rate → amount auto-calculated
- Extra rows do NOT add to the "Items in Total" hours counter
- Starting point: one extra row type ("bonus/appreciation"), but the UI should support N rows
- Future: maybe per-row checkboxes to include/exclude from totals, per-row "count in hours" flag

**Implementation notes:**
- Requires modifying `scripts/patch-templates.mjs` to insert a conditional/looping `<w:tr>` block into the DOCX XML using docxtemplater loop syntax (`{#extraRows}...{/extraRows}`)
- The bonus row XML structure must match the existing work-row column widths/styles
- DB schema: add an `extra_rows` JSON column (or a separate `invoice_rows` table) to store the extra row data
- API: accept `extraRows: Array<{ description: string, qty: number, rate: number }>` in the generate endpoint