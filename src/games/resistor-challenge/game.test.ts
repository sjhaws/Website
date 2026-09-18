import { describe, expect, it } from 'vitest'
import {
  addHighScore,
  initialState,
  isHighScoreList,
  reducer,
  remainingMs,
  ROUND_MS,
  type Action,
  type GameState,
} from './game.ts'
import type { Resistor } from './resistor.ts'

const R1: Resistor = { first: 4, second: 7, multiplier: 2, tolerance: 'gold' } // 4.7 kΩ ±5%
const R2: Resistor = { first: 1, second: 0, multiplier: 0, tolerance: 'silver' } // 10 Ω ±10%

function run(state: GameState, ...actions: Action[]): GameState {
  return actions.reduce(reducer, state)
}

const started = () =>
  run(initialState(R2), { type: 'start', now: 1000, resistor: R1 })
const right: Action = { type: 'answer', ohms: '4.7k', tolerance: '5', next: R2 }
const wrong: Action = { type: 'answer', ohms: '47', tolerance: '5', next: R2 }

describe('a round', () => {
  it('starts with 60 seconds and nothing scored', () => {
    const state = started()
    expect(state.view).toBe('game')
    expect(state.score).toBe(0)
    expect(remainingMs(state, 1000)).toBe(ROUND_MS)
    expect(remainingMs(state, 31_000)).toBe(30_000)
  })

  it('scores 5 and gives back a second for a first-try answer', () => {
    const state = run(started(), right)
    expect(state.score).toBe(5)
    expect(state.resistor).toEqual(R2)
    expect(state.feedback).toEqual({ type: 'correct', points: 5, bonus: true })
    expect(remainingMs(state, 31_000)).toBe(31_000)
  })

  it('loses a point per wrong try, never below 1, with no bonus', () => {
    let state = run(started(), wrong)
    expect(state.points).toBe(4)
    expect(state.feedback).toEqual({ type: 'wrong' })
    expect(state.resistor).toEqual(R1) // must answer or skip to move on
    state = run(state, wrong, wrong, wrong, wrong, wrong)
    expect(state.points).toBe(1)
    state = run(state, right)
    expect(state.score).toBe(1)
    expect(state.feedback).toEqual({ type: 'correct', points: 1, bonus: false })
    expect(state.adjustmentMs).toBe(0)
  })

  it('scores nothing for a skip and costs three seconds', () => {
    const state = run(started(), wrong, { type: 'skip', next: R2 })
    expect(state.score).toBe(0)
    expect(state.points).toBe(5)
    expect(state.resistor).toEqual(R2)
    expect(state.feedback).toEqual({ type: 'skipped', resistor: R1 })
    expect(remainingMs(state, 31_000)).toBe(27_000)
  })

  it('never shows negative time', () => {
    expect(remainingMs(started(), 1_000_000)).toBe(0)
  })

  it('ends on the High Scores view with the final score', () => {
    const state = run(started(), right, { type: 'time-up' })
    expect(state.view).toBe('scores')
    expect(state.finalScore).toBe(5)
    expect(run(state, { type: 'time-up' })).toBe(state)
  })

  it('records nothing when you exit mid-round', () => {
    const state = run(started(), right, { type: 'exit' })
    expect(state.view).toBe('menu')
    expect(state.finalScore).toBeNull()
  })

  it('ignores answers outside a round', () => {
    const menu = initialState(R1)
    expect(run(menu, right)).toBe(menu)
    expect(run(menu, { type: 'skip', next: R2 })).toBe(menu)
  })
})

describe('high scores', () => {
  it('keeps the top five in order, a tie going above the older score', () => {
    expect(addHighScore([], 10)).toEqual([10])
    expect(addHighScore([30, 20, 10], 20)).toEqual([30, 20, 20, 10])
    expect(addHighScore([50, 40, 30, 20, 10], 35)).toEqual([50, 40, 35, 30, 20])
    expect(addHighScore([50, 40, 30, 20, 10], 5)).toEqual([50, 40, 30, 20, 10])
    expect(addHighScore([50, 40, 30, 20], 0)).toEqual([50, 40, 30, 20, 0])
  })

  it('only accepts saved lists that look right', () => {
    expect(isHighScoreList([40, 25, 0])).toBe(true)
    expect(isHighScoreList([])).toBe(true)
    expect(isHighScoreList([1, 2, 3, 4, 5, 6])).toBe(false)
    expect(isHighScoreList([10, -1])).toBe(false)
    expect(isHighScoreList('40,25')).toBe(false)
  })
})
