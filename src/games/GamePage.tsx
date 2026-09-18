import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { getGame } from './registry.ts'
import styles from './GamePage.module.css'

export function GamePage({
  slug,
  children,
}: {
  slug: string
  children: ReactNode
}) {
  const { title } = getGame(slug)
  return (
    <article className={styles.page}>
      <title>{`${title} · HawsFun`}</title>
      <div className={styles.top}>
        <h1 className={styles.title}>{title}</h1>
      </div>
      {children}
    </article>
  )
}
