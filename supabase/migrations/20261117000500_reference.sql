-- 005 Data acuan: harga resmi, templat, aturan, dan pengaturan. Bukan data contoh.

insert into public.packages (id, slug, brand, name, summary, price_min, price_max, fixed, revisions, active, sort) values
('undangan-basic','undangan-basic','studio','Undangan digital Basic','Satu tampilan dan fitur inti.',250000,250000,true,2,true,1),
('undangan-premium','undangan-premium','studio','Undangan digital Premium','Lebih banyak halaman, galeri, dan ucapan.',350000,350000,true,2,true,2),
('undangan-exclusive','undangan-exclusive','studio','Undangan digital Exclusive','Paket terlengkap dengan kustomisasi lebih luas.',500000,500000,true,2,true,3),
('video-pendek','video-pendek','studio','Video pendek / reels','15–60 detik, satu lagu, dua revisi.',150000,300000,false,2,true,4),
('dokumentasi','dokumentasi','studio','Dokumentasi kegiatan','Setengah hari sampai sehari, suntingan ringkas.',500000,1500000,false,2,true,5),
('video-profil','video-profil','studio','Video profil','2–5 menit dengan naskah sederhana.',1000000,3000000,false,2,true,6),
('video-ai','video-ai','studio','Video AI singkat','Visual bantu AI, durasi pendek.',200000,500000,false,2,true,7),
('audio','audio','studio','Audio / podcast','Rekaman dan rapikan 1–3 episode.',150000,400000,false,2,true,8),
('tugas','tugas','edukasi','Tugas kuliah / makalah','Pendampingan naskah pendek. Bukan pengganti penulis.',150000,300000,false,2,true,9),
('kti','kti','edukasi','KTI / laporan','Struktur, bahasa, dan merapikan sitasi.',300000,600000,false,2,true,10),
('rpl','rpl','edukasi','Naskah dan portofolio RPL','Jadwal di luar jam kerja, termasuk pegawai instansi.',400000,1500000,false,2,true,11),
('skripsi','skripsi','edukasi','Pendampingan skripsi','Bimbingan bertahap. Tanpa jaminan kelulusan.',800000,2000000,false,2,true,12),
('tesis','tesis','edukasi','Pendampingan tesis','Pendampingan lebih dalam, jadwal tertulis.',1500000,3500000,false,2,true,13),
('web-umkm','web-umkm','tech','Situs profil UMKM','5–8 halaman.',1000000,2500000,false,2,true,14),
('web-instansi','web-instansi','tech','Situs instansi','Informasi resmi, berita, dan unggah dokumen.',2500000,5000000,false,2,true,15),
('aplikasi-kerja','aplikasi-kerja','tech','Aplikasi kerja','Lingkup ditulis terpisah pada lampiran.',3000000,8000000,false,2,true,16),
('android','android','tech','Aplikasi Android','Fungsi inti, tanpa jaminan lolos toko aplikasi.',5000000,15000000,false,2,true,17),
('flipbook','flipbook','tech','Flipbook','Tata letak, unggah, dan tautan unduh.',750000,2000000,false,2,true,18)
on conflict (id) do update set name = excluded.name, summary = excluded.summary, price_min = excluded.price_min, price_max = excluded.price_max, fixed = excluded.fixed, sort = excluded.sort;

