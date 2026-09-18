import { isRouteErrorResponse, useRouteError } from 'react-router'
import styles from './Menu.module.css'

// Shown instead of the whole site when a page crashes or fails to load, so it
// can't rely on the site layout. Uses plain links for the same reason.
export function ErrorPage() {
  const error = useRouteError()
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Oops, sorry, we have some unregistered gremlins in the system. Please try again.'

  return (
    <div className={styles.page}>
      <title>Something went wrong · HawsFun</title>
      <h1 className={styles.title}>Something went wrong</h1>
      <p>{detail}</p>
      <p>
        <a href="/">Back to Home</a>
      </p>
    </div>
  )
}
