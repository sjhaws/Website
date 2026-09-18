import { useEffect, useReducer, useRef, useState, type FormEvent } from 'react'
import buttonStyles from '../../components/RetroButton.module.css'
import { useStoredState } from '../../lib/useStoredState.ts'
import {
  addHighScore,
  FIRST_TRY_BONUS_MS,
  HIGH_SCORE_COUNT,
  initialState,
  isHighScoreList,
  reducer,
  remainingMs,
  ROUND_MS,
  SKIP_PENALTY_MS,
  type Feedback,
} from './game.ts'
import { ResistorDrawing, ResistorSymbol } from './ResistorArt.tsx'
import { RulesContent, RulesDialog } from './Rules.tsx'
import {
  formatOhms,
  isCorrect,
  randomResistor,
  resistance,
  TOLERANCES,
} from './resistor.ts'
import styles from './ResistorChallenge.module.css'

const button = `${buttonStyles.button} ${buttonStyles.small}`
const NO_SCORES: number[] = []

function feedbackText(feedback: Feedback): string {
  switch (feedback.type) {
    case 'correct':
      return `Correct! +${feedback.points} ${feedback.points === 1 ? 'point' : 'points'}${feedback.bonus ? ` and +${FIRST_TRY_BONUS_MS / 1000} second` : ''}`
    case 'wrong':
      return 'Try Again'
    case 'skipped': {
      const r = feedback.resistor
      return `Skipped (−${SKIP_PENALTY_MS / 1000} seconds). That one was ${formatOhms(resistance(r))} ±${TOLERANCES[r.tolerance]}%.`
    }
  }
}

export function ResistorChallenge() {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    initialState(randomResistor()),
  )
  const [highScores, setHighScores] = useStoredState(
    'hawsfun.resistor-challenge.high-scores',
    NO_SCORES,
    isHighScoreList,
  )
  const [now, setNow] = useState(() => Date.now())
  const [ohms, setOhms] = useState('')
  const [tolerance, setTolerance] = useState('')
  const ohmsInput = useRef<HTMLInputElement>(null)
  const [rulesOpen, setRulesOpen] = useState(false)

  const inRound = state.view === 'game'
  const remaining = inRound ? remainingMs(state, now) : ROUND_MS

  // Tick the clock during a round.
  useEffect(() => {
    if (!inRound) return
    const timer = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(timer)
  }, [inRound])

  // When time runs out, end the round and save the score.
  const { score } = state
  useEffect(() => {
    if (!inRound || remaining > 0) return
    dispatch({ type: 'time-up' })
    setHighScores((scores) => addHighScore(scores, score))
  }, [inRound, remaining, score, setHighScores])

  function startRound() {
    setRulesOpen(false)
    const time = Date.now()
    setNow(time)
    setOhms('')
    setTolerance('')
    dispatch({ type: 'start', now: time, resistor: randomResistor() })
  }

  function nextQuestion() {
    setOhms('')
    setTolerance('')
    ohmsInput.current?.focus()
  }

  // Enter in either field submits.
  function submit(event: FormEvent) {
    event.preventDefault()
    const correct = isCorrect(state.resistor, ohms, tolerance)
    dispatch({ type: 'answer', ohms, tolerance, next: randomResistor() })
    if (correct) nextQuestion()
    else ohmsInput.current?.focus()
  }

  function skip() {
    dispatch({ type: 'skip', next: randomResistor() })
    nextQuestion()
  }

  const newGame = (
    <button type="button" className={button} onClick={startRound}>
      New Game
    </button>
  )
  const mainMenu = (
    <button
      type="button"
      className={button}
      onClick={() => dispatch({ type: 'show', view: 'menu' })}
    >
      Main Menu
    </button>
  )

  if (state.view === 'menu') {
    return (
      <div className={styles.game}>
        <ResistorSymbol />
        <div className={styles.buttons}>
          {newGame}
          <button
            type="button"
            className={button}
            onClick={() => dispatch({ type: 'show', view: 'scores' })}
          >
            High Scores
          </button>
          <button
            type="button"
            className={button}
            onClick={() => dispatch({ type: 'show', view: 'rules' })}
          >
            Rules
          </button>
        </div>
        <p className={styles.footer}>Copyright HAWSCO 2019</p>
      </div>
    )
  }

  if (state.view === 'rules') {
    return (
      <div className={styles.game}>
        <h2>How to Play</h2>
        <RulesContent />
        <div className={styles.buttons}>
          {newGame}
          {mainMenu}
        </div>
      </div>
    )
  }

  if (state.view === 'scores') {
    // Highlight the round that just ended, if it made the list.
    const newIndex =
      state.finalScore === null ? -1 : highScores.indexOf(state.finalScore)
    return (
      <div className={styles.game}>
        <h2>High Scores</h2>
        {state.finalScore !== null && (
          <p className={styles.gameOver} role="status">
            Game Over. Your score was: {state.finalScore}
          </p>
        )}
        <ol className={styles.scores}>
          {Array.from({ length: HIGH_SCORE_COUNT }, (_, i) => (
            <li
              key={i}
              className={i === newIndex ? styles.newScore : undefined}
            >
              {highScores[i] ?? '–'}
            </li>
          ))}
        </ol>
        <div className={styles.buttons}>
          {newGame}
          {mainMenu}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.game}>
      <div className={styles.buttons}>
        {newGame}
        <button
          type="button"
          className={button}
          onClick={() => dispatch({ type: 'exit' })}
        >
          Exit Game
        </button>
        <button
          type="button"
          className={button}
          aria-haspopup="dialog"
          onClick={() => setRulesOpen(true)}
        >
          Rules
        </button>
      </div>
      <RulesDialog
        open={rulesOpen}
        onClose={() => {
          setRulesOpen(false)
          ohmsInput.current?.focus()
        }}
      />
      <dl className={styles.stats}>
        <div>
          <dt>Score</dt>
          <dd>{state.score}</dd>
        </div>
        <div>
          <dt>Time left</dt>
          <dd className={remaining <= 10_000 ? styles.hurry : undefined}>
            {Math.ceil(remaining / 1000)}
          </dd>
        </div>
      </dl>
      <h2>What is the Resistance?</h2>
      <ResistorDrawing resistor={state.resistor} />
      <form className={styles.answer} onSubmit={submit}>
        <label>
          Ohms
          <input
            ref={ohmsInput}
            value={ohms}
            onChange={(event) => setOhms(event.target.value)}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            placeholder="e.g. 4.7k"
          />
        </label>
        <label>
          Tolerance (%)
          <input
            value={tolerance}
            onChange={(event) => setTolerance(event.target.value)}
            autoComplete="off"
            inputMode="numeric"
            placeholder="5 or 10"
          />
        </label>
        <div className={styles.buttons}>
          <button type="submit" className={button}>
            Next
          </button>
          <button type="button" className={button} onClick={skip}>
            Skip
          </button>
        </div>
      </form>
      <p
        className={`${styles.feedback} ${state.feedback ? styles[state.feedback.type] : ''}`}
        aria-live="polite"
      >
        {state.feedback && feedbackText(state.feedback)}
      </p>
    </div>
  )
}
