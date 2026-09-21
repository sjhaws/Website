import { useCallback, useEffect, useState, type RefObject } from 'react'

// Older Safari only has the webkit-prefixed full-screen API.
type WebkitElement = HTMLElement & { webkitRequestFullscreen?: () => void }
type WebkitDocument = Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => void
}
// Asking to stay sideways works on some phones, and only in full screen.
type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: 'landscape') => Promise<void>
}

function fullscreenElement() {
  const doc = document as WebkitDocument
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Games size themselves to their box when the window resizes.
function tellGamesToResize() {
  window.dispatchEvent(new Event('resize'))
}

/**
 * Full screen for a game's box. Uses the browser's full-screen mode where it
 * has one, and turns a phone sideways where it can. iPhones only allow full
 * screen for videos, so there the box is stretched over the whole window
 * instead (`faked`).
 */
export function useFullscreen(target: RefObject<HTMLElement | null>) {
  const [real, setReal] = useState(false)
  const [faked, setFaked] = useState(false)

  useEffect(() => {
    const onChange = () => {
      setReal(target.current !== null && fullscreenElement() === target.current)
      tellGamesToResize()
    }
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [target])

  // While faking it: nothing scrolls underneath, and Escape leaves.
  useEffect(() => {
    if (!faked) return
    const root = document.documentElement
    const overflow = root.style.overflow
    root.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFaked(false)
    }
    window.addEventListener('keydown', onKey)
    tellGamesToResize()
    return () => {
      root.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
      tellGamesToResize()
    }
  }, [faked])

  const enter = useCallback(async () => {
    const element = target.current as WebkitElement | null
    if (!element) return
    try {
      if (element.requestFullscreen) {
        // Some browsers never answer, so don't wait long.
        await Promise.race([
          element.requestFullscreen({ navigationUI: 'hide' }),
          sleep(1000),
        ])
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen()
        await sleep(300)
      }
    } catch {
      // Refused.
    }
    if (fullscreenElement() === element) {
      const orientation = screen.orientation as LockableOrientation
      await orientation?.lock?.('landscape').catch(() => {})
    } else {
      setFaked(true)
    }
  }, [target])

  const exit = useCallback(() => {
    const doc = document as WebkitDocument
    if (doc.fullscreenElement) {
      void doc.exitFullscreen()
    } else if (doc.webkitFullscreenElement) {
      doc.webkitExitFullscreen?.()
    }
    setFaked(false)
  }, [])

  return { active: real || faked, faked, enter, exit }
}
