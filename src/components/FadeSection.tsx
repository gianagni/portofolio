import { useEffect, useRef, useState, type ReactNode } from 'react'

interface FadeSectionProps {
  id?: string
  ariaLabelledBy?: string
  className?: string
  children: ReactNode
}

export function FadeSection({ id, ariaLabelledBy, className = '', children }: FadeSectionProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (visible) return
    const node = ref.current
    if (!node) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
            break
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [visible])

  return (
    <section
      ref={ref}
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={`fade-section scroll-mt-10 ${visible ? 'is-visible' : ''} ${className}`.trim()}
    >
      {children}
    </section>
  )
}
