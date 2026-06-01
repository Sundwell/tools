import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { db } from '~/db/index'
import { invoices } from '~/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const invoice = db.select().from(invoices).where(eq(invoices.id, id)).get()
  if (!invoice) {
    throw createError({ statusCode: 404, message: 'Invoice not found' })
  }
  if (!invoice.pdf_path) {
    throw createError({ statusCode: 404, message: 'PDF not found' })
  }

  const pdfBuffer = readFileSync(invoice.pdf_path)
  const filename = basename(invoice.pdf_path)

  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
  return pdfBuffer
})
