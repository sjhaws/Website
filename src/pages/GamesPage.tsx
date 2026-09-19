import logo from '../assets/hawsfun-logo.png'
import { RetroLink } from '../components/RetroButton.tsx'
import { GAMES } from '../games/registry.ts'
import styles from './Menu.module.css'

export function GamesPage() {
  return (
    <div className={styles.page}>
      <title>Games · HawsFun</title>
      <img className={styles.logo} src={logo} alt="HawsFun" />
      <h1 className={styles.title}>Choose a game to play!</h1>
      <ul className={styles.grid}>
        {GAMES.map((game) => (
          <li key={game.slug}>
            <RetroLink to={`/games/${game.slug}`} size="large">
              {game.title}
            </RetroLink>
          </li>
        ))}
      </ul>
    </div>
  )
}
