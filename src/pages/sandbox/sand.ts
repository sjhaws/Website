import { GAMES } from '../../games/registry.ts'

// The sand pit is a grid of cells, each holding up to LAYERS of sand. Every
// scoop of the trowel removes one layer from the cells under it.
export const COLS = 32
export const ROWS = 20
export const LAYERS = 3
/** How far a scoop reaches from the cell it lands on, in cells. */
export const SCOOP_RADIUS = 1.5
/** A treasure pops out once this share of the sand over it is dug away. */
export const FOUND_AT = 0.5

export const CF4G_URL = 'https://cf4g.netlify.app'

export const GEM_KINDS = [
  'ruby',
  'emerald',
  'sapphire',
  'amethyst',
  'topaz',
  'diamond',
] as const
export type GemKind = (typeof GEM_KINDS)[number]
export type TreasureKind = GemKind | 'bone' | 'upright-bone' | 'skull'

export const TREASURE_NAMES: Record<TreasureKind, string> = {
  ruby: 'Ruby',
  emerald: 'Emerald',
  sapphire: 'Sapphire',
  amethyst: 'Amethyst',
  topaz: 'Topaz',
  diamond: 'Diamond',
  bone: 'Bone',
  'upright-bone': 'Bone',
  skull: 'Skull',
}

/** The size of each treasure, in cells. */
export const FOOTPRINTS: Record<TreasureKind, { w: number; h: number }> = {
  ruby: { w: 3, h: 3 },
  emerald: { w: 3, h: 3 },
  sapphire: { w: 3, h: 3 },
  amethyst: { w: 3, h: 3 },
  topaz: { w: 3, h: 3 },
  diamond: { w: 3, h: 3 },
  bone: { w: 5, h: 2 },
  'upright-bone': { w: 2, h: 5 },
  skull: { w: 3, h: 3 },
}

/** Where a treasure leads when it's clicked. */
export type Prize =
  { type: 'game'; slug: string } | { type: 'cf4g' } | { type: 'rickroll' }

export interface Treasure {
  kind: TreasureKind
  col: number
  row: number
  prize: Prize
}

export interface Sand {
  /** Layers left in each cell, row by row. 0 is dug all the way down. */
  depth: readonly number[]
  treasures: readonly Treasure[]
}

type Random = () => number

const GAME_SLUGS = GAMES.map((game) => game.slug)

function pick<T>(items: readonly T[], random: Random): T {
  return items[Math.floor(random() * items.length)]
}

function shuffle<T>(items: readonly T[], random: Random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Five different gems, a skull and two bones lying either way. */
export function chooseKinds(random: Random = Math.random): TreasureKind[] {
  const gems = shuffle(GEM_KINDS, random).slice(0, 5)
  const bones = [0, 1].map(() =>
    random() < 0.5 ? ('bone' as const) : ('upright-bone' as const),
  )
  return [...gems, 'skull', ...bones]
}

/**
 * One prize per treasure. Every pit has at least one of each kind of prize;
 * the rest are chosen at random.
 */
export function choosePrizes(
  count: number,
  random: Random = Math.random,
  slugs: readonly string[] = GAME_SLUGS,
): Prize[] {
  const makers: (() => Prize)[] = [
    () => ({ type: 'game', slug: pick(slugs, random) }),
    () => ({ type: 'cf4g' }),
    () => ({ type: 'rickroll' }),
  ]
  const prizes = makers.map((make) => make())
  while (prizes.length < count) prizes.push(pick(makers, random)())
  return shuffle(prizes, random).slice(0, count)
}

/**
 * Finds a spot for each treasure, at least one cell from the edge and from
 * each other, so every find is its own dig.
 */
export function placeTreasures(
  kinds: readonly TreasureKind[],
  random: Random = Math.random,
): { kind: TreasureKind; col: number; row: number }[] {
  for (let attempt = 0; attempt < 100; attempt++) {
    const placed: { kind: TreasureKind; col: number; row: number }[] = []
    for (const kind of kinds) {
      const { w, h } = FOOTPRINTS[kind]
      for (let tries = 0; tries < 200; tries++) {
        const col = 1 + Math.floor(random() * (COLS - w - 1))
        const row = 1 + Math.floor(random() * (ROWS - h - 1))
        const clear = placed.every((other) => {
          const size = FOOTPRINTS[other.kind]
          return (
            col > other.col + size.w ||
            other.col > col + w ||
            row > other.row + size.h ||
            other.row > row + h
          )
        })
        if (clear) {
          placed.push({ kind, col, row })
          break
        }
      }
    }
    if (placed.length === kinds.length) return placed
  }
  throw new Error('No room for the treasures')
}

export function newSand(random: Random = Math.random): Sand {
  const spots = placeTreasures(chooseKinds(random), random)
  const prizes = choosePrizes(spots.length, random)
  return {
    depth: Array(COLS * ROWS).fill(LAYERS),
    treasures: spots.map((spot, i) => ({ ...spot, prize: prizes[i] })),
  }
}

/** Takes one layer from every cell within the scoop's reach. */
export function dig(sand: Sand, col: number, row: number): Sand {
  const reach = Math.floor(SCOOP_RADIUS)
  let depth: number[] | null = null
  for (let r = row - reach; r <= row + reach; r++) {
    for (let c = col - reach; c <= col + reach; c++) {
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue
      if (Math.hypot(c - col, r - row) > SCOOP_RADIUS) continue
      const i = r * COLS + c
      if (sand.depth[i] === 0) continue
      depth ??= [...sand.depth]
      depth[i]--
    }
  }
  return depth ? { ...sand, depth } : sand
}

/** The share of a treasure's cells that are dug all the way down. */
export function uncovered(sand: Sand, treasure: Treasure): number {
  const { w, h } = FOOTPRINTS[treasure.kind]
  let bare = 0
  for (let r = treasure.row; r < treasure.row + h; r++) {
    for (let c = treasure.col; c < treasure.col + w; c++) {
      if (sand.depth[r * COLS + c] === 0) bare++
    }
  }
  return bare / (w * h)
}

export function isFound(sand: Sand, treasure: Treasure): boolean {
  return uncovered(sand, treasure) >= FOUND_AT
}
