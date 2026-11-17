import { QrMark } from './QrMark'
import type { Lembar } from '../lib/lembar'
import { KOP } from '../lib/lembar'

export function LembarView({ lembar }: { lembar: Lembar }) {
  return (
    <article className="lembar">
      <header>
        <strong className="sora">ANARA</strong>
        <div>{lembar.jenis}</div>
      </header>
      <p className="addr">{KOP}</p>
      <h2>{lembar.judul}</h2>
      <p className="nomor">{lembar.nomor} · {lembar.tanggal}</p>
      <table className="data">
        <tbody>
          {lembar.pihak.map((row) => <tr key={row.kiri}><th>{row.kiri}</th><td>{row.kanan}</td></tr>)}
        </tbody>
      </table>
      {lembar.pasal.map((pasal) => (
        <section key={pasal.judul}>
          <h3>{pasal.judul}</h3>
          <p>{pasal.isi}</p>
        </section>
      ))}
      {lembar.baris.length ? (
        <table className="data">
          <thead><tr>{lembar.kolom.map((kolom) => <th key={kolom}>{kolom}</th>)}</tr></thead>
          <tbody>{lembar.baris.map((baris, index) => <tr key={index}>{baris.map((sel, cell) => <td key={cell}>{sel}</td>)}</tr>)}</tbody>
        </table>
      ) : null}
      <dl className="ringkas">
        {lembar.ringkas.map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.nilai}</dd></div>)}
      </dl>
      {lembar.terbilang ? <p className="terbilang">Terbilang: {lembar.terbilang}</p> : null}
      {lembar.catatan ? <p className="catatan">{lembar.catatan}</p> : null}
      <div className="ttd-row">
        {lembar.ttd.map((orang) => (
          <div key={orang.jabatan + orang.nama}>
            <b>{orang.jabatan}</b>
            {orang.token ? <QrMark token={orang.token} label={`${orang.nama} · ${orang.jabatan}`} /> : <div className="ttd-kosong" />}
            <span>{orang.nama}</span>
          </div>
        ))}
      </div>
    </article>
  )
}
