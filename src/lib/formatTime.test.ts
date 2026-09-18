import { describe, expect, it } from 'vitest'
import { formatTime } from './formatTime.ts'

describe('formatTime', () => {
  it.each([
    [0, '0:00'],
    [999, '0:00'],
    [1_000, '0:01'],
    [59_999, '0:59'],
    [75_000, '1:15'],
    [600_000, '10:00'],
    [-5_000, '0:00'],
  ])('formats %i ms as %s', (ms, text) => {
    expect(formatTime(ms)).toBe(text)
  })
})
