import {
  Fragment,
  useEffect,
  useReducer,
  useRef,
  useState,
  type MouseEvent,
} from 'react'
import { formatTime } from '../../lib/formatTime.ts'
import {
  buildDeck,
  currentCard,
  isFinished,
  matchedCount,
  newGame,
  reducer,
  rosterOrder,
} from './game.ts'
import { LEADERS, LEADERS_AS_OF, type Leader } from './leaders.ts'
import styles from './ApostleFlashcards.module.css'

const PHOTOS: Record<string, string> = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>('./photos/*.jpg', {
      eager: true,
      import: 'default',
    }),
  ).map(([path, url]) => [path.split('/').pop()!.replace('.jpg', ''), url]),
)
const BY_SLUG = new Map(LEADERS.map((leader) => [leader.slug, leader]))
const ROSTER = rosterOrder(LEADERS)
const AS_OF = new Date(
  LEADERS_AS_OF.year,
  LEADERS_AS_OF.month - 1,
).toLocaleDateString('en-US', {
  month: 'long',
  year: 'numeric',
})

// Fallback when a leader has no photo: initials on a color picked from the name.
const AVATAR_COLORS = [
  '#1c2c4c',
  '#223460',
  '#3a4d78',
  '#5a3d2b',
  '#2f4d3f',
  '#4a3350',
]

function initials(name: string) {
  const words = name.replace(/[.,]/g, '').split(' ').filter(Boolean)
  return (
    words[0][0] + (words.length > 1 ? words[words.length - 1][0] : '')
  ).toUpperCase()
}

function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

const SHAKE: Keyframe[] = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(-4px)' },
  { transform: 'translateX(4px)' },
  { transform: 'translateX(-4px)' },
  { transform: 'translateX(4px)' },
  { transform: 'translateX(0)' },
]

function TempleIcon() {
  return (
    <svg className={styles.temple} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 3 L30 18 L30 36 L10 36 L10 18 Z" fill="#d8b877" />
      <rect x="17" y="24" width="6" height="12" fill="#1c2c4c" />
      <circle cx="20" cy="10" r="2" fill="#1c2c4c" />
    </svg>
  )
}

function Spires() {
  return (
    <div className={styles.spires} aria-hidden="true">
      <svg width="26" height="34" viewBox="0 0 26 34">
        <path
          d="M13 0 L20 14 L20 34 L6 34 L6 14 Z"
          fill="#d8b877"
          opacity="0.5"
        />
      </svg>
      <svg width="34" height="44" viewBox="0 0 34 44">
        <path
          d="M17 0 L27 18 L27 44 L7 44 L7 18 Z"
          fill="#d8b877"
          opacity="0.75"
        />
      </svg>
      <svg width="26" height="34" viewBox="0 0 26 34">
        <path
          d="M13 0 L20 14 L20 34 L6 34 L6 14 Z"
          fill="#d8b877"
          opacity="0.5"
        />
      </svg>
    </div>
  )
}

function Avatar({ leader }: { leader: Leader }) {
  const photo = PHOTOS[leader.slug]
  return photo ? (
    <img className={styles.avatar} src={photo} alt={leader.name} />
  ) : (
    <div
      className={styles.avatar}
      style={{ background: avatarColor(leader.name) }}
      aria-hidden="true"
    >
      {initials(leader.name)}
    </div>
  )
}

