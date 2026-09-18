import { describe, expect, it } from 'vitest'
import {
  buildDeck,
  currentCard,
  isFinished,
  matchedCount,
  newGame,
  reducer,
  rosterOrder,
  type Action,
  type Card,
  type GameState,
} from './game.ts'
import { LEADERS } from './leaders.ts'

const DECK: Card[] = [
  { slug: 'a', clue: 'clue a' },
  { slug: 'b', clue: 'clue b' },
  { slug: 'c', clue: 'clue c' },
]

function run(state: GameState, ...actions: Action[]): GameState {
  return actions.reduce(reducer, state)
}

const guess = (slug: string, now = 1000): Action => ({
  type: 'guess',
  slug,
  now,
})
const next = (now = 2000): Action => ({ type: 'next', now })

// The photo files that exist, as Vite sees them.
const PHOTOS = Object.keys(import.meta.glob('./photos/*.jpg'))

describe('leader data', () => {
  it('has 15 leaders, each with a unique slug, 5 facts and a photo', () => {
    expect(LEADERS).toHaveLength(15)
    expect(new Set(LEADERS.map((l) => l.slug)).size).toBe(15)
    for (const leader of LEADERS) {
      expect(leader.facts).toHaveLength(5)
      expect(PHOTOS, `photo for ${leader.slug}`).toContain(
        `./photos/${leader.slug}.jpg`,
      )
    }
  })
})

describe('deck and roster', () => {
  it('uses every leader once, with one of their own facts as the clue', () => {
    const deck = buildDeck(LEADERS)
    expect(deck.map((c) => c.slug).sort()).toEqual(
      LEADERS.map((l) => l.slug).sort(),
    )
    for (const card of deck) {
      expect(LEADERS.find((l) => l.slug === card.slug)!.facts).toContain(
        card.clue,
      )
    }
  })

  it('sorts the roster by surname', () => {
    expect(rosterOrder(LEADERS).map((l) => l.name.split(' ').pop())).toEqual([
      'Andersen',
      'Bednar',
      'Caussé',
      'Christofferson',
      'Cook',
      'Eyring',
      'Gilbert',
      'Gong',
      'Kearon',
      'Oaks',
      'Rasband',
      'Renlund',
      'Soares',
      'Stevenson',
      'Uchtdorf',
    ])
  })
})

describe('playing', () => {
  it('does not start the clock until the first guess or skip', () => {
    expect(newGame(DECK).startedAt).toBeNull()
    expect(run(newGame(DECK), guess('b', 1234)).startedAt).toBe(1234)
    expect(run(newGame(DECK), { type: 'skip', now: 555 }).startedAt).toBe(555)
  })

  it('counts a wrong name as a miss and resets the streak', () => {
    const state = run(newGame(DECK), guess('a'), next(), guess('c'))
    expect(state.misses).toBe(1)
    expect(state.streak).toBe(0)
    expect(state.bestStreak).toBe(1)
    expect(state.showing).toBeNull()
    expect(currentCard(state)?.slug).toBe('b') // guess again
  })

  it('shows the answer after a correct pick, and ignores names until Next', () => {
    let state = run(newGame(DECK), guess('a'))
    expect(state.showing).toBe('correct')
    expect(state.results).toEqual({ a: 'correct' })
    expect(run(state, guess('b'))).toBe(state)
    state = run(state, next())
    expect(currentCard(state)?.slug).toBe('b')
  })

  it('ignores names already matched or skipped', () => {
    const state = run(newGame(DECK), guess('a'), next())
    expect(run(state, guess('a'))).toBe(state)
  })

  it('skips: marks the leader, resets the streak, shows the answer', () => {
    const state = run(newGame(DECK), guess('a'), next(), {
      type: 'skip',
      now: 1500,
    })
    expect(state.results).toEqual({ a: 'correct', b: 'skipped' })
    expect(state.showing).toBe('skipped')
    expect(state.streak).toBe(0)
  })

  it('tracks the best streak and finishes on the last Next', () => {
    const state = run(
      newGame(DECK),
      guess('a'),
      next(),
      guess('b'),
      next(),
      guess('c'),
      next(9000),
    )
    expect(matchedCount(state)).toBe(3)
    expect(state.bestStreak).toBe(3)
    expect(isFinished(state)).toBe(true)
    expect(state.finishedAt).toBe(9000)
    expect(currentCard(state)).toBeNull()
    expect(run(state, guess('a'))).toBe(state)
  })

  it('starts over completely on a new game', () => {
    const played = run(newGame(DECK), guess('b'), guess('a'))
    expect(run(played, { type: 'new-game', deck: DECK })).toEqual(newGame(DECK))
  })
})
