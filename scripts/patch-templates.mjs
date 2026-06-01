/**
 * Patches DOCX templates by merging fragmented XML runs into single {{token}} placeholders.
 * Run with: node scripts/patch-templates.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import PizZip from 'pizzip'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const sources = [
  {
    src: resolve(root, 'Invoice_PA_SWIFT_00038_SERHII_LIAMTSEV.docx'),
    dst: resolve(root, 'assets/templates/Invoice_PA_template.docx'),
    templateType: 'PA',
  },
  {
    src: resolve(root, 'Invoice_OM_SWIFT_00039_SERHII_LIAMTSEV.docx'),
    dst: resolve(root, 'assets/templates/Invoice_OM_template.docx'),
    templateType: 'OM',
  },
]

mkdirSync(resolve(root, 'assets/templates'), { recursive: true })

for (const { src, dst, templateType } of sources) {
  console.log(`\nPatching ${templateType} template...`)
  const buf = readFileSync(src)
  const zip = new PizZip(buf)
  let xml = zip.file('word/document.xml').asText()

  // ── 1. Merge invoice number: two consecutive runs ──────────────────────────
  // Run 1 text: "   Invoice Number:                           INV-000"
  // Run 2 text: "38" or "39"
  // Replace run1 text to hold the placeholder, remove run2 entirely.
  xml = xml.replace(
    /(<w:t[^>]*>)([ \t]*Invoice Number:[ \t]*INV-000)(<\/w:t>)([\s\S]*?<\/w:r>)([\s\S]*?<w:r\b[^>]*>[\s\S]*?<w:t[^>]*>)\d+(<\/w:t>[\s\S]*?<\/w:r>)/,
    (m, tOpen, label, tClose, restOfRun1, run2Open, run2Close) => {
      const labelFixed = label.replace(/INV-000$/, '{{invoiceNumber}}')
      return `${tOpen}${labelFixed}${tClose}${restOfRun1}`
    }
  )

  // ── 2. Merge invoice date runs ─────────────────────────────────────────────
  // From analysis: paragraph has runs with text: "Invoice Date:0", "1", ".", "05", ".202", "6"
  // (the tab element is inside the first run before/after the text node)
  // Strategy: find the paragraph, fix it inline.
  xml = mergeInvoiceDateRuns(xml)

  // ── 3. Single-run value replacements ──────────────────────────────────────
  // balanceDue: first €2464.00 occurrence
  xml = xml.replace(/(<w:t[^>]*>)€2464\.00(<\/w:t>)/, '$1{{balanceDue}}$2')

  // periodDescription — PA
  xml = xml.replace(
    /(<w:t[^>]*>)(Custom software development as per Agreement from 01\.10\.\.[0-9]+ for the period )01\.04\.2026-30\.04\.2026(<\/w:t>)/,
    '$1$2{{periodDescription}}$3'
  )
  // periodDescription — OM
  xml = xml.replace(
    /(<w:t[^>]*>)(Custom software development as per annex dated [0-9.]+ to the contractor Agreement from [0-9.]+ for the period )01\.04\.2026-30\.04\.2026( - Omni Matrix<\/w:t>)/,
    '$1$2{{periodDescription}}$3'
  )

  // hoursQty
  xml = xml.replace(/(<w:t[^>]*>)88\.00 hrs(<\/w:t>)/, '$1{{hoursQty}}$2')

  // rate (28,00)
  xml = xml.replace(/(<w:t[^>]*>)28,00(<\/w:t>)/, '$1{{rate}}$2')

  // lineAmount (first 2464,00)
  xml = xml.replace(/(<w:t[^>]*>)2464,00(<\/w:t>)/, '$1{{lineAmount}}$2')

  // itemsTotal (88,00 — may have trailing space)
  xml = xml.replace(/(<w:t[^>]*>)88,00\s*(<\/w:t>)/, '$1{{itemsTotal}}$2')

  // subTotal (second €2464.00)
  xml = xml.replace(/(<w:t[^>]*>)€2464\.00(<\/w:t>)/, '$1{{subTotal}}$2')

  // total — OM keeps "(100% Omni Matrix)" suffix, PA is plain
  if (templateType === 'OM') {
    xml = xml.replace(
      /(<w:t[^>]*>)2464,00( \(100% Omni Matrix\)<\/w:t>)/,
      '$1{{total}}$2'
    )
  } else {
    xml = xml.replace(/(<w:t[^>]*>)2464,00(<\/w:t>)/, '$1{{total}}$2')
  }

  // ── 4. Save ───────────────────────────────────────────────────────────────
  zip.file('word/document.xml', xml)
  const out = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' })
  writeFileSync(dst, out)
  console.log(`  Written: ${dst}`)

  // ── 5. Verify all tokens present ─────────────────────────────────────────
  const tokens = [
    '{{invoiceNumber}}', '{{invoiceDate}}', '{{balanceDue}}',
    '{{periodDescription}}', '{{hoursQty}}', '{{lineAmount}}',
    '{{itemsTotal}}', '{{subTotal}}', '{{rate}}', '{{total}}',
  ]
  let allOk = true
  for (const token of tokens) {
    if (xml.includes(token)) {
      console.log(`  OK  ${token}`)
    } else {
      console.error(`  MISSING  ${token}`)
      allOk = false
    }
  }
  if (!allOk) process.exit(1)
}

console.log('\nAll templates patched successfully.')

/**
 * Merges the 6 fragmented invoice-date runs in the paragraph containing "Invoice Date:".
 */
