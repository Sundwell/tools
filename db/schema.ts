import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core'

export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey(),
  template: text('template').notNull(),
  invoice_number: text('invoice_number').notNull().unique(),
  invoice_date: text('invoice_date').notNull(),
  period_start: text('period_start').notNull(),
  period_end: text('period_end').notNull(),
  hours: real('hours').notNull(),
  rate: real('rate').notNull().default(28.0),
  status: text('status').notNull().default('draft'),
  pdf_path: text('pdf_path'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
})
