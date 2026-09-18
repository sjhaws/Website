// Battleship rules: fleets, shots and the enemy's targeting. Pure functions,
// so they can be tested without React. `random` parameters default to
// Math.random and can be replaced in tests.

export const BOARD_SIZE = 10

export const SHIPS = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 },
] as const

export type ShipName = (typeof SHIPS)[number]['name']
export type Direction = 'horizontal' | 'vertical'

export interface Cell {
  row: number
  col: number
}

export interface PlacedShip {
  name: ShipName
  size: number
  direction: Direction
  cells: Cell[]
}

export interface Shot {
  cell: Cell
  result: 'hit' | 'miss'
}

export type Random = () => number

const ORTHOGONAL = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const

export const cellKey = ({ row, col }: Cell) => `${row},${col}`

export function inBounds({ row, col }: Cell): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE
}

function pick<T>(items: T[], random: Random): T {
  return items[Math.floor(random() * items.length)]
}

/** The cells a ship covers, running right (horizontal) or down (vertical) from `start`. */
export function shipCells(
  start: Cell,
  size: number,
  direction: Direction,
): Cell[] {
  return Array.from({ length: size }, (_, i) =>
    direction === 'horizontal'
      ? { row: start.row, col: start.col + i }
      : { row: start.row + i, col: start.col },
  )
}

/** Ships must stay on the board and can't overlap, but they may touch. */
export function canPlace(
  fleet: PlacedShip[],
  size: number,
  start: Cell,
  direction: Direction,
): boolean {
  const taken = new Set(fleet.flatMap((ship) => ship.cells.map(cellKey)))
  return shipCells(start, size, direction).every(
    (cell) => inBounds(cell) && !taken.has(cellKey(cell)),
  )
}

/** The next ship to place, in the fixed order, or null when the fleet is complete. */
export function nextShip(fleet: PlacedShip[]) {
  return SHIPS[fleet.length] ?? null
}

export function placeShip(
  fleet: PlacedShip[],
  start: Cell,
  direction: Direction,
): PlacedShip[] {
  const ship = nextShip(fleet)
  if (!ship) return fleet
  return [
    ...fleet,
    { ...ship, direction, cells: shipCells(start, ship.size, direction) },
  ]
}

export function randomFleet(random: Random = Math.random): PlacedShip[] {
  let fleet: PlacedShip[] = []
  for (const ship of SHIPS) {
    for (;;) {
      const direction: Direction = random() < 0.5 ? 'horizontal' : 'vertical'
      const start = {
        row: Math.floor(random() * BOARD_SIZE),
        col: Math.floor(random() * BOARD_SIZE),
      }
      if (canPlace(fleet, ship.size, start, direction)) {
        fleet = placeShip(fleet, start, direction)
        break
      }
    }
  }
  return fleet
}

export function shipAt(
  fleet: PlacedShip[],
  cell: Cell,
): PlacedShip | undefined {
  return fleet.find((ship) =>
    ship.cells.some((c) => c.row === cell.row && c.col === cell.col),
  )
}

export function isSunk(ship: PlacedShip, shots: Shot[]): boolean {
  const fired = new Set(shots.map((shot) => cellKey(shot.cell)))
  return ship.cells.every((cell) => fired.has(cellKey(cell)))
}

export function allSunk(fleet: PlacedShip[], shots: Shot[]): boolean {
  return fleet.length > 0 && fleet.every((ship) => isSunk(ship, shots))
}

export function hasShot(shots: Shot[], cell: Cell): boolean {
  return shots.some(
    (shot) => shot.cell.row === cell.row && shot.cell.col === cell.col,
  )
}

/** Fires at `cell`. Returns the shot and, if it finished a ship off, that ship. */
export function fire(
  fleet: PlacedShip[],
  shots: Shot[],
  cell: Cell,
): { shot: Shot; sunk: PlacedShip | null } {
  const target = shipAt(fleet, cell)
  const shot: Shot = { cell, result: target ? 'hit' : 'miss' }
  const sunk = target && isSunk(target, [...shots, shot]) ? target : null
  return { shot, sunk }
}

export function untriedCells(shots: Shot[]): Cell[] {
  const fired = new Set(shots.map((shot) => cellKey(shot.cell)))
  const cells: Cell[] = []
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (!fired.has(cellKey({ row, col }))) cells.push({ row, col })
    }
  }
  return cells
}

/** Easy enemy: any cell it hasn't tried. */
export function easyTarget(shots: Shot[], random: Random = Math.random): Cell {
  return pick(untriedCells(shots), random)
}

/**
 * Normal enemy: hunts at random until it hits something, then works on every
 * ship it has damaged but not sunk, even after sinking a different one. With
 * two or more hits in a line it keeps extending that line; otherwise it tries
 * the cells next to a hit.
 */
export function normalTarget(
  shots: Shot[],
  targetFleet: PlacedShip[],
  random: Random = Math.random,
): Cell {
  const fired = new Set(shots.map((shot) => cellKey(shot.cell)))
  const sunkCells = new Set(
    targetFleet
      .filter((ship) => isSunk(ship, shots))
      .flatMap((ship) => ship.cells.map(cellKey)),
  )
  const damaged = shots
    .filter(
      (shot) => shot.result === 'hit' && !sunkCells.has(cellKey(shot.cell)),
    )
    .map((shot) => shot.cell)
  if (damaged.length === 0) return easyTarget(shots, random)

  const damagedKeys = new Set(damaged.map(cellKey))
  const isUntried = (cell: Cell) => inBounds(cell) && !fired.has(cellKey(cell))
  const step = (cell: Cell, dr: number, dc: number) => ({
    row: cell.row + dr,
    col: cell.col + dc,
  })

  const lineEnds: Cell[] = []
  for (const hit of damaged) {
    for (const [dr, dc] of [
      [0, 1],
      [1, 0],
    ] as const) {
      if (!damagedKeys.has(cellKey(step(hit, dr, dc)))) continue
      let first = hit
      while (damagedKeys.has(cellKey(step(first, -dr, -dc))))
        first = step(first, -dr, -dc)
      let last = hit
      while (damagedKeys.has(cellKey(step(last, dr, dc))))
        last = step(last, dr, dc)
      lineEnds.push(
        ...[step(first, -dr, -dc), step(last, dr, dc)].filter(isUntried),
      )
    }
  }
  if (lineEnds.length > 0) return pick(lineEnds, random)

  const neighbours = damaged
    .flatMap((hit) => ORTHOGONAL.map(([dr, dc]) => step(hit, dr, dc)))
    .filter(isUntried)
  if (neighbours.length > 0) return pick(neighbours, random)

  return easyTarget(shots, random)
}
