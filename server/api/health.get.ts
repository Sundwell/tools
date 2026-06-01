import { execSync } from 'node:child_process'
import { sqlite } from '~/db/index'

export default defineEventHandler(async () => {
  let dbStatus = 'ok'
  try {
    sqlite.prepare('SELECT 1').get()
  } catch {
    dbStatus = 'error'
  }

  let libreoffice = 'NOT INSTALLED'
  try {
    const out = execSync('soffice --version', { timeout: 5000 }).toString().trim()
    libreoffice = out || 'ok'
  } catch {
    libreoffice = 'NOT INSTALLED'
  }

  return {
    status: dbStatus === 'ok' ? 'ok' : 'degraded',
    db: dbStatus,
    libreoffice,
  }
})
