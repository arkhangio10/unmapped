'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Sparkles } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface VoiceTextareaProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  lang?: string
  hint?: string
  listeningLabel?: string
  silenceTimeoutSec?: number
}

type SRResult = { 0: { transcript: string }; isFinal: boolean }
type SR = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: (e: { resultIndex: number; results: ArrayLike<SRResult> }) => void
  onerror: (e: { error: string }) => void
  onend: () => void
  start: () => void
  stop: () => void
  abort: () => void
}

const DEFAULT_SILENCE_TIMEOUT = 30 // seconds

export function VoiceTextarea({
  value,
  onChange,
  placeholder,
  maxLength = 3000,
  lang,
  hint,
  listeningLabel = 'Listening…',
  silenceTimeoutSec = DEFAULT_SILENCE_TIMEOUT,
}: VoiceTextareaProps) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)
  const [errMsg, setErrMsg] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(silenceTimeoutSec)

  const recogRef = useRef<SR | null>(null)
  // Text already in the field BEFORE this listening session started
  const baseRef = useRef('')
  // Latest external value (so we can read it when toggling mic on)
  const valueRef = useRef(value)
  // Silence countdown timer
  const silenceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    valueRef.current = value
  }, [value])

  const clearTimers = () => {
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current)
      stopTimerRef.current = null
    }
  }

  const armSilenceTimer = () => {
    clearTimers()
    setSecondsLeft(silenceTimeoutSec)

    silenceTimerRef.current = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0))
    }, 1000)

    stopTimerRef.current = setTimeout(() => {
      const r = recogRef.current
      if (r) {
        try {
          r.stop()
        } catch {
          // ignore
        }
      }
      setListening(false)
      clearTimers()
      setErrMsg(`Stopped after ${silenceTimeoutSec}s of silence — tap mic to continue`)
    }, silenceTimeoutSec * 1000)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const w = window as unknown as {
      SpeechRecognition?: new () => SR
      webkitSpeechRecognition?: new () => SR
    }
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!Ctor) {
      setSupported(false)
      return
    }

    const r = new Ctor()
    r.continuous = true
    r.interimResults = true
    r.lang = lang === 'es' ? 'es-PE' : lang === 'en' ? 'en-US' : navigator.language || 'en-US'

    r.onresult = (e) => {
      // Reset silence timer on every speech event
      armSilenceTimer()

      // Iterate ALL results from index 0 (not just from resultIndex)
      // Otherwise finalized chunks from earlier in the session are dropped.
      let finalText = ''
      let interimText = ''
      for (let i = 0; i < e.results.length; i++) {
        const result = e.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript
        } else {
          interimText += result[0].transcript
        }
      }

      // Combine: previously-typed text  +  final speech this session  +  current interim
      const combined = `${baseRef.current} ${finalText} ${interimText}`
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLength)

      onChange(combined)
    }

    r.onerror = (e) => {
      // 'no-speech' is normal when there's silence — don't show as error
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setErrMsg(`Mic error: ${e.error}`)
      }
      setListening(false)
      clearTimers()
    }

    r.onend = () => {
      setListening(false)
      clearTimers()
    }

    recogRef.current = r
    return () => {
      try {
        r.stop()
      } catch {
        // ignore
      }
      clearTimers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, silenceTimeoutSec, maxLength])

  const toggle = () => {
    const r = recogRef.current
    if (!r) return

    if (listening) {
      r.stop()
      setListening(false)
      clearTimers()
      return
    }

    // Capture EVERYTHING currently in the field as the base.
    // Anything spoken in the new session will be appended to this.
    baseRef.current = valueRef.current.trim()
    setErrMsg(null)
    try {
      r.start()
      setListening(true)
      armSilenceTimer()
    } catch {
      // recognition was already running
    }
  }

  return (
    <div
      className={cn(
        'rounded-2xl border bg-card transition-all overflow-hidden',
        listening
          ? 'border-primary ring-2 ring-primary/30 shadow-md'
          : 'border-border hover:border-primary/40'
      )}
    >
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
          placeholder={placeholder}
          rows={5}
          className="resize-none border-0 rounded-none bg-transparent pr-14 text-base leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
        />
        {supported && (
          <button
            type="button"
            onClick={toggle}
            aria-label={listening ? 'Stop recording' : 'Start voice input'}
            className={cn(
              'absolute right-3 top-3 grid place-items-center h-10 w-10 rounded-full transition-all',
              listening
                ? 'bg-coral text-coral-foreground animate-pulse shadow-lg'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
            )}
          >
            {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
        )}
      </div>

      {/* Footer area inside the frame */}
      <div className="px-3.5 py-2.5 border-t border-border bg-muted/30">
        {listening ? (
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-coral font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-coral animate-pulse" />
              {listeningLabel}
            </span>
            <span className="text-muted-foreground font-data tabular-nums">
              auto-stop in {secondsLeft}s
            </span>
          </div>
        ) : errMsg ? (
          <p className="text-xs text-coral">{errMsg}</p>
        ) : hint ? (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
            <span>{hint}</span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">&nbsp;</p>
        )}
      </div>
    </div>
  )
}
