// Four-band resistors: generating one, reading its bands, and checking an
// answer. Pure functions, tested in resistor.test.ts.

export const DIGIT_COLORS = [
  'black',
  'brown',
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'violet',
  'grey',
  'white',
] as const
export type DigitColor = (typeof DIGIT_COLORS)[number]
export type ToleranceColor = 'gold' | 'silver'
export type BandColor = DigitColor | ToleranceColor

export const TOLERANCES: Record<ToleranceColor, number> = {
  gold: 5,
  silver: 10,
}

export interface Resistor {
  /** First digit, 1–9. */
  first: number
  /** Second digit, 0–9. */
  second: number
  /** Power of ten, 0–9. */
  multiplier: number
  tolerance: ToleranceColor
}

export function randomResistor(random: () => number = Math.random): Resistor {
  return {
    first: 1 + Math.floor(random() * 9),
    second: Math.floor(random() * 10),
    multiplier: Math.floor(random() * 10),
    tolerance: random() < 0.5 ? 'gold' : 'silver',
  }
}

/** Resistance in ohms: two digits followed by `multiplier` zeros. */
export function resistance({ first, second, multiplier }: Resistor): number {
  return (first * 10 + second) * 10 ** multiplier
}

export function bands(
  resistor: Resistor,
): [DigitColor, DigitColor, DigitColor, ToleranceColor] {
  return [
    DIGIT_COLORS[resistor.first],
    DIGIT_COLORS[resistor.second],
    DIGIT_COLORS[resistor.multiplier],
    resistor.tolerance,
  ]
}

const PREFIXES: Record<string, number> = { '': 0, k: 3, m: 6, g: 9 }

/**
 * Reads a resistance typed in any common form: 4700, 4,700, 4.7k, 4k7, 2.2M,
 * 1G, with an optional Ω / ohm / ohms. Letters are case-insensitive, and "m"
 * means mega because no answer is below 10 Ω. Returns null if it can't be read.
 *
 * Works on digit strings rather than floating point, so 2.2M is exactly
 * 2,200,000.
 */
export function parseOhms(text: string): number | null {
  const cleaned = text
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/,/g, '')
    .replace(/(ω|ohms?)$/, '')
  const decimal = /^(\d+)(?:\.(\d+))?([kmg]?)$/.exec(cleaned) // 4700, 4.7k
  const infix = /^(\d+)([kmg])(\d+)$/.exec(cleaned) // 4k7
  const [whole, fraction, prefix] = decimal
    ? [decimal[1], decimal[2] ?? '', decimal[3]]
    : infix
      ? [infix[1], infix[3], infix[2]]
      : [null, '', '']
  if (whole === null) return null
  const digits = Number(whole + fraction)
  const shift = PREFIXES[prefix] - fraction.length
  return shift >= 0 ? digits * 10 ** shift : digits / 10 ** -shift
}

/** Reads a tolerance typed as 5, 5%, 10 or 10% (any whole number is read). */
export function parseTolerance(text: string): number | null {
  const match = /^(\d+)%?$/.exec(text.replace(/\s+/g, ''))
  return match ? Number(match[1]) : null
}

export function isCorrect(
  resistor: Resistor,
  ohms: string,
  tolerance: string,
): boolean {
  return (
    parseOhms(ohms) === resistance(resistor) &&
    parseTolerance(tolerance) === TOLERANCES[resistor.tolerance]
  )
}

/** A resistance written the way it's usually printed, e.g. 4700 → "4.7 kΩ". */
export function formatOhms(ohms: number): string {
  const [divisor, unit] =
    ohms >= 1e9
      ? [1e9, 'GΩ']
      : ohms >= 1e6
        ? [1e6, 'MΩ']
        : ohms >= 1e3
          ? [1e3, 'kΩ']
          : [1, 'Ω']
  return `${Number((ohms / divisor).toPrecision(3))} ${unit}`
}
