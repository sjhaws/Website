import { useState } from 'react'
import buttonStyles from '../../components/RetroButton.module.css'
import { useStoredState } from '../../lib/useStoredState.ts'
import logo from './assets/logo.png'
import paperImage from './assets/paper.jpg'
import rockImage from './assets/rock.jpg'
import scissorsImage from './assets/scissors.jpg'
import {
  addRound,
  CHOICE_NAMES,
  CHOICES,
  isTotals,
  NO_TOTALS,
  outcome,
  randomChoice,
  type Choice,
  type Outcome,
} from './rules.ts'
import styles from './RockPaperScissors.module.css'

const IMAGES: Record<Choice, string> = {
  rock: rockImage,
  paper: paperImage,
  scissors: scissorsImage,
}

const MESSAGES: Record<Outcome, string> = {
  win: 'You Win',
  lose: 'You Lose',
  draw: 'Draw',
}

interface Round {
  player: Choice
  computer: Choice
  result: Outcome
}

export function RockPaperScissors() {
  const [totals, setTotals] = useStoredState(
    'hawsfun.rock-paper-scissors.totals',
    NO_TOTALS,
    isTotals,
  )
  const [round, setRound] = useState<Round | null>(null)

  function play(player: Choice) {
    const computer = randomChoice()
    const result = outcome(player, computer)
    setRound({ player, computer, result })
    setTotals((current) => addRound(current, result))
  }

  function reset() {
    setTotals(NO_TOTALS)
    setRound(null)
  }

  return (
    <div className={styles.game}>
      <img className={styles.logo} src={logo} alt="" />
      <p className={styles.prompt}>Choose your move</p>
      <div className={styles.choices}>
        {CHOICES.map((choice) => (
          <button
            key={choice}
            type="button"
            className={styles.choice}
            onClick={() => play(choice)}
          >
            <img src={IMAGES[choice]} alt="" />
            {CHOICE_NAMES[choice]}
          </button>
        ))}
      </div>

      <section className={styles.result} aria-live="polite">
        <h2 className={styles.resultTitle}>Result</h2>
        {round ? (
          <>
            <p className={`${styles.message} ${styles[round.result]}`}>
              {MESSAGES[round.result]}
            </p>
            <div className={styles.matchup}>
              <Pick label="Your choice" choice={round.player} />
              <span className={styles.versus}>vs</span>
              <Pick label="Computer's choice" choice={round.computer} />
            </div>
          </>
        ) : (
          <p className={styles.waiting}>Pick rock, paper or scissors to play</p>
        )}
      </section>

      <dl className={styles.scores}>
        <div>
          <dt>Your score</dt>
          <dd>{totals.wins}</dd>
        </div>
        <div>
          <dt>Draws</dt>
          <dd>{totals.draws}</dd>
        </div>
        <div>
          <dt>Computer's score</dt>
          <dd>{totals.losses}</dd>
        </div>
      </dl>

      <button
        type="button"
        className={`${buttonStyles.button} ${buttonStyles.small}`}
        onClick={reset}
      >
        Reset scores
      </button>
    </div>
  )
}

function Pick({ label, choice }: { label: string; choice: Choice }) {
  return (
    <figure className={styles.pick}>
      <figcaption>{label}</figcaption>
      <img src={IMAGES[choice]} alt="" />
      <span>{CHOICE_NAMES[choice]}</span>
    </figure>
  )
}
