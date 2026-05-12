# BAB IV
# Analisis Sistem dan Pengujian

## 4.1 Analisis Sistem

COCONEXUS merupakan sistem repository berbasis web untuk mendukung pembelajaran dan pengelolaan informasi mengenai pemanfaatan limbah kelapa. Sistem dibangun menggunakan backend Node.js, Express, Sequelize, dan MySQL, sedangkan frontend menggunakan Vue 3, Pinia, Vue Router, dan Tailwind CSS.

Secara umum sistem memiliki dua kelompok pengguna, yaitu user dan admin. User dapat melakukan registrasi, login, membaca artikel yang telah dipublikasikan, memperbarui profil, serta memberikan komentar pada artikel. Admin memiliki kewenangan untuk mengelola artikel, kategori, user, komentar, upload media, serta melihat statistik dashboard.

## 4.2 Fitur Utama Sistem

Fitur utama yang telah tersedia pada sistem meliputi:

1. Autentikasi user menggunakan JWT.
2. Registrasi user dengan validasi email dan password.
3. Pengelolaan role user dan admin.
4. Pengelolaan artikel dengan status draft, revision, dan published.
5. Pengelolaan kategori artikel.
6. Upload media artikel dan avatar user.
7. Product card untuk menghubungkan artikel utama dengan artikel detail.
8. Komentar dan balasan komentar pada artikel published.
9. Dashboard admin berisi statistik user, artikel, kategori, komentar, dan view artikel.
10. Audit log untuk mencatat aktivitas penting yang dilakukan admin.

## 4.3 Penyempurnaan Sistem

Berdasarkan analisis kode, dilakukan penyempurnaan pada bagian registrasi user. Sebelumnya, request registrasi masih dapat membawa nilai role admin. Hal ini berpotensi menyebabkan user publik membuat akun dengan hak akses admin.

Penyempurnaan yang dilakukan adalah mengunci proses registrasi publik agar selalu membuat akun dengan role user. Pembuatan akun admin hanya sebaiknya dilakukan melalui mekanisme internal seperti seeder database atau endpoint khusus yang dilindungi akses admin.

Selain itu, cakupan pengujian otomatis diperluas agar sistem tidak hanya diuji pada alur berhasil, tetapi juga pada skenario gagal seperti password salah, password lemah, email duplikat, akses tanpa token, token tidak valid, upload file tidak sesuai, artikel tanpa konten, komentar kosong, dan akses user biasa ke halaman admin.

## 4.4 Metode Pengujian

Pengujian dilakukan menggunakan metode black-box testing dan integration testing pada backend. Pengujian dilakukan terhadap endpoint API untuk memastikan setiap fitur memberikan respons yang sesuai berdasarkan data masukan.

Pengujian frontend dilakukan melalui proses production build untuk memastikan source code frontend dapat dikompilasi tanpa error.

Perintah pengujian yang digunakan:

```bash
cd backend
npm test
```

```bash
cd frontend
npm run build
```

## 4.5 Hasil Pengujian Backend

Hasil pengujian backend menunjukkan seluruh skenario berhasil dijalankan. Jumlah skenario pengujian otomatis yang tersedia adalah 28 skenario dengan hasil 28 berhasil dan 0 gagal.

