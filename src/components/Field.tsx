import type { ReactNode } from 'react'

export function Field({
  id,
  label,
  hint,
  tooltip,
  required,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  tooltip?: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <div className="field-block">
      <label htmlFor={id}>
        {label}
        {required ? <span className="wajib"> wajib</span> : null}
        {tooltip ? <span className="tip" tabIndex={0} aria-label={tooltip}>i<span>{tooltip}</span></span> : null}
      </label>
      {children}
      {hint ? <p className="hint" id={`${id}-bantuan`}>{hint}</p> : null}
      {error ? <p className="field-error" role="alert">{error}</p> : null}
    </div>
  )
}

export function CaraMengisi({ judul, butir }: { judul: string; butir: string[] }) {
  return (
    <aside className="cara">
      <b>{judul}</b>
      <ol>{butir.map((item) => <li key={item}>{item}</li>)}</ol>
    </aside>
  )
}

export function NomorKunci({ id, nilai }: { id: string; nilai: string }) {
  return (
    <Field id={id} label="Nomor dokumen" hint="Nomor dikunci oleh server saat disimpan agar tidak bentrok." tooltip="Urutan dimulai dari 0001 setiap bulan.">
      <input className="field" id={id} value={nilai || 'Terisi otomatis saat disimpan'} readOnly />
    </Field>
  )
}
