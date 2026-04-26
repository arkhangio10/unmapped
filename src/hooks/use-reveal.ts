'use client'

import { useEffect, useRef } from 'react'

/**
 * Lightweight scroll reveal — adds `is-visible` once the element
 * enters the viewport. CSS keyframe does the actual animation.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible')
      return
    }
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          io.unobserve(entry.target)
        }
      }
    }, options)
    io.observe(el)
    return () => io.disconnect()
  }, [options])

  return ref
}
