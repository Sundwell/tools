import { unlinkSync, existsSync } from 'node:fs'
import { db } from '~/db/index'
import { invoices } from '~/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const invoice = db.select().from(invoices).where(eq(invoices.id, id)).get()
  if (!invoice) {
    throw createError({ statusCode: 404, message: 'Invoice not found' })
  }

  if (invoice.pdf_path && existsSync(invoice.pdf_path)) {
    unlinkSync(invoice.pdf_path)
  }

  db.delete(invoices).where(eq(invoices.id, id)).run()

  return { success: true }
})
