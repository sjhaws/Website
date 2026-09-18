import { BAND_FILL } from './colors.ts'
import { bands, type Resistor } from './resistor.ts'
import styles from './ResistorChallenge.module.css'

// Band positions along the body, in SVG units: 60 apart so the color names
// underneath don't run together. The tolerance band sits apart.
const BAND_X = [140, 200, 260, 362]
const BAND_WIDTH = 24

export function ResistorDrawing({ resistor }: { resistor: Resistor }) {
  const colors = bands(resistor)
  return (
    <svg
      className={styles.drawing}
      viewBox="0 0 540 150"
      role="img"
      aria-label={`Resistor with bands: ${colors.join(', ')}`}
    >
      <line x1="0" y1="55" x2="540" y2="55" stroke="#9aa4b2" strokeWidth="6" />
      <rect
        x="100"
        y="20"
        width="340"
        height="70"
        rx="30"
        fill="#e3c98f"
        stroke="#b89a5a"
        strokeWidth="2"
      />
      {colors.map((color, i) => (
        <g key={i}>
          <rect
            x={BAND_X[i]}
            y="20"
            width={BAND_WIDTH}
            height="70"
            fill={BAND_FILL[color]}
            stroke="rgba(0, 0, 0, 0.35)"
          />
          <text
            x={BAND_X[i] + BAND_WIDTH / 2}
            y="120"
            className={styles.bandLabel}
            textAnchor="middle"
          >
            {color}
          </text>
        </g>
      ))}
    </svg>
  )
}

/** The zigzag schematic symbol, for the menu. */
export function ResistorSymbol() {
  return (
    <svg className={styles.symbol} viewBox="0 0 420 120" aria-hidden="true">
      <path
        d="M 10 60 H 120 L 135 30 L 165 90 L 195 30 L 225 90 L 255 30 L 285 90 L 300 60 H 410"
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinejoin="round"
      />
    </svg>
  )
}
