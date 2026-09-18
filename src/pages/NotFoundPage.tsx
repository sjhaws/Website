import { RetroLink } from '../components/RetroButton.tsx'
import styles from './Menu.module.css'

export function NotFoundPage() {
  return (
    <div className={styles.page}>
      <title>Page not found · HawsFun</title>
      <h1 className={styles.title}>Game Over: page not found</h1>
      <p>There's nothing at this address.</p>
      <ul className={styles.grid}>
        <li>
          <RetroLink to="/">Back to Home</RetroLink>
        </li>
      </ul>
    </div>
  )
}
