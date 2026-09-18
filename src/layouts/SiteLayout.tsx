import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router'
import logo from '../assets/hawsfun-logo.png'
import styles from './SiteLayout.module.css'

export function SiteLayout() {
  return (
    <>
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          <img src={logo} alt="HawsFun" />
        </Link>
        <nav className={styles.nav} aria-label="Main">
          <NavLink to="/games">Games</NavLink>
          <NavLink to="/fun">Sandbox</NavLink>
          <NavLink to="/about">Behind the Curtain</NavLink>
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <ScrollRestoration />
    </>
  )
}
