import { GamePage } from '../GamePage.tsx'
import { Battleship } from './Battleship.tsx'

export function Component() {
  return (
    <GamePage slug="battleship">
      <Battleship />
    </GamePage>
  )
}
