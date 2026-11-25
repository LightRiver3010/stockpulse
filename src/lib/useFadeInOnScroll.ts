import { useEffect, useRef, useState } from 'react'

/**
 * Tracks when an element enters the viewport for scroll-triggered fade-ins.
 * Starts visible on SSR/prerender or when IntersectionObserver is unavailable
 * so static HTML is never stuck invisible.
 */
export function useFadeInOnScroll<T extends HTMLElement = HTMLElement>(threshold = 0.12) {
  const ref = useRef<T | null>(null)
  const [isVisible, setIsVisible] = useState(() => typeof window === 'undefined')

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}
