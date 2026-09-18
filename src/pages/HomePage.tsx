import { RetroLink } from '../components/RetroButton.tsx'
import styles from './Menu.module.css'

export function HomePage() {
  return (
    <div className={styles.page}>
      <title>HawsFun</title>
      <h1 className={styles.title}>Welcome to the HawsFun Sandbox</h1>
      <ul className={styles.grid}>
        <li>
          <RetroLink to="/games" size="large">
            Games
          </RetroLink>
        </li>
        <li>
          <RetroLink to="/fun" size="large">
            Just for Fun
          </RetroLink>
        </li>
        <li>
          <RetroLink to="/about" size="large">
            Behind the Curtain
          </RetroLink>
        </li>
      </ul>
      <p className={styles.tagline}>
        You never know what you might find
        <br />
        Feel free to explore!
      </p>
    </div>
  )
}
