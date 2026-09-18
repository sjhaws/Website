// Resistor Challenge round logic as a pure reducer. The component supplies
// the time (`now`) and the next resistor, and owns the saved high scores.
import { isCorrect, type Resistor } from './resistor.ts'

export const ROUND_MS = 60_000
/** Answering right on the first try gives back this much time. */
export const FIRST_TRY_BONUS_MS = 1_000
/** Skipping a resistor costs this much time. */
export const SKIP_PENALTY_MS = 3_000
export const MAX_POINTS = 5
export const HIGH_SCORE_COUNT = 5

export type View = 'menu' | 'rules' | 'scores' | 'game'

export type Feedback =
  | { type: 'correct'; points: number; bonus: boolean }
  | { type: 'wrong' }
  | { type: 'skipped'; resistor: Resistor }

export interface GameState {
  view: View
  resistor: Resistor
  /** What the current resistor is worth: 5, minus 1 per wrong try, at least 1. */
  points: number
  score: number
  startedAt: number
  /** Net time given back (negative) or taken (positive) by bonuses and skips. */
  adjustmentMs: number
  feedback: Feedback | null
  /** The score of the round that just ended, shown on the High Scores view. */
  finalScore: number | null
}

export type Action =
  | { type: 'show'; view: Exclude<View, 'game'> }
  | { type: 'start'; now: number; resistor: Resistor }
  | { type: 'answer'; ohms: string; tolerance: string; next: Resistor }
  | { type: 'skip'; next: Resistor }
  | { type: 'time-up' }
  | { type: 'exit' }

export function initialState(resistor: Resistor): GameState {
  return {
    view: 'menu',
    resistor,
    points: MAX_POINTS,
    score: 0,
    startedAt: 0,
    adjustmentMs: 0,
    feedback: null,
    finalScore: null,
  }
}

export function remainingMs(state: GameState, now: number): number {
  return Math.max(0, ROUND_MS - (now - state.startedAt + state.adjustmentMs))
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'show':
      return { ...state, view: action.view, finalScore: null }

    case 'start':
      return {
        ...initialState(action.resistor),
        view: 'game',
        startedAt: action.now,
      }

    case 'answer': {
      if (state.view !== 'game') return state
      if (!isCorrect(state.resistor, action.ohms, action.tolerance)) {
        return {
          ...state,
          points: Math.max(1, state.points - 1),
          feedback: { type: 'wrong' },
        }
      }
      const bonus = state.points === MAX_POINTS
      return {
        ...state,
        resistor: action.next,
        points: MAX_POINTS,
        score: state.score + state.points,
        adjustmentMs: state.adjustmentMs - (bonus ? FIRST_TRY_BONUS_MS : 0),
        feedback: { type: 'correct', points: state.points, bonus },
      }
    }

    case 'skip':
      if (state.view !== 'game') return state
      return {
        ...state,
        resistor: action.next,
        points: MAX_POINTS,
        adjustmentMs: state.adjustmentMs + SKIP_PENALTY_MS,
        feedback: { type: 'skipped', resistor: state.resistor },
      }

    case 'time-up':
      if (state.view !== 'game') return state
      return { ...state, view: 'scores', finalScore: state.score }

    case 'exit':
      // Leaving mid-round records nothing.
      return { ...state, view: 'menu', feedback: null, finalScore: null }
  }
}

/** Adds a score to the top five. A score equal to an existing one goes above it. */
export function addHighScore(scores: number[], score: number): number[] {
  const index = scores.findIndex((s) => score >= s)
  const updated =
    index === -1
      ? [...scores, score]
      : [...scores.slice(0, index), score, ...scores.slice(index)]
  return updated.slice(0, HIGH_SCORE_COUNT)
}

export function isHighScoreList(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length <= HIGH_SCORE_COUNT &&
    value.every((score) => Number.isInteger(score) && score >= 0)
  )
}
