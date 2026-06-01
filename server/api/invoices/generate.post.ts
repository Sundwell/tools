import { randomUUID } from 'node:crypto'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { db } from '~/db/index'
import { invoices } from '~/db/schema'
import { renderInvoice } from '~/server/utils/invoice-renderer'
import { convertDocxToPdf } from '~/server/utils/pdf-converter'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const {
    template,
    invoiceNumber,
    invoiceDate,
    periodStart,
    periodEnd,
    hours,
    rate,
  } = body

  if (!template || !invoiceNumber || !invoiceDate || !periodStart || !periodEnd || hours == null || rate == null) {
    throw createError({ statusCode: 400, message: 'Missing required fields' })
  }
  if (template !== 'OM' && template !== 'PA') {
    throw createError({ statusCode: 400, message: 'template must be OM or PA' })
  }

  // Check uniqueness
  const existing = db.select().from(invoices).where(eq(invoices.invoice_number, invoiceNumber)).get()
  if (existing) {
    throw createError({ statusCode: 409, message: `Invoice number ${invoiceNumber} already exists` })
  }

  // Render DOCX
  const docxBuffer = renderInvoice({
    template,
    invoiceNumber,
    invoiceDate,
    periodStart,
    periodEnd,
    hours: Number(hours),
    rate: Number(rate),
  })

  // Convert to PDF
  const pdfBuffer = convertDocxToPdf(docxBuffer)
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw createError({ statusCode: 500, message: 'PDF conversion failed' })
  }

  // Save PDF
  const invoicesDir = resolve(process.cwd(), 'data/invoices')
  mkdirSync(invoicesDir, { recursive: true })
  const filename = `Invoice_${template}_SWIFT_${invoiceNumber.replace('INV-', '')}_SERHII_LIAMTSEV.pdf`
  const pdfPath = resolve(invoicesDir, filename)
  writeFileSync(pdfPath, pdfBuffer)

  // Insert DB row
  const id = randomUUID()
  const now = new Date().toISOString()
  db.insert(invoices).values({
    id,
    template,
    invoice_number: invoiceNumber,
    invoice_date: invoiceDate,
    period_start: periodStart,
    period_end: periodEnd,
    hours: Number(hours),
    rate: Number(rate),
    status: 'issued',
    pdf_path: pdfPath,
    created_at: now,
    updated_at: now,
  }).run()

  return {
    id,
    downloadUrl: `/api/invoices/${id}/download`,
    filename,
  }
})
