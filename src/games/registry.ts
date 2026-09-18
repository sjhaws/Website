export interface GameInfo {
  slug: string
  title: string
  /**
   * The old static page, for games not rebuilt in React yet. These open with a
   * full page load; games without one have a route at /games/<slug>.
   */
  legacyUrl?: string
}

// Order matches the Games menu.
export const GAMES: GameInfo[] = [
  { slug: 'apostle-flashcards', title: 'Apostle Flashcards' },
  { slug: 'memory-game', title: 'Memory Game' },
  { slug: 'resistor-challenge', title: 'Resistor Challenge' },
  { slug: 'rock-paper-scissors', title: 'Rock Paper Scissors' },
  { slug: 'retro-dungeon-crawler', title: 'Retro Dungeon Crawler' },
  { slug: 'i-nephi', title: 'I, Nephi' },
  { slug: 'battleship', title: 'Battleship' },
  { slug: 'carmen-racing', title: 'Carmen Racing' },
]

export function getGame(slug: string): GameInfo {
  const game = GAMES.find((g) => g.slug === slug)
  if (!game) throw new Error(`Unknown game: ${slug}`)
  return game
}
