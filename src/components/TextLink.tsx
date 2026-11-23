import type { AnchorHTMLAttributes, ReactNode } from 'react'

interface TextLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href?: string
  tone?: 'ink' | 'accent'
  children: ReactNode
}

export function TextLink({ href, tone = 'ink', children, className = '', ...rest }: TextLinkProps) {
  const toneClasses = tone === 'accent' ? 'text-[#22C55E] decoration-[#22C55E]' : 'decoration-current'
  const baseClasses = `${toneClasses} underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline`

  if (!href) {
    return <span className={`${baseClasses} cursor-default ${className}`.trim()}>{children}</span>
  }

  return (
    <a href={href} className={`${baseClasses} ${className}`.trim()} {...rest}>
      {children}
    </a>
  )
}
