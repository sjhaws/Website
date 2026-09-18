import { describe, expect, it } from 'vitest'
import {
  bands,
  formatOhms,
  isCorrect,
  parseOhms,
  parseTolerance,
  randomResistor,
  resistance,
  type Resistor,
} from './resistor.ts'

describe('resistance', () => {
  it('is two digits followed by the multiplier in zeros, for every combination', () => {
    for (let first = 1; first <= 9; first++) {
      for (let second = 0; second <= 9; second++) {
        for (let multiplier = 0; multiplier <= 9; multiplier++) {
          const r: Resistor = { first, second, multiplier, tolerance: 'gold' }
          expect(resistance(r)).toBe(
            Number(`${first}${second}${'0'.repeat(multiplier)}`),
          )
        }
      }
    }
  })

  it('covers 10 Ω to 99 GΩ', () => {
    expect(
      resistance({ first: 1, second: 0, multiplier: 0, tolerance: 'gold' }),
    ).toBe(10)
    expect(
      resistance({ first: 9, second: 9, multiplier: 9, tolerance: 'gold' }),
    ).toBe(99_000_000_000)
  })
})

describe('bands', () => {
  it('uses the standard color code', () => {
    expect(
      bands({ first: 4, second: 7, multiplier: 2, tolerance: 'gold' }),
    ).toEqual(['yellow', 'violet', 'red', 'gold'])
    expect(
      bands({ first: 1, second: 0, multiplier: 9, tolerance: 'silver' }),
    ).toEqual(['brown', 'black', 'white', 'silver'])
  })
})

describe('randomResistor', () => {
  it('stays within the band ranges at both ends of the random range', () => {
    expect(randomResistor(() => 0)).toEqual({
      first: 1,
      second: 0,
      multiplier: 0,
      tolerance: 'gold',
    })
    expect(randomResistor(() => 0.9999)).toEqual({
      first: 9,
      second: 9,
      multiplier: 9,
      tolerance: 'silver',
    })
  })
})

describe('parseOhms', () => {
  it.each([
    ['4700', 4700],
    ['04700', 4700],
    ['4,700', 4700],
    ['4.7k', 4700],
    ['4.7K', 4700],
    ['4k7', 4700],
    ['4K7', 4700],
    ['4.7 kohm', 4700],
    ['4700Ω', 4700],
    ['4700 ohms', 4700],
    [' 4.7k ', 4700],
    ['2.2M', 2_200_000],
    ['2.2m', 2_200_000],
    ['2m2', 2_200_000],
    ['1G', 1_000_000_000],
    ['99G', 99_000_000_000],
    ['4.75k', 4750],
    ['4.7', 4.7],
    ['0.5k', 500],
  ])('reads %j as %d', (text, ohms) => {
    expect(parseOhms(text)).toBe(ohms)
  })

  it.each(['', 'abc', '4.7kk', '1.2.3', 'k47', '4.7x', '-47', '4.7 k Ω extra'])(
    'rejects %j',
    (text) => {
      expect(parseOhms(text)).toBeNull()
    },
  )
})

describe('parseTolerance', () => {
  it.each([
    ['5', 5],
    ['5%', 5],
    [' 10 % ', 10],
    ['10', 10],
  ])('reads %j as %d', (text, value) => {
    expect(parseTolerance(text)).toBe(value)
  })

  it.each(['', '5.0', 'five', '%5'])('rejects %j', (text) => {
    expect(parseTolerance(text)).toBeNull()
  })
})

describe('isCorrect', () => {
  const r: Resistor = { first: 4, second: 7, multiplier: 2, tolerance: 'gold' } // 4.7 kΩ ±5%

  it('accepts any form of the right answer', () => {
    expect(isCorrect(r, '4700', '5')).toBe(true)
    expect(isCorrect(r, '4.7k', '5%')).toBe(true)
    expect(isCorrect(r, '4k7', ' 5 % ')).toBe(true)
  })

  it('rejects close-but-wrong answers', () => {
    expect(isCorrect(r, '4.7', '5')).toBe(false)
    expect(isCorrect(r, '470', '5')).toBe(false)
    expect(isCorrect(r, '4700', '10')).toBe(false)
    expect(isCorrect(r, '4700', '')).toBe(false)
  })
})

describe('formatOhms', () => {
  it.each([
    [47, '47 Ω'],
    [4700, '4.7 kΩ'],
    [10_000, '10 kΩ'],
    [2_200_000, '2.2 MΩ'],
    [99_000_000_000, '99 GΩ'],
  ])('writes %d as %s', (ohms, text) => {
    expect(formatOhms(ohms)).toBe(text)
  })
})
