import type { ReactNode } from 'react'
import { getGame } from './registry.ts'
import styles from './GamePage.module.css'

export function GamePage({
  slug,
  actions,
  children,
}: {
  slug: string
  /** Buttons shown beside the title. */
  actions?: ReactNode
  children: ReactNode
}) {
  const { title } = getGame(slug)
  return (
    <article className={styles.page}>
      <title>{`${title} · HawsFun`}</title>
      <div className={styles.top}>
        <h1 className={styles.title}>{title}</h1>
        {actions}
      </div>
      {children}
    </article>
  )
}
