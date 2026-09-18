// Apostle Flashcards rules as a pure reducer. The component supplies the time
// (`now`) and the shuffled deck.
import type { Leader } from './leaders.ts'

export interface Card {
  slug: string
  clue: string
}

export type Outcome = 'correct' | 'skipped'

export interface GameState {
  deck: Card[]
  position: number
  /** How each leader was resolved so far, by slug. */
  results: Record<string, Outcome>
  /** Set while the answer card is showing, until Next is pressed. */
  showing: Outcome | null
  streak: number
  bestStreak: number
  /** Wrong names picked. */
  misses: number
  /** When the first guess or skip happened: the clock starts then. */
  startedAt: number | null
  /** When Finish was pressed on the last card. */
  finishedAt: number | null
}

export type Action =
  | { type: 'new-game'; deck: Card[] }
  | { type: 'guess'; slug: string; now: number }
  | { type: 'skip'; now: number }
  | { type: 'next'; now: number }

export function shuffle<T>(
  items: T[],
  random: () => number = Math.random,
): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Every leader once, in random order, each with one of their facts as the clue. */
export function buildDeck(
  leaders: Leader[],
  random: () => number = Math.random,
): Card[] {
  return shuffle(leaders, random).map((leader) => ({
    slug: leader.slug,
    clue: leader.facts[Math.floor(random() * leader.facts.length)],
  }))
}

export function surname(name: string): string {
  return name.trim().split(/\s+/).pop() ?? name
}

/** The roster stays in this order: alphabetical by surname. */
export function rosterOrder(leaders: Leader[]): Leader[] {
  return [...leaders].sort((a, b) =>
    surname(a.name).localeCompare(surname(b.name)),
  )
}

export function newGame(deck: Card[]): GameState {
  return {
    deck,
    position: 0,
    results: {},
    showing: null,
    streak: 0,
    bestStreak: 0,
    misses: 0,
    startedAt: null,
    finishedAt: null,
  }
}

export function currentCard(state: GameState): Card | null {
  return state.deck[state.position] ?? null
}

export function matchedCount(state: GameState): number {
  return Object.values(state.results).filter((result) => result === 'correct')
    .length
}

export function isFinished(state: GameState): boolean {
  return state.finishedAt !== null
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'new-game':
      return newGame(action.deck)

    case 'guess': {
      const card = currentCard(state)
      // Ignore names while the answer is showing, and names already resolved.
      if (!card || state.showing || state.results[action.slug]) return state
      const startedAt = state.startedAt ?? action.now
      if (action.slug !== card.slug) {
        return { ...state, startedAt, misses: state.misses + 1, streak: 0 }
      }
      const streak = state.streak + 1
      return {
        ...state,
        startedAt,
        results: { ...state.results, [card.slug]: 'correct' },
        showing: 'correct',
        streak,
        bestStreak: Math.max(state.bestStreak, streak),
      }
    }

    case 'skip': {
      const card = currentCard(state)
      if (!card || state.showing) return state
      return {
        ...state,
        startedAt: state.startedAt ?? action.now,
        results: { ...state.results, [card.slug]: 'skipped' },
        showing: 'skipped',
        streak: 0,
      }
    }

    case 'next': {
      if (!state.showing) return state
      const position = state.position + 1
      return {
        ...state,
        position,
        showing: null,
        finishedAt: position >= state.deck.length ? action.now : null,
      }
    }
  }
}
