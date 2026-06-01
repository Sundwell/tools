import { execSync } from 'node:child_process'
import { writeFileSync, readFileSync, unlinkSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'

export function convertDocxToPdf(docxBuffer: Buffer): Buffer {
  const id = randomUUID()
  const tmpDir = join(tmpdir(), `soffice-${id}`)
  mkdirSync(tmpDir, { recursive: true })

  const docxPath = join(tmpDir, 'input.docx')
  const pdfPath = join(tmpDir, 'input.pdf')
  const userInstall = `file://${join(tmpdir(), `soffice-profile-${id}`)}`

  try {
    writeFileSync(docxPath, docxBuffer)

    execSync(
      `soffice --headless -env:UserInstallation=${userInstall} --convert-to pdf --outdir "${tmpDir}" "${docxPath}"`,
      { timeout: 30000 }
    )

    const pdfBuffer = readFileSync(pdfPath)
    if (pdfBuffer.length === 0) {
      throw new Error('PDF conversion produced empty file')
    }
    return pdfBuffer
  } finally {
    try { rmSync(tmpDir, { recursive: true, force: true }) } catch {}
  }
}
