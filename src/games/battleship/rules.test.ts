import { describe, expect, it } from 'vitest'
import {
  allSunk,
  BOARD_SIZE,
  canPlace,
  cellKey,
  easyTarget,
  fire,
  inBounds,
  nextShip,
  normalTarget,
  placeShip,
  randomFleet,
  shipCells,
  SHIPS,
  type Cell,
  type PlacedShip,
  type Shot,
} from './rules.ts'

// Small seeded generator so "random" tests are repeatable.
function seeded(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const hit = (row: number, col: number): Shot => ({
  cell: { row, col },
  result: 'hit',
})
const miss = (row: number, col: number): Shot => ({
  cell: { row, col },
  result: 'miss',
})
const isNeighbour = (a: Cell, b: Cell) =>
  Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1

function fleetOf(
  ...ships: [
    name: PlacedShip['name'],
    start: Cell,
    direction: PlacedShip['direction'],
  ][]
): PlacedShip[] {
  return ships.map(([name, start, direction]) => {
    const size = SHIPS.find((s) => s.name === name)!.size
    return { name, size, direction, cells: shipCells(start, size, direction) }
  })
}

describe('placement', () => {
  it('runs ships right or down from the start cell', () => {
    expect(shipCells({ row: 2, col: 3 }, 3, 'horizontal')).toEqual([
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      { row: 2, col: 5 },
    ])
    expect(shipCells({ row: 2, col: 3 }, 2, 'vertical')).toEqual([
      { row: 2, col: 3 },
      { row: 3, col: 3 },
    ])
  })

  it('keeps ships on the board and apart, but lets them touch', () => {
    const fleet = placeShip([], { row: 0, col: 0 }, 'horizontal') // Carrier on row 0
    expect(canPlace(fleet, 4, { row: 0, col: 7 }, 'horizontal')).toBe(false) // off the edge
    expect(canPlace(fleet, 4, { row: 0, col: 2 }, 'vertical')).toBe(false) // overlaps
    expect(canPlace(fleet, 4, { row: 1, col: 0 }, 'horizontal')).toBe(true) // touching
    expect(canPlace(fleet, 4, { row: 6, col: 9 }, 'vertical')).toBe(true) // ends on the last row
  })

  it('places ships in the fixed order', () => {
    let fleet: PlacedShip[] = []
    for (let row = 0; row < SHIPS.length; row++) {
      expect(nextShip(fleet)?.name).toBe(SHIPS[row].name)
      fleet = placeShip(fleet, { row, col: 0 }, 'horizontal')
    }
    expect(nextShip(fleet)).toBeNull()
    expect(placeShip(fleet, { row: 9, col: 0 }, 'horizontal')).toBe(fleet)
  })

  it('always builds a legal random fleet', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const fleet = randomFleet(seeded(seed))
      expect(fleet.map((ship) => ship.name)).toEqual(
        SHIPS.map((ship) => ship.name),
      )
      const cells = fleet.flatMap((ship) => ship.cells)
      expect(cells).toHaveLength(17)
      expect(cells.every(inBounds)).toBe(true)
      expect(new Set(cells.map(cellKey)).size).toBe(17)
    }
  })
})

describe('firing', () => {
  const fleet = fleetOf(['Destroyer', { row: 4, col: 4 }, 'horizontal'])

  it('reports hits, misses and the ship that sinks', () => {
    expect(fire(fleet, [], { row: 0, col: 0 })).toEqual({
      shot: miss(0, 0),
      sunk: null,
    })
    expect(fire(fleet, [], { row: 4, col: 4 })).toEqual({
      shot: hit(4, 4),
      sunk: null,
    })
    expect(fire(fleet, [hit(4, 4)], { row: 4, col: 5 }).sunk?.name).toBe(
      'Destroyer',
    )
  })

  it('knows when a whole fleet is sunk', () => {
    expect(allSunk(fleet, [hit(4, 4)])).toBe(false)
    expect(allSunk(fleet, [hit(4, 4), hit(4, 5)])).toBe(true)
  })
})

describe('easy enemy', () => {
  it('never repeats a cell', () => {
    const shots: Shot[] = []
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (row !== 7 || col !== 3) shots.push(miss(row, col))
      }
    }
    expect(easyTarget(shots, seeded(1))).toEqual({ row: 7, col: 3 })
  })
})

describe('normal enemy', () => {
  const fleet = fleetOf(
    ['Destroyer', { row: 0, col: 0 }, 'horizontal'],
    ['Cruiser', { row: 5, col: 5 }, 'vertical'],
  )

  it('hunts at random with no damaged ships', () => {
    const shots = [miss(9, 9)]
    expect(normalTarget(shots, fleet, seeded(3))).toEqual(
      easyTarget(shots, seeded(3)),
    )
  })

  it('tries the cells next to a hit', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const target = normalTarget([hit(5, 5)], fleet, seeded(seed))
      expect(isNeighbour(target, { row: 5, col: 5 })).toBe(true)
    }
  })

  it('extends a line of hits', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const target = normalTarget([hit(5, 5), hit(6, 5)], fleet, seeded(seed))
      expect([
        cellKey({ row: 4, col: 5 }),
        cellKey({ row: 7, col: 5 }),
      ]).toContain(cellKey(target))
    }
  })

  it('falls back to neighbours when both ends of a line are open water', () => {
    // Two ships side by side: the vertical "line" of hits is really two ships.
    const sideBySide = fleetOf(
      ['Cruiser', { row: 5, col: 5 }, 'horizontal'],
      ['Destroyer', { row: 6, col: 5 }, 'horizontal'],
    )
    const shots = [hit(5, 5), hit(6, 5), miss(4, 5), miss(7, 5)]
    for (let seed = 1; seed <= 20; seed++) {
      const target = normalTarget(shots, sideBySide, seeded(seed))
      expect(
        isNeighbour(target, { row: 5, col: 5 }) ||
          isNeighbour(target, { row: 6, col: 5 }),
      ).toBe(true)
    }
  })

  it('keeps chasing a damaged ship after sinking a different one', () => {
    // Hit the cruiser once, then sink the destroyer.
    const shots = [hit(5, 5), hit(0, 0), hit(0, 1)]
    for (let seed = 1; seed <= 20; seed++) {
      expect(
        isNeighbour(normalTarget(shots, fleet, seeded(seed)), {
          row: 5,
          col: 5,
        }),
      ).toBe(true)
    }
  })

  it('ignores hits on ships already sunk', () => {
    const shots = [hit(0, 0), hit(0, 1)]
    expect(normalTarget(shots, fleet, seeded(4))).toEqual(
      easyTarget(shots, seeded(4)),
    )
  })
})
