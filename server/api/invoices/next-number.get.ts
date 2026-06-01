import { db } from '~/db/index'
import { invoices } from '~/db/schema'
import { desc } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const last = db
    .select({ invoice_number: invoices.invoice_number })
    .from(invoices)
    .orderBy(desc(invoices.invoice_number))
    .limit(1)
    .get()

  let nextNum = 1
  if (last) {
    const match = last.invoice_number.match(/(\d+)$/)
    if (match) {
      nextNum = parseInt(match[1], 10) + 1
    }
  }

  const padded = String(nextNum).padStart(5, '0')
  return { nextNumber: `INV-${padded}` }
})
