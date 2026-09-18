import type { Difficulty } from './game.ts'

// Every image in a folder, keyed by file name without the extension.
function imagesIn(modules: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(modules).map(([path, url]) => [
      path
        .split('/')
        .pop()!
        .replace(/\.\w+$/, ''),
      url,
    ]),
  )
}

const animals = imagesIn(
  import.meta.glob<string>('./assets/animals/*.webp', {
    eager: true,
    import: 'default',
  }),
)
const space = imagesIn(
  import.meta.glob<string>('./assets/space/*.webp', {
    eager: true,
    import: 'default',
  }),
)

export interface FaceSet {
  label: string
  /** Face name → image URL. The name is also the card's accessible label. */
  images: Record<string, string>
  /** Face name → image credit, listed under the board. */
  credits?: Record<string, string>
}

export const FACE_SETS: Record<Difficulty, FaceSet> = {
  easy: { label: 'Easy', images: animals },
  hard: {
    label: 'Hard',
    images: space,
    // Sources for each are in assets/space/CREDITS.md.
    credits: {
      asteroid: 'NASA/JPL-Caltech/UCLA/MPS/DLR/IDA',
      blackhole: 'NASA/JPL-Caltech',
      earth: 'NASA',
      jupiter: 'NASA/JPL/USGS',
      mars: 'NASA/JPL/USGS',
      mercury:
        'NASA/Johns Hopkins University Applied Physics Laboratory/Carnegie Institution of Washington',
      moon: 'NASA/GSFC Scientific Visualization Studio',
      neptune: 'NASA/JPL',
      pluto: 'NASA/JHUAPL/SwRI',
      saturn: 'NASA/JPL/Space Science Institute',
      star: 'NASA/ESA/CSA/STScI/JPL-Caltech',
      sun: 'NASA/GSFC/SVS/SDO',
      uranus: 'NASA/JPL-Caltech',
      venus: 'NASA/JPL-Caltech',
    },
  },
}

/** A face's display name, e.g. "blackhole" → "Black hole". */
export function faceName(face: string): string {
  return face === 'blackhole'
    ? 'Black hole'
    : face[0].toUpperCase() + face.slice(1)
}

export function facesFor(difficulty: Difficulty): string[] {
  return Object.keys(FACE_SETS[difficulty].images)
}
