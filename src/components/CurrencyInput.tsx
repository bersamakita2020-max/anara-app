import { useEffect, useState } from 'react'

function digits(value: string): string {
  return value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
}

export function formatRupiahInput(amount: number): string {
  if (!amount) return ''
  return 'Rp ' + amount.toLocaleString('id-ID')
}

export function CurrencyInput({
  id,
  value,
  onChange,
  required,
}: {
  id: string
  value: number
  onChange: (amount: number) => void
  required?: boolean
}) {
  const [text, setText] = useState(value ? formatRupiahInput(value) : '')
  useEffect(() => {
    const shown = digits(text)
    const next = value ? String(value) : ''
    if (shown !== next) setText(value ? formatRupiahInput(value) : '')
  }, [value, text])
  return (
    <input
      id={id}
      className="field"
      inputMode="numeric"
      required={required}
      value={text}
      onChange={(event) => {
        const raw = digits(event.target.value)
        const amount = raw ? Number(raw) : 0
        setText(amount ? formatRupiahInput(amount) : '')
        onChange(amount)
      }}
    />
  )
}
