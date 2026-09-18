import battleshipH from './assets/battleship-horizontal.webp'
import battleshipV from './assets/battleship-vertical.webp'
import carrierH from './assets/carrier-horizontal.webp'
import carrierV from './assets/carrier-vertical.webp'
import cruiserH from './assets/cruiser-horizontal.webp'
import cruiserV from './assets/cruiser-vertical.webp'
import destroyerH from './assets/destroyer-horizontal.webp'
import destroyerV from './assets/destroyer-vertical.webp'
import submarineH from './assets/submarine-horizontal.webp'
import submarineV from './assets/submarine-vertical.webp'
import {
  BOARD_SIZE,
  cellKey,
  shipAt,
  type Cell,
  type Direction,
  type PlacedShip,
  type ShipName,
  type Shot,
} from './rules.ts'
import styles from './Battleship.module.css'

const SHIP_ART: Record<ShipName, Record<Direction, string>> = {
  Carrier: { horizontal: carrierH, vertical: carrierV },
  Battleship: { horizontal: battleshipH, vertical: battleshipV },
  Cruiser: { horizontal: cruiserH, vertical: cruiserV },
  Submarine: { horizontal: submarineH, vertical: submarineV },
  Destroyer: { horizontal: destroyerH, vertical: destroyerV },
}

const ROWS = 'ABCDEFGHIJ'
const CELLS: Cell[] = Array.from(
  { length: BOARD_SIZE * BOARD_SIZE },
  (_, i) => ({
    row: Math.floor(i / BOARD_SIZE),
    col: i % BOARD_SIZE,
  }),
)

export type Highlight = 'valid' | 'preview' | 'blocked' | null

interface BoardProps {
  title: string
  /** Ships whose artwork is shown: your own fleet, or the enemy's after the game. */
  fleet: PlacedShip[]
  shots: Shot[]
  canClick?: (cell: Cell) => boolean
  onCellClick?: (cell: Cell) => void
  onCellHover?: (cell: Cell | null) => void
  highlight?: (cell: Cell) => Highlight
}

export function Board({
  title,
  fleet,
  shots,
  canClick,
  onCellClick,
  onCellHover,
  highlight,
}: BoardProps) {
  const results = new Map(
    shots.map((shot) => [cellKey(shot.cell), shot.result]),
  )

  return (
    <figure className={styles.boardWrap}>
      <figcaption className={styles.boardTitle}>{title}</figcaption>
      <div className={styles.board} onMouseLeave={() => onCellHover?.(null)}>
        {fleet.map((ship) => {
          const [first] = ship.cells
          const horizontal = ship.direction === 'horizontal'
          return (
            <img
              key={ship.name}
              className={styles.ship}
              src={SHIP_ART[ship.name][ship.direction]}
              alt=""
              style={{
                gridRow: `${first.row + 1} / span ${horizontal ? 1 : ship.size}`,
                gridColumn: `${first.col + 1} / span ${horizontal ? ship.size : 1}`,
              }}
            />
          )
        })}
        {CELLS.map((cell) => {
          const result = results.get(cellKey(cell))
          const ship = shipAt(fleet, cell)
          const mark = highlight?.(cell) ?? null
          const clickable = canClick?.(cell) ?? false
          const name = `${ROWS[cell.row]}${cell.col + 1}`
          const description = result ?? (ship ? ship.name : '')
          return (
            <button
              key={cellKey(cell)}
              type="button"
              className={[
                styles.cell,
                result ? styles[result] : ship ? styles.shipCell : '',
                mark ? styles[mark] : '',
              ].join(' ')}
              style={{ gridRow: cell.row + 1, gridColumn: cell.col + 1 }}
              aria-label={`${title} ${name}${description ? `, ${description}` : ''}`}
              disabled={!clickable}
              onClick={() => onCellClick?.(cell)}
              onMouseEnter={() => onCellHover?.(cell)}
            >
              {result === 'hit' ? 'X' : result === 'miss' ? '•' : ''}
            </button>
          )
        })}
      </div>
    </figure>
  )
}
