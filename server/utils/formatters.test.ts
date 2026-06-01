import { describe, it, expect } from 'vitest'
import { fmtHeader, fmtTable, fmtHours, fmtItemsTotal } from './formatters'

describe('fmtHeader', () => {
  it('formats with euro sign and 2 decimals', () => {
    expect(fmtHeader(2464)).toBe('€2464.00')
    expect(fmtHeader(0)).toBe('€0.00')
    expect(fmtHeader(100.5)).toBe('€100.50')
  })
})

describe('fmtTable', () => {
  it('formats with comma decimal separator', () => {
    expect(fmtTable(2464)).toBe('2464,00')
    expect(fmtTable(0)).toBe('0,00')
    expect(fmtTable(28)).toBe('28,00')
  })
})

describe('fmtHours', () => {
  it('formats with hrs suffix', () => {
    expect(fmtHours(88)).toBe('88.00 hrs')
    expect(fmtHours(0)).toBe('0.00 hrs')
    expect(fmtHours(8.5)).toBe('8.50 hrs')
  })
})

describe('fmtItemsTotal', () => {
  it('formats with comma decimal separator', () => {
    expect(fmtItemsTotal(88)).toBe('88,00')
    expect(fmtItemsTotal(0)).toBe('0,00')
  })
})
