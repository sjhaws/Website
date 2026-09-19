import { describe, expect, it } from 'vitest'
import { GAMES } from '../../games/registry.ts'
import {
  chooseKinds,
  choosePrizes,
  COLS,
  dig,
  FOOTPRINTS,
  GEM_KINDS,
  isFound,
  LAYERS,
  newSand,
  placeTreasures,
  ROWS,
  uncovered,
  type Sand,
  type Treasure,
} from './sand.ts'

// A repeatable stand-in for Math.random (mulberry32).
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const at = (sand: Sand, col: number, row: number) =>
  sand.depth[row * COLS + col]

const RUBY: Treasure = {
  kind: 'ruby',
  col: 10,
  row: 5,
  prize: { type: 'cf4g' },
}
const EMPTY: Sand = {
  depth: Array(COLS * ROWS).fill(LAYERS),
  treasures: [RUBY],
}

describe('a new sand pit', () => {
  it('starts full of sand, with 5 different gems, a skull and 2 bones', () => {
    const sand = newSand(seeded(1))
    expect(sand.depth).toHaveLength(COLS * ROWS)
    expect(sand.depth.every((d) => d === LAYERS)).toBe(true)

    const kinds = sand.treasures.map((t) => t.kind)
    const gems = kinds.filter((k) =>
      (GEM_KINDS as readonly string[]).includes(k),
    )
    expect(new Set(gems).size).toBe(5)
    expect(kinds.filter((k) => k === 'skull')).toHaveLength(1)
    expect(kinds.filter((k) => k.endsWith('bone'))).toHaveLength(2)
  })

  it('keeps treasures off the edge and at least a cell apart', () => {
    for (let seed = 0; seed < 200; seed++) {
      const spots = placeTreasures(chooseKinds(seeded(seed)), seeded(seed + 1))
      spots.forEach((a, i) => {
        const size = FOOTPRINTS[a.kind]
        expect(a.col).toBeGreaterThanOrEqual(1)
        expect(a.row).toBeGreaterThanOrEqual(1)
        expect(a.col + size.w).toBeLessThanOrEqual(COLS - 1)
        expect(a.row + size.h).toBeLessThanOrEqual(ROWS - 1)
        for (const b of spots.slice(i + 1)) {
          const other = FOOTPRINTS[b.kind]
          const apart =
            a.col > b.col + other.w ||
            b.col > a.col + size.w ||
            a.row > b.row + other.h ||
            b.row > a.row + size.h
          expect(apart, `${a.kind} and ${b.kind}, seed ${seed}`).toBe(true)
        }
      })
    }
  })
})

describe('prizes', () => {
  it('includes a game, cf4g and a rickroll in every pit', () => {
    for (let seed = 0; seed < 100; seed++) {
      const types = choosePrizes(8, seeded(seed)).map((p) => p.type)
      expect(types).toHaveLength(8)
      expect(types).toContain('game')
      expect(types).toContain('cf4g')
      expect(types).toContain('rickroll')
    }
  })

  it('only sends players to games that exist', () => {
    const slugs = GAMES.map((g) => g.slug)
    for (let seed = 0; seed < 100; seed++) {
      for (const prize of choosePrizes(8, seeded(seed))) {
        if (prize.type === 'game') expect(slugs).toContain(prize.slug)
      }
    }
  })
})

describe('digging', () => {
  it('takes one layer from the 3×3 block under the trowel', () => {
    const sand = dig(EMPTY, 5, 5)
    for (let row = 3; row <= 7; row++) {
      for (let col = 3; col <= 7; col++) {
        const under = Math.abs(col - 5) <= 1 && Math.abs(row - 5) <= 1
        expect(at(sand, col, row), `${col},${row}`).toBe(
          under ? LAYERS - 1 : LAYERS,
        )
      }
    }
  })

  it('reaches bare ground after one scoop per layer, then changes nothing', () => {
    let sand = EMPTY
    for (let i = 0; i < LAYERS; i++) sand = dig(sand, 5, 5)
    expect(at(sand, 5, 5)).toBe(0)
    expect(dig(sand, 5, 5)).toBe(sand)
  })

  it('stays inside the pit at the edges', () => {
    const sand = dig(EMPTY, 0, 0)
    expect(at(sand, 0, 0)).toBe(LAYERS - 1)
    expect(at(sand, 1, 1)).toBe(LAYERS - 1)
    expect(sand.depth).toHaveLength(COLS * ROWS)
    expect(dig(EMPTY, COLS - 1, ROWS - 1).depth).toHaveLength(COLS * ROWS)
  })

  it('does not change the pit it was given', () => {
    dig(EMPTY, 5, 5)
    expect(EMPTY.depth.every((d) => d === LAYERS)).toBe(true)
  })
})

describe('finding treasure', () => {
  it('counts only the cells dug all the way down', () => {
    let sand = EMPTY
    sand = dig(dig(sand, 10, 5), 10, 5) // two layers: nothing bare yet
    expect(uncovered(sand, RUBY)).toBe(0)
    sand = dig(sand, 10, 5) // the ruby's top-left 2×2 corner is now bare
    expect(uncovered(sand, RUBY)).toBeCloseTo(4 / 9)
    expect(isFound(sand, RUBY)).toBe(false)
  })

  it('pops the treasure out once half of it is uncovered', () => {
    let sand = EMPTY
    for (let i = 0; i < LAYERS; i++) sand = dig(sand, 11, 6)
    expect(uncovered(sand, RUBY)).toBe(1)
    expect(isFound(sand, RUBY)).toBe(true)
  })
})
