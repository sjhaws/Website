import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { useNavigate } from 'react-router'
import buttonStyles from '../../components/RetroButton.module.css'
import { TreasureArt } from './art.tsx'
import {
  drawGrains,
  drawSand,
  flingGrains,
  HEIGHT,
  moveGrains,
  WIDTH,
  type Grain,
} from './draw.ts'
import { RickRollDialog } from './RickRoll.tsx'
import {
  CF4G_URL,
  COLS,
  dig,
  FOOTPRINTS,
  isFound,
  newSand,
  ROWS,
  TREASURE_NAMES,
  type Prize,
  type Sand,
} from './sand.ts'
import trowel from './trowel.svg'
import styles from './Sandbox.module.css'

/** How far the pointer moves between scoops while dragging, in cells. */
const DRAG_STEP = 1.5

// The pit stays as you left it when a treasure sends you to a game and you
// come back. Reloading the page fills it in again.
let savedSand: Sand | null = null

const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
}

const clamp = (n: number, max: number) => Math.max(0, Math.min(max, n))

export function Component() {
  const [sand, setSand] = useState(() => savedSand ?? newSand())
  const [marker, setMarker] = useState({ col: COLS / 2, row: ROWS / 2 })
  const [showMarker, setShowMarker] = useState(false)
  const [rickRolled, setRickRolled] = useState(false)
  const navigate = useNavigate()

  const canvas = useRef<HTMLCanvasElement>(null)
  // Pointer events can arrive faster than React re-renders, so digging works
  // on this copy of the sand and hands each result to React.
  const latest = useRef(sand)
  const view = useRef({ sand, marker: null as typeof marker | null })
  const grains = useRef<Grain[]>([])
  const frame = useRef(0)
  const lastScoop = useRef<{ x: number; y: number } | null>(null)

  function paint() {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    drawSand(ctx, view.current.sand, view.current.marker)
    drawGrains(ctx, grains.current)
  }

  function animate(from: number) {
    frame.current = requestAnimationFrame((now) => {
      grains.current = moveGrains(grains.current, now - from)
      paint()
      frame.current = 0
      if (grains.current.length > 0) animate(now)
    })
  }

  useEffect(() => {
    savedSand = sand
    view.current = { sand, marker: showMarker ? marker : null }
    if (!frame.current) paint()
  })

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  function setBoth(next: Sand) {
    latest.current = next
    setSand(next)
  }

  function scoop(x: number, y: number) {
    const col = clamp(Math.floor(x), COLS - 1)
    const row = clamp(Math.floor(y), ROWS - 1)
    const before = latest.current
    const after = dig(before, col, row)
    if (after === before) return
    setBoth(after)
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      grains.current.push(
        ...flingGrains(col, row, before.depth[row * COLS + col]),
      )
      if (!frame.current) animate(performance.now())
    }
  }

  /** The pointer's position in cells, as fractions. */
  function pointAt(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * COLS,
      y: ((event.clientY - rect.top) / rect.height) * ROWS,
    }
  }

  function startDigging(event: PointerEvent<HTMLCanvasElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setShowMarker(false)
    const point = pointAt(event)
    lastScoop.current = point
    scoop(point.x, point.y)
  }

  function keepDigging(event: PointerEvent<HTMLCanvasElement>) {
    const from = lastScoop.current
    if (!from) return
    const to = pointAt(event)
    const distance = Math.hypot(to.x - from.x, to.y - from.y)
    // Scoop every DRAG_STEP along the way, so a fast swipe doesn't skip.
    const steps = Math.floor(distance / DRAG_STEP)
    for (let i = 1; i <= steps; i++) {
      const t = (i * DRAG_STEP) / distance
      const point = {
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t,
      }
      scoop(point.x, point.y)
      lastScoop.current = point
    }
  }

  function stopDigging() {
    lastScoop.current = null
  }

  function handleKey(event: KeyboardEvent<HTMLCanvasElement>) {
    const arrow = ARROWS[event.key]
    if (arrow) {
      event.preventDefault()
      setShowMarker(true)
      setMarker((m) => ({
        col: clamp(m.col + arrow[0], COLS - 1),
        row: clamp(m.row + arrow[1], ROWS - 1),
      }))
    } else if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      setShowMarker(true)
      scoop(marker.col, marker.row)
    }
  }

  function smoothSand() {
    grains.current = []
    setBoth(newSand())
  }

  function open(prize: Prize) {
    if (prize.type === 'game') navigate(`/games/${prize.slug}`)
    else if (prize.type === 'cf4g') window.open(CF4G_URL, '_blank', 'noopener')
    else setRickRolled(true)
  }

  const total = sand.treasures.length
  const found = sand.treasures.filter((t) => isFound(sand, t)).length

  return (
    <div className={styles.page}>
      <title>Sandbox · HawsFun</title>
      <h1 className={styles.title}>Sandbox</h1>
      <p className={styles.intro}>
        <img src={trowel} alt="" width={32} height={32} /> Grab the trowel and
        dig! Scoop away the sand to see what's buried, then click whatever you
        find.
      </p>

      <div className={styles.pit} style={{ aspectRatio: `${COLS} / ${ROWS}` }}>
        <canvas
          ref={canvas}
          className={styles.sand}
          width={WIDTH}
          height={HEIGHT}
          tabIndex={0}
          role="application"
          aria-label="Sand pit. Use the arrow keys to move the trowel, and Space to dig."
          onPointerDown={startDigging}
          onPointerMove={keepDigging}
          onPointerUp={stopDigging}
          onPointerCancel={stopDigging}
          onKeyDown={handleKey}
          onBlur={() => setShowMarker(false)}
        />
        {sand.treasures.map((treasure, i) => {
          const { w, h } = FOOTPRINTS[treasure.kind]
          const place = {
            left: `${(treasure.col / COLS) * 100}%`,
            top: `${(treasure.row / ROWS) * 100}%`,
            width: `${(w / COLS) * 100}%`,
            height: `${(h / ROWS) * 100}%`,
          }
          return isFound(sand, treasure) ? (
            <button
              key={i}
              type="button"
              className={styles.found}
              style={place}
              aria-label={`${TREASURE_NAMES[treasure.kind]}: see where it leads`}
              onClick={() => open(treasure.prize)}
            >
              <TreasureArt kind={treasure.kind} />
            </button>
          ) : (
            <div key={i} className={styles.buried} style={place}>
              <TreasureArt kind={treasure.kind} />
            </div>
          )
        })}
      </div>

      <div className={styles.bar}>
        <p className={styles.status} aria-live="polite">
          {found === 0
            ? 'Nothing yet. Keep digging!'
            : found < total
              ? `Found ${found} of ${total}`
              : `You found all ${total}! Smooth the sand to bury more.`}
        </p>
        <button
          type="button"
          className={`${buttonStyles.button} ${buttonStyles.small}`}
          onClick={smoothSand}
        >
          Smooth the Sand
        </button>
      </div>

      <RickRollDialog open={rickRolled} onClose={() => setRickRolled(false)} />
    </div>
  )
}