insert into public.contract_templates (key, name, prefix, body) values
('pks','01 Perjanjian Kerja Sama Mitra','ANR/PKS',$body_pks$01 Perjanjian Kerja Sama Mitra
Nomor: {{nomor}}
Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat · WhatsApp 0858-1169-9699
PERJANJIAN KERJA SAMA MITRA
ANARA
Perjanjian ini dibuat dan disepakati oleh dua pihak di bawah ini, dalam bahasa yang jelas agar hak, kewajiban, dan pembagian hasil usaha ANARA dapat dijalankan dengan tertib.
Pada tanggal {{tanggal}} , yang menandatangani perjanjian ini:
1. M. Wilda Alfiansyah, A.Md.Kes.
selaku Pemilik ANARA, berkedudukan di Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat, WhatsApp 0858-1169-9699, selanjutnya disebut Pihak Pertama.
2. M. Fadilah Alkadri
selaku Mitra Pengelola ANARA, Manager Keuangan dan Admin WhatsApp, beralamat di {{alamat_mitra}}, WhatsApp {{wa_mitra}} , selanjutnya disebut Pihak Kedua.
Pihak Pertama dan Pihak Kedua, baik sendiri-sendiri maupun bersama-sama, selanjutnya disebut Para Pihak. Para Pihak menyatakan cakap dan berwenang menandatangani perjanjian ini, lalu sepakat terikat pada ketentuan berikut.
Pasal 1 Pengertian
(1) ANARA adalah usaha jasa yang dijalankan di Kabupaten Sintang, Kalimantan Barat, dengan tiga unit layanan: ANARA Studio, ANARA Edukasi, dan ANARA Tech. Tagline resmi ANARA adalah “ANARA, Beyond Value”.
(2) Order adalah pekerjaan yang diterima ANARA dari klien dan telah disepakati, termasuk setelah uang muka diterima sesuai ketentuan yang berlaku.
(3) Jasa pengerja adalah bagian hasil order yang dibayarkan kepada orang yang mengerjakan order tersebut.
(4) Kas usaha adalah dana yang ditahan untuk modal dan kebutuhan usaha. Operasional adalah dana untuk biaya kerja sehari-hari, termasuk kuota, langganan perangkat, dan honor peran. Laba bersih adalah sisa hasil order setelah pos lain dipenuhi, yang kemudian dibagi antara Para Pihak.
(5) Rencana Bisnis ANARA 2027 dan SOP ANARA (SOP-ANARA-001 sampai SOP-ANARA-011) merupakan bagian yang tidak terpisahkan dari perjanjian ini, sepanjang tidak bertentangan dengan pasal di sini.
Pasal 2 Ruang lingkup dan peran (1) Perjanjian ini mengatur kerja sama Para Pihak dalam menjalankan ANARA, termasuk pengerjaan order, pengelolaan uang, pembagian hasil, dan tata tertib kerja.
(2) Pihak Pertama sebagai pemilik menentukan arah usaha, mutu layanan, harga resmi, dan skema bagi hasil. Pihak Pertama mengerjakan order ANARA Studio dan ANARA Tech, serta merancang aplikasi order dan keuangan milik ANARA. Pihak Pertama tidak memegang kas harian.
(3) Pihak Kedua memegang kas usaha, mencatat keuangan, menjadi Admin WhatsApp resmi 0858-1169-9699, dan mengerjakan order ANARA Edukasi. Pihak Kedua tidak mengubah skema bagi hasil, daftar harga resmi, atau rekening usaha tanpa persetujuan tertulis Pihak Pertama.
(4) Pembagian peran pengerjaan di atas adalah patokan kerja. Jika suatu order dikerjakan bersama atau dialihkan karena salah satu pihak berhalangan, jasa pengerja dibayar kepada yang benar-benar mengerjakan, dan dicatat secara tertulis.
Pasal 3 Kewajiban dan hak Pihak Pertama berkewajiban:
- Menjaga arah, mutu, dan nama baik ANARA.
- Mengerjakan order Studio dan Tech sesuai brief, tenggat, dan tata kerja SOP.
- Menyetujui laporan keuangan dan pembayaran hasil setiap bulan.
- Menyediakan arah kerja aplikasi internal dan keputusan yang menjadi wewenang pemilik. Pihak Pertama berhak:
- Menerima bagian laba bersih sesuai Pasal 4.
- Memeriksa catatan kas, rekening usaha, dan arsip order setiap saat.
- Menolak order yang merugikan nama baik atau berada di luar lingkup layanan ANARA. Pihak Kedua berkewajiban:
- Membalas pesan masuk di WhatsApp 0858-1169-9699 pada hari kerja yang sama, paling lambat 24 jam.
- Mencatat setiap penerimaan dan pengeluaran pada hari yang sama, serta menjaga rekening usaha terpisah dari rekening pribadi.
- Mengerjakan order Edukasi sebagai pendampingan, bimbingan, dan penyuntingan, sesuai SOP dan etika akademik.
- Menyusun laporan tertulis paling lambat setiap tanggal 5 bulan berikutnya.
- Menjaga kerahasiaan data klien dan data usaha. Pihak Kedua berhak:
- Menerima jasa pengerja atas order yang dikerjakannya, bagian laba bersih, dan honor peran sesuai Pasal 4.
- Meminta kejelasan tertulis jika ada perubahan harga, skema, atau tata kerja.
Pasal 4 Pembagian hasil (1) Setiap order, setelah dikurangi fee referral apabila ada, dibagi ke empat pos. Porsi pos mengikuti fase usaha berikut:
Pos Fase 1 Januari–April Fase 2 Mei–September Fase 3 Oktober–Desember
Jasa pengerja | >40% | >45% | >50%
Kas / modal usaha | >30% | >15% | >10%
Operasional | >15% | >15% | >15%
Laba bersih | >15% | >25% | >25%
Total | >100% | >100% | >100% (2) Laba bersih dibagi 60 persen untuk Pihak Pertama dan 40 persen untuk Pihak Kedua. Jasa pengerja dibayar kepada orang yang mengerjakan order tersebut.
(3) Pihak Kedua menerima honor peran sebagai Manager Keuangan dan Admin WhatsApp sebesar Rp300.000 pada Fase 1, Rp500.000 pada Fase 2, dan Rp750.000 pada Fase 3, untuk setiap bulan. Honor ini dibayar dari pos operasional. Jika pos operasional tidak mencukupi, honor dibayar dari kas usaha, atau dicatat sebagai kewajiban yang dilunasi pada bulan berikutnya.
(4) Siapa pun yang membawa klien hingga menjadi order berhak atas fee referral sebesar 5 persen dari nilai order, yang dihitung sebelum pembagian empat pos. Fee hanya dibayar jika ada perujuk yang dicatat pada saat order diterima.
(5) Pembagian hasil dilakukan setiap tanggal 5 bulan berikutnya, setelah laporan disetujui Pihak Pertama. Jasa pengerja boleh dibayar per order setelah klien pelunasan, tanpa menunggu tanggal 5, asalkan sudah dicatat.
(6) Setelah Desember 2027, porsi Fase 3 tetap dipakai sampai Para Pihak menuangkan perubahan tertulis, biasanya pada tinjauan enam bulan.
Contoh perhitungan pada Fase 1, tanpa fee referral:
Contoh order Jasa pengerja Kas Operasional Laba (Pemilik / Mitra)
Undangan Premium Rp350.000 | >Rp140.000 | >Rp105.000 | >Rp52.500 | >Rp31.500 / Rp21.000
Pendampingan skripsi Rp1.500.000 | >Rp600.000 | >Rp450.000 | >Rp225.000 | >Rp135.000 / Rp90.000
Pasal 5 Pengelolaan kas dan dana darurat (1) Rekening usaha ANARA dipisahkan dari rekening pribadi Para Pihak. Nomor rekening usaha:
Bank {{bank}} Nomor {{rekening}} Atas nama {{atas_nama}}
(2) Sebanyak 20 persen saldo kas dikunci sebagai dana darurat sampai jumlah terkunci mencapai Rp5.000.000. Dana darurat tidak dipakai untuk keperluan pribadi dan tidak dipakai untuk belanja rutin, kecuali dalam keadaan mendesak yang disetujui tertulis oleh Para Pihak.
(3) Pembelian perangkat atau langganan berbayar di atas kuota internet hanya dilakukan jika kas usaha sudah melewati Rp2.000.000, dan mengikuti jadwal yang tertulis di Rencana Bisnis ANARA 2027, atau keputusan tertulis lain dari Pihak Pertama.
(4) Pihak Kedua tidak memindahkan dana usaha ke rekening pribadi, kecuali untuk membayar jasa pengerja, honor, bagian laba, atau biaya usaha yang sudah dicatat dan dapat dibuktikan.
Pasal 6 Laporan keuangan (1) Pihak Kedua menyusun laporan tertulis setiap tanggal 5, paling sedikit memuat: daftar order masuk dan lunas pada bulan sebelumnya, rincian pembagian per order, saldo kas, saldo operasional, honor, laba, dan pengeluaran tools.
(2) Laporan memakai Kalkulator Bagi Hasil ANARA atau aplikasi keuangan internal apabila sudah dipakai. Setelah Pihak Pertama menyetujui laporan, pembayaran laba, honor, dan sisa kewajiban dilakukan pada hari yang sama atau paling lambat dua hari kerja kemudian.
(3) Pihak Pertama boleh meminta penjelasan atau bukti pendukung sebelum menyetujui laporan. Perbedaan catatan diselesaikan dengan musyawarah pada kesempatan pertama.
Pasal 7 Kerahasiaan (1) Para Pihak menjaga kerahasiaan data klien, naskah, file, catatan keuangan, daftar klien, harga khusus, dan informasi usaha lain yang tidak dimaksudkan untuk umum.
(2) Kewajiban ini tetap berlaku selama dua tahun setelah perjanjian berakhir, kecuali data itu sudah menjadi milik umum secara sah atau harus dibuka karena ketentuan hukum.
Pasal 8 Kepemilikan merek, aset, dan karya (1) Nama, logo, tagline, akun media sosial, situs, aplikasi internal, templat, daftar klien, dan identitas merek ANARA adalah milik usaha ANARA yang diwakili Pihak Pertama sebagai pemilik.
(2) Karya yang dihasilkan untuk klien mengikuti perjanjian dengan klien tersebut. File kerja, akun, dan perangkat yang dibeli dari kas usaha adalah aset ANARA.
(3) Peralatan atau langganan yang dibeli dari uang pribadi salah satu pihak tetap milik pihak yang membeli, kecuali kemudian diganti dari kas usaha dan dicatat sebagai aset ANARA.
(4) Pihak Kedua tidak mendaftarkan merek, akun, atau domain atas nama pribadi yang memakai nama ANARA, tanpa persetujuan tertulis Pihak Pertama.
Pasal 9 Larangan mengambil klien dan memakai nama ANARA (1) Selama perjanjian berlangsung dan enam bulan setelahnya, masing-masing pihak tidak menawarkan layanan sejenis secara pribadi kepada klien ANARA yang pernah ditangani selama kerja sama ini, dan tidak memakai nama, logo, atau data ANARA untuk kepentingan di luar usaha.
(2) Ketentuan ini tidak menghalangi Para Pihak bekerja di bidang lain yang tidak memakai merek ANARA dan tidak mengambil klien ANARA.
(3) Pelanggaran pasal ini menjadi alasan pengakhiran perjanjian dan dapat diikuti tuntutan ganti rugi sebesar kerugian yang dapat dibuktikan.
Pasal 10 Jangka waktu dan evaluasi (1) Perjanjian ini berlaku mulai tanggal {{mulai}} dan berlangsung untuk jangka waktu satu tahun. Perjanjian diperpanjang secara otomatis untuk satu tahun berikutnya, kecuali salah satu pihak memberi tahu secara tertulis paling lambat 30 hari sebelum tanggal berakhir.
(2) Para Pihak meninjau kerja sama ini paling sedikit setiap enam bulan, termasuk skema bagi hasil, honor peran, dan beban kerja. Perubahan hanya sah jika dituangkan secara tertulis dan ditandatangani Para Pihak.
Pasal 11 Pengunduran diri, pengakhiran, dan pembagian aset (1) Salah satu pihak boleh mengakhiri perjanjian dengan pemberitahuan tertulis 30 hari sebelumnya. Order yang sedang dikerjakan diselesaikan atau dialihkan secara tertib kepada pihak yang tersisa, dengan pemberitahuan kepada klien jika diperlukan.
(2) Perjanjian dapat berakhir segera jika salah satu pihak melakukan pelanggaran berat, antara lain: merugikan kas usaha, membocorkan data klien, mengambil klien secara tidak sah, atau tidak menjalankan kewajiban pokok setelah dua kali peringatan tertulis.
(3) Pada saat berakhir, urutan penyelesaian adalah sebagai berikut: (a) merapikan arsip order dan akun usaha; (b) membayar jasa pengerja, honor, dan kewajiban kepada pihak ketiga yang sudah tercatat; (c) menagih atau menyerahkan piutang yang masih berjalan sesuai kesepakatan; (d) membagi sisa kas usaha setelah kewajiban dilunasi, yaitu 60 persen untuk Pihak Pertama dan 40 persen untuk Pihak Kedua, kecuali Para Pihak menulis kesepakatan lain.
(4) Merek, akun, data klien, aplikasi internal, dan aset yang dibeli dari kas usaha tetap pada ANARA yang diwakili Pihak Pertama. Pihak yang keluar menyerahkan akses, sandi, arsip, dan barang usaha paling lambat tujuh hari setelah tanggal berakhir.
Pasal 12 Penyelesaian sengketa (1) Setiap sengketa diselesaikan terlebih dahulu melalui musyawarah secara kekeluargaan, paling lama 30 hari sejak salah satu pihak menyampaikan keberatan secara tertulis.
(2) Jika musyawarah tidak merampungkan sengketa, Para Pihak menyerahkan penyelesaiannya kepada Pengadilan Negeri Sintang.
Pasal 13 Ketentuan penutup (1) Hal-hal yang belum diatur dalam perjanjian ini dapat ditambahkan kemudian melalui adendum tertulis yang ditandatangani Para Pihak.
(2) Jika satu ketentuan dalam perjanjian ini tidak dapat diberlakukan, ketentuan lain tetap berlaku.
(3) Perjanjian ini dibuat atas kehendak Para Pihak, tanpa paksaan, dan mengikat sejak ditandatangani.
Demikian perjanjian ini dibuat dan ditandatangani di Sintang, pada tanggal {{tanggal}} , dalam dua rangkap yang sama bunyinya. Masing-masing rangkap mempunyai kekuatan yang sama setelah ditandatangani dan dibubuhi materai cukup.
PIHAK PERTAMA
Pemilik ANARA
tempat materai
M. Wilda Alfiansyah, A.Md.Kes.
PIHAK KEDUA
Mitra Pengelola ANARA
tempat materai
M. Fadilah Alkadri
Alamat usaha: Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat. WhatsApp 0858-1169-9699 (wa.me/6285811699699).$body_pks$),
('pekerja','02 Kontrak Pekerja dan Admin Medsos','ANR/PKP',$body_pekerja$02 Kontrak Kerja Pekerja dan Admin Medsos
Nomor: {{nomor}}
Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat · WhatsApp 0858-1169-9699
PERJANJIAN KERJA SAMA
Pekerja Lepas / Freelancer dan Admin Media Sosial
Bagian yang diarsir kuning dan titik-titik adalah isian. Ganti dengan data yang benar sebelum dicetak dan ditandatangani.
Templat ini dipakai ANARA ketika menambah pekerja lepas, honorer, atau admin media sosial. Lowongan hanya dibuka jika syarat di Rencana Bisnis dan SOP-ANARA-011 sudah terpenuhi, yaitu omzet minimal Rp12.000.000 selama tiga bulan beruntun dan kas usaha minimal Rp15.000.000, kecuali ada keputusan tertulis lain dari Pemilik.
Pada tanggal {{tanggal}} , yang menandatangani perjanjian ini:
1. M. Wilda Alfiansyah, A.Md.Kes.
selaku Pemilik ANARA, berkedudukan di Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat, WhatsApp 0858-1169-9699, selanjutnya disebut ANARA.
2. Data pekerja
Uraian Isian
Nama lengkap | {{nama_pekerja}}
NIK | {{nik}}
Alamat | {{alamat_pekerja}}
WhatsApp | {{wa_pekerja}}
Posisi | {{posisi}}
Tanggal mulai kerja | {{mulai}}
Masa percobaan | 3 (tiga) bulan, atau ..........
Jenis honor | Per proyek / Bulanan
Nilai honor | {{honor}}
Hari atau jam ketersediaan | {{jadwal}}
Target kerja (jika ada) | ................................ Pihak pada butir 2 selanjutnya disebut Pekerja. ANARA dan Pekerja sepakat terikat pada ketentuan berikut.
Pasal 1 Status dan ruang lingkup (1) Perjanjian ini adalah kerja sama untuk pekerjaan tertentu atau peran honorer. Perjanjian ini bukan pengangkatan sebagai karyawan tetap, kecuali kemudian dituangkan dalam perjanjian baru yang menyatakan hal itu.
(2) Pekerja produksi atau freelancer mengerjakan pekerjaan sesuai uraian tugas dan brief setiap proyek. Admin media sosial mengelola unggahan, pesan yang diarahkan, dan jadwal konten sesuai Brand Kit Aura. Admin media sosial tidak memegang kas usaha dan tidak menentukan harga, skema, atau rekening ANARA.
(3) Uraian tugas Pekerja: ................................................................ ................................................................
Pasal 2 Masa percobaan (1) Masa percobaan berlangsung selama jangka waktu yang tertulis di tabel di atas, dihitung dari tanggal mulai kerja. Selama masa itu, salah satu pihak boleh mengakhiri perjanjian dengan pemberitahuan tertulis tujuh hari sebelumnya, tanpa kewajiban membayar sisa honor di luar pekerjaan yang sudah selesai dan diterima.
(2) Kinerja ditinjau pada akhir masa percobaan. Kelanjutan kerja dituangkan secara tertulis, termasuk jika honor atau tugas berubah.
Pasal 3 Honor dan pembayaran (1) Nilai dan jenis honor mengikuti isian pada tabel. Honor per proyek dibayar setelah pekerjaan diterima dan, jika terkait order klien, setelah ketentuan pembayaran klien yang relevan terpenuhi. Honor bulanan dibayar setiap tanggal ........ , untuk bulan sebelumnya.
(2) Pajak, jika ada dan diwajibkan ketentuan yang berlaku, ditanggung sesuai kesepakatan tertulis pada saat pembayaran. Biaya alat kerja pribadi menjadi tanggungan Pekerja, kecuali ANARA menyediakan akses atau perangkat atas nama usaha.
(3) ANARA tidak menahan honor yang sudah jatuh tempo, kecuali ada kerugian yang dapat dibuktikan karena kesalahan Pekerja, dan hanya sebesar kerugian itu, setelah Pekerja diberi kesempatan menjelaskan.
Pasal 4 Ketersediaan, target, dan tata kerja (1) Pekerja menjaga ketersediaan sesuai hari atau jam yang tertulis di tabel, dan memberi tahu ANARA secepatnya jika berhalangan.
(2) Target kerja, jika diisi, menjadi acuan penilaian. Perubahan target disampaikan secara tertulis.
(3) File kerja, akun, dan bahan klien disimpan di folder atau akun yang ditentukan ANARA. Pekerja tidak menyimpan salinan di perangkat pribadi lebih lama daripada yang diperlukan untuk menyelesaikan pekerjaan, dan menghapusnya setelah serah terima, kecuali ANARA meminta arsip tertentu.
Pasal 5 Kerahasiaan (1) Pekerja menjaga kerahasiaan data klien, naskah, file, harga, dan informasi internal ANARA. Data itu tidak boleh dibagi kepada pihak lain, diunggah, atau dipakai untuk kepentingan pribadi.
(2) Kewajiban ini tetap berlaku selama dua tahun setelah perjanjian berakhir.
Pasal 6 Hak cipta dan karya (1) Seluruh karya, file, rancangan, unggahan, dan bahan yang dihasilkan Pekerja dalam rangka perjanjian ini menjadi milik ANARA sejak diserahkan, dan ANARA berhak menyerahkannya kepada klien sesuai perjanjian dengan klien.
(2) Pekerja menjamin bahwa karya yang diserahkannya tidak meniru karya orang lain secara tidak sah. Jika timbul tuntutan karena pelanggaran itu, Pekerja membantu penyelesaiannya dan bertanggung jawab atas kerugian yang dapat dibuktikan, sepanjang bukan karena instruksi tertulis ANARA.
(3) Nama, logo, akun, dan bahan merek ANARA hanya dipakai untuk menjalankan tugas. Akses diserahkan kembali pada saat perjanjian berakhir.
Pasal 7 Tata tertib dan sanksi (1) Pekerja bekerja jujur, sopan kepada klien, dan mengikuti Brand Kit serta SOP yang relevan.
(2) Pelanggaran ringan, seperti keterlambatan berulang tanpa kabar, diberikan peringatan tertulis. Pelanggaran berat, antara lain membocorkan data, merusak nama baik ANARA, atau tidak menyerahkan pekerjaan tanpa alasan yang patut, dapat berakibat pengakhiran segera dan tuntutan ganti rugi sebesar kerugian yang dapat dibuktikan.
Pasal 8 Pengakhiran (1) Setelah masa percobaan, salah satu pihak boleh mengakhiri perjanjian dengan pemberitahuan tertulis 14 hari sebelumnya. Pekerjaan yang sedang berjalan diselesaikan atau diserahkan secara tertib.
(2) Pada saat berakhir, Pekerja menyerahkan file, akses, dan barang milik ANARA paling lambat tiga hari, dan menerima honor atas pekerjaan yang sudah selesai dan diterima.
Pasal 9 Penyelesaian sengketa dan penutup (1) Sengketa diselesaikan melalui musyawarah paling lama 30 hari. Jika tidak selesai, Para Pihak menyerahkannya kepada Pengadilan Negeri Sintang.
(2) Perubahan perjanjian hanya sah jika dibuat tertulis dan ditandatangani kedua belah pihak.
Demikian perjanjian ini dibuat dan ditandatangani di Sintang, pada tanggal {{tanggal}} , dalam dua rangkap yang sama bunyinya. Masing-masing rangkap mempunyai kekuatan yang sama setelah ditandatangani dan dibubuhi materai cukup.
ANARA
Pemilik
tempat materai
M. Wilda Alfiansyah, A.Md.Kes.
PEKERJA
Nama terang
tempat materai
{{nama_pekerja}}
Alamat usaha: Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat. WhatsApp 0858-1169-9699 (wa.me/6285811699699).$body_pekerja$),
('umum','03 Kontrak Layanan Klien Umum','ANR/UMM',$body_umum$03 Kontrak Layanan Klien Umum
Nomor: {{nomor}}
Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat · WhatsApp 0858-1169-9699
PERJANJIAN LAYANAN
Templat umum untuk klien ANARA
Bagian yang diarsir kuning dan titik-titik adalah isian. Ganti dengan data yang benar sebelum dicetak dan ditandatangani.
Perjanjian ini adalah kesepakatan kerja antara ANARA dan Klien. Bahasanya disusun agar mudah dipahami, tetap jelas hak dan kewajibannya, dan dapat diisi lalu ditandatangani sebelum pekerjaan dimulai.
Data perjanjian dan rincian pekerjaan
Uraian Isian
Tanggal perjanjian | {{tanggal}}
Nama klien | {{nama_klien}}
Alamat klien | {{alamat_klien}}
WhatsApp klien | {{wa_klien}}
Nama instansi atau kampus | {{instansi}}
Unit layanan | {{unit}}
Nama layanan atau paket | {{paket}}
Uraian pekerjaan secara singkat | {{brief}}
Harga total | {{harga}}
Uang muka (DP) | {{dp}}
Pelunasan | {{sisa}}
Tanggal mulai | {{mulai}}
Tanggal selesai (target) | {{selesai}}
Jumlah putaran revisi yang termasuk | {{revisi}}
Rekening pembayaran | {{rekening}} ANARA dalam perjanjian ini diwakili oleh M. Wilda Alfiansyah, A.Md.Kes., Pemilik, berkedudukan di Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat, WhatsApp 0858-1169-9699. Pihak yang datanya tertulis pada tabel di atas selanjutnya disebut Klien.
Pasal 1 Dasar kesepakatan (1) ANARA menyediakan layanan sesuai unit, paket, dan uraian yang tertulis pada tabel di atas, serta lampiran jika ada. Jika ada perbedaan antara pembicaraan lisan dan tulisan, yang berlaku adalah yang tertulis dalam perjanjian ini dan lampirannya.
(2) Pekerjaan dimulai setelah uang muka diterima dan brief atau bahan awal yang diminta ANARA sudah lengkap. File atau hasil akhir diserahkan setelah pelunasan.
Pasal 2 Biaya dan pembayaran (1) Harga total adalah jumlah yang tertulis pada tabel. Harga itu sudah mencakup putaran revisi yang disebutkan, sepanjang masih dalam lingkup pekerjaan.
(2) Uang muka standar adalah 50 persen dari harga total, kecuali diisi lain pada tabel, misalnya 30 persen untuk order kecil dari klien lama yang tertib, atau 70 persen untuk order baru bernilai tinggi atau klien baru dari instansi.
(3) Klien membayar ke rekening yang tertulis pada tabel atau pada tagihan resmi ANARA. Kerja dihentikan sementara jika pelunasan belum diterima setelah tujuh hari dari pemberitahuan tagihan, sampai pembayaran masuk.
(4) Biaya tambahan di luar lingkup, termasuk revisi kelebihan, perubahan konsep, atau penambahan pokok pekerjaan, hanya dikenakan setelah ANARA memberitahukan jumlahnya dan Klien menyetujuinya.
Pasal 3 Jadwal dan kewajiban Klien (1) Target tanggal selesai berlaku jika Klien mengirim bahan, masukan, dan jawaban pada waktu yang disepakati. Keterlambatan bahan dari Klien dapat menggeser jadwal, tanpa membuat ANARA wanprestasi.
(2) Klien menjamin bahwa nama, teks, data, foto, logo, musik, dan bahan lain yang diserahkan kepada ANARA berhak dipakainya untuk pekerjaan ini. Jika timbul tuntutan dari pihak lain karena bahan itu, Klien bertanggung jawab menyelesaikannya.
(3) Klien memberi masukan yang jelas dalam lima hari kerja setelah draf dikirim, kecuali disepakati jangka waktu lain. Jika tidak ada kabar dalam jangka itu, draf dianggap diterima dan ANARA boleh menagih pelunasan sesuai tahap yang berjalan.
Pasal 4 Pengerjaan, revisi, dan serah terima (1) ANARA mengerjakan pekerjaan dengan saksama sesuai brief dan tata kerja internal, serta menjaga kerahasiaan data Klien.
(2) Dua putaran revisi termasuk dalam harga, atau jumlah lain yang tertulis pada tabel, selama permintaan itu tidak mengubah konsep atau menambah pokok pekerjaan. Permintaan di luar itu dihitung sebagai perubahan lingkup.
(3) Hasil akhir diserahkan dalam format yang disepakati, setelah pelunasan. ANARA tidak wajib menyerahkan file mentah, akun, atau bahan kerja lain, kecuali hal itu ditulis dalam perjanjian atau lampiran.
(4) ANARA menyimpan salinan file kerja selama tiga bulan setelah serah terima. Setelah itu, ANARA tidak wajib menyimpan atau menyediakan ulang file tersebut.
Pasal 5 Hak cipta, pemakaian, dan portofolio (1) Setelah pelunasan, Klien berhak memakai hasil pekerjaan sesuai tujuan order yang disepakati.
(2) ANARA tetap berhak atas templat, sistem, kode dasar, cara kerja, dan bahan merek yang sudah dimiliki sebelum order ini, atau yang dikembangkan sebagai alat kerja umum ANARA.
(3) ANARA boleh menampilkan hasil pekerjaan sebagai portofolio, termasuk di media sosial dan situs, kecuali Klien meminta secara tertulis agar hasil itu tidak dipamerkan. Permintaan ini sebaiknya disampaikan sebelum serah terima.
Pasal 6 Kerahasiaan (1) ANARA dan Klien menjaga data pribadi, bahan, dan informasi yang tidak dimaksudkan untuk umum. ANARA tidak membagikan naskah, data, atau file Klien kepada pihak lain, kecuali dengan izin Klien atau karena kewajiban hukum.
(2) Kewajiban ini tetap berlaku selama dua tahun setelah pekerjaan selesai.
Pasal 7 Pembatalan, keterlambatan, dan keadaan kahar (1) Jika Klien membatalkan pekerjaan sebelum ANARA mulai mengerjakan, uang muka dikembalikan setelah dipotong biaya administrasi 10 persen. Jika pekerjaan sudah dimulai, uang muka tidak dikembalikan, dan ANARA boleh menagih pekerjaan yang sudah dikerjakan di luar uang muka, bila jumlahnya lebih besar.
(2) Jika ANARA membatalkan pekerjaan bukan karena kesalahan Klien, seluruh pembayaran yang sudah diterima untuk pekerjaan itu dikembalikan, dan perjanjian berakhir.
(3) Keterlambatan karena Klien belum mengirim bahan, belum memberi masukan, atau belum membayar, tidak menjadi alasan menuntut denda kepada ANARA. Jika ANARA terlambat dari jadwal yang sudah berjalan tanpa alasan yang patut, Klien berhak meminta penjelasan dan jadwal baru secara tertulis.
(4) Keadaan kahar, seperti bencana, gangguan keras yang tidak dapat dihindari, atau kebijakan pemerintah yang menghalangi kerja, membebaskan kedua belah pihak dari keterlambatan selama keadaan itu berlangsung. Pihak yang terdampak memberi tahu pihak yang lain secepatnya.
Pasal 8 Garansi (1) ANARA memperbaiki kesalahan teknis pada hasil yang diserahkan, jika dilaporkan dalam tujuh hari kerja setelah serah terima, sepanjang kesalahan itu ada pada pekerjaan ANARA dan masih dalam lingkup kesepakatan.
(2) Ketentuan garansi tambahan untuk layanan tertentu, jika ada, ditulis pada pasal ketentuan khusus atau pada lampiran.
Pasal 9 Ketentuan khusus sesuai unit (1) Jika layanan berada pada ANARA Studio, berlaku juga ketentuan pada Kontrak Klien Studio, termasuk soal file, undangan digital, dan bahan visual atau audio.
(2) Jika layanan berada pada ANARA Tech, berlaku juga ketentuan pada Kontrak Klien Tech, termasuk tahapan kerja, serah terima akun atau kode, domain dan hosting, garansi perbaikan kesalahan, serta pemeliharaan.
(3) Jika layanan berada pada ANARA Edukasi, berlaku juga ketentuan pada Kontrak Klien Edukasi. Layanan itu adalah pendampingan, bimbingan, dan penyuntingan. Klien tetap bertanggung jawab atas keaslian dan pemakaian karyanya. ANARA tidak menjamin kelulusan.
(4) Lampiran rincian pekerjaan, jika ada, menjadi bagian perjanjian ini.
Lampiran: rincian pekerjaan (isi sesuai kebutuhan)
Tahap atau item Keterangan Keterangan tambahan
................................ | ................................ | ................................
................................ | ................................ | ................................
................................ | ................................ | ................................
................................ | ................................ | ................................ Pasal 10 Penyelesaian masalah dan penutup (1) Jika timbul masalah, Klien dan ANARA menyelesaikannya terlebih dahulu melalui musyawarah, lewat WhatsApp resmi atau pertemuan, paling lama 30 hari.
(2) Jika musyawarah tidak merampungkan masalah, penyelesaian diserahkan kepada Pengadilan Negeri Sintang.
(3) Perjanjian ini mengikat sejak ditandatangani, termasuk jika ditandatangani di lembar yang berbeda atau dikirim ulang secara elektronik dengan tanda yang dapat dikenali sebagai persetujuan Klien dan ANARA.
Demikian perjanjian ini dibuat dan ditandatangani di Sintang, pada tanggal {{tanggal}} , dalam dua rangkap yang sama bunyinya. Masing-masing rangkap mempunyai kekuatan yang sama setelah ditandatangani dan dibubuhi materai cukup.
ANARA
Pemilik
tempat materai
M. Wilda Alfiansyah, A.Md.Kes.
KLIEN
Nama terang
tempat materai
{{nama_klien}}
Alamat usaha: Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat. WhatsApp 0858-1169-9699 (wa.me/6285811699699).$body_umum$),
('studio','04 Kontrak Klien Studio','ANR/STD',$body_studio$04 Kontrak Klien Studio
Nomor: {{nomor}}
Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat · WhatsApp 0858-1169-9699
PERJANJIAN LAYANAN
ANARA Studio · Video, audio, video AI, dan undangan digital
Bagian yang diarsir kuning dan titik-titik adalah isian. Ganti dengan data yang benar sebelum dicetak dan ditandatangani.
Perjanjian ini adalah kesepakatan kerja antara ANARA dan Klien. Bahasanya disusun agar mudah dipahami, tetap jelas hak dan kewajibannya, dan dapat diisi lalu ditandatangani sebelum pekerjaan dimulai.
Data perjanjian dan rincian pekerjaan
Uraian Isian
Tanggal perjanjian | {{tanggal}}
Nama klien | {{nama_klien}}
Alamat klien | {{alamat_klien}}
WhatsApp klien | {{wa_klien}}
Nama instansi atau kampus | {{instansi}}
Unit layanan | {{unit}}
Nama layanan atau paket | {{paket}}
Uraian pekerjaan secara singkat | {{brief}}
Harga total | {{harga}}
Uang muka (DP) | {{dp}}
Pelunasan | {{sisa}}
Tanggal mulai | {{mulai}}
Tanggal selesai (target) | {{selesai}}
Jumlah putaran revisi yang termasuk | {{revisi}}
Rekening pembayaran | {{rekening}} ANARA dalam perjanjian ini diwakili oleh M. Wilda Alfiansyah, A.Md.Kes., Pemilik, berkedudukan di Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat, WhatsApp 0858-1169-9699. Pihak yang datanya tertulis pada tabel di atas selanjutnya disebut Klien.
Pasal 1 Dasar kesepakatan (1) ANARA menyediakan layanan sesuai unit, paket, dan uraian yang tertulis pada tabel di atas, serta lampiran jika ada. Jika ada perbedaan antara pembicaraan lisan dan tulisan, yang berlaku adalah yang tertulis dalam perjanjian ini dan lampirannya.
(2) Pekerjaan dimulai setelah uang muka diterima dan brief atau bahan awal yang diminta ANARA sudah lengkap. File atau hasil akhir diserahkan setelah pelunasan.
Pasal 2 Biaya dan pembayaran (1) Harga total adalah jumlah yang tertulis pada tabel. Harga itu sudah mencakup putaran revisi yang disebutkan, sepanjang masih dalam lingkup pekerjaan.
(2) Uang muka standar adalah 50 persen dari harga total, kecuali diisi lain pada tabel, misalnya 30 persen untuk order kecil dari klien lama yang tertib, atau 70 persen untuk order baru bernilai tinggi atau klien baru dari instansi.
(3) Klien membayar ke rekening yang tertulis pada tabel atau pada tagihan resmi ANARA. Kerja dihentikan sementara jika pelunasan belum diterima setelah tujuh hari dari pemberitahuan tagihan, sampai pembayaran masuk.
(4) Biaya tambahan di luar lingkup, termasuk revisi kelebihan, perubahan konsep, atau penambahan pokok pekerjaan, hanya dikenakan setelah ANARA memberitahukan jumlahnya dan Klien menyetujuinya.
Pasal 3 Jadwal dan kewajiban Klien (1) Target tanggal selesai berlaku jika Klien mengirim bahan, masukan, dan jawaban pada waktu yang disepakati. Keterlambatan bahan dari Klien dapat menggeser jadwal, tanpa membuat ANARA wanprestasi.
(2) Klien menjamin bahwa nama, teks, data, foto, logo, musik, dan bahan lain yang diserahkan kepada ANARA berhak dipakainya untuk pekerjaan ini. Jika timbul tuntutan dari pihak lain karena bahan itu, Klien bertanggung jawab menyelesaikannya.
(3) Klien memberi masukan yang jelas dalam lima hari kerja setelah draf dikirim, kecuali disepakati jangka waktu lain. Jika tidak ada kabar dalam jangka itu, draf dianggap diterima dan ANARA boleh menagih pelunasan sesuai tahap yang berjalan.
Pasal 4 Pengerjaan, revisi, dan serah terima (1) ANARA mengerjakan pekerjaan dengan saksama sesuai brief dan tata kerja internal, serta menjaga kerahasiaan data Klien.
(2) Dua putaran revisi termasuk dalam harga, atau jumlah lain yang tertulis pada tabel, selama permintaan itu tidak mengubah konsep atau menambah pokok pekerjaan. Permintaan di luar itu dihitung sebagai perubahan lingkup.
(3) Hasil akhir diserahkan dalam format yang disepakati, setelah pelunasan. ANARA tidak wajib menyerahkan file mentah, akun, atau bahan kerja lain, kecuali hal itu ditulis dalam perjanjian atau lampiran.
(4) ANARA menyimpan salinan file kerja selama tiga bulan setelah serah terima. Setelah itu, ANARA tidak wajib menyimpan atau menyediakan ulang file tersebut.
Pasal 5 Hak cipta, pemakaian, dan portofolio (1) Setelah pelunasan, Klien berhak memakai hasil pekerjaan sesuai tujuan order yang disepakati.
(2) ANARA tetap berhak atas templat, sistem, kode dasar, cara kerja, dan bahan merek yang sudah dimiliki sebelum order ini, atau yang dikembangkan sebagai alat kerja umum ANARA.
(3) ANARA boleh menampilkan hasil pekerjaan sebagai portofolio, termasuk di media sosial dan situs, kecuali Klien meminta secara tertulis agar hasil itu tidak dipamerkan. Permintaan ini sebaiknya disampaikan sebelum serah terima.
Pasal 6 Kerahasiaan (1) ANARA dan Klien menjaga data pribadi, bahan, dan informasi yang tidak dimaksudkan untuk umum. ANARA tidak membagikan naskah, data, atau file Klien kepada pihak lain, kecuali dengan izin Klien atau karena kewajiban hukum.
(2) Kewajiban ini tetap berlaku selama dua tahun setelah pekerjaan selesai.
Pasal 7 Pembatalan, keterlambatan, dan keadaan kahar (1) Jika Klien membatalkan pekerjaan sebelum ANARA mulai mengerjakan, uang muka dikembalikan setelah dipotong biaya administrasi 10 persen. Jika pekerjaan sudah dimulai, uang muka tidak dikembalikan, dan ANARA boleh menagih pekerjaan yang sudah dikerjakan di luar uang muka, bila jumlahnya lebih besar.
(2) Jika ANARA membatalkan pekerjaan bukan karena kesalahan Klien, seluruh pembayaran yang sudah diterima untuk pekerjaan itu dikembalikan, dan perjanjian berakhir.
(3) Keterlambatan karena Klien belum mengirim bahan, belum memberi masukan, atau belum membayar, tidak menjadi alasan menuntut denda kepada ANARA. Jika ANARA terlambat dari jadwal yang sudah berjalan tanpa alasan yang patut, Klien berhak meminta penjelasan dan jadwal baru secara tertulis.
(4) Keadaan kahar, seperti bencana, gangguan keras yang tidak dapat dihindari, atau kebijakan pemerintah yang menghalangi kerja, membebaskan kedua belah pihak dari keterlambatan selama keadaan itu berlangsung. Pihak yang terdampak memberi tahu pihak yang lain secepatnya.
Pasal 8 Garansi (1) ANARA memperbaiki kesalahan teknis pada file yang diserahkan, misalnya file rusak atau tidak sesuai format yang disepakati, jika dilaporkan dalam tujuh hari kerja setelah serah terima.
(2) Perubahan isi, konsep, atau bahan baru setelah serah terima bukan garansi, melainkan pekerjaan tambahan.
Pasal 9 Ketentuan khusus ANARA Studio (1) Lingkup pekerjaan mengikuti paket dan uraian pada tabel, misalnya video pendek, dokumentasi, video profil, video AI, audio, atau undangan pernikahan digital. Yang tidak tertulis, termasuk jumlah hari syuting tambahan, pengisi suara tambahan, lisensi musik berbayar, atau halaman undangan di luar paket, bukan bagian harga awal.
(2) Klien mengirim data lengkap yang diperlukan, seperti nama, tanggal, foto, logo, naskah, dan referensi, sesuai waktu yang disepakati. Untuk undangan digital, perubahan data penting setelah draf disetujui dapat dihitung sebagai revisi atau pekerjaan tambahan.
(3) File yang masih berwatermark atau belum final tidak untuk disebarluaskan sebagai hasil jadi. File tanpa watermark atau tautan final diserahkan setelah pelunasan.
(4) File mentah, hasil rekaman utuh, atau proyek suntingan hanya diserahkan jika hal itu ditulis dalam tabel atau lampiran. Jika tidak ditulis, yang diserahkan adalah hasil jadi sesuai format yang disepakati.
(5) Jika pekerjaan memakai musik, font, atau bahan berlisensi, Klien dan ANARA menuliskan siapa yang menyediakan dan menanggung lisensinya. Jika tidak ditulis, Klien menyediakan bahan yang haknya sudah jelas, atau menyetujui pemakaian bahan yang secara sah boleh dipakai ANARA.
(6) ANARA tidak bertanggung jawab atas pemakaian hasil di luar tujuan order, atau atas perubahan yang dilakukan pihak lain setelah serah terima.
Lampiran: rincian pekerjaan Studio
Item Keterangan Jumlah / durasi
................................ | ................................ | ................................
................................ | ................................ | ................................
................................ | ................................ | ................................
................................ | ................................ | ................................ Pasal 10 Penyelesaian masalah dan penutup (1) Jika timbul masalah, Klien dan ANARA menyelesaikannya terlebih dahulu melalui musyawarah, lewat WhatsApp resmi atau pertemuan, paling lama 30 hari.
(2) Jika musyawarah tidak merampungkan masalah, penyelesaian diserahkan kepada Pengadilan Negeri Sintang.
(3) Perjanjian ini mengikat sejak ditandatangani, termasuk jika ditandatangani di lembar yang berbeda atau dikirim ulang secara elektronik dengan tanda yang dapat dikenali sebagai persetujuan Klien dan ANARA.
Demikian perjanjian ini dibuat dan ditandatangani di Sintang, pada tanggal {{tanggal}} , dalam dua rangkap yang sama bunyinya. Masing-masing rangkap mempunyai kekuatan yang sama setelah ditandatangani dan dibubuhi materai cukup.
ANARA
Pemilik
tempat materai
M. Wilda Alfiansyah, A.Md.Kes.
KLIEN
Nama terang
tempat materai
{{nama_klien}}
Alamat usaha: Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat. WhatsApp 0858-1169-9699 (wa.me/6285811699699).$body_studio$),
('tech','05 Kontrak Klien Tech','ANR/TCH',$body_tech$05 Kontrak Klien Tech
Nomor: {{nomor}}
Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat · WhatsApp 0858-1169-9699
PERJANJIAN LAYANAN
ANARA Tech · Situs, aplikasi, dan flipbook
Bagian yang diarsir kuning dan titik-titik adalah isian. Ganti dengan data yang benar sebelum dicetak dan ditandatangani.
Perjanjian ini adalah kesepakatan kerja antara ANARA dan Klien. Bahasanya disusun agar mudah dipahami, tetap jelas hak dan kewajibannya, dan dapat diisi lalu ditandatangani sebelum pekerjaan dimulai.
Data perjanjian dan rincian pekerjaan
Uraian Isian
Tanggal perjanjian | {{tanggal}}
Nama klien | {{nama_klien}}
Alamat klien | {{alamat_klien}}
WhatsApp klien | {{wa_klien}}
Nama instansi atau kampus | {{instansi}}
Unit layanan | {{unit}}
Nama layanan atau paket | {{paket}}
Uraian pekerjaan secara singkat | {{brief}}
Harga total | {{harga}}
Uang muka (DP) | {{dp}}
Pelunasan | {{sisa}}
Tanggal mulai | {{mulai}}
Tanggal selesai (target) | {{selesai}}
Jumlah putaran revisi yang termasuk | {{revisi}}
Rekening pembayaran | {{rekening}} ANARA dalam perjanjian ini diwakili oleh M. Wilda Alfiansyah, A.Md.Kes., Pemilik, berkedudukan di Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat, WhatsApp 0858-1169-9699. Pihak yang datanya tertulis pada tabel di atas selanjutnya disebut Klien.
Pasal 1 Dasar kesepakatan (1) ANARA menyediakan layanan sesuai unit, paket, dan uraian yang tertulis pada tabel di atas, serta lampiran jika ada. Jika ada perbedaan antara pembicaraan lisan dan tulisan, yang berlaku adalah yang tertulis dalam perjanjian ini dan lampirannya.
(2) Pekerjaan dimulai setelah uang muka diterima dan brief atau bahan awal yang diminta ANARA sudah lengkap. File atau hasil akhir diserahkan setelah pelunasan.
Pasal 2 Biaya dan pembayaran (1) Harga total adalah jumlah yang tertulis pada tabel. Harga itu sudah mencakup putaran revisi yang disebutkan, sepanjang masih dalam lingkup pekerjaan.
(2) Uang muka standar adalah 50 persen dari harga total, kecuali diisi lain pada tabel, misalnya 30 persen untuk order kecil dari klien lama yang tertib, atau 70 persen untuk order baru bernilai tinggi atau klien baru dari instansi.
(3) Klien membayar ke rekening yang tertulis pada tabel atau pada tagihan resmi ANARA. Kerja dihentikan sementara jika pelunasan belum diterima setelah tujuh hari dari pemberitahuan tagihan, sampai pembayaran masuk.
(4) Biaya tambahan di luar lingkup, termasuk revisi kelebihan, perubahan konsep, atau penambahan pokok pekerjaan, hanya dikenakan setelah ANARA memberitahukan jumlahnya dan Klien menyetujuinya.
Pasal 3 Jadwal dan kewajiban Klien (1) Target tanggal selesai berlaku jika Klien mengirim bahan, masukan, dan jawaban pada waktu yang disepakati. Keterlambatan bahan dari Klien dapat menggeser jadwal, tanpa membuat ANARA wanprestasi.
(2) Klien menjamin bahwa nama, teks, data, foto, logo, musik, dan bahan lain yang diserahkan kepada ANARA berhak dipakainya untuk pekerjaan ini. Jika timbul tuntutan dari pihak lain karena bahan itu, Klien bertanggung jawab menyelesaikannya.
(3) Klien memberi masukan yang jelas dalam lima hari kerja setelah draf dikirim, kecuali disepakati jangka waktu lain. Jika tidak ada kabar dalam jangka itu, draf dianggap diterima dan ANARA boleh menagih pelunasan sesuai tahap yang berjalan.
Pasal 4 Pengerjaan, revisi, dan serah terima (1) ANARA mengerjakan pekerjaan dengan saksama sesuai brief dan tata kerja internal, serta menjaga kerahasiaan data Klien.
(2) Dua putaran revisi termasuk dalam harga, atau jumlah lain yang tertulis pada tabel, selama permintaan itu tidak mengubah konsep atau menambah pokok pekerjaan. Permintaan di luar itu dihitung sebagai perubahan lingkup.
(3) Hasil akhir diserahkan dalam format yang disepakati, setelah pelunasan. ANARA tidak wajib menyerahkan file mentah, akun, atau bahan kerja lain, kecuali hal itu ditulis dalam perjanjian atau lampiran.
(4) ANARA menyimpan salinan file kerja selama tiga bulan setelah serah terima. Setelah itu, ANARA tidak wajib menyimpan atau menyediakan ulang file tersebut.
Pasal 5 Hak cipta, pemakaian, dan portofolio (1) Setelah pelunasan, Klien berhak memakai hasil pekerjaan sesuai tujuan order yang disepakati.
(2) ANARA tetap berhak atas templat, sistem, kode dasar, cara kerja, dan bahan merek yang sudah dimiliki sebelum order ini, atau yang dikembangkan sebagai alat kerja umum ANARA.
(3) ANARA boleh menampilkan hasil pekerjaan sebagai portofolio, termasuk di media sosial dan situs, kecuali Klien meminta secara tertulis agar hasil itu tidak dipamerkan. Permintaan ini sebaiknya disampaikan sebelum serah terima.
Pasal 6 Kerahasiaan (1) ANARA dan Klien menjaga data pribadi, bahan, dan informasi yang tidak dimaksudkan untuk umum. ANARA tidak membagikan naskah, data, atau file Klien kepada pihak lain, kecuali dengan izin Klien atau karena kewajiban hukum.
(2) Kewajiban ini tetap berlaku selama dua tahun setelah pekerjaan selesai.
Pasal 7 Pembatalan, keterlambatan, dan keadaan kahar (1) Jika Klien membatalkan pekerjaan sebelum ANARA mulai mengerjakan, uang muka dikembalikan setelah dipotong biaya administrasi 10 persen. Jika pekerjaan sudah dimulai, uang muka tidak dikembalikan, dan ANARA boleh menagih pekerjaan yang sudah dikerjakan di luar uang muka, bila jumlahnya lebih besar.
(2) Jika ANARA membatalkan pekerjaan bukan karena kesalahan Klien, seluruh pembayaran yang sudah diterima untuk pekerjaan itu dikembalikan, dan perjanjian berakhir.
(3) Keterlambatan karena Klien belum mengirim bahan, belum memberi masukan, atau belum membayar, tidak menjadi alasan menuntut denda kepada ANARA. Jika ANARA terlambat dari jadwal yang sudah berjalan tanpa alasan yang patut, Klien berhak meminta penjelasan dan jadwal baru secara tertulis.
(4) Keadaan kahar, seperti bencana, gangguan keras yang tidak dapat dihindari, atau kebijakan pemerintah yang menghalangi kerja, membebaskan kedua belah pihak dari keterlambatan selama keadaan itu berlangsung. Pihak yang terdampak memberi tahu pihak yang lain secepatnya.
Pasal 8 Garansi (1) Untuk layanan ANARA Tech, ANARA memperbaiki kesalahan (bug) yang muncul pada lingkup yang sudah disepakati, selama 30 hari setelah serah terima, tanpa biaya tambahan. Perbaikan itu tidak mencakup permintaan fitur baru, perubahan desain, isi yang diubah Klien sendiri, gangguan pada pihak ketiga, atau masa berlaku domain dan hosting.
(2) Pemeliharaan rutin, perpanjangan domain, hosting, dan pengembangan lanjutan bukan bagian dari harga awal, kecuali dibeli sebagai paket terpisah yang ditulis dalam lampiran.
Pasal 9 Ketentuan khusus ANARA Tech (1) Pekerjaan ANARA Tech pada umumnya berjalan dalam tahapan berikut, kecuali ditulis lain pada lampiran: (a) brief dan kesepakatan lingkup; (b) rancangan atau tampilan; (c) pengerjaan; (d) uji bersama Klien; (e) serah terima setelah pelunasan.
(2) Lingkup ditulis sejelas mungkin, termasuk jumlah halaman atau fitur, isi yang disiapkan Klien, dan hal yang tidak termasuk. Permintaan di luar lingkup dihitung tambahan dan baru dikerjakan setelah harganya disetujui.
(3) Setelah pelunasan, ANARA menyerahkan hasil sesuai kesepakatan, yang dapat berupa situs yang sudah tayang, berkas flipbook, tautan, akun, atau kode sumber, sesuai yang tertulis pada lampiran. Jika lampiran tidak menyebut penyerahan kode sumber, yang diserahkan adalah hasil yang dapat dipakai Klien sesuai tujuan order, bukan seluruh kode dasar milik ANARA.
(4) Jika ANARA membelikan domain, hosting, atau layanan pihak ketiga atas nama atau untuk Klien, biaya berlangganan dan perpanjangannya menjadi tanggung jawab Klien, kecuali ditulis lain. Akses akun diserahkan pada saat serah terima, setelah pelunasan. Klien sendiri yang kemudian menjaga perpanjangan, kecuali membeli paket pemeliharaan.
(5) ANARA memperbaiki kesalahan (bug) pada lingkup yang disepakati selama 30 hari setelah serah terima, tanpa biaya tambahan. Garansi ini tidak berlaku untuk fitur baru, perubahan isi atau desain, kerusakan karena diubah pihak lain, gangguan internet, atau layanan pihak ketiga.
(6) Paket pemeliharaan, jika diinginkan, disepakati terpisah, termasuk jangka waktu, lingkup, dan biayanya.
Lampiran: lingkup dan tahapan ANARA Tech
Uraian Isian
Jenis pekerjaan (situs profil / aplikasi kerja / Android / flipbook) | ................................
Lingkup ringkas (halaman, fitur, isi) | ................................
Yang tidak termasuk | ................................
Domain dan hosting disediakan oleh | Klien / ANARA, keterangan: ..........
Kode sumber diserahkan | Ya / Tidak, keterangan: ..........
Akun yang diserahkan | ................................
Paket pemeliharaan | Tidak ada / Ada, keterangan: .......... Pasal 10 Penyelesaian masalah dan penutup (1) Jika timbul masalah, Klien dan ANARA menyelesaikannya terlebih dahulu melalui musyawarah, lewat WhatsApp resmi atau pertemuan, paling lama 30 hari.
(2) Jika musyawarah tidak merampungkan masalah, penyelesaian diserahkan kepada Pengadilan Negeri Sintang.
(3) Perjanjian ini mengikat sejak ditandatangani, termasuk jika ditandatangani di lembar yang berbeda atau dikirim ulang secara elektronik dengan tanda yang dapat dikenali sebagai persetujuan Klien dan ANARA.
Demikian perjanjian ini dibuat dan ditandatangani di Sintang, pada tanggal {{tanggal}} , dalam dua rangkap yang sama bunyinya. Masing-masing rangkap mempunyai kekuatan yang sama setelah ditandatangani dan dibubuhi materai cukup.
ANARA
Pemilik
tempat materai
M. Wilda Alfiansyah, A.Md.Kes.
KLIEN
Nama terang
tempat materai
{{nama_klien}}
Alamat usaha: Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat. WhatsApp 0858-1169-9699 (wa.me/6285811699699).$body_tech$),
('edukasi','06 Kontrak Klien Edukasi','ANR/EDU',$body_edukasi$06 Kontrak Klien Edukasi
Nomor: {{nomor}}
Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat · WhatsApp 0858-1169-9699
PERJANJIAN LAYANAN
ANARA Edukasi · Pendampingan mahasiswa reguler dan mahasiswa RPL
Bagian yang diarsir kuning dan titik-titik adalah isian. Ganti dengan data yang benar sebelum dicetak dan ditandatangani.
Perjanjian ini adalah kesepakatan kerja antara ANARA dan Klien. Bahasanya disusun agar mudah dipahami, tetap jelas hak dan kewajibannya, dan dapat diisi lalu ditandatangani sebelum pekerjaan dimulai.
Data perjanjian dan rincian pekerjaan
Uraian Isian
Tanggal perjanjian | {{tanggal}}
Nama klien | {{nama_klien}}
Alamat klien | {{alamat_klien}}
WhatsApp klien | {{wa_klien}}
Nama instansi atau kampus | {{instansi}}
Unit layanan | {{unit}}
Nama layanan atau paket | {{paket}}
Uraian pekerjaan secara singkat | {{brief}}
Harga total | {{harga}}
Uang muka (DP) | {{dp}}
Pelunasan | {{sisa}}
Tanggal mulai | {{mulai}}
Tanggal selesai (target) | {{selesai}}
Jumlah putaran revisi yang termasuk | {{revisi}}
Rekening pembayaran | {{rekening}} ANARA dalam perjanjian ini diwakili oleh M. Wilda Alfiansyah, A.Md.Kes., Pemilik, berkedudukan di Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat, WhatsApp 0858-1169-9699. Pihak yang datanya tertulis pada tabel di atas selanjutnya disebut Klien.
Pasal 1 Dasar kesepakatan (1) ANARA menyediakan layanan sesuai unit, paket, dan uraian yang tertulis pada tabel di atas, serta lampiran jika ada. Jika ada perbedaan antara pembicaraan lisan dan tulisan, yang berlaku adalah yang tertulis dalam perjanjian ini dan lampirannya.
(2) Pekerjaan dimulai setelah uang muka diterima dan brief atau bahan awal yang diminta ANARA sudah lengkap. File atau hasil akhir diserahkan setelah pelunasan.
Pasal 2 Biaya dan pembayaran (1) Harga total adalah jumlah yang tertulis pada tabel. Harga itu sudah mencakup putaran revisi yang disebutkan, sepanjang masih dalam lingkup pekerjaan.
(2) Uang muka standar adalah 50 persen dari harga total, kecuali diisi lain pada tabel, misalnya 30 persen untuk order kecil dari klien lama yang tertib, atau 70 persen untuk order baru bernilai tinggi atau klien baru dari instansi.
(3) Klien membayar ke rekening yang tertulis pada tabel atau pada tagihan resmi ANARA. Kerja dihentikan sementara jika pelunasan belum diterima setelah tujuh hari dari pemberitahuan tagihan, sampai pembayaran masuk.
(4) Biaya tambahan di luar lingkup, termasuk revisi kelebihan, perubahan konsep, atau penambahan pokok pekerjaan, hanya dikenakan setelah ANARA memberitahukan jumlahnya dan Klien menyetujuinya.
Pasal 3 Jadwal dan kewajiban Klien (1) Target tanggal selesai berlaku jika Klien mengirim bahan, masukan, dan jawaban pada waktu yang disepakati. Keterlambatan bahan dari Klien dapat menggeser jadwal, tanpa membuat ANARA wanprestasi.
(2) Klien menjamin bahwa nama, teks, data, foto, logo, musik, dan bahan lain yang diserahkan kepada ANARA berhak dipakainya untuk pekerjaan ini. Jika timbul tuntutan dari pihak lain karena bahan itu, Klien bertanggung jawab menyelesaikannya.
(3) Klien memberi masukan yang jelas dalam lima hari kerja setelah draf dikirim, kecuali disepakati jangka waktu lain. Jika tidak ada kabar dalam jangka itu, draf dianggap diterima dan ANARA boleh menagih pelunasan sesuai tahap yang berjalan.
Pasal 4 Pengerjaan, revisi, dan serah terima (1) ANARA mengerjakan pekerjaan dengan saksama sesuai brief dan tata kerja internal, serta menjaga kerahasiaan data Klien.
(2) Dua putaran revisi termasuk dalam harga, atau jumlah lain yang tertulis pada tabel, selama permintaan itu tidak mengubah konsep atau menambah pokok pekerjaan. Permintaan di luar itu dihitung sebagai perubahan lingkup.
(3) Hasil akhir diserahkan dalam format yang disepakati, setelah pelunasan. ANARA tidak wajib menyerahkan file mentah, akun, atau bahan kerja lain, kecuali hal itu ditulis dalam perjanjian atau lampiran.
(4) ANARA menyimpan salinan file kerja selama tiga bulan setelah serah terima. Setelah itu, ANARA tidak wajib menyimpan atau menyediakan ulang file tersebut.
Pasal 5 Hak cipta, pemakaian, dan portofolio (1) Setelah pelunasan, Klien berhak memakai hasil pekerjaan sesuai tujuan order yang disepakati.
(2) ANARA tetap berhak atas templat, sistem, kode dasar, cara kerja, dan bahan merek yang sudah dimiliki sebelum order ini, atau yang dikembangkan sebagai alat kerja umum ANARA.
(3) ANARA boleh menampilkan hasil pekerjaan sebagai portofolio, termasuk di media sosial dan situs, kecuali Klien meminta secara tertulis agar hasil itu tidak dipamerkan. Permintaan ini sebaiknya disampaikan sebelum serah terima.
Pasal 6 Kerahasiaan (1) ANARA dan Klien menjaga data pribadi, bahan, dan informasi yang tidak dimaksudkan untuk umum. ANARA tidak membagikan naskah, data, atau file Klien kepada pihak lain, kecuali dengan izin Klien atau karena kewajiban hukum.
(2) Kewajiban ini tetap berlaku selama dua tahun setelah pekerjaan selesai.
Pasal 7 Pembatalan, keterlambatan, dan keadaan kahar (1) Jika Klien membatalkan pekerjaan sebelum ANARA mulai mengerjakan, uang muka dikembalikan setelah dipotong biaya administrasi 10 persen. Jika pekerjaan sudah dimulai, uang muka tidak dikembalikan, dan ANARA boleh menagih pekerjaan yang sudah dikerjakan di luar uang muka, bila jumlahnya lebih besar.
(2) Jika ANARA membatalkan pekerjaan bukan karena kesalahan Klien, seluruh pembayaran yang sudah diterima untuk pekerjaan itu dikembalikan, dan perjanjian berakhir.
(3) Keterlambatan karena Klien belum mengirim bahan, belum memberi masukan, atau belum membayar, tidak menjadi alasan menuntut denda kepada ANARA. Jika ANARA terlambat dari jadwal yang sudah berjalan tanpa alasan yang patut, Klien berhak meminta penjelasan dan jadwal baru secara tertulis.
(4) Keadaan kahar, seperti bencana, gangguan keras yang tidak dapat dihindari, atau kebijakan pemerintah yang menghalangi kerja, membebaskan kedua belah pihak dari keterlambatan selama keadaan itu berlangsung. Pihak yang terdampak memberi tahu pihak yang lain secepatnya.
Pasal 8 Garansi (1) ANARA menindaklanjuti masukan yang masih berada dalam lingkup pendampingan, sesuai putaran revisi yang berlaku. ANARA tidak menjamin hasil penilaian, kelulusan, atau keputusan kampus.
(2) Jika file yang diserahkan rusak atau tidak lengkap karena kesalahan ANARA, ANARA mengirim ulang file yang sama tanpa biaya.
Pasal 9 Ketentuan khusus ANARA Edukasi (1) Layanan ANARA Edukasi adalah pendampingan, bimbingan, dan penyuntingan naskah akademik. ANARA membantu Klien merapikan, menata, dan memperbaiki naskah, serta memberi masukan. ANARA bukan penulis pengganti, bukan pembimbing resmi kampus, dan tidak menjanjikan kelulusan, nilai tertentu, atau diterimanya naskah oleh kampus.
(2) Klien adalah mahasiswa reguler atau mahasiswa Rekognisi Pembelajaran Lampau (RPL), termasuk pegawai puskesmas, rumah sakit, dinas, atau instansi lain yang kuliah sambil bekerja, sesuai data pada tabel atau lampiran.
(3) Klien tetap menjadi pihak yang bertanggung jawab atas keaslian karyanya, sitasi, data, dan kepatuhan pada aturan kampus. Klien wajib memeriksa kembali naskah sebelum dikumpulkan.
(4) ANARA berhak menolak permintaan yang melewati batas ini, termasuk permintaan agar ANARA menulis utuh naskah sebagai pengganti Klien, menjamin kelulusan, atau menyalin karya orang lain.
(5) Naskah, data, dan identitas Klien dijaga rahasia. ANARA tidak memublikasikan naskah Klien, dan tidak menampilkannya sebagai portofolio, kecuali Klien memberi izin tertulis. Pasal portofolio pada perjanjian ini tidak berlaku untuk naskah akademik, kecuali ada izin itu.
(6) Untuk mahasiswa RPL, jadwal komunikasi diutamakan di luar jam kerja Klien, sesuai hari dan jam yang disepakati pada lampiran. Klien menyampaikan aturan kampus, panduan penulisan, dan bahan yang sudah dimiliki sejak awal pendampingan.
(7) Masukan dari dosen pembimbing resmi atau dari kampus yang masih berada dalam lingkup dan putaran revisi akan ditindaklanjuti. Perubahan besar di luar lingkup, atau naskah baru yang berbeda pokoknya, dihitung sebagai pekerjaan tambahan.
Lampiran: data pendampingan
Uraian Isian
Status klien | {{status_mahasiswa}}
Kampus dan program studi | {{kampus}}
Jenis naskah | {{jenis_naskah}}
Judul atau topik (jika sudah ada) | ................................
Tenggat kampus | {{selesai}}
Jam yang mudah dihubungi | {{jadwal}}
Bahan yang diserahkan Klien pada awal kerja | ................................ Pasal 10 Penyelesaian masalah dan penutup (1) Jika timbul masalah, Klien dan ANARA menyelesaikannya terlebih dahulu melalui musyawarah, lewat WhatsApp resmi atau pertemuan, paling lama 30 hari.
(2) Jika musyawarah tidak merampungkan masalah, penyelesaian diserahkan kepada Pengadilan Negeri Sintang.
(3) Perjanjian ini mengikat sejak ditandatangani, termasuk jika ditandatangani di lembar yang berbeda atau dikirim ulang secara elektronik dengan tanda yang dapat dikenali sebagai persetujuan Klien dan ANARA.
Demikian perjanjian ini dibuat dan ditandatangani di Sintang, pada tanggal {{tanggal}} , dalam dua rangkap yang sama bunyinya. Masing-masing rangkap mempunyai kekuatan yang sama setelah ditandatangani dan dibubuhi materai cukup.
ANARA
Pemilik
tempat materai
M. Wilda Alfiansyah, A.Md.Kes.
KLIEN
Nama terang
tempat materai
{{nama_klien}}
Alamat usaha: Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat. WhatsApp 0858-1169-9699 (wa.me/6285811699699).$body_edukasi$),
('snk','07 Syarat dan Ketentuan Layanan','',$body_snk$07 Syarat dan Ketentuan Layanan
Berlaku untuk setiap order
Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat · WhatsApp 0858-1169-9699
SYARAT DAN KETENTUAN LAYANAN ANARA
Ringkasan untuk percakapan WhatsApp dan halaman web
Ringkasan ini berlaku untuk setiap order ANARA. Jika Klien dan ANARA menandatangani perjanjian tertulis, bunyi perjanjian itu yang diutamakan apabila ada perbedaan.
1. Layanan. ANARA menyediakan jasa ANARA Studio (video, audio, video AI, undangan digital), ANARA Edukasi (pendampingan naskah mahasiswa reguler dan mahasiswa RPL), dan ANARA Tech (situs profil, aplikasi kerja, aplikasi Android, flipbook). Rincian mengikuti penawaran atau perjanjian yang disepakati. 2. Harga dan pembayaran. Harga mengikuti penawaran tertulis. Uang muka standar 50 persen, kecuali disepakati lain. Pekerjaan dimulai setelah uang muka masuk. Hasil akhir diserahkan setelah pelunasan ke rekening yang tercantum pada tagihan. 3. Jadwal. Jadwal berjalan jika bahan dan masukan Klien lengkap. Keterlambatan bahan dapat menggeser tenggat. 4. Revisi. Dua putaran revisi termasuk dalam harga, sepanjang masih dalam lingkup. Perubahan konsep, tambahan pokok, atau revisi berlebih dikenai biaya yang diberitahukan lebih dulu. 5. Bahan dari Klien. Klien menjamin berhak memakai semua bahan yang dikirim kepada ANARA, dan bertanggung jawab jika bahan itu menimbulkan tuntutan pihak lain. 6. Hak cipta dan portofolio. Setelah lunas, Klien berhak memakai hasil sesuai tujuan order. ANARA boleh menampilkan karya sebagai portofolio, kecuali Klien meminta secara tertulis agar tidak dipamerkan. Untuk naskah akademik, ANARA tidak menampilkannya tanpa izin tertulis Klien.
7. Kerahasiaan. ANARA menjaga data dan bahan Klien, dan tidak membagikannya kepada pihak lain tanpa izin, kecuali diwajibkan hukum. 8. Pendampingan edukasi. Layanan Edukasi adalah pendampingan, bimbingan, dan penyuntingan. Klien bertanggung jawab atas keaslian, sitasi, dan pemakaian naskahnya. ANARA tidak menjamin kelulusan dan berhak menolak permintaan yang melewati batas itu. 9. Pembatalan. Jika Klien membatalkan sebelum pekerjaan dimulai, uang muka dikembalikan setelah dipotong biaya administrasi 10 persen. Jika pekerjaan sudah dimulai, uang muka tidak dikembalikan. Jika ANARA membatalkan bukan karena kesalahan Klien, pembayaran yang sudah diterima untuk pekerjaan itu dikembalikan. 10. Keterlambatan dan keadaan kahar. Keterlambatan karena bahan atau pembayaran Klien tidak menjadi kesalahan ANARA. Keadaan kahar yang menghalangi kerja diberitahukan secepatnya dan menunda kewajiban selama keadaan itu berlangsung. 11. Garansi. Kesalahan teknis pada hasil yang diserahkan dapat dilaporkan dalam tujuh hari kerja. Untuk layanan Tech, perbaikan bug pada lingkup yang disepakati berlaku 30 hari setelah serah terima. Fitur baru, pemeliharaan, domain, dan hosting bukan bagian garansi, kecuali dibeli terpisah. 12. Penyelesaian masalah. Masalah diselesaikan melalui musyawarah. Jika tidak selesai, tempuh Pengadilan Negeri Sintang. Kontak resmi ANARA: Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat, WhatsApp 0858-1169-9699 (wa.me/6285811699699).
ANARA, Beyond Value. Sintang, Kalimantan Barat. Dokumen ini dapat dikirim apa adanya lewat WhatsApp atau dipasang di situs. Untuk order yang lebih besar, gunakan perjanjian layanan yang ditandatangani.$body_snk$)
on conflict (key) do nothing;