function mergeInvoiceDateRuns(xml) {
  // Locate the paragraph that contains "Invoice Date:"
  const invDateIdx = xml.indexOf('Invoice Date:')
  if (invDateIdx === -1) return xml

  const paraStart = xml.lastIndexOf('<w:p ', invDateIdx)
  const paraEnd = xml.indexOf('</w:p>', invDateIdx) + '</w:p>'.length
  const para = xml.slice(paraStart, paraEnd)

  // Find the first run that contains "Invoice Date:" text
  // Its <w:t> may be: "Invoice Date:0" (the "0" is the start of the date leaked in)
  const firstRunMatch = para.match(/<w:r\b[^>]*>[\s\S]*?<w:t[^>]*>[\s\S]*?Invoice Date:[\s\S]*?<\/w:t>[\s\S]*?<\/w:r>/)
  if (!firstRunMatch) return xml

  const firstRun = firstRunMatch[0]
  const firstRunIdx = para.indexOf(firstRun)

  // Extract rPr from the first run for reuse
  const rPrMatch = firstRun.match(/<w:rPr>[\s\S]*?<\/w:rPr>/)
  const rPr = rPrMatch ? rPrMatch[0] : ''

  // Fix the first run: strip any trailing date chars from the <w:t> (the "0")
  // and keep the tab element intact.
  // The first run may have TWO <w:t> nodes: "Invoice Date:" and "0" (after the tab).
  // Remove the second <w:t> node entirely and strip any digits from the first.
  let fixedFirstRun = firstRun.replace(
    /(<w:t[^>]*>)([\s\S]*?Invoice Date:)\d*(<\/w:t>)/,
    '$1$2$3'
  )
  // Remove any remaining <w:t> nodes that are just date digit fragments (after the label)
  fixedFirstRun = fixedFirstRun.replace(
    /(<w:tab\/>[\s\S]*?)<w:t[^>]*>\d+<\/w:t>/,
    '$1'
  )

  // Build a new run with the date placeholder
  const dateRun = `<w:r w:rsidDel="00000000" w:rsidR="00000000" w:rsidRPr="00000000">${rPr}<w:t xml:space="preserve">{{invoiceDate}}</w:t></w:r>`

  // Remove the 5 following tiny fragment runs: "1", ".", "05", ".202", "6"
  const fragTexts = ['1', '.', '05', '.202', '6']
  let tail = para.slice(firstRunIdx + firstRun.length)

  for (const frag of fragTexts) {
    // Match a run whose w:t content is exactly this fragment
    const escaped = frag.replace(/\./g, '\\.')
    const pattern = new RegExp(
      `^\\s*<w:r\\b[^>]*>[\\s\\S]*?<w:t[^>]*>${escaped}<\\/w:t>[\\s\\S]*?<\\/w:r>`
    )
    const m = tail.match(pattern)
    if (m) {
      tail = tail.slice(m[0].length)
    }
  }

  const newPara = para.slice(0, firstRunIdx) + fixedFirstRun + dateRun + tail
  return xml.slice(0, paraStart) + newPara + xml.slice(paraEnd)
}
