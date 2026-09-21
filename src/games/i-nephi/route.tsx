import { useRef } from 'react'
import buttonStyles from '../../components/RetroButton.module.css'
import { GameHost } from '../GameHost.tsx'
import { GamePage } from '../GamePage.tsx'
import { useFullscreen } from '../useFullscreen.ts'
import { start } from './game.js'
import styles from './game.module.css'

export function Component() {
  const stage = useRef<HTMLDivElement>(null)
  const fullscreen = useFullscreen(stage)
  const stageClass = [
    styles.stage,
    fullscreen.active && styles.full,
    fullscreen.faked && styles.faked,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <GamePage
      slug="i-nephi"
      actions={
        <button
          type="button"
          className={`${buttonStyles.button} ${buttonStyles.small}`}
          onClick={(event) => {
            // Let go of focus, or Space (jump) would press it again.
            event.currentTarget.blur()
            void fullscreen.enter()
          }}
        >
          Full screen
        </button>
      }
    >
      <div ref={stage} className={stageClass}>
        <GameHost start={start} className={styles.host} />
        {fullscreen.active && (
          <button
            type="button"
            className={styles.exit}
            onClick={fullscreen.exit}
            aria-label="Leave full screen"
          >
            ✕
          </button>
        )}
      </div>
    </GamePage>
  )
}
