export function pesanAuth(message: string, jenis: 'masuk' | 'daftar' | 'reset'): string {
  const teks = message.toLowerCase()
  if (teks.includes('invalid login') || teks.includes('invalid_credentials') || teks.includes('invalid credentials')) {
    return 'Email atau kata sandi tidak sesuai.'
  }
  if (teks.includes('email not confirmed')) return 'Cek email Anda untuk konfirmasi.'
  if (teks.includes('already registered') || teks.includes('already been registered') || teks.includes('user already exists')) {
    return 'Email ini sudah terdaftar. Silakan masuk.'
  }
  if (teks.includes('weak') || (teks.includes('password') && (teks.includes('6') || teks.includes('short') || teks.includes('least')))) {
    return 'Kata sandi minimal 6 karakter.'
  }
  if (teks.includes('rate') || teks.includes('too many') || teks.includes('over_request')) {
    return 'Terlalu banyak percobaan. Coba lagi beberapa saat.'
  }
  if (teks.includes('invalid email') || teks.includes('unable to validate email')) return 'Alamat email tidak valid.'
  if (jenis === 'reset') return 'Pengaturan ulang kata sandi gagal. Periksa alamat email.'
  if (jenis === 'daftar') return 'Pendaftaran gagal. Periksa email dan kata sandi.'
  return 'Tidak dapat masuk. Periksa email dan kata sandi.'
}
