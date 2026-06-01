export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const monthParam = query.month as string | undefined // YYYY-MM

  let year: number, month: number
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split('-').map(Number)
    year = y
    month = m // 1-indexed
  } else {
    const now = new Date()
    year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    month = now.getMonth() === 0 ? 12 : now.getMonth() // 1-indexed
  }

  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)

  // Count weekdays
  let weekdays = 0
  const d = new Date(firstDay)
  while (d <= lastDay) {
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) weekdays++
    d.setDate(d.getDate() + 1)
  }

  const fmt = (date: Date) => {
    const dd = String(date.getDate()).padStart(2, '0')
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const yyyy = date.getFullYear()
    return `${dd}.${mm}.${yyyy}`
  }

  return {
    totalHours: weekdays * 8,
    weekdays,
    periodStart: fmt(firstDay),
    periodEnd: fmt(lastDay),
  }
})
