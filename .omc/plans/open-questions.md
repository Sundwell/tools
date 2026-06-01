# Open Questions

## Personal Invoice Generator (Toolbox v1) - 2026-06-01
- [ ] PDF engine: headless Chromium (Playwright) vs a lighter lib (pdfmake/react-pdf)? — Chromium gives exact layout + free preview but is a heavy dep; affects deploy size.
- [ ] DB choice: SQLite (local-first, zero-config) vs Postgres (future multi-host)? — Drives ORM config and deploy story.
- [ ] Is hosted deployment ever needed, or strictly local-only? — Changes whether we build the optional Docker/VPS path now.
- [ ] Should static seller/bank data be UI-editable or config-only in v1? — Plan assumes config/seed (Must NOT edit via UI).
- [ ] Confirm filename extension switches .docx -> .pdf while keeping the rest of the convention. — Affects render output naming.
- [ ] Are OM/PA the only templates ever, or should template definitions be data-driven/extensible too? — Impacts whether Template is seed-config or full CRUD.
- [ ] Bonus line exact placement and whether it affects "Items in Total" hours count or only Amount. — Affects total computation rules.
