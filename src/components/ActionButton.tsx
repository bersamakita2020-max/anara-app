import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useAnara } from '../data/store'

export function ActionButton({
  children,
  busy,
  className = 'btn btn-grad',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean; children: ReactNode }) {
  const { pending } = useAnara()
  const locked = Boolean(busy || pending || rest.disabled)
  return (
    <button {...rest} className={className} disabled={locked} aria-busy={locked}>
      {locked ? <span className="spin" aria-hidden="true" /> : null}
      {children}
    </button>
  )
}
