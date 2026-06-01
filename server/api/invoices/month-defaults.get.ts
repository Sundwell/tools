export default defineEventHandler(async () => {
  const now = new Date()
  // Previous month
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const month = now.getMonth() === 0 ? 12 : now.getMonth() // 1-indexed

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
    periodStart: fmt(firstDay),
    periodEnd: fmt(lastDay),
  }
})
