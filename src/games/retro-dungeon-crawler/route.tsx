import { GameHost } from '../GameHost.tsx'
import { GamePage } from '../GamePage.tsx'
import { start } from './game.js'

export function Component() {
  return (
    <GamePage slug="retro-dungeon-crawler">
      <GameHost start={start} />
    </GamePage>
  )
}
