import { GamePage } from '../GamePage.tsx'
import { RockPaperScissors } from './RockPaperScissors.tsx'

export function Component() {
  return (
    <GamePage slug="rock-paper-scissors">
      <RockPaperScissors />
    </GamePage>
  )
}
