import type { GemKind, TreasureKind } from './sand.ts'

// Pixel art, one string per row. Each letter is a color from the palette the
// art is drawn with, and '.' is see-through.

const GEM = [
  '............',
  '...kkkkkk...',
  '..khhllllk..',
  '.khhllllmmk.',
  'khllllllmmdk',
  'kmmmmmmmdddk',
  '.kllmmmmmdk.',
  '..klmmmmdk..',
  '...klmmdk...',
  '....kmdk....',
  '.....kk.....',
  '............',
]

const BONE = [
  '.kkk............kkk.',
  'kwwwk..........kwwwk',
  'kwwwwkkkkkkkkkkwwwwk',
  '.kwwwwwwwwwwwwwwwwk.',
  '.kwwwwwwwwwwwwwwwsk.',
  'kwwwskkkkkkkkkkwwssk',
  'kwssk..........kwssk',
  '.kkk............kkk.',
]

// The same bone, standing on end.
const UPRIGHT_BONE = [...BONE[0]].map((_, x) =>
  BONE.map((row) => row[x]).join(''),
)

const SKULL = [
  '...kkkkkk...',
  '..kwwwwwwk..',
  '.kwwwwwwwwk.',
  'kwwwwwwwwwsk',
  'kwkkkwwkkksk',
  'kwkkkwwkkksk',
  'kwkkkwwkkksk',
  'kwwwwkkwwwsk',
  '.kwwwwwwwsk.',
  '..kwkwkwsk..',
  '..kwkwkwsk..',
  '...kkkkkk...',
]

type Palette = Record<string, string>

const GEM_COLORS: Record<GemKind, Palette> = {
  ruby: {
    h: '#ffd6de',
    l: '#ff4d6d',
    m: '#d0103a',
    d: '#7a0020',
    k: '#2e000d',
  },
  emerald: {
    h: '#dcffe4',
    l: '#4fe07a',
    m: '#16a34a',
    d: '#0b5e2a',
    k: '#042414',
  },
  sapphire: {
    h: '#dce8ff',
    l: '#5b8cff',
    m: '#1d4ed8',
    d: '#0f2a7a',
    k: '#060f33',
  },
  amethyst: {
    h: '#f3e2ff',
    l: '#c084fc',
    m: '#8b3fd9',
    d: '#4c1d95',
    k: '#1e0b3d',
  },
  topaz: {
    h: '#fff6cc',
    l: '#ffc83d',
    m: '#e08a00',
    d: '#8a4b00',
    k: '#331a00',
  },
  diamond: {
    h: '#ffffff',
    l: '#e3f6ff',
    m: '#a9d8f0',
    d: '#5f9fbf',
    k: '#1d3542',
  },
}

const BONE_COLORS: Palette = { w: '#f3ecd8', s: '#c9bb98', k: '#3b3122' }

interface Sprite {
  w: number
  h: number
  /** One SVG path per color letter. */
  paths: [string, string][]
}

/** Merges each row's runs of one color into a single path per color. */
function sprite(rows: readonly string[]): Sprite {
  const paths = new Map<string, string>()
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length;) {
      let end = x
      while (row[end] === row[x]) end++
      if (row[x] !== '.') {
        const run = `M${x} ${y}h${end - x}v1h${x - end}z`
        paths.set(row[x], (paths.get(row[x]) ?? '') + run)
      }
      x = end
    }
  })
  return { w: rows[0].length, h: rows.length, paths: [...paths] }
}

const GEM_SPRITE = sprite(GEM)
const BONE_SPRITES: Record<Exclude<TreasureKind, GemKind>, Sprite> = {
  bone: sprite(BONE),
  'upright-bone': sprite(UPRIGHT_BONE),
  skull: sprite(SKULL),
}

function isGem(kind: TreasureKind): kind is GemKind {
  return kind in GEM_COLORS
}

export function TreasureArt({ kind }: { kind: TreasureKind }) {
  const { w, h, paths } = isGem(kind) ? GEM_SPRITE : BONE_SPRITES[kind]
  const palette = isGem(kind) ? GEM_COLORS[kind] : BONE_COLORS
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {paths.map(([color, d]) => (
        <path key={color} fill={palette[color]} d={d} />
      ))}
    </svg>
  )
}
