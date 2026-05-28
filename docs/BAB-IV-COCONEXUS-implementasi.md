# BAB IV IMPLEMENTASI DAN PENGUJIAN

IV.1 Implementasi Sistem

Implementasi sistem merupakan tahap penerapan hasil perancangan ke dalam bentuk aplikasi berbasis web. Sistem COCONEXUS dikembangkan menggunakan arsitektur 3-lapis dengan backend Node.js (Express) dan database MySQL serta frontend berbasis Vue 3. Sistem ini dirancang untuk mendukung repository pembelajaran pemanfaatan limbah kelapa dengan fitur publikasi artikel, manajemen kategori, komentar, unggah media, statistik artikel, dan pengelolaan pengguna.

Sistem memiliki tiga jenis aktor utama: pengguna umum, moderator (content moderator), dan admin. Pengguna umum dapat mengakses fitur publik tanpa harus login, seperti daftar artikel, detail artikel, komentari, dan halaman informasi. Moderator memiliki hak akses untuk membuat, menyunting, dan mempublikasikan artikel dengan workflow (draft → revision → published), mengelola kategori pembelajaran, serta meninjau komentar. Admin memiliki hak akses penuh untuk mengelola data pengguna, kategori, artikel, komentar, dan melihat log audit serta statistik.

Tabel IV.1.1 Tabel implementasi sistem

| No | Komponen | Hasil Implementasi |
|---|---|---|
| 1 | Framework | Backend: Node.js + Express; Frontend: Vue 3 |
| 2 | Basis Data | MySQL dengan ORM Sequelize |
| 3 | Akses Sistem | Akses melalui browser; peran: publik, moderator, admin |
| 4 | Arsitektur | Pola Model-View-Controller (MVC) dan REST API |
| 5 | Hak Akses | Pembatasan fitur berdasarkan role (JWT + middleware) |

IV.2 Implementasi Database

Implementasi database dilakukan menggunakan MySQL. Struktur database dibuat berdasarkan rancangan ERD yang telah disusun pada tahap perancangan. Database menyimpan data pengguna, profil, role, kategori, artikel, detail artikel, media, komentar, views, product cards, dan audit logs. Relasi antar tabel dibangun menggunakan primary key dan foreign key agar data tersimpan dan terhubung secara terstruktur.

Tabel IV.2.1 Tabel implementasi database

| No | Nama Tabel | Fungsi Implementasi |
|---|---|---|
| 1 | roles | Menyimpan data peran atau hak akses pengguna |
| 2 | users | Menyimpan data akun pengguna sistem |
| 3 | user_profiles | Menyimpan profil pengguna (bio, avatar) |
| 4 | category_tags | Menyimpan kategori pembelajaran |
| 5 | articles | Menyimpan data utama artikel |
| 6 | article_details | Menyimpan konten detail artikel (sections, sources) |
| 7 | article_media | Menyimpan media pendukung artikel (gambar, video, dokumen) |
| 8 | comments | Menyimpan komentar bersarang pada artikel |
| 9 | article_views | Menyimpan hitungan views per artikel |
| 10 | product_cards | Menyimpan data product card terkait artikel |
| 11 | audit_logs | Menyimpan riwayat aktivitas pengguna dalam sistem |

IV.3 Implementasi Antarmuka

Implementasi antarmuka dilakukan berdasarkan rancangan tampilan. Antarmuka sistem berbasis web dan disesuaikan dengan hak akses pengguna sehingga pengguna umum, moderator, dan admin memperoleh menu berbeda.

Gambar referensi (ditunjukkan di laporan sebagai bukti implementasi):
- Halaman Login
- Dashboard user
- Form pembuatan artikel
- Form upload media
- Halaman detail artikel dengan komentar
- Dashboard admin (manajemen artikel, user, kategori)

Tabel IV.3.1 Tabel implementasi antarmuka

