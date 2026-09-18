import { useEffect, useState } from 'react'

function read<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const value: unknown = JSON.parse(raw)
    return isValid(value) ? value : fallback
  } catch {
    // Storage can be blocked (private browsing) or hold malformed JSON.
    return fallback
  }
}

/**
 * Like useState, but the value is saved in this browser's localStorage under
 * `key` and restored next visit. Stored values that fail `isValid` (from an
 * older version, or edited by hand) are ignored in favour of `fallback`.
 */
export function useStoredState<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
) {
  const [value, setValue] = useState<T>(() => read(key, fallback, isValid))

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Not saved; the game still works for this visit.
    }
  }, [key, value])

  return [value, setValue] as const
}
