import type { MouseEvent } from 'react'
import { TextLink } from './TextLink'

const NAV_ITEMS = [
  { label: 'Work', href: '#work' },
  { label: 'Experience', href: '#experience' },
  { label: 'Contact', href: '#contact' },
] as const

function handleAnchorClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
  if (!href.startsWith('#')) return
  const target = document.getElementById(href.slice(1))
  if (!target) return
  event.preventDefault()
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  window.history.replaceState(null, '', href)
}

export function Nav() {
  return (
    <header className="w-full pt-8 pb-12 sm:pt-11 sm:pb-16">
      <nav
        aria-label="Primary"
        className="flex items-baseline justify-between gap-4 text-[15px] leading-normal"
      >
        <TextLink
          href="#top"
          onClick={(event) => handleAnchorClick(event, '#top')}
          className="font-medium tracking-[-0.01em]"
        >
          NG
        </TextLink>
        <ul className="flex items-center gap-6 sm:gap-7">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <TextLink
                href={item.href}
                onClick={(event) => handleAnchorClick(event, item.href)}
                className="text-[14px]"
              >
                {item.label}
              </TextLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