export function ApostleFlashcards() {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    newGame(buildDeck(LEADERS)),
  )
  const [now, setNow] = useState(() => Date.now())
  const clueRef = useRef<HTMLParagraphElement>(null)
  const finishDialog = useRef<HTMLDialogElement>(null)

  const card = currentCard(state)
  const leader = card ? BY_SLUG.get(card.slug)! : null
  const finished = isFinished(state)
  const matched = matchedCount(state)
  const total = state.deck.length
  const elapsed =
    state.startedAt === null ? 0 : (state.finishedAt ?? now) - state.startedAt

  // The clock ticks from the first guess or skip until Finish.
  const running = state.startedAt !== null && !finished
  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [running])

  // The "Well done!" pop-up opens when the last card is finished.
  useEffect(() => {
    const dialog = finishDialog.current
    if (finished && dialog && !dialog.open) dialog.showModal()
  }, [finished])

  function startNewGame() {
    finishDialog.current?.close()
    dispatch({ type: 'new-game', deck: buildDeck(LEADERS) })
  }

  function guess(event: MouseEvent<HTMLButtonElement>, slug: string) {
    const wrong = card && !state.showing && slug !== card.slug
    if (
      wrong &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      event.currentTarget.animate(SHAKE, { duration: 400 })
    }
    // oxlint-disable-next-line react/purity -- a click handler, not render
    dispatch({ type: 'guess', slug, now: Date.now() })
  }

  function next() {
    dispatch({ type: 'next', now: Date.now() })
    // Move keyboard and screen-reader focus to the new clue.
    requestAnimationFrame(() => clueRef.current?.focus())
  }

  const summary = `You matched ${matched} of ${total} leaders in ${formatTime(elapsed)} with ${state.misses} ${
    state.misses === 1 ? 'miss' : 'misses'
  } and a best streak of ${state.bestStreak}.`

  return (
    <div className={styles.game}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Flashcards</p>
        <h2 className={styles.title}>Called to Serve</h2>
        <Spires />
        <p className={styles.sub}>
          Read the clue, then pick the leader it describes from the roster.
          Learn the First Presidency and Quorum of the Twelve Apostles of The
          Church of Jesus Christ of Latter-day Saints as of {AS_OF}.
        </p>
      </header>

      <div className={styles.bar}>
        <dl className={styles.stats}>
          <div>
            <dd>
              {matched} / {total}
            </dd>
            <dt>Matched</dt>
          </div>
          <div>
            <dd>{state.streak}</dd>
            <dt>Streak</dt>
          </div>
          <div>
            <dd>{state.misses}</dd>
            <dt>Misses</dt>
          </div>
          <div>
            <dd>{formatTime(elapsed)}</dd>
            <dt>Time</dt>
          </div>
        </dl>
        <button type="button" className={styles.newGame} onClick={startNewGame}>
          New Game
        </button>
      </div>

      <div className={styles.layout}>
        <section className={styles.stage} aria-label="Flashcard">
          <div
            className={styles.progress}
            role="progressbar"
            aria-label="Leaders matched"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={matched}
          >
            <div
              className={styles.progressFill}
              style={{ width: `${(matched / total) * 100}%` }}
            />
          </div>

          <div
            className={`${styles.card} ${state.showing === 'correct' ? styles.correctCard : ''} ${
              state.showing === 'skipped' ? styles.skippedCard : ''
            }`}
          >
            {/* Keyed so each layout gets fresh elements: otherwise React reuses
                the Skip button as Next Card, and autoFocus never fires. */}
            {finished ? (
              <Fragment key="finished">
                <TempleIcon />
                <p className={styles.kicker}>Finished</p>
                <p className={styles.clue}>{summary}</p>
                <button
                  type="button"
                  className={styles.next}
                  onClick={startNewGame}
                >
                  Play Again
                </button>
              </Fragment>
            ) : state.showing && leader ? (
              <Fragment key="answer">
                <Avatar leader={leader} />
                <p className={styles.answerName}>{leader.name}</p>
                <p className={styles.answerRole}>{leader.role}</p>
                <ul className={styles.facts}>
                  {leader.facts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={styles.next}
                  onClick={next}
                  autoFocus
                >
                  {state.position + 1 < total ? 'Next Card' : 'Finish'}
                </button>
              </Fragment>
            ) : card ? (
              <Fragment key="clue">
                <TempleIcon />
                <p className={styles.kicker}>
                  Clue {state.position + 1} of {total}
                </p>
                <p className={styles.clue} ref={clueRef} tabIndex={-1}>
                  {card.clue}
                </p>
                <p className={styles.hint}>
                  Choose the matching name from the roster
                </p>
                <button
                  type="button"
                  className={styles.skip}
                  onClick={() => dispatch({ type: 'skip', now: Date.now() })}
                >
                  I don't know — show the answer
                </button>
              </Fragment>
            ) : null}
          </div>
          <p className={styles.caption}>
            Card {Math.min(state.position + 1, total)} of {total}
          </p>
        </section>

        <section className={styles.roster} aria-labelledby="roster-title">
          <h3 id="roster-title">The Roster</h3>
          <p className={styles.hint}>
            Tap the name that matches the clue on the card.
          </p>
          <div className={styles.rosterGrid}>
            {ROSTER.map((person) => {
              const result = state.results[person.slug]
              return (
                <button
                  key={person.slug}
                  type="button"
                  className={`${styles.rosterItem} ${result ? styles[result] : ''}`}
                  disabled={!!result || finished}
                  aria-label={
                    result
                      ? `${person.name}, ${result === 'correct' ? 'matched' : 'skipped'}`
                      : person.name
                  }
                  onClick={(event) => guess(event, person.slug)}
                >
                  <span className={styles.rosterName}>{person.name}</span>
                  <span className={styles.check} aria-hidden="true">
                    {result === 'correct'
                      ? '✓'
                      : result === 'skipped'
                        ? '–'
                        : ''}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      </div>

      <dialog
        ref={finishDialog}
        className={styles.finish}
        aria-labelledby="finish-title"
      >
        <h3 id="finish-title">Well done!</h3>
        <p>{summary}</p>
        <button type="button" onClick={startNewGame} autoFocus>
          Play Again
        </button>
      </dialog>
    </div>
  )
}
