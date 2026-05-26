import { describe, it, expect } from 'vitest'
import {
  formatEventTime,
  formatEventTimeRange,
  getEventDateStr,
  isTokenExpired,
} from './calendarUtils'

// 2026-05-26 09:00 CDT = 14:00 UTC  (Chicago is UTC-5 in summer/CDT)
const UTC_9AM  = '2026-05-26T14:00:00Z'
const UTC_10AM = '2026-05-26T15:00:00Z'
const CHICAGO  = 'America/Chicago'

describe('formatEventTime', () => {
  it('converts UTC ISO to local time string', () => {
    expect(formatEventTime(UTC_9AM, CHICAGO)).toBe('9:00 AM')
  })
})

describe('formatEventTimeRange', () => {
  it('produces a start–end range with timezone abbreviation', () => {
    const result = formatEventTimeRange(UTC_9AM, UTC_10AM, CHICAGO)
    // CDT in May, CT in winter — accept either
    expect(result).toMatch(/^9:00 AM – 10:00 AM \(C[DS]T\)$/)
  })
})

describe('getEventDateStr', () => {
  it('returns YYYY-MM-DD in the given timezone', () => {
    expect(getEventDateStr(UTC_9AM, CHICAGO)).toBe('2026-05-26')
  })

  it('uses the timezone to determine the date, not UTC', () => {
    // 2026-05-27T03:00:00Z = 2026-05-26T22:00:00 CDT → date is May 26 in Chicago
    expect(getEventDateStr('2026-05-27T03:00:00Z', CHICAGO)).toBe('2026-05-26')
  })
})

describe('isTokenExpired', () => {
  it('returns true for a past timestamp', () => {
    expect(isTokenExpired('2020-01-01T00:00:00Z')).toBe(true)
  })

  it('returns false for a future timestamp', () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    expect(isTokenExpired(future)).toBe(false)
  })
})
