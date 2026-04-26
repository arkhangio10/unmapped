'use client'

import { ReactNode, CSSProperties } from 'react'
import { useReveal } from '@/hooks/use-reveal'
import { cn } from '@/lib/utils'

interface RevealProps {
  children: ReactNode
  delay?: number
  className?: string
  as?: 'div' | 'section' | 'li' | 'span'
}

export function Reveal({ children, delay = 0, className, as = 'div' }: RevealProps) {
  const ref = useReveal<HTMLDivElement>()
  const style = { animationDelay: `${delay}ms` } as CSSProperties
  const Tag = as
  return (
    // @ts-expect-error — dynamic tag with ref
    <Tag ref={ref} style={style} className={cn('reveal', className)}>
      {children}
    </Tag>
  )
}

interface CharRevealProps {
  text: string
  className?: string
  startDelay?: number
}

export function CharReveal({ text, className, startDelay = 0 }: CharRevealProps) {
  const chars = Array.from(text)
  return (
    <span className={className} aria-label={text}>
      {chars.map((c, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="char"
          style={
            { ['--i' as string]: i, animationDelay: `${startDelay + i * 25}ms` } as CSSProperties
          }
        >
          {c === ' ' ? ' ' : c}
        </span>
      ))}
    </span>
  )
}
