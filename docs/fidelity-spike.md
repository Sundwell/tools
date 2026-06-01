# LibreOffice Fidelity Spike

## Environment

- **LibreOffice version**: 24.2.7.2 420 (Build:2)
- **Platform**: Linux (WSL2)
- **Date**: 2026-06-01

## Conversion Results

| Source DOCX | Output PDF | Size | Result |
|---|---|---|---|
| Invoice_OM_SWIFT_00039_SERHII_LIAMTSEV.docx (9.5K) | Invoice_OM_SWIFT_00039_SERHII_LIAMTSEV.pdf | 42.2K | PASS |
| Invoice_PA_SWIFT_00038_SERHII_LIAMTSEV.docx (9.6K) | Invoice_PA_SWIFT_00038_SERHII_LIAMTSEV.pdf | 41.2K | PASS |

Both PDFs are located in `data/fidelity-spike/`.

## Verdict: PASS

LibreOffice successfully converts both DOCX invoice templates to PDF using the `writer_pdf_Export` filter. Both output files are non-zero bytes (~41-42K each, expanded from ~9.5K source DOCX).

## Observations

- Conversion is headless (`--headless` flag) with no display required — suitable for server-side use.
- The `writer_pdf_Export` filter is the standard LibreOffice Writer PDF exporter and preserves layout faithfully for simple document structures like these invoices.
- PDFs are roughly 4-5x larger than the source DOCX, which is normal (embedded fonts, rasterized elements).
- No errors or warnings were emitted during conversion.
- Conversion is sequential (soffice cannot run two instances simultaneously); each file takes ~1-2 seconds.

## Command Used

```bash
soffice --headless --convert-to pdf --outdir data/fidelity-spike/ Invoice_OM_SWIFT_00039_SERHII_LIAMTSEV.docx
soffice --headless --convert-to pdf --outdir data/fidelity-spike/ Invoice_PA_SWIFT_00038_SERHII_LIAMTSEV.docx
```