| No | Halaman | Aktor | Keterangan |
|---|---|---|---|
| 1 | Login | Moderator dan Admin | Digunakan untuk masuk ke dashboard internal sesuai role |
| 2 | Landing Page / Artikel Publik | Pengguna Umum | Menampilkan daftar artikel, kategori, dan pencarian |
| 3 | Form Pembuatan Artikel | Moderator dan Admin | Form untuk membuat artikel, mengatur kategori, upload media |
| 4 | Detail Artikel | Semua pengguna | Menampilkan konten, media, dan komentar bersarang |
| 5 | Dashboard Admin | Admin | Manajemen data user, artikel, kategori, dan audit logs |

IV.4 Implementasi Fitur

Implementasi fitur disesuaikan kebutuhan sistem:

Tabel IV.4.1 Tabel implementasi fitur

| No | Fitur | Hasil Implementasi |
|---|---|---|
| 1 | Manajemen Artikel | Moderator/Admin dapat membuat, edit, dan publish artikel (draft → revision → published) |
| 2 | Manajemen Kategori | Otomatis membuat/memperbarui kategori saat penyimpanan artikel |
| 3 | Media & Upload | Menangani upload gambar, video, dokumen untuk artikel dan avatar pengguna |
| 4 | Komentar Bersarang | Mendukung komentar bersarang dengan parent_id |
| 5 | Statistik & Views | Melacak jumlah views artikel untuk metrik popularitas |
| 6 | Manajemen Pengguna | Admin dapat menambah, ubah, soft delete pengguna |
| 7 | Audit Log | Mencatat aktivitas penting di tabel audit_logs |

IV.5 Pengujian Sistem

Tambahan: Sistem dapat membuat, menyunting, dan mempublikasikan artikel dengan workflow (draft → revision → published).
	- Sistem dapat mengelola kategori pembelajaran secara otomatis saat pembuatan atau pembaruan artikel.
	- Sistem dapat menangani detail artikel dengan media pendukung seperti gambar, video, dan dokumen.
	- Sistem dapat melacak jumlah views artikel untuk mengukur popularitas konten.

Pengujian dilakukan untuk memastikan fitur berjalan sesuai kebutuhan. Metode pengujian meliputi black box testing (Newman untuk API), pengujian integrasi backend, dan smoke test pada UI.

IV.5.1 Pengujian Black Box

Pengujian black box dilakukan dengan koleksi Postman dan dieksekusi menggunakan Newman. Pengujian mencakup endpoint publik (read articles), endpoint internal (create/update/delete article), upload media, komentar, autentikasi, dan otorisasi role.

IV.5.2 Pengujian User Acceptance Test / UAT

UAT disusun berdasarkan peran: Pengguna umum, Moderator, Admin. Skenario UAT meliputi pendaftaran, login, pembuatan artikel, publikasi, penambahan komentar, dan pengelolaan data oleh admin.

IV.6 Hasil Pengujian

Hasil pengujian backend menunjukkan seluruh skenario API yang diuji berhasil. Newman report dan ringkasan pengujian disimpan dalam folder `docs/newman-results`.

Contoh ringkasan hasil pengujian:

- Black Box menggunakan Newman: 23 request dan 36 assertion — semua berhasil.
- UI Smoke Test: 18 skenario — semua berhasil.

Dokumentasi pengujian disimpan pada folder `docs/newman-results` dan `docs/test` sesuai struktur proyek.

IV.7 Pembahasan

Berdasarkan implementasi dan pengujian, sistem COCONEXUS telah memenuhi kebutuhan fungsional utama. Sistem memungkinkan pembuatan dan publikasi artikel, manajemen kategori, upload media, komentar bersarang, dan pelacakan view. Pengujian otomatis dan manual menunjukkan fitur berjalan sesuai skenario yang diuji.

---

**Lampiran**: Lampiran bukti implementasi (screenshot halaman, newman reports, dan file migrasi) disimpan di folder `docs/` dan `backend/migrations`.
