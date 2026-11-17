import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export function QrMark({ token, label }: { token: string; label: string }) {
  const [src, setSrc] = useState('')
  const url = `${window.location.origin}/anara-app/verifikasi/${token}`
  useEffect(() => {
    void QRCode.toDataURL(url, { margin: 1, width: 168 }).then(setSrc)
  }, [url])
  return (
    <figure className="qr-mark">
      {src ? <img src={src} alt={`QR verifikasi ${label}`} /> : <div className="skeleton" />}
      <figcaption>
        <b>{label}</b>
        <span>Pindai untuk memeriksa keaslian</span>
      </figcaption>
    </figure>
  )
}
