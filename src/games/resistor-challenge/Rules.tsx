import { useEffect, useRef } from 'react'
import { ColorChart } from './ColorChart.tsx'
import styles from './ResistorChallenge.module.css'

/** The rules text and color chart, shared by the Rules screen and the pop-up. */
export function RulesContent() {
  return (
    <>
      <div className={styles.prose}>
        <p>
          You have 60 seconds to answer as many resistors as you can. A resistor
          answered correctly on the first try is worth 5 points and gives you 1
          extra second.
        </p>
        <p>
          Every wrong answer lowers that resistor's value by 1 point, down to a
          minimum of 1 point. You can keep trying, or press{' '}
          <strong>Skip</strong> to move on: a skipped resistor scores nothing
          and costs 3 seconds.
        </p>
        <p>
          Type the resistance in ohms. Shorthand is fine: 4700, 4,700, 4.7k and
          4k7 all mean the same thing, and M means mega (2.2M is 2,200,000).
          Type the tolerance as 5 or 10, with or without the % sign.
        </p>
        <p>
          The chart below is a reminder of how resistor values and tolerances
          are calculated:
        </p>
      </div>
      <ColorChart />
    </>
  )
}

/**
 * The rules in a pop-up, for checking mid-round. Uses the native <dialog>, so
 * Escape closes it and focus stays inside while it's open. The clock keeps
 * running: the chart is effectively the answer key.
 */
export function RulesDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open && !element.open) element.showModal()
    if (!open && element.open) element.close()
  }, [open])

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="rules-dialog-title"
      onClose={onClose}
      // A click on the dim backdrop lands on the <dialog> itself.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className={styles.dialogBody}>
        <div className={styles.dialogHeader}>
          <h2 id="rules-dialog-title">How to Play</h2>
          <button type="button" className={styles.close} onClick={onClose}>
            Close
          </button>
        </div>
        <p className={styles.dialogNote}>
          The clock keeps running while the rules are open.
        </p>
        <RulesContent />
      </div>
    </dialog>
  )
}
