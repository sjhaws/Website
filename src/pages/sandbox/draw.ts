import { COLS, LAYERS, ROWS, type Sand } from './sand.ts'

/** Canvas pixels per cell. CSS scales the canvas to fit the page. */
export const CELL = 16
export const WIDTH = COLS * CELL
export const HEIGHT = ROWS * CELL

// Three shades per layer, indexed by layers left - 1: damp sand at the
// bottom, dry sand on top.
const SHADES = [
  ['#b07a3a', '#a87234', '#b98342'],
  ['#d8aa5a', '#cfa050', '#e1b464'],
  ['#f2d28c', '#eac87e', '#f8dc9a'],
]
const GRAIN = ['#8f5f28', '#b98a43', '#d6b36c']

/** Steady per-cell noise, so the sand doesn't shimmer between frames. */
function noise(n: number): number {
  let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

/**
 * Draws the sand, leaving dug-out cells see-through so the pit floor and any
 * treasure underneath show. `marker` outlines the keyboard trowel's scoop.
 */
export function drawSand(
  ctx: CanvasRenderingContext2D,
  sand: Sand,
  marker: { col: number; row: number } | null,
) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT)
  const depthAt = (col: number, row: number, fallback: number) =>
    col < 0 || row < 0 || col >= COLS || row >= ROWS
      ? fallback
      : sand.depth[row * COLS + col]

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const i = row * COLS + col
      const depth = sand.depth[i]
      const x = col * CELL
      const y = row * CELL
      if (depth > 0) {
        ctx.fillStyle = SHADES[depth - 1][Math.floor(noise(i) * 3)]
        ctx.fillRect(x, y, CELL, CELL)
        ctx.fillStyle = GRAIN[depth - 1]
        for (let g = 1; g <= 2; g++) {
          const gx = Math.floor(noise(i * 5 + g) * (CELL - 2))
          const gy = Math.floor(noise(i * 7 + g) * (CELL - 2))
          ctx.fillRect(x + gx, y + gy, 2, 2)
        }
      }
      // Sand that's higher above or to the left casts a shadow into the dip.
      const above = depthAt(col, row - 1, depth) - depth
      const left = depthAt(col - 1, row, depth) - depth
      if (above > 0) {
        ctx.fillStyle = `rgba(40, 20, 0, ${0.15 + 0.12 * above})`
        ctx.fillRect(x, y, CELL, 5)
      }
      if (left > 0) {
        ctx.fillStyle = `rgba(40, 20, 0, ${0.1 + 0.08 * left})`
        ctx.fillRect(x, y, 3, CELL)
      }
    }
  }

  if (marker) {
    ctx.strokeStyle = '#fff600'
    ctx.lineWidth = 3
    ctx.strokeRect(
      (marker.col - 1) * CELL + 1.5,
      (marker.row - 1) * CELL + 1.5,
      CELL * 3 - 3,
      CELL * 3 - 3,
    )
  }
}

/** A bit of sand flung out by the trowel, in canvas pixels. */
export interface Grain {
  x: number
  y: number
  vx: number
  vy: number
  /** Counts down from 1 to 0, when the grain disappears. */
  life: number
  color: string
}

export function flingGrains(
  col: number,
  row: number,
  layer: number,
  random: () => number = Math.random,
): Grain[] {
  const shades = SHADES[Math.max(0, Math.min(LAYERS, layer) - 1)]
  return Array.from({ length: 7 }, () => ({
    x: (col + 0.5) * CELL,
    y: (row + 0.5) * CELL,
    vx: (random() - 0.5) * 0.5,
    vy: -0.25 - random() * 0.25,
    life: 1,
    color: shades[Math.floor(random() * 3)],
  }))
}

/** Moves each grain on by `ms` milliseconds and drops the finished ones. */
export function moveGrains(grains: readonly Grain[], ms: number): Grain[] {
  const gravity = 0.0012
  return grains
    .map((g) => ({
      ...g,
      x: g.x + g.vx * ms,
      y: g.y + g.vy * ms + (gravity * ms * ms) / 2,
      vy: g.vy + gravity * ms,
      life: g.life - ms / 450,
    }))
    .filter((g) => g.life > 0)
}

export function drawGrains(
  ctx: CanvasRenderingContext2D,
  grains: readonly Grain[],
) {
  for (const g of grains) {
    ctx.globalAlpha = Math.min(1, g.life * 1.5)
    ctx.fillStyle = g.color
    ctx.fillRect(Math.round(g.x) - 2, Math.round(g.y) - 2, 4, 4)
  }
  ctx.globalAlpha = 1
}
