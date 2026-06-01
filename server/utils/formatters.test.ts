import { describe, it, expect } from 'vitest'
import { fmtHeader, fmtTable, fmtHours, fmtItemsTotal } from './formatters'

describe('formatters', () => {
  it('fmtHeader', () => {
    expect(fmtHeader(2464)).toBe('€2464.00')
  })

  it('fmtTable', () => {
    expect(fmtTable(2464)).toBe('2464,00')
  })

  it('fmtHours', () => {
    expect(fmtHours(88)).toBe('88.00 hrs')
  })

  it('fmtItemsTotal', () => {
    expect(fmtItemsTotal(88)).toBe('88,00')
  })

})
