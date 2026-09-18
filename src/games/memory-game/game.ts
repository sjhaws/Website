// Memory Game rules as a pure reducer, so they can be tested without React.
// Timing (the pause before a pair settles, and the clock) lives in the
// component; the reducer only records when things happened.

export type Difficulty = 'easy' | 'hard'

export interface Card {
  id: number
  face: string
}

export interface GameState {
  difficulty: Difficulty
  cards: Card[]
  /** Indexes of unmatched cards currently face up: at most two. */
  faceUp: number[]
  matched: boolean[]
  /** Every pair turned over counts, matched or not. */
  tries: number
  /** When the first card was flipped (the clock starts then), in ms. */
  startedAt: number | null
  /** When the last pair was matched, in ms. */
  finishedAt: number | null
}

export type Action =
  | { type: 'new-game'; difficulty: Difficulty; cards: Card[] }
  | { type: 'flip'; index: number; now: number }
  | { type: 'settle'; now: number }

/** How long a turned-over pair stays visible before the board accepts clicks again. */
export const MATCH_PAUSE_MS = 500
export const MISS_PAUSE_MS = 1000

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

/** Two cards per face, shuffled. */
export function buildDeck(
  faces: readonly string[],
  random: () => number = Math.random,
): Card[] {
  return shuffle(
    faces.flatMap((face) => [face, face]),
    random,
  ).map((face, id) => ({ id, face }))
}

export function newGame(difficulty: Difficulty, cards: Card[]): GameState {
  return {
    difficulty,
    cards,
    faceUp: [],
    matched: cards.map(() => false),
    tries: 0,
    startedAt: null,
    finishedAt: null,
  }
}

/** Whether the two face-up cards are a pair (still waiting to settle). */
export function isPairShowing(state: GameState): boolean {
  const [a, b] = state.faceUp
  return (
    state.faceUp.length === 2 && state.cards[a].face === state.cards[b].face
  )
}

export function isWon(state: GameState): boolean {
  return state.finishedAt !== null
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'new-game':
      return newGame(action.difficulty, action.cards)

    case 'flip': {
      const { index } = action
      // Ignore clicks while a pair is showing, on cards already up, or after the win.
      if (
        isWon(state) ||
        state.faceUp.length === 2 ||
        state.faceUp.includes(index) ||
        state.matched[index]
      ) {
        return state
      }
      const faceUp = [...state.faceUp, index]
      return {
        ...state,
        faceUp,
        tries: faceUp.length === 2 ? state.tries + 1 : state.tries,
        startedAt: state.startedAt ?? action.now,
      }
    }

    case 'settle': {
      if (state.faceUp.length !== 2) return state
      if (!isPairShowing(state)) return { ...state, faceUp: [] }
      const matched = state.matched.map(
        (isMatched, i) => isMatched || state.faceUp.includes(i),
      )
      return {
        ...state,
        faceUp: [],
        matched,
        finishedAt: matched.every(Boolean) ? action.now : null,
      }
    }
  }
}
