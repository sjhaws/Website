import type { ReactNode } from 'react'
import { Link } from 'react-router'
import styles from './RetroButton.module.css'

interface RetroLinkProps {
  to: string
  children: ReactNode
  size?: 'normal' | 'large'
}

export function RetroLink({ to, children, size = 'normal' }: RetroLinkProps) {
  const className =
    size === 'large' ? `${styles.button} ${styles.large}` : styles.button
  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  )
}
