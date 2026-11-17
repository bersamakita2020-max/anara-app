import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Field } from './Field'

export interface ComboOption {
  value: string
  label: string
}

export function Combobox({
  id,
  label,
  hint,
  tooltip,
  required,
  placeholder,
  value,
  options,
  onChange,
  onCreate,
  error,
}: {
  id?: string
  label: string
  hint?: string
  tooltip?: string
  required?: boolean
  placeholder?: string
  value: string
  options: ComboOption[]
  onChange: (value: string, label: string) => void
  onCreate?: (label: string) => Promise<string | void> | string | void
  error?: string
}) {
  const autoId = useId()
  const fieldId = id || autoId
  const box = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const selected = options.find((item) => item.value === value)
  const shown = query || (open ? '' : selected?.label || '')
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return options.filter((item) => item.label.toLowerCase().includes(needle))
  }, [options, query])
  const canCreate = Boolean(onCreate && query.trim() && !options.some((item) => item.label.toLowerCase() === query.trim().toLowerCase()))
  const rows = canCreate ? [...filtered, { value: '__baru__', label: `Tambah “${query.trim()}” baru` }] : filtered

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  async function choose(index: number) {
    const item = rows[index]
    if (!item) return
    if (item.value === '__baru__' && onCreate) {
      const created = await onCreate(query.trim())
      onChange(created || query.trim(), query.trim())
    } else {
      onChange(item.value, item.label)
    }
    setQuery('')
    setOpen(false)
  }

  return (
    <Field id={fieldId} label={label} hint={hint} tooltip={tooltip} required={required} error={error}>
      <div className="combo" ref={box}>
        <input
          id={fieldId}
          className="field"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          placeholder={placeholder || 'Ketik untuk mencari'}
          value={open ? query : shown}
          onFocus={() => { setOpen(true); setQuery('') }}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); setCursor(0) }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setCursor((item) => Math.min(item + 1, rows.length - 1)) }
            if (event.key === 'ArrowUp') { event.preventDefault(); setCursor((item) => Math.max(item - 1, 0)) }
            if (event.key === 'Enter' && open) { event.preventDefault(); void choose(cursor) }
            if (event.key === 'Escape') setOpen(false)
          }}
        />
        {open ? (
          <ul className="combo-list" role="listbox">
            {rows.length === 0 ? <li className="muted">Tidak ada yang cocok.</li> : null}
            {rows.map((item, index) => (
              <li key={item.value + item.label}>
                <button type="button" className={index === cursor ? 'on' : undefined} role="option" aria-selected={item.value === value} onMouseEnter={() => setCursor(index)} onClick={() => void choose(index)}>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Field>
  )
}
