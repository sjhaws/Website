import { describe, expect, it } from 'vitest'
import {
  addRound,
  CHOICES,
  isTotals,
  NO_TOTALS,
  outcome,
  randomChoice,
} from './rules.ts'

describe('outcome', () => {
  it('scores all 9 combinations', () => {
    const results = CHOICES.flatMap((player) =>
      CHOICES.map(
        (computer) => `${player}-${computer}:${outcome(player, computer)}`,
      ),
    )
    expect(results).toEqual([
      'rock-rock:draw',
      'rock-paper:lose',
      'rock-scissors:win',
      'paper-rock:win',
      'paper-paper:draw',
      'paper-scissors:lose',
      'scissors-rock:lose',
      'scissors-paper:win',
      'scissors-scissors:draw',
    ])
  })
})

describe('randomChoice', () => {
  it('maps the whole random range onto the three choices', () => {
    expect(randomChoice(() => 0)).toBe('rock')
    expect(randomChoice(() => 0.34)).toBe('paper')
    expect(randomChoice(() => 0.999999)).toBe('scissors')
  })
})

describe('isTotals', () => {
  it('accepts saved totals', () => {
    expect(isTotals({ wins: 3, losses: 0, draws: 12 })).toBe(true)
  })

  it.each([
    null,
    'text',
    {},
    { wins: 1, losses: 2 },
    { wins: -1, losses: 0, draws: 0 },
    { wins: 1.5, losses: 0, draws: 0 },
  ])('rejects %j', (value) => {
    expect(isTotals(value)).toBe(false)
  })
})

describe('addRound', () => {
  it('adds one to the matching total only', () => {
    expect(addRound(NO_TOTALS, 'win')).toEqual({ wins: 1, losses: 0, draws: 0 })
    expect(addRound(NO_TOTALS, 'lose')).toEqual({
      wins: 0,
      losses: 1,
      draws: 0,
    })
    expect(addRound(NO_TOTALS, 'draw')).toEqual({
      wins: 0,
      losses: 0,
      draws: 1,
    })
  })
})
