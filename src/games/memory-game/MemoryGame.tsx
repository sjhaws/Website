import { useEffect, useReducer, useState } from 'react'
import logo from '../../assets/hawsfun-logo.png'
import buttonStyles from '../../components/RetroButton.module.css'
import { formatTime } from '../../lib/formatTime.ts'
import { FACE_SETS, faceName, facesFor } from './faces.ts'
import {
  buildDeck,
  isPairShowing,
  isWon,
  MATCH_PAUSE_MS,
  MISS_PAUSE_MS,
  newGame,
  reducer,
  type Difficulty,
} from './game.ts'
import styles from './MemoryGame.module.css'

const DIFFICULTIES: Difficulty[] = ['easy', 'hard']

export function MemoryGame() {
  const [state, dispatch] = useReducer(
    reducer,
    'easy',
    (difficulty: Difficulty) =>
      newGame(difficulty, buildDeck(facesFor(difficulty))),
  )
  const [now, setNow] = useState(() => Date.now())
  const won = isWon(state)
  const pairShowing = isPairShowing(state)
  const pairs = state.cards.length / 2

  function startNewGame(difficulty: Difficulty) {
    dispatch({
      type: 'new-game',
      difficulty,
      cards: buildDeck(facesFor(difficulty)),
    })
  }

  // Leave a turned-over pair visible briefly, then keep or hide it. Starting a
  // new game clears faceUp, which cancels a pending pause.
  useEffect(() => {
    if (state.faceUp.length !== 2) return
    const timer = setTimeout(
      () => dispatch({ type: 'settle', now: Date.now() }),
      pairShowing ? MATCH_PAUSE_MS : MISS_PAUSE_MS,
    )
    return () => clearTimeout(timer)
  }, [state.faceUp, pairShowing])

  // Tick the clock only while a game is in progress.
  const running = state.startedAt !== null && !won
  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [running])

  const elapsed =
    state.startedAt === null ? 0 : (state.finishedAt ?? now) - state.startedAt
  const { images, credits } = FACE_SETS[state.difficulty]

  return (
    <div className={styles.game}>
      <div className={styles.controls}>
        <div className={styles.difficulty} role="group" aria-label="Difficulty">
          {DIFFICULTIES.map((difficulty) => (
            <button
              key={difficulty}
              type="button"
              className={`${buttonStyles.button} ${buttonStyles.small}`}
              aria-pressed={state.difficulty === difficulty}
              onClick={() => {
                if (difficulty !== state.difficulty) startNewGame(difficulty)
              }}
            >
              {FACE_SETS[difficulty].label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`${buttonStyles.button} ${buttonStyles.small}`}
          onClick={() => startNewGame(state.difficulty)}
        >
          New Game
        </button>
      </div>

      <dl className={styles.stats}>
        <div>
          <dt>Tries</dt>
          <dd>{state.tries}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{formatTime(elapsed)}</dd>
        </div>
      </dl>

      <div className={styles.status} aria-live="polite">
        {won && (
          <p className={styles.win}>
            You Win!! All {pairs} pairs in {state.tries} tries and{' '}
            {formatTime(elapsed)}.
          </p>
        )}
      </div>

      <ul className={`${styles.board} ${styles[state.difficulty]}`}>
        {state.cards.map((card, index) => {
          const matched =
            state.matched[index] ||
            (pairShowing && state.faceUp.includes(index))
          const showing = matched || state.faceUp.includes(index)
          const name = faceName(card.face)
          return (
            <li key={card.id}>
              <button
                type="button"
                className={`${styles.card} ${showing ? styles.flipped : ''} ${matched ? styles.matched : ''}`}
                aria-label={
                  showing
                    ? matched
                      ? `${name}, matched`
                      : name
                    : `Card ${index + 1}, face down`
                }
                disabled={state.matched[index]}
                onClick={() =>
                  dispatch({ type: 'flip', index, now: Date.now() })
                }
              >
                <span className={styles.inner}>
                  <span className={styles.back}>
                    <img src={logo} alt="" />
                  </span>
                  <span className={styles.front}>
                    <img src={images[card.face]} alt="" />
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {credits && (
        <details className={styles.credits}>
          <summary>Image credits: NASA</summary>
          <ul>
            {Object.entries(credits).map(([face, credit]) => (
              <li key={face}>
                {faceName(face)}: {credit}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
