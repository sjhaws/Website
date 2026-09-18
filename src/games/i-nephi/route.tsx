import { GameHost } from '../GameHost.tsx'
import { GamePage } from '../GamePage.tsx'
import { start } from './game.js'
import styles from './game.module.css'

export function Component() {
  return (
    <GamePage slug="i-nephi">
      <GameHost start={start} className={styles.host} />
    </GamePage>
  )
}
