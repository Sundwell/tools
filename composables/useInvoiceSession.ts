import { ref, computed } from 'vue'

const fmtHeader = (n: number) => `€${n.toFixed(2)}`
const fmtTable = (n: number) => n.toFixed(2).replace('.', ',')

function todayDDMMYYYY(): string {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

export function useInvoiceSession() {
  const totalHours = ref(0)
  const periodStart = ref('')
  const periodEnd = ref('')
  const monthLabel = ref('')

  // PA step fields
  const paInvoiceNumber = ref('')
  const paInvoiceDate = ref(todayDDMMYYYY())
  const paHours = ref(0)
  const paRate = ref(28)

  // OM step fields
  const omInvoiceNumber = ref('')
  const omInvoiceDate = ref(todayDDMMYYYY())
  const omRate = ref(28)

  const omHours = computed(() => Math.max(0, totalHours.value - paHours.value))

  // PA computed amounts
  const paLineAmount = computed(() => paHours.value * paRate.value)
  const paBalanceDue = computed(() => paLineAmount.value)

  // OM computed amounts
  const omLineAmount = computed(() => omHours.value * omRate.value)
  const omBalanceDue = computed(() => omLineAmount.value)

  async function loadDefaults() {
    const [defaults, nextNum] = await Promise.all([
      $fetch<{ totalHours: number; periodStart: string; periodEnd: string }>(
        '/api/invoices/month-defaults'
      ),
      $fetch<{ nextNumber: string }>('/api/invoices/next-number'),
    ])

    totalHours.value = defaults.totalHours
    periodStart.value = defaults.periodStart
    periodEnd.value = defaults.periodEnd
    paHours.value = defaults.totalHours

    // Build month label from periodStart (DD.MM.YYYY)
    const parts = defaults.periodStart.split('.')
    if (parts.length === 3) {
      const d = new Date(Number(parts[2]), Number(parts[1]) - 1, 1)
      monthLabel.value = d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
    }

    paInvoiceNumber.value = nextNum.nextNumber
    // OM number is PA + 1
    const numMatch = nextNum.nextNumber.match(/(\d+)$/)
    if (numMatch) {
      const next = parseInt(numMatch[1], 10) + 1
      omInvoiceNumber.value = `INV-${String(next).padStart(5, '0')}`
    }
  }

  async function generatePA(): Promise<{ id: string; downloadUrl: string; filename: string }> {
    return $fetch('/api/invoices/generate', {
      method: 'POST',
      body: {
        template: 'PA',
        invoiceNumber: paInvoiceNumber.value,
        invoiceDate: paInvoiceDate.value,
        periodStart: periodStart.value,
        periodEnd: periodEnd.value,
        hours: paHours.value,
        rate: paRate.value,
      },
    })
  }

  async function generateOM(): Promise<{ id: string; downloadUrl: string; filename: string }> {
    return $fetch('/api/invoices/generate', {
      method: 'POST',
      body: {
        template: 'OM',
        invoiceNumber: omInvoiceNumber.value,
        invoiceDate: omInvoiceDate.value,
        periodStart: periodStart.value,
        periodEnd: periodEnd.value,
        hours: omHours.value,
        rate: omRate.value,
      },
    })
  }

  return {
    totalHours, periodStart, periodEnd, monthLabel,
    paInvoiceNumber, paInvoiceDate, paHours, paRate,
    omInvoiceNumber, omInvoiceDate, omHours, omRate,
    paLineAmount, paBalanceDue,
    omLineAmount, omBalanceDue,
    fmtHeader, fmtTable,
    loadDefaults, generatePA, generateOM,
  }
}