| No | Skenario Pengujian | Data Uji | Hasil yang Diharapkan | Status |
|---|---|---|---|---|
| 1 | Registrasi meminta role admin | Role admin pada request | Akun tetap dibuat sebagai user | Berhasil |
| 2 | User biasa mengakses dashboard admin | Token user | Sistem menolak akses | Berhasil |
| 3 | Login dengan password salah | Password tidak valid | Sistem menolak login | Berhasil |
| 4 | Registrasi password lemah | Password kurang kuat | Sistem menolak registrasi | Berhasil |
| 5 | Registrasi email duplikat | Email yang sudah terdaftar | Sistem menolak registrasi | Berhasil |
| 6 | Akses artikel admin tanpa token | Tidak ada token | Sistem menolak akses | Berhasil |
| 7 | Akses artikel admin dengan token tidak valid | Token salah | Sistem menolak akses | Berhasil |
| 8 | Membuat artikel tanpa konten | Body kosong | Sistem menolak data | Berhasil |
| 9 | Upload file tidak didukung | File exe | Sistem menolak upload | Berhasil |
| 10 | Komentar pada artikel draft | Artikel belum published | Sistem menolak komentar | Berhasil |
| 11 | Komentar kosong | Body komentar kosong | Sistem menolak komentar | Berhasil |
| 12 | Daftar artikel publik | Artikel draft dan published | Hanya artikel published tampil | Berhasil |
| 13 | Membuka detail artikel published | Artikel published | View artikel tercatat | Berhasil |
| 14 | Membuat kategori | Data kategori valid | Kategori berhasil dibuat | Berhasil |
| 15 | Membuat kategori duplikat | Nama kategori sama | Sistem menolak duplikasi | Berhasil |
| 16 | Menghapus kategori yang dipakai artikel | Kategori masih berelasi | Sistem menolak hapus | Berhasil |
| 17 | Admin memperbarui user | Role dan profil valid | Data user diperbarui | Berhasil |
| 18 | Admin menghapus akun sendiri | ID admin aktif | Sistem menolak aksi | Berhasil |
| 19 | User memperbarui profil sendiri | Nama dan bio valid | Profil diperbarui | Berhasil |
| 20 | Admin login dan membuat artikel draft | Data artikel valid | Artikel draft dibuat | Berhasil |
| 21 | Membuat artikel dengan product card | Product card valid | Product card tersimpan | Berhasil |
| 22 | Publish artikel draft | Status published | Artikel dipublikasikan | Berhasil |
| 23 | Upload media artikel valid | File gambar | Media tersimpan | Berhasil |
| 24 | Statistik dashboard | Data artikel dan komentar | Dataset chart sesuai | Berhasil |
| 25 | Product card yang belum terhubung | Artikel utama | Data card tersedia tampil | Berhasil |
| 26 | Daftar artikel utama | Artikel parent dan detail | Hanya artikel utama tampil | Berhasil |
| 27 | Membuat artikel detail terhubung product card | Parent article dan card valid | Relasi tersimpan | Berhasil |
| 28 | Update product card artikel | Data card baru | Card lama diganti | Berhasil |

## 4.6 Hasil Pengujian Frontend

Pengujian frontend dilakukan dengan menjalankan proses build. Hasil build menunjukkan frontend berhasil dikompilasi tanpa error. Hal ini menunjukkan bahwa struktur komponen, routing, store, dan dependency frontend dapat diproses menjadi file production.

## 4.6.1 Hasil Pengujian API Menggunakan Newman

Selain pengujian integrasi backend menggunakan Node test runner, pengujian API juga dilakukan menggunakan Newman. Pengujian Newman dilakukan terhadap 23 request API dengan total 36 assertion. Hasil pengujian menunjukkan 23 request berhasil dijalankan, 36 assertion berhasil, dan 0 assertion gagal.

Pengujian Newman mencakup health check, login admin, registrasi user, validasi role registrasi, akses admin oleh user biasa, password salah, password lemah, email duplikat, akses tanpa token, token tidak valid, kategori, artikel, publikasi artikel, detail artikel, komentar, pembaruan profil, dan statistik dashboard.

Tabel hasil pengujian API menggunakan Newman tersedia pada dokumen `docs/newman-results/tabel-hasil-uji-api-newman.md`.

## 4.7 Analisis Hasil Pengujian

Berdasarkan hasil pengujian, sistem telah memenuhi kebutuhan fungsional utama. Backend mampu menangani proses autentikasi, otorisasi, validasi input, pengelolaan artikel, pengelolaan kategori, pengelolaan user, komentar, upload media, statistik dashboard, serta pencatatan view artikel.

Pengujian juga menunjukkan sistem memiliki mekanisme kontrol terhadap data yang tidak valid. Contohnya, sistem menolak password lemah, email duplikat, akses tanpa token, token tidak valid, file upload yang tidak didukung, artikel tanpa konten, dan komentar kosong.

## 4.8 Rekomendasi Pengembangan Selanjutnya

Rekomendasi pengembangan selanjutnya adalah:

1. Menambahkan pengujian end-to-end frontend menggunakan Playwright atau Cypress.
2. Menambahkan dokumentasi API menggunakan format OpenAPI atau Postman Collection.
3. Menambahkan refresh token atau mekanisme logout server-side untuk memperkuat keamanan JWT.
4. Menggunakan Redis untuk rate limiter jika sistem digunakan pada production.
5. Menambahkan pencatatan durasi baca artikel agar statistik aktivitas user lebih informatif.
6. Menambahkan moderasi komentar untuk mencegah komentar tidak sesuai.

## 4.9 Kesimpulan

Berdasarkan analisis dan pengujian, sistem COCONEXUS telah berjalan sesuai kebutuhan utama. Seluruh skenario pengujian backend berhasil dijalankan dengan hasil 28 berhasil dan 0 gagal, sedangkan frontend berhasil melalui proses build production. Dengan demikian, sistem dapat dinyatakan layak untuk digunakan sebagai repository pembelajaran pengelolaan limbah kelapa, dengan beberapa rekomendasi lanjutan untuk peningkatan keamanan, dokumentasi, dan pengujian antarmuka pengguna.
