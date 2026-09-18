import { useEffect, useRef } from 'react'

/**
 * A canvas game module's entry point: builds the game inside `container` and
 * returns a function that removes everything it added (elements, listeners,
 * timers, animation loops).
 */
export type StartGame = (container: HTMLElement) => () => void

/** Runs a canvas game while this component is on the page. */
export function GameHost({
  start,
  className,
}: {
  start: StartGame
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    return start(container)
  }, [start])

  return <div ref={containerRef} className={className} />
}
