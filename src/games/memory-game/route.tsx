import { GamePage } from '../GamePage.tsx'
import { MemoryGame } from './MemoryGame.tsx'

export function Component() {
  return (
    <GamePage slug="memory-game">
      <MemoryGame />
    </GamePage>
  )
}
