import { db } from '~/db/index'
import { invoices } from '~/db/schema'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const rows = db
    .select()
    .from(invoices)
    .where(eq(invoices.status, 'issued'))
    .orderBy(desc(invoices.created_at))
    .all()

  return rows.map((r) => ({
    id: r.id,
    template: r.template,
    invoiceNumber: r.invoice_number,
    invoiceDate: r.invoice_date,
    periodStart: r.period_start,
    periodEnd: r.period_end,
    hours: r.hours,
    rate: r.rate,
    status: r.status,
    pdfPath: r.pdf_path,
    createdAt: r.created_at,
  }))
})
