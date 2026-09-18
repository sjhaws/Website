import { describe, expect, it } from 'vitest'
import {
  buildDeck,
  isPairShowing,
  isWon,
  newGame,
  reducer,
  type Card,
  type GameState,
} from './game.ts'

// A fixed layout: cat, dog, cat, dog.
const CARDS: Card[] = [
  { id: 0, face: 'cat' },
  { id: 1, face: 'dog' },
  { id: 2, face: 'cat' },
  { id: 3, face: 'dog' },
]

function flip(state: GameState, index: number, now = 1000) {
  return reducer(state, { type: 'flip', index, now })
}

function settle(state: GameState, now = 2000) {
  return reducer(state, { type: 'settle', now })
}

describe('buildDeck', () => {
  it('has exactly two of every face', () => {
    const faces = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
    const deck = buildDeck(faces)
    expect(deck).toHaveLength(20)
    for (const face of faces) {
      expect(deck.filter((card) => card.face === face)).toHaveLength(2)
    }
    expect(new Set(deck.map((card) => card.id)).size).toBe(20)
  })

  it('uses the random source to shuffle', () => {
    const inOrder = buildDeck(['a', 'b'], () => 0.999)
    const reversed = buildDeck(['a', 'b'], () => 0)
    expect(inOrder.map((card) => card.face)).toEqual(['a', 'a', 'b', 'b'])
    expect(reversed.map((card) => card.face)).not.toEqual(['a', 'a', 'b', 'b'])
  })
})

describe('flipping', () => {
  it('starts the clock on the first flip and counts a try on the second', () => {
    let state = flip(newGame('easy', CARDS), 0, 1234)
    expect(state.startedAt).toBe(1234)
    expect(state.tries).toBe(0)
    state = flip(state, 1, 5000)
    expect(state.faceUp).toEqual([0, 1])
    expect(state.tries).toBe(1)
    expect(state.startedAt).toBe(1234)
  })

  it('ignores the same card twice, a third card, and matched cards', () => {
    let state = flip(newGame('easy', CARDS), 0)
    expect(flip(state, 0)).toBe(state)
    state = flip(state, 1)
    expect(flip(state, 2)).toBe(state)

    const matched = settle(flip(flip(newGame('easy', CARDS), 0), 2))
    expect(matched.matched[0]).toBe(true)
    expect(flip(matched, 0)).toBe(matched)
  })
})

describe('settling', () => {
  it('keeps a matching pair face up', () => {
    const state = flip(flip(newGame('easy', CARDS), 0), 2)
    expect(isPairShowing(state)).toBe(true)
    const settled = settle(state)
    expect(settled.matched).toEqual([true, false, true, false])
    expect(settled.faceUp).toEqual([])
  })

  it('turns a mismatched pair back over', () => {
    const state = flip(flip(newGame('easy', CARDS), 0), 1)
    expect(isPairShowing(state)).toBe(false)
    const settled = settle(state)
    expect(settled.matched).toEqual([false, false, false, false])
    expect(settled.faceUp).toEqual([])
    expect(settled.tries).toBe(1)
  })

  it('does nothing with fewer than two cards up', () => {
    const state = flip(newGame('easy', CARDS), 0)
    expect(settle(state)).toBe(state)
  })

  it('stops the clock when the last pair is matched', () => {
    let state = settle(flip(flip(newGame('easy', CARDS), 0), 2), 3000)
    expect(isWon(state)).toBe(false)
    state = settle(flip(flip(state, 1), 3), 9000)
    expect(isWon(state)).toBe(true)
    expect(state.finishedAt).toBe(9000)
    expect(state.tries).toBe(2)
    expect(flip(state, 0)).toBe(state)
  })
})

describe('new game', () => {
  it('clears everything, including a half-turned pair', () => {
    const midGame = flip(settle(flip(flip(newGame('easy', CARDS), 0), 1)), 3)
    const fresh = reducer(midGame, {
      type: 'new-game',
      difficulty: 'hard',
      cards: CARDS,
    })
    expect(fresh).toEqual(newGame('hard', CARDS))
    expect(fresh.faceUp).toEqual([])
    expect(fresh.tries).toBe(0)
    expect(fresh.startedAt).toBeNull()
  })
})