insert into public.automation_rules (key, title, detail, message, enabled, group_name) values
('wa-status','WhatsApp saat status berubah','Templat ke nomor klien dan salinan ke Admin WA.','Halo {{nama}}, pesanan {{kode}} berstatus {{status}}.',true,'pemberitahuan'),
('ingat-dp','Pengingat DP belum masuk','Hari ke-2 dan ke-5 setelah tagihan.','Pengingat uang muka {{kode}}.',true,'pemberitahuan'),
('ingat-lunas','Pengingat pelunasan dan tenggat','H-2 tenggat dan H+3 pelunasan.','Pengingat pelunasan {{kode}}.',true,'pemberitahuan'),
('ingat-revisi','Pengingat masukan revisi','Lima hari kerja tanpa balasan.','Draf {{kode}} menunggu masukan.',true,'pemberitahuan'),
('ingat-garansi','Pengingat garansi Tech','30 hari setelah serah terima.','Garansi {{kode}} sampai {{tanggal}}.',true,'pemberitahuan'),
('invoice','Tagihan dan kuitansi otomatis','DP saat kontrak disetujui, pelunasan saat final.','Tagihan {{kode}}.',true,'keuangan'),
('split','Bagi hasil otomatis saat lunas','Porsi fase, laba 60:40, referral 5 persen.','Bagi hasil {{kode}} tercatat.',true,'keuangan'),
('laporan-5','Laporan setiap tanggal 5','Untuk pemilik dan mitra.','Laporan {{periode}} siap.',true,'laporan'),
('rekrut','Dana darurat dan kunci rekrutmen','20 persen kas sampai 5 juta.','Ambang berubah.',true,'laporan'),
('cadangan','Cadangan mingguan','Ringkasan tiap Senin.','Cadangan siap.',true,'laporan')
on conflict (key) do nothing;

