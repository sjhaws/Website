export const CHOICES = ['rock', 'paper', 'scissors'] as const
export type Choice = (typeof CHOICES)[number]
export type Outcome = 'win' | 'lose' | 'draw'

export const CHOICE_NAMES: Record<Choice, string> = {
  rock: 'Rock',
  paper: 'Paper',
  scissors: 'Scissors',
}

// What each choice beats.
const BEATS: Record<Choice, Choice> = {
  rock: 'scissors',
  paper: 'rock',
  scissors: 'paper',
}

/** The result of a round, from the player's point of view. */
export function outcome(player: Choice, computer: Choice): Outcome {
  if (player === computer) return 'draw'
  return BEATS[player] === computer ? 'win' : 'lose'
}

export function randomChoice(random: () => number = Math.random): Choice {
  return CHOICES[Math.floor(random() * CHOICES.length)]
}

export interface Totals {
  wins: number
  losses: number
  draws: number
}

export const NO_TOTALS: Totals = { wins: 0, losses: 0, draws: 0 }

export function isTotals(value: unknown): value is Totals {
  if (typeof value !== 'object' || value === null) return false
  const totals = value as Record<string, unknown>
  return (['wins', 'losses', 'draws'] as const).every(
    (key) => Number.isInteger(totals[key]) && (totals[key] as number) >= 0,
  )
}

export function addRound(totals: Totals, result: Outcome): Totals {
  switch (result) {
    case 'win':
      return { ...totals, wins: totals.wins + 1 }
    case 'lose':
      return { ...totals, losses: totals.losses + 1 }
    case 'draw':
      return { ...totals, draws: totals.draws + 1 }
  }
}
