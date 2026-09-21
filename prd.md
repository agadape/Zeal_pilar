# Product Requirements — Tugu Leaders Portal

## Vision

Tugu Leaders Portal memberi leader ZEAL satu tempat untuk mengetahui siapa yang perlu diperhatikan, mencatat aktivitas ministry, mengelola PDG, dan membagikan laporan mingguan tanpa spreadsheet terpisah.

## Users

- Super Admin: menjaga data organisasi, akun, grup, event, dan konfigurasi.
- Group Leader: mengelola anggota serta laporan grup sendiri, mencatat BA, dan membuat pengumuman.
- Member: mengakses informasi internal dan profil sendiri.

## Core journeys

### Weekly reporting

Leader memilih grup yang dipimpinnya, menandai anggota missing beserta alasan, memilih pelaku reachout, mengisi visitor/baptisan, menyimpan laporan, lalu menyalin format WhatsApp. Satu laporan hanya boleh ada per grup/tanggal dan leader tidak boleh memodifikasi grup lain.

### People and Bible Study

Admin mengelola profil. Leader/admin mencatat sesi BA termasuk tanggal, urutan, topik, catatan, dan mentor. Detail profil menampilkan grup aktual dan histori BA.

### PDG management

Admin membuat atau menghapus grup. Leader mengelola anggota dan metadata grup sendiri. Admin melakukan handover tanpa menghapus statistik atau anggota.

### d-Tree pembimbingan

Semua user authenticated dapat melihat pohon pembimbingan. Dua Pemimpin Jemaat yang sejajar menjadi akar global, leader grup menjadi cabang pertama sesuai gender, lalu relasi pembimbing utama membentuk generasi berikutnya. Pembimbing dan anggota harus berada dalam grup serta gender yang sama.

Admin dan semua Group Leader dapat mencari orang, membuka detail tanpa pindah halaman, menempatkan anggota yang belum dibimbing, memindahkan pembimbing dengan konfirmasi, dan menambah pembimbing pendamping. Hanya Admin dapat mengganti pasangan Pemimpin Jemaat. Semua perpindahan mempertahankan histori.

### Events and announcements

Semua user melihat jadwal dan roster; admin mengelola event. Admin dan group leader membuat pengumuman, author mengelola tulisannya sendiri, dan admin dapat mengelola semuanya.

### Account administration

Super Admin menghubungkan record leader ke Supabase Auth dan mereset password. Semua aksi service-role harus divalidasi ulang pada server.

## Non-functional requirements

- Mobile-first dan aman digunakan di Safari iOS.
- Tidak ada silent data loss atau silent LocalStorage fallback di production.
- RLS menjadi enforcement utama untuk semua mutation.
- Service-role key tidak pernah dikirim ke browser.
- Error mutation terlihat oleh pengguna.
- Lint, TypeScript, dan production build harus lulus sebelum deploy.

## Future candidates

- Detektor MIA tiga minggu berturut-turut.
- Prayer request per grup.
- Audit log mutation admin.
- Transaction/RPC untuk replace group members dan weekly-stat detail.
- Automated integration test untuk matrix RLS.
