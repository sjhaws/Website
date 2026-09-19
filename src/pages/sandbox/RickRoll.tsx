import { useEffect, useRef } from 'react'
import styles from './Sandbox.module.css'

// YouTube's privacy-enhanced player, which sets no cookies until the video
// plays. The click that opened the pop-up lets it autoplay with sound in most
// browsers; where it can't, YouTube shows its play button instead.
const VIDEO_URL =
  'https://www.youtube-nocookie.com/embed/xvFZjo5PgG0?autoplay=1&playsinline=1&rel=0'

/** The native <dialog>, so Escape closes it and focus stays inside. */
export function RickRollDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open && !element.open) {
      element.showModal()
      // Otherwise the video, as the first thing in the pop-up, gets focus.
      closeButton.current?.focus()
    }
    if (!open && element.open) element.close()
  }, [open])

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="rickroll-title"
      onClose={onClose}
      // A click on the dim backdrop lands on the <dialog> itself.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className={styles.dialogBody}>
        <h2 id="rickroll-title">You've been rickrolled!</h2>
        {/* Only loaded while the pop-up is open, so closing it stops the video. */}
        {open && (
          <iframe
            className={styles.video}
            src={VIDEO_URL}
            title="Rick Astley: Never Gonna Give You Up"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
        <button
          ref={closeButton}
          type="button"
          className={styles.close}
          onClick={onClose}
        >
          Back to Digging
        </button>
      </div>
    </dialog>
  )
}
