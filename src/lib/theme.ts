import { useCallback, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

const KEY = 'theme'

/** Current theme from storage → else the attribute already on <html> → else dark. */
function read(): Theme {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* private mode / disabled storage */
  }
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

/**
 * Theme state on top of the existing `[data-theme]` system.
 * setTheme flips the attribute SYNCHRONOUSLY (so it works inside a View
 * Transition snapshot) and persists to localStorage.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(read)

  const setTheme = useCallback((t: Theme) => {
    document.documentElement.dataset.theme = t
    try {
      localStorage.setItem(KEY, t)
    } catch {
      /* ignore */
    }
    setThemeState(t)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return { theme, setTheme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') }
}
