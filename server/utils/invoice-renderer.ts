import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { fmtHeader, fmtTable, fmtHours, fmtItemsTotal } from './formatters'

export interface InvoiceData {
  template: 'OM' | 'PA'
  invoiceNumber: string
  invoiceDate: string
  periodStart: string
  periodEnd: string
  hours: number
  rate: number
}

export function renderInvoice(data: InvoiceData): Buffer {
  const templatePath = resolve(
    process.cwd(),
    `assets/templates/Invoice_${data.template}_template.docx`
  )
  const content = readFileSync(templatePath)
  const zip = new PizZip(content)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' },
  })

  const lineTotal = data.hours * data.rate
  const periodDescription = `${data.periodStart}-${data.periodEnd}`

  const tags: Record<string, string> = {
    invoiceNumber: data.invoiceNumber,
    invoiceDate: data.invoiceDate,
    balanceDue: fmtHeader(lineTotal),
    periodDescription,
    hoursQty: fmtHours(data.hours),
    rate: fmtTable(data.rate),
    lineAmount: fmtTable(lineTotal),
    itemsTotal: fmtItemsTotal(data.hours),
    subTotal: fmtHeader(lineTotal),
    total: fmtTable(lineTotal),
  }

  doc.render(tags)

  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' }) as Buffer
}
