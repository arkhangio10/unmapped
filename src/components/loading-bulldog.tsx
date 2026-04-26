'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/lib/i18n'

interface LoadingBulldogProps {
  stages?: string[]
  intervalMs?: number
}

export function LoadingBulldog({ stages, intervalMs = 2200 }: LoadingBulldogProps) {
  const t = useT()
  const defaultStages = [
    t('loading.stage_1'),
    t('loading.stage_2'),
    t('loading.stage_3'),
    t('loading.stage_4'),
  ]
  const messages = stages ?? defaultStages

  const [stage, setStage] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setStage((s) => (s + 1) % messages.length)
    }, intervalMs)
    return () => clearInterval(id)
  }, [messages.length, intervalMs])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md"
      role="status"
      aria-live="polite"
    >
      <div className="relative w-full max-w-lg px-6 text-center">
        {/* Aurora glow behind */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="aurora-pulse absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full" />
        </div>

        {/* Stage road */}
        <div className="relative h-44 mb-8 overflow-hidden">
          {/* Ground line with subtle gradient */}
          <div className="absolute bottom-12 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="absolute bottom-9 left-0 right-0 h-12 bg-gradient-to-t from-primary/5 to-transparent" />

          {/* Walking bulldog with footprints */}
          <div className="bulldog-walker absolute bottom-12">
            {/* Bulldog body */}
            <span className="bulldog-emoji block" role="img" aria-label="French bulldog">
              🐶
            </span>
            {/* Soft shadow under */}
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-2 w-16 rounded-full bg-foreground/20 blur-sm shadow-pulse" />
            {/* Dust puff (left) */}
            <span className="dust-puff absolute -bottom-1 -left-3 text-xl opacity-0">💨</span>
            {/* Dust puff (right, delayed) */}
            <span className="dust-puff dust-puff--delayed absolute -bottom-1 -right-3 text-xl opacity-0">💨</span>
          </div>

          {/* Static footprints staying behind */}
          <div className="absolute bottom-7 left-0 right-0 flex justify-center gap-4 opacity-30">
            <span className="footprint" style={{ animationDelay: '0s' }}>·</span>
            <span className="footprint" style={{ animationDelay: '0.3s' }}>·</span>
            <span className="footprint" style={{ animationDelay: '0.6s' }}>·</span>
            <span className="footprint" style={{ animationDelay: '0.9s' }}>·</span>
            <span className="footprint" style={{ animationDelay: '1.2s' }}>·</span>
          </div>
        </div>

        {/* Stage label */}
        <div className="min-h-[3.5rem] flex flex-col items-center justify-center">
          <p
            key={stage}
            className="font-serif-display text-3xl text-foreground mb-1 stage-text"
          >
            {messages[stage]}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('loading.subtitle')}
          </p>
        </div>

        {/* Progress dots */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {messages.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === stage ? 'w-10 bg-primary' : i < stage ? 'w-2 bg-primary/50' : 'w-2 bg-border'
              }`}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        .bulldog-walker {
          left: -10%;
          animation: walk-across 7s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          font-size: 4.5rem;
          line-height: 1;
        }

        .bulldog-emoji {
          animation: walk-bob 0.55s ease-in-out infinite alternate;
          transform-origin: center bottom;
        }

        .shadow-pulse {
          animation: shadow-pulse 0.55s ease-in-out infinite alternate;
        }

        @keyframes walk-across {
          0% {
            left: -15%;
            transform: scaleX(1);
          }
          47% {
            left: 100%;
            transform: scaleX(1);
          }
          50% {
            left: 100%;
            transform: scaleX(-1);
          }
          97% {
            left: -15%;
            transform: scaleX(-1);
          }
          100% {
            left: -15%;
            transform: scaleX(1);
          }
        }

        @keyframes walk-bob {
          0% {
            transform: translateY(0) rotate(-3deg) scaleY(1);
          }
          100% {
            transform: translateY(-8px) rotate(3deg) scaleY(0.95);
          }
        }

        @keyframes shadow-pulse {
          0% {
            transform: translateX(-50%) scaleX(1);
            opacity: 0.25;
          }
          100% {
            transform: translateX(-50%) scaleX(0.7);
            opacity: 0.12;
          }
        }

        .dust-puff {
          animation: dust 0.55s ease-out infinite alternate;
        }
        .dust-puff--delayed {
          animation-delay: 0.275s;
        }

        @keyframes dust {
          0% {
            opacity: 0;
            transform: scale(0.5) translateY(0);
          }
          50% {
            opacity: 0.6;
          }
          100% {
            opacity: 0;
            transform: scale(1.2) translateY(-8px);
          }
        }

        .footprint {
          font-size: 1.5rem;
          color: var(--muted-foreground);
          animation: footprint-fade 7s linear infinite;
        }

        @keyframes footprint-fade {
          0%, 100% { opacity: 0; }
          10%, 60% { opacity: 0.3; }
        }

        .aurora-pulse {
          background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
          opacity: 0.15;
          animation: aurora-glow 3s ease-in-out infinite alternate;
        }

        @keyframes aurora-glow {
          0% {
            opacity: 0.10;
            transform: translate(-50%, -50%) scale(0.95);
          }
          100% {
            opacity: 0.20;
            transform: translate(-50%, -50%) scale(1.05);
          }
        }

        .stage-text {
          animation: stage-fade-in 0.5s ease-out;
        }

        @keyframes stage-fade-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .bulldog-walker,
          .bulldog-emoji,
          .shadow-pulse,
          .dust-puff,
          .footprint,
          .aurora-pulse,
          .stage-text {
            animation: none !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  )
}
