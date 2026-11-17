import { useMemo, useState, type ReactNode } from 'react'

export interface Column<T> {
  key: string
  label: string
  sort?: (row: T) => string | number
  render: (row: T) => ReactNode
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  cari,
  filters,
  empty,
}: {
  rows: T[]
  columns: Column<T>[]
  cari?: (row: T, query: string) => boolean
  filters?: { label: string; value: string; options: { value: string; label: string }[]; match: (row: T, value: string) => boolean }[]
  empty: string
}) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState('')
  const [dir, setDir] = useState<1 | -1>(1)
  const [page, setPage] = useState(0)
  const [picked, setPicked] = useState<Record<string, string>>({})
  const filtered = useMemo(() => {
    let list = rows
    if (query && cari) list = list.filter((row) => cari(row, query.toLowerCase()))
    for (const filter of filters || []) {
      const value = picked[filter.value]
      if (value) list = list.filter((row) => filter.match(row, value))
    }
    const column = columns.find((item) => item.key === sortKey && item.sort)
    if (column?.sort) {
      list = [...list].sort((a, b) => {
        const left = column.sort!(a)
        const right = column.sort!(b)
        return left > right ? dir : left < right ? -dir : 0
      })
    }
    return list
  }, [rows, query, cari, filters, picked, columns, sortKey, dir])
  const size = 8
  const pages = Math.max(1, Math.ceil(filtered.length / size))
  const view = filtered.slice(page * size, page * size + size)
  return (
    <div className="table-card">
      <div className="table-tools">
        {cari ? <input className="field" value={query} placeholder="Cari…" aria-label="Cari tabel" onChange={(event) => { setQuery(event.target.value); setPage(0) }} /> : null}
        {(filters || []).map((filter) => (
          <select key={filter.value} className="field" aria-label={filter.label} value={picked[filter.value] || ''} onChange={(event) => { setPicked((prev) => ({ ...prev, [filter.value]: event.target.value })); setPage(0) }}>
            <option value="">{filter.label}</option>
            {filter.options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        ))}
      </div>
      {view.length === 0 ? <div className="empty-art"><span aria-hidden="true">◌</span><p>{empty}</p></div> : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>
                    {column.sort ? (
                      <button type="button" className="sort" onClick={() => { setSortKey(column.key); setDir((item) => (sortKey === column.key ? (item === 1 ? -1 : 1) : 1)) }}>{column.label}</button>
                    ) : column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view.map((row) => <tr key={row.id}>{columns.map((column) => <td key={column.key}>{column.render(row)}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      )}
      <div className="pager">
        <span>{filtered.length} baris</span>
        <button className="btn btn-ghost btn-sm" type="button" disabled={page === 0} onClick={() => setPage((item) => item - 1)}>Sebelumnya</button>
        <span>{page + 1} / {pages}</span>
        <button className="btn btn-ghost btn-sm" type="button" disabled={page + 1 >= pages} onClick={() => setPage((item) => item + 1)}>Berikutnya</button>
      </div>
    </div>
  )
}
