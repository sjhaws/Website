import { BAND_FILL } from './colors.ts'
import { DIGIT_COLORS, TOLERANCES, type ToleranceColor } from './resistor.ts'
import styles from './ResistorChallenge.module.css'

const MULTIPLIERS = [
  '×1',
  '×10',
  '×100',
  '×1k',
  '×10k',
  '×100k',
  '×1M',
  '×10M',
  '×100M',
  '×1G',
]

function Swatch({ color }: { color: keyof typeof BAND_FILL }) {
  return (
    <td>
      <span
        className={styles.swatch}
        style={{ background: BAND_FILL[color] }}
      />
      {color[0].toUpperCase() + color.slice(1)}
    </td>
  )
}

export function ColorChart() {
  return (
    <table className={styles.chart}>
      <caption>
        Band 1 is the first digit, band 2 the second digit, band 3 the
        multiplier and band 4 the tolerance. For example, yellow, violet, red,
        gold is 47 × 100 = 4,700 Ω (4.7k), ±5%.
      </caption>
      <thead>
        <tr>
          <th scope="col">Color</th>
          <th scope="col">Digit</th>
          <th scope="col">Multiplier</th>
          <th scope="col">Tolerance</th>
        </tr>
      </thead>
      <tbody>
        {DIGIT_COLORS.map((color, digit) => (
          <tr key={color}>
            <Swatch color={color} />
            <td>{digit}</td>
            <td>{MULTIPLIERS[digit]}</td>
            <td>–</td>
          </tr>
        ))}
        {(Object.keys(TOLERANCES) as ToleranceColor[]).map((color) => (
          <tr key={color}>
            <Swatch color={color} />
            <td>–</td>
            <td>–</td>
            <td>±{TOLERANCES[color]}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