insert into public.app_settings (id, payload) values (1, $set${"phase": 3, "phaseAuto": true, "splits": {"1": [40, 30, 15, 15], "2": [45, 15, 15, 25], "3": [50, 10, 15, 25]}, "bankName": "", "bankNumber": "", "bankHolder": "", "emergencyRate": 0.2, "emergencyCap": 5000000, "toolsThreshold": 2000000, "recruitRevenue": 12000000, "recruitMonths": 3, "recruitCash": 15000000, "ownerShare": 60, "partnerShare": 40, "honor": {"1": 300000, "2": 500000, "3": 750000}, "waDisplay": "0858-1169-9699", "waLink": "https://wa.me/6285811699699", "address": "Jl. AIPDA KS. Tubun (depan Gereja Immanuel), Sintang, Kalimantan Barat", "ownerName": "M. Wilda Alfiansyah, A.Md.Kes.", "partnerName": "M. Fadilah Alkadri"}$set$) on conflict (id) do nothing;

insert into public.workers (id, name, whatsapp, title, brand, active, sample) values
('11111111-1111-4111-8111-111111111111','M. Wilda Alfiansyah, A.Md.Kes.','085811699699','Pemilik · Studio dan Tech','semua',true,false),
('22222222-2222-4222-8222-222222222222','M. Fadilah Alkadri','085811699699','Keuangan · Admin WA · Edukasi','edukasi',true,false)
on conflict (id) do nothing;
