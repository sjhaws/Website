import { useEffect, useReducer, useState } from 'react'
import buttonStyles from '../../components/RetroButton.module.css'
import { Board, type Highlight } from './Board.tsx'
import {
  ENEMY_DELAY_MS,
  initialState,
  reducer,
  resultMessage,
  type Difficulty,
} from './game.ts'
import {
  canPlace,
  cellKey,
  easyTarget,
  hasShot,
  nextShip,
  normalTarget,
  randomFleet,
  shipCells,
  type Cell,
} from './rules.ts'
import styles from './Battleship.module.css'

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'normal', label: 'Normal' },
]

const button = `${buttonStyles.button} ${buttonStyles.small}`

export function Battleship() {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState())
  const [hovered, setHovered] = useState<Cell | null>(null)
  const placing = state.phase === 'placing'
  const ship = placing ? nextShip(state.playerFleet) : null
  const result = resultMessage(state)

  // R turns the next ship, as in the original. The listener is removed when
  // you leave the page.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (event.key === 'r' || event.key === 'R') dispatch({ type: 'rotate' })
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // The enemy fires after a short pause.
  const { phase, turn, difficulty, enemyShots, playerFleet } = state
  useEffect(() => {
    if (phase !== 'battle' || turn !== 'enemy') return
    const timer = setTimeout(() => {
      const cell =
        difficulty === 'easy'
          ? easyTarget(enemyShots)
          : normalTarget(enemyShots, playerFleet)
      dispatch({ type: 'enemy-fire', cell })
    }, ENEMY_DELAY_MS)
    return () => clearTimeout(timer)
  }, [phase, turn, difficulty, enemyShots, playerFleet])

  // While placing: outline every cell where the next ship fits, and preview
  // its footprint under the pointer.
  const preview =
    ship && hovered ? shipCells(hovered, ship.size, state.direction) : []
  const previewFits =
    ship && hovered
      ? canPlace(state.playerFleet, ship.size, hovered, state.direction)
      : false
  const previewKeys = new Set(preview.map(cellKey))
  const fits = (cell: Cell) =>
    !!ship && canPlace(state.playerFleet, ship.size, cell, state.direction)

  function playerHighlight(cell: Cell): Highlight {
    if (!ship) return null
    if (previewKeys.has(cellKey(cell)))
      return previewFits ? 'preview' : 'blocked'
    return fits(cell) ? 'valid' : null
  }

  return (
    <div className={styles.game}>
      <div className={styles.controls}>
        <div className={styles.group} role="group" aria-label="Difficulty">
          {DIFFICULTIES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={button}
              aria-pressed={state.difficulty === value}
              disabled={!placing}
              onClick={() =>
                dispatch({ type: 'set-difficulty', difficulty: value })
              }
            >
              {label}
            </button>
          ))}
        </div>
        {placing && (
          <div className={styles.group}>
            <button
              type="button"
              className={button}
              disabled={!ship}
              onClick={() => dispatch({ type: 'rotate' })}
            >
              Rotate: {state.direction}
            </button>
            <button
              type="button"
              className={button}
              onClick={() =>
                dispatch({ type: 'randomize', fleet: randomFleet() })
              }
            >
              Randomize
            </button>
            <button
              type="button"
              className={button}
              disabled={!!ship}
              onClick={() =>
                dispatch({ type: 'start-battle', enemyFleet: randomFleet() })
              }
            >
              Start Battle
            </button>
          </div>
        )}
        {state.phase === 'over' && (
          <button
            type="button"
            className={button}
            onClick={() => dispatch({ type: 'restart' })}
          >
            Restart
          </button>
        )}
      </div>

      <div className={styles.messages} aria-live="polite">
        {result && (
          <p className={state.winner === 'player' ? styles.won : styles.lost}>
            {result}
          </p>
        )}
        <p>{state.playerMessage}</p>
        {state.enemyMessage && (
          <p className={styles.enemyMessage}>{state.enemyMessage}</p>
        )}
        {placing && ship && (
          <p className={styles.hint}>
            Click your board to place it. Press R or Rotate to turn it, or
            Randomize.
          </p>
        )}
      </div>

      <div className={styles.boards}>
        <Board
          title="Your Board"
          fleet={state.playerFleet}
          shots={state.enemyShots}
          // Every cell stays enabled so the preview follows the pointer; the
          // rules ignore clicks where the ship doesn't fit.
          canClick={placing && ship ? () => true : undefined}
          onCellClick={(cell) => dispatch({ type: 'place', cell })}
          onCellHover={placing ? setHovered : undefined}
          highlight={placing ? playerHighlight : undefined}
        />
        <Board
          title="Enemy Board"
          // The enemy fleet is only shown once the game is over.
          fleet={state.phase === 'over' ? state.enemyFleet : []}
          shots={state.playerShots}
          canClick={(cell) =>
            state.phase === 'battle' &&
            state.turn === 'player' &&
            !hasShot(state.playerShots, cell)
          }
          onCellClick={(cell) => dispatch({ type: 'player-fire', cell })}
        />
      </div>
    </div>
  )
}
