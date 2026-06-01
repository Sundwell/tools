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

export type InvoiceStatus = 'idle' | 'generating' | 'done' | 'error'

export function useInvoiceSession() {
  const selectedMonth = ref('')
  const totalHours = ref(0)
  const weekdays = ref(0)
  const periodStart = ref('')
  const periodEnd = ref('')

  const monthLabel = computed(() => {
    if (!selectedMonth.value) return ''
    const [y, m] = selectedMonth.value.split('-').map(Number)
    const d = new Date(y, m - 1, 1)
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
  })

  // PA fields
  const paInvoiceNumber = ref('')
  const paInvoiceDate = ref(todayDDMMYYYY())
  const _paHours = ref(0)
  const paRate = ref(28)
  const paStatus = ref<InvoiceStatus>('idle')
  const paError = ref('')

  // OM fields
  const omInvoiceNumber = ref('')
  const omInvoiceDate = ref(todayDDMMYYYY())
  const omRate = ref(28)
  const omStatus = ref<InvoiceStatus>('idle')
  const omError = ref('')

  // Editing either side keeps them summing to totalHours
  const paHours = computed({
    get: () => _paHours.value,
    set: (v: number) => { _paHours.value = Math.max(0, Math.min(v, totalHours.value)) },
  })
  const omHours = computed({
    get: () => Math.max(0, totalHours.value - _paHours.value),
    set: (v: number) => { _paHours.value = Math.max(0, totalHours.value - Math.max(0, Math.min(v, totalHours.value))) },
  })

  const paLineAmount = computed(() => paHours.value * paRate.value)
  const paBalanceDue = computed(() => paLineAmount.value)
  const omLineAmount = computed(() => omHours.value * omRate.value)
  const omBalanceDue = computed(() => omLineAmount.value)

  async function loadDefaults() {
    const now = new Date()
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
    selectedMonth.value = prevMonth

    const [defaults, nextNum] = await Promise.all([
      $fetch<{ totalHours: number; weekdays: number; periodStart: string; periodEnd: string }>(
        `/api/invoices/month-defaults?month=${prevMonth}`
      ),
      $fetch<{ nextNumber: string }>('/api/invoices/next-number'),
    ])

    totalHours.value = defaults.totalHours
    weekdays.value = defaults.weekdays
    periodStart.value = defaults.periodStart
    periodEnd.value = defaults.periodEnd
    _paHours.value = defaults.totalHours

    paInvoiceNumber.value = nextNum.nextNumber
    const numMatch = nextNum.nextNumber.match(/(\d+)$/)
    if (numMatch) {
      const next = parseInt(numMatch[1], 10) + 1
      omInvoiceNumber.value = `INV-${String(next).padStart(5, '0')}`
    }
  }

  async function loadMonth(month: string) {
    selectedMonth.value = month
    const defaults = await $fetch<{ totalHours: number; weekdays: number; periodStart: string; periodEnd: string }>(
      `/api/invoices/month-defaults?month=${month}`
    )
    totalHours.value = defaults.totalHours
    weekdays.value = defaults.weekdays
    periodStart.value = defaults.periodStart
    periodEnd.value = defaults.periodEnd
    _paHours.value = defaults.totalHours
  }

  async function generatePA(): Promise<{ id: string; downloadUrl: string; filename: string }> {
    paStatus.value = 'generating'
    paError.value = ''
    try {
      const result = await $fetch<{ id: string; downloadUrl: string; filename: string }>(
        '/api/invoices/generate',
        {
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
        }
      )
      paStatus.value = 'done'
      return result
    } catch (e: any) {
      paStatus.value = 'error'
      paError.value = e?.data?.message || e?.message || 'Failed to generate PA invoice'
      throw e
    }
  }

  async function generateOM(): Promise<{ id: string; downloadUrl: string; filename: string }> {
    omStatus.value = 'generating'
    omError.value = ''
    try {
      const result = await $fetch<{ id: string; downloadUrl: string; filename: string }>(
        '/api/invoices/generate',
        {
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
        }
      )
      omStatus.value = 'done'
      return result
    } catch (e: any) {
      omStatus.value = 'error'
      omError.value = e?.data?.message || e?.message || 'Failed to generate OM invoice'
      throw e
    }
  }

  return {
    selectedMonth, totalHours, weekdays, periodStart, periodEnd, monthLabel,
    paInvoiceNumber, paInvoiceDate, paHours, paRate,
    paStatus, paError,
    omInvoiceNumber, omInvoiceDate, omHours, omRate,
    omStatus, omError,
    paLineAmount, paBalanceDue,
    omLineAmount, omBalanceDue,
    fmtHeader, fmtTable,
    loadDefaults, loadMonth, generatePA, generateOM,
  }
}
