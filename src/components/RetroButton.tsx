import type { ReactNode } from 'react'
import { Link } from 'react-router'
import styles from './RetroButton.module.css'

interface RetroLinkProps {
  to: string
  children: ReactNode
  size?: 'normal' | 'large'
  /** Open with a full page load, for pages outside the React app. */
  reloadDocument?: boolean
}

export function RetroLink({
  to,
  children,
  size = 'normal',
  reloadDocument,
}: RetroLinkProps) {
  const className =
    size === 'large' ? `${styles.button} ${styles.large}` : styles.button
  return (
    <Link to={to} className={className} reloadDocument={reloadDocument}>
      {children}
    </Link>
  )
}
