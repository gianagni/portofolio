import { useEffect, useState } from 'react'

interface TerminalEntry {
  command: string
  output: string
}

const TERMINAL_ENTRIES: readonly TerminalEntry[] = [
  {
    command: 'whoami',
    output: 'nandito gianza agni - full-stack developer',
  },
  {
    command: 'ls projects',
    output: 'spn-booking  flowprint  lahena  ng-market',
  },
  {
    command: 'cat stack.txt',
    output: 'next.js, typescript, supabase, postgresql, node.js',
  },
  {
    command: 'echo $STATUS',
    output: 'available after 22 Dec 2026',
  },
]

interface FlatSegment {
  type: 'prompt' | 'command' | 'output'
  text: string
}

const SEGMENTS: readonly FlatSegment[] = TERMINAL_ENTRIES.flatMap((entry) => [
  { type: 'prompt', text: '$ ' },
  { type: 'command', text: `${entry.command}\n` },
  { type: 'output', text: `${entry.output}\n` },
])

const TOTAL_CHARS = SEGMENTS.reduce((sum, seg) => sum + seg.text.length, 0)
const TYPING_DURATION_MS = 900

function renderSegments(charBudget: number) {
  let remaining = charBudget
  return SEGMENTS.map((seg, idx) => {
    if (remaining <= 0) return null
    const slice = seg.text.slice(0, remaining)
    remaining -= slice.length

    if (seg.type === 'prompt') {
      return (
        <span key={idx} className="text-[#22C55E]">
          {slice}
        </span>
      )
    }

    if (seg.type === 'command') {
      return (
        <span key={idx} className="text-[#F4F4F5]">
          {slice}
        </span>
      )
    }

    return (
      <span key={idx} className="text-[#A1A1AA]">
        {slice}
      </span>
    )
  })
}

export function TerminalCard() {
  const [revealedChars, setRevealedChars] = useState<number>(() => {
    if (typeof window === 'undefined') return TOTAL_CHARS
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? TOTAL_CHARS : 0
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mediaQuery.matches) {
      setRevealedChars(TOTAL_CHARS)
      return
    }

    let frameId = 0
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      if (elapsed >= TYPING_DURATION_MS) {
        setRevealedChars(TOTAL_CHARS)
        return
      }
      const nextCount = Math.max(1, Math.floor((elapsed / TYPING_DURATION_MS) * TOTAL_CHARS))
      setRevealedChars(nextCount)
      frameId = window.requestAnimationFrame(tick)
    }

    frameId = window.requestAnimationFrame(tick)

    const handleMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        window.cancelAnimationFrame(frameId)
        setRevealedChars(TOTAL_CHARS)
      }
    }

    mediaQuery.addEventListener('change', handleMotionChange)
    return () => {
      window.cancelAnimationFrame(frameId)
      mediaQuery.removeEventListener('change', handleMotionChange)
    }
  }, [])

  return (
    <div
      role="region"
      aria-label="Terminal summary"
      className="w-full rounded-[12px] bg-[#101010] p-[20px] font-mono text-[13px] sm:text-[14px] leading-[1.7] shadow-[0_10px_30px_rgba(17,17,17,0.08)]"
    >
      <div className="mb-3.5 flex items-center gap-3 select-none">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#3F3F46]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3F3F46]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3F3F46]" />
        </div>
        <span className="text-[12px] leading-none text-[#71717A]">dito@gianagni: ~</span>
      </div>

      <div className="grid">
        <pre
          aria-hidden="true"
          className="invisible col-start-1 row-start-1 m-0 font-mono text-[13px] sm:text-[14px] leading-[1.7] whitespace-pre-wrap break-words select-none"
        >
          {renderSegments(TOTAL_CHARS)}
          <span>&nbsp;</span>
        </pre>

        <pre className="col-start-1 row-start-1 m-0 font-mono text-[13px] sm:text-[14px] leading-[1.7] whitespace-pre-wrap break-words">
          {renderSegments(revealedChars)}
          <span className="terminal-cursor" aria-hidden="true" />
        </pre>
      </div>

      <div className="mt-4 border-t border-[#27272A] pt-3 text-[12px] leading-[1.5] text-[#71717A]">
        dito@gianagni: ~/portfolio
      </div>
    </div>
  )
}
