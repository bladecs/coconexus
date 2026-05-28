# HALAMAN JUDUL

"Pengembangan Sistem Repository Pembelajaran Pemanfaatan Limbah Kelapa Berbasis Web"

Hafizh Ahmad Al Mushoffi

Program Studi Teknik Informatika

Fakultas Teknik

Universitas [Nama Universitas]

2026

---

# LEMBAR PENGESAHAN

Saya yang bertanda tangan di bawah ini menyatakan bahwa karya ilmiah ini telah ditelaah dan disetujui untuk diajukan sebagai salah satu syarat memperoleh gelar Sarjana di Universitas [Nama Universitas].

Pembimbing I : ___________________________

Pembimbing II : __________________________

Mengetahui,

Ketua Program Studi Teknik Informatika

Tanggal: ________________________________

---

# PERNYATAAN ORISINALITAS

Saya menyatakan bahwa Karya Tulis Ilmiah ini merupakan hasil karya sendiri dan belum pernah diajukan untuk memperoleh gelar akademik pada program studi manapun.

Apabila di kemudian hari terbukti ada plagiarisme, maka saya siap menerima konsekuensi akademik sesuai ketentuan yang berlaku.


Nama : Hafizh Ahmad Al Mushoffi

NIM : ___________________________

Tanggal : ________________________

---

# PERNYATAAN HKI

Saya menyatakan bahwa hasil penelitian dan karya ilmiah ini sepenuhnya merupakan hak kekayaan intelektual saya sendiri. Apabila terdapat unsur hak cipta atau hak kekayaan intelektual yang berasal dari pihak lain, telah dicantumkan sumbernya secara benar.


Nama : Hafizh Ahmad Al Mushoffi

Tanggal : ________________________

---

# ABSTRAK

Sistem COCONEXUS adalah sebuah repository berbasis web yang dirancang untuk mendukung pembelajaran dan pengelolaan informasi pemanfaatan limbah kelapa. Sistem ini mengintegrasikan backend berbasis Node.js, Express, Sequelize, dan MySQL dengan frontend berbasis Vue 3, Pinia, Vue Router, dan Tailwind CSS.

Penelitian ini bertujuan merancang dan mengimplementasikan sistem informasi yang memungkinkan pengguna umum untuk membaca artikel, memberi komentar, serta melakukan registrasi dan autentikasi. Selain itu, sistem juga menyediakan akses admin untuk mengelola artikel, kategori, pengguna, komentar, dan statistik.

Metode penelitian yang digunakan meliputi studi literatur, analisis kebutuhan, perancangan sistem, implementasi, dan pengujian fungsional. Pengujian dilaksanakan dengan black-box testing, integration testing backend, serta build frontend untuk memastikan sistem dapat berjalan tanpa error.

Hasil pengujian menunjukkan bahwa sistem mampu menangani 28 skenario backend dengan hasil seluruhnya berhasil. Pengujian API menggunakan Newman juga menunjukkan seluruh 23 request dan 36 assertion berhasil. Dengan hasil tersebut, sistem COCONEXUS dinilai layak sebagai solusi repository pembelajaran pemanfaatan limbah kelapa.

Kata kunci: repository pembelajaran, limbah kelapa, sistem informasi, Node.js, Vue 3.

---

# DAFTAR ISI

HALAMAN JUDUL
LEMBAR PENGESAHAN
PERNYATAAN ORISINALITAS
PERNYATAAN HKI
ABSTRAK
DAFTAR ISI
DAFTAR GAMBAR
DAFTAR TABEL
DAFTAR LAMPIRAN

BAB I PENDAHULUAN
1.1 Latar Belakang
1.2 Rumusan Masalah
1.3 Batasan Masalah
1.4 Tujuan
1.5 Manfaat
1.6 Sistematika Penulisan

BAB II TINJAUAN PUSTAKA
2.1 Tinjauan Teori
2.2 Tinjauan Teknologi
2.3 Penelitian Terdahulu
2.4 State of the Art / Posisi Penelitian

BAB III METODOLOGI PENYELESAIAN MASALAH
3.1 Metode Penelitian
3.2 Objek dan Lokasi Penelitian
3.3 Teknik Pengumpulan Data
3.4 Tahapan Penelitian
3.5 Analisis Kebutuhan Sistem
3.6 Perancangan Sistem
3.6.1 Arsitektur Sistem
3.6.2 Use Case Diagram
3.6.3 Activity Diagram / Flowchart Sistem
3.6.4 Data Flow Diagram
3.6.5 Entity Relationship Diagram
3.6.6 Perancangan Database
3.6.7 Perancangan Antarmuka
3.7 Rencana Pengujian Sistem

BAB IV HASIL DAN PEMBAHASAN
4.1 Implementasi Sistem
4.2 Implementasi Database
4.3 Implementasi Antarmuka
4.4 Implementasi Fitur
4.5 Pengujian Sistem
4.5.1 Pengujian Black Box
4.5.2 Pengujian User Acceptance Test / UAT
4.6 Hasil Pengujian
4.7 Pembahasan

BAB V KESIMPULAN DAN SARAN
5.1 Kesimpulan
5.2 Saran

DAFTAR PUSTAKA
LAMPIRAN

---

# DAFTAR GAMBAR

1. Arsitektur Sistem COCONEXUS ......................... 32
2. Use Case Diagram ................................... 33
3. Activity Diagram / Flowchart Sistem ................ 34
4. Data Flow Diagram .................................. 35
5. Entity Relationship Diagram ........................ 36

---

# DAFTAR TABEL

1. Fitur Utama Sistem .................................. 38
2. Ringkasan Pengujian Backend ........................ 39
3. Ringkasan Pengujian Newman ........................ 40

---

# DAFTAR LAMPIRAN

Lampiran A: Hasil Pengujian API Newman
Lampiran B: Potongan Kode Implementasi
Lampiran C: Struktur Database

---

# BAB I PENDAHULUAN

## 1.1 Latar Belakang

COCONEXUS merupakan sistem repository berbasis web untuk mendukung pembelajaran dan pengelolaan informasi mengenai pemanfaatan limbah kelapa. Terdapat kebutuhan untuk menyediakan platform yang mudah diakses dan terstruktur agar masyarakat dapat memperoleh informasi tentang pengelolaan limbah kelapa dengan lebih efektif.

Pemanfaatan limbah kelapa memiliki potensi untuk mendukung ekonomi lokal dan mengurangi dampak lingkungan. Oleh sebab itu, pengembangan platform digital berbasis web menjadi solusi untuk menyebarkan informasi, artikel, dan pengetahuan tentang praktik terbaik pemanfaatan limbah kelapa.

## 1.2 Rumusan Masalah

1. Bagaimana merancang sistem repository berbasis web untuk memfasilitasi akses informasi pemanfaatan limbah kelapa?
2. Bagaimana mengelola konten artikel, kategori, komentar, dan pengguna secara aman dan terstruktur?
3. Bagaimana memastikan sistem dapat dijalankan dan diuji dengan baik pada backend dan frontend?

## 1.3 Batasan Masalah

1. Sistem hanya melayani dua peran utama yaitu user dan admin.
2. Fokus implementasi adalah pada manajemen artikel, kategori, komentar, pengguna, dan statistik.
3. Pengujian difokuskan pada backend API, integrasi, dan build frontend.
4. Data repository disimpan pada basis data MySQL dan tidak termasuk pengolahan citra lanjutan.

## 1.4 Tujuan

1. Membangun sistem repository pembelajaran limbah kelapa berbasis web.
2. Mengimplementasikan mekanisme autentikasi dan otorisasi yang aman.
3. Menyediakan fitur manajemen artikel, kategori, komentar, dan pengguna.
4. Melakukan pengujian sistem untuk memastikan kelayakan fungsi.

## 1.5 Manfaat

1. Menyediakan media informasi yang mudah diakses bagi masyarakat.
2. Mengoptimalkan pengelolaan artikel dan konten edukasi mengenai limbah kelapa.
3. Menjadi referensi akademik dalam pengembangan aplikasi repository berbasis web.
4. Mendukung peningkatan keterampilan digital pada pengguna dan pengelola.

## 1.6 Sistematika Penulisan

BAB I membahas pendahuluan, termasuk latar belakang, rumusan masalah, batasan masalah, tujuan, manfaat, dan sistematika penulisan.
BAB II membahas tinjauan pustaka, teori dasar, tinjauan teknologi, penelitian terdahulu, dan posisi penelitian.
BAB III menjelaskan metodologi penelitian, objek penelitian, teknik pengumpulan data, tahapan penelitian, analisis kebutuhan, perancangan sistem, dan rencana pengujian.
BAB IV memaparkan hasil implementasi sistem, implementasi database, implementasi antarmuka, fitur, pengujian sistem, hasil pengujian, dan pembahasan.
BAB V berisi kesimpulan dan saran.

---

# BAB II TINJAUAN PUSTAKA

## 2.1 Tinjauan Teori

Repository pembelajaran adalah sistem yang menyimpan, mengelola, dan menyediakan akses terhadap konten edukatif secara terstruktur. Sistem ini biasanya mendukung pencarian, pengelolaan dokumen, dan interaksi pengguna.

Sistem informasi berbasis web memanfaatkan model client-server, dimana frontend sebagai antarmuka pengguna berkomunikasi dengan backend melalui API untuk mengelola data dan logika bisnis.

## 2.2 Tinjauan Teknologi

Backend sistem COCONEXUS dibangun menggunakan Node.js, Express, Sequelize, dan MySQL. Node.js menyediakan runtime JavaScript server-side, Express menyediakan framework web, dan Sequelize bertindak sebagai ORM untuk memudahkan interaksi dengan basis data MySQL.

Frontend sistem menggunakan Vue 3, Pinia, Vue Router, dan Tailwind CSS. Vue 3 memberikan kemampuan pembuatan antarmuka responsif, Pinia digunakan untuk manajemen state, Vue Router mengatur navigasi, dan Tailwind CSS memberikan styling utilitas.

## 2.3 Penelitian Terdahulu

Penelitian terdahulu yang relevan meliputi pengembangan sistem informasi edukasi berbasis web dan repository konten. Beberapa penelitian serupa menunjukkan bahwa integrasi fitur manajemen konten dan autentikasi sangat penting untuk menjaga kualitas informasi dan keamanan sistem.

Studi tentang pemanfaatan limbah kelapa juga menunjukkan bahwa penyebaran informasi melalui platform digital dapat membantu meningkatkan kesadaran masyarakat dan mendukung ekonomi lokal.

## 2.4 State of the Art / Posisi Penelitian

Posisi penelitian ini adalah pengembangan sistem repository pembelajaran dengan fokus pada konten limbah kelapa. Dibandingkan dengan platform edukasi umum, COCONEXUS menambahkan fitur manajemen artikel yang terhubung dengan product card, komentar, dan dashboard statistik yang mendukung evaluasi penggunaan.

Sistem ini juga menekankan pada keamanan backend melalui validasi input dan otorisasi role, sehingga berbeda dari sistem repository sederhana yang hanya mengandalkan autentikasi dasar.

---

# BAB III METODOLOGI PENYELESAIAN MASALAH

## 3.1 Metode Penelitian

Metode penelitian yang digunakan adalah metode penelitian dan pengembangan (R&D) dengan pendekatan studi kasus pada pengembangan sistem informasi berbasis web. Langkah-langkah meliputi analisis kebutuhan, perancangan, implementasi, dan pengujian.

## 3.2 Objek dan Lokasi Penelitian

Objek penelitian adalah sistem informasi repository pembelajaran COCONEXUS. Lokasi penelitian dilakukan secara daring dan lokal menggunakan lingkungan pengembangan di komputer, dengan basis data MySQL dan server pemrograman Node.js.

## 3.3 Teknik Pengumpulan Data

Teknik pengumpulan data meliputi:

1. Studi pustaka untuk memperoleh teori dan teknologi yang relevan.
2. Analisis dokumentasi proyek untuk memahami kebutuhan sistem.
3. Observasi kode sumber dan database untuk mendokumentasikan implementasi.
4. Pengujian fungsional dan integrasi untuk mengevaluasi hasil implementasi.

## 3.4 Tahapan Penelitian

Tahapan penelitian terdiri dari:

1. Identifikasi masalah dan analisis kebutuhan.
2. Perancangan arsitektur sistem dan basis data.
3. Implementasi backend dan frontend.
4. Pengujian sistem pada backend dan frontend.
5. Evaluasi hasil dan penyusunan laporan.

## 3.5 Analisis Kebutuhan Sistem

Analisis kebutuhan sistem dilakukan untuk menentukan kebutuhan yang harus dipenuhi oleh sistem repository pembelajaran pemanfaatan limbah kelapa berbasis web. Tahap ini bertujuan agar sistem yang dikembangkan sesuai dengan kebutuhan pengguna dan dapat membantu dalam penyebarluasan pengetahuan mengenai pemanfaatan limbah kelapa. Hasil analisis kebutuhan sistem diperoleh dari proses observasi, studi literatur, konsultasi dengan ahli, serta analisis terhadap kebutuhan pembelajaran komunitas yang eksisting.

Kebutuhan sistem dalam penelitian ini terdiri dari kebutuhan pengguna, kebutuhan fungsional, dan kebutuhan nonfungsional.

### 3.5.1 Kebutuhan Pengguna

Kebutuhan pengguna menjelaskan pihak-pihak yang menggunakan sistem beserta hak aksesnya. Pengguna sistem terdiri dari tiga kategori:

1. **Admin**: Memiliki hak akses penuh untuk mengelola data pengguna, artikel, komentar, kategori, log audit, serta mengakses dashboard statistik sistem.
2. **Moderator Konten**: Memiliki hak akses untuk membuat, menyunting, dan mempublikasikan artikel dengan workflow (draft → revision → published), mengelola kategori pembelajaran, serta mengelola komentar yang masuk.
3. **Pengguna Umum**: Memiliki hak akses untuk membaca artikel, memberikan komentar bersarang, melakukan registrasi dan login, serta mengakses profil pribadi dan statistik pembelajaran.

### 3.5.2 Kebutuhan Fungsional

Kebutuhan fungsional merupakan kebutuhan yang berkaitan dengan fungsi atau layanan yang harus tersedia pada sistem. Kebutuhan fungsional pada sistem repository pembelajaran ini meliputi:

1. **Autentikasi dan Manajemen Pengguna**:
   - Sistem dapat melakukan proses registrasi, login, dan logout pengguna dengan autentikasi berbasis JWT.
   - Sistem dapat mengelola data pengguna dan profil pengguna berdasarkan hak akses.
   - Sistem dapat melakukan soft delete pada data pengguna oleh admin.

2. **Manajemen Konten Pembelajaran**:
   - Sistem dapat membuat, menyunting, dan mempublikasikan artikel dengan workflow (draft → revision → published).
   - Sistem dapat mengelola kategori pembelajaran secara otomatis saat pembuatan atau pembaruan artikel.
   - Sistem dapat menangani detail artikel dengan media pendukung seperti gambar, video, dan dokumen.
   - Sistem dapat melacak jumlah views artikel untuk mengukur popularitas konten.

3. **Interaksi Pengguna**:
   - Sistem dapat menerima dan menampilkan komentar bersarang (nested comments) pada artikel.
   - Sistem dapat menampilkan profil pengguna dengan informasi pembelajaran.

4. **Fitur Admin dan Monitoring**:
   - Sistem dapat menampilkan dashboard admin untuk manajemen artikel, pengguna, dan komentar.
   - Sistem dapat mencatat log audit untuk setiap aktivitas pengguna penting.
   - Sistem dapat menampilkan statistik pembelajaran dan artikel populer.

5. **Manajemen Media**:
   - Sistem dapat mengunggah dan mengelola media pembelajaran dalam berbagai format.
   - Sistem dapat menyimpan avatar pengguna dan file media artikel.

### 3.5.3 Kebutuhan Nonfungsional

Kebutuhan nonfungsional merupakan kebutuhan yang berkaitan dengan kualitas sistem. Kebutuhan nonfungsional pada sistem ini meliputi:

1. **Aksesibilitas dan Teknologi**:
   - Sistem berbasis web sehingga dapat diakses melalui browser di berbagai perangkat (desktop, tablet, mobile).
   - Sistem dapat berjalan pada perangkat komputer atau laptop yang terhubung dengan jaringan internet.

2. **Desain dan User Experience**:
   - Sistem memiliki tampilan antarmuka yang responsif, intuitif, dan mudah digunakan.
   - Sistem menggunakan desain modern dengan palet warna yang konsisten.

3. **Keamanan**:
   - Sistem memiliki pembatasan hak akses yang ketat sesuai peran pengguna.
   - Sistem memiliki tingkat keamanan tinggi terutama pada proses autentikasi dan autorisasi menggunakan JWT.
   - Sistem melakukan validasi input untuk mencegah injection attacks.

4. **Data dan Performance**:
   - Sistem mampu menyimpan data secara terstruktur menggunakan basis data MySQL.
   - Sistem memiliki kecepatan akses yang optimal untuk pengalaman pengguna yang baik.
   - Sistem dapat menangani concurrent users dan request dalam jumlah yang signifikan.

5. **Pemeliharaan**:
   - Sistem memiliki struktur kode yang terorganisir dan mudah dipelihara.
   - Sistem memiliki dokumentasi API yang lengkap untuk kemudahan pengembangan dan debugging.

## 3.6 Perancangan Sistem

Perancangan sistem merupakan tahap yang dilakukan setelah analisis kebutuhan sistem. Tahap ini bertujuan untuk memberikan gambaran mengenai struktur, alur kerja, basis data, antarmuka, serta hak akses pengguna pada sistem repository pembelajaran pemanfaatan limbah kelapa yang akan dikembangkan. Perancangan sistem dilakukan agar proses implementasi dapat berjalan lebih terarah dan sesuai dengan kebutuhan pengguna.

Pada penelitian ini, perancangan sistem meliputi perancangan arsitektur sistem, use case diagram, activity diagram, basis data, antarmuka pengguna, serta hak akses pengguna. Perancangan arsitektur sistem digunakan untuk menggambarkan hubungan antara pengguna, aplikasi frontend berbasis Vue 3, backend server berbasis Node.js dengan Express, dan basis data MySQL. Use case diagram digunakan untuk menggambarkan interaksi antara aktor (admin, moderator konten, pengguna umum) dengan fitur sistem. Activity diagram digunakan untuk menggambarkan alur proses pada setiap fitur utama, seperti autentikasi pengguna, pembuatan dan publikasi artikel, pengelolaan komentar bersarang, dan manajemen konten pembelajaran. Perancangan basis data digunakan untuk menentukan struktur tabel, relasi data, dan integritas referensial yang diperlukan dalam sistem. Selain itu, perancangan antarmuka dilakukan untuk menggambarkan tampilan halaman sistem yang responsif dan mudah digunakan oleh pengguna di berbagai perangkat.

### 3.6.1 Arsitektur Sistem

Arsitektur sistem COCONEXUS menggunakan model client-server dengan tiga lapisan utama:

1. **Presentation Layer (Frontend)**:
   - Frontend Vue 3 berfungsi sebagai tampilan pengguna dan berkomunikasi dengan backend melalui REST API.
   - Menggunakan Vue Router untuk navigasi antar halaman dan Pinia untuk state management.
   - Styling menggunakan Tailwind CSS untuk tampilan responsif dan modern.

2. **Application Layer (Backend)**:
   - Backend Node.js dengan Express.js menangani logika bisnis, autentikasi JWT, validasi input, dan autorisasi.
   - Middleware untuk error handling, rate limiting, CORS, compression, dan logging.
   - Controllers untuk menangani request dari berbagai endpoint API.

3. **Data Layer (Database)**:
   - MySQL untuk penyimpanan data terstruktur dengan Sequelize sebagai ORM.
   - Migrations untuk mengelola versi skema database.
   - Seeders untuk inisialisasi data awal.

### 3.6.2 Use Case Diagram

Use case diagram menjelaskan peran user dan admin dalam sistem:

1. **Pengguna Umum** dapat:
   - Melakukan registrasi dan login
   - Membaca artikel dan melihat detail artikel
   - Memberikan komentar dan membalas komentar
   - Memperbarui profil pengguna
   - Melihat statistik pembelajaran

2. **Admin** dapat:
   - Mengelola artikel (create, read, update, delete dengan workflow approval)
   - Mengelola kategori pembelajaran
   - Mengelola pengguna (create, read, update, soft delete)
   - Mengelola komentar (delete inappropriate comments)
   - Mengelola media dan file pembelajaran
   - Mengakses log audit sistem
   - Melihat dashboard statistik dan laporan

3. **Moderator Konten** dapat:
   - Membuat dan menyunting artikel
   - Mengatur kategori pembelajaran
   - Mengelola komentar di artikel mereka
   - Melihat statistik artikel mereka

### 3.6.3 Activity Diagram / Flowchart Sistem

Activity diagram menggambarkan alur proses utama:

1. **Alur Registrasi**: Pengguna mengisi form → validasi input → hash password → simpan ke database → notifikasi sukses
2. **Alur Login**: Pengguna login → verifikasi kredensial → generate JWT token → redirect ke dashboard
3. **Alur Pembuatan Artikel**: Moderator membuat artikel → set kategori → upload media → submit untuk review → admin approve → publish
4. **Alur Komentar Bersarang**: Pengguna memberi komentar → sistem menyimpan dengan parent_id → tampilkan dalam struktur bersarang
5. **Alur Akses Admin**: User login → cek role di JWT → jika admin, tampilkan dashboard admin

### 3.6.4 Data Flow Diagram

Data flow diagram menunjukkan aliran data:

- User login → Frontend kirim credential → Backend verifikasi → return JWT token
- User baca artikel → Frontend request ke API → Backend query database → return data artikel + comments
- Moderator submit artikel → Frontend kirim form data + media → Backend proses + simpan ke database
- Admin manage users → Frontend request user list → Backend query dengan pagination → return data
- System audit → Backend log setiap aktivitas penting → simpan ke audit_logs table

### 3.6.5 Entity Relationship Diagram

Entity relationship diagram memetakan relasi antar tabel:

- **users** (1) -- (1) **user_profiles**: Satu user memiliki satu profil
- **users** (1) -- (N) **articles**: Satu user dapat membuat banyak artikel
- **users** (1) -- (N) **comments**: Satu user dapat membuat banyak komentar
- **category_tags** (1) -- (N) **articles**: Satu kategori memiliki banyak artikel
- **articles** (1) -- (1) **article_details**: Satu artikel memiliki satu detail
- **articles** (1) -- (N) **article_media**: Satu artikel dapat memiliki banyak media
- **articles** (1) -- (N) **comments**: Satu artikel dapat memiliki banyak komentar
- **articles** (1) -- (N) **article_views**: Tracking views untuk setiap artikel
- **comments** (N) -- (1) **comments**: Nested comments (parent-child relationship)
- **users** (1) -- (N) **audit_logs**: Setiap aktivitas user dicatat di audit log

### 3.6.6 Perancangan Database

Perancangan database menggunakan MySQL dengan 11 entitas utama:

| Tabel | Deskripsi |
|-------|-----------|
| users | Menyimpan data pengguna (email, password, role, status) |
| user_profiles | Profil detail pengguna (bio, avatar, alamat) |
| category_tags | Kategori pembelajaran yang tersedia |
| articles | Artikel dengan status (draft, revision, published) |
| article_details | Detail konten artikel (content, sections, sources) |
| article_media | File media yang terlampir pada artikel |
| comments | Komentar dengan support nested comments (parent_id) |
| article_views | Tracking jumlah views per artikel per user |
| product_cards | Data produk hasil pengolahan limbah kelapa |
| audit_logs | Log aktivitas sistem untuk auditing |

Setiap tabel dilengkapi dengan timestamps (createdAt, updatedAt) untuk tracking dan soft delete support dimana diperlukan.

### 3.6.7 Perancangan Antarmuka

Perancangan antarmuka menekankan tampilan bersih, responsif, dan mudah digunakan:

1. **Landing Page**: Menampilkan featured articles, kategori, dan call-to-action untuk registrasi
2. **Halaman Artikel**: List artikel dengan filter kategori, search, pagination
3. **Detail Artikel**: Konten lengkap dengan media, komentar bersarang, metadata
4. **Halaman Auth**: Form login dan registrasi dengan validasi client-side
5. **Profil Pengguna**: Edit profil, upload avatar, melihat artikel yang disimpan
6. **Dashboard Admin**: 
   - Statistik artikel, user, comments
   - Manajemen artikel dengan workflow approval
   - Manajemen user dan role
   - Moderasi komentar
   - Audit log viewer

Frontend menggunakan Tailwind CSS untuk styling, responsive design untuk mobile/tablet/desktop, dan Vue Router untuk navigasi client-side yang smooth.

## 3.7 Rencana Pengujian Sistem

Rencana pengujian sistem meliputi:

1. Pengujian unit dan integrasi pada backend API.
2. Pengujian build frontend untuk memastikan kompilasi.
3. Pengujian black box untuk skenario normal dan kasus gagal.
4. Pengujian User Acceptance Test (UAT) untuk memastikan sistem memenuhi kebutuhan pengguna.

---

# BAB IV HASIL DAN PEMBAHASAN

## 4.1 Implementasi Sistem

Implementasi sistem dilakukan dengan membangun backend menggunakan Node.js, Express, Sequelize, dan MySQL. Backend menyediakan endpoint untuk autentikasi, manajemen pengguna, artikel, kategori, komentar, upload file, dan statistik.

Frontend diimplementasikan dengan Vue 3, Pinia, Vue Router, dan Tailwind CSS. Antarmuka memungkinkan pengguna untuk membaca artikel dan melakukan interaksi, sementara admin dapat mengelola konten.

## 4.2 Implementasi Database

Basis data MySQL digunakan untuk menyimpan data pengguna, artikel, kategori, komentar, dan log aktivitas. Struktur database dirancang dengan relasi yang jelas untuk mendukung validasi dan konsistensi data.

Beberapa tabel penting meliputi:

- users
- user_profiles
- category_tags
- articles
- article_details
- article_media
- comments
- article_views
- audit_logs
- product_cards

## 4.3 Implementasi Antarmuka

Antarmuka pengguna dibangun dengan komponen Vue yang modular. Halaman utama menampilkan daftar artikel yang sudah dipublikasikan, halaman detail artikel menampilkan konten dan komentar, serta halaman dashboard admin menampilkan statistik.

## 4.4 Implementasi Fitur

Fitur yang diimplementasikan meliputi:

1. Registrasi dan login user dengan JWT.
2. Validasi email, password, dan peran penggunan saat registrasi.
3. Pengelolaan artikel dengan status draft, revision, dan published.
4. Pengelolaan kategori artikel.
5. Upload media artikel dan avatar pengguna.
6. Komentar dan balasan komentar pada artikel publik.
7. Dashboard admin yang menampilkan statistik user, artikel, kategori, komentar, dan view artikel.
8. Audit log untuk kegiatan penting admin.

## 4.5 Pengujian Sistem

### 4.5.1 Pengujian Black Box

Pengujian black box dilakukan pada backend API untuk memastikan setiap endpoint memberikan respons yang sesuai tanpa memperhatikan struktur internal kode. Pengujian mencakup skenario normal dan kasus negatif.

### 4.5.2 Pengujian User Acceptance Test / UAT

Pengujian UAT melibatkan evaluasi terhadap kebutuhan pengguna akhir, seperti kemampuan membaca artikel, login, registrasi, komentar, serta kemampuan admin dalam mengelola konten.

## 4.6 Hasil Pengujian

### 4.6.1 Hasil Pengujian Backend

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

### 4.6.2 Hasil Pengujian Frontend

Pengujian frontend dilakukan dengan menjalankan proses build. Hasil build menunjukkan frontend berhasil dikompilasi tanpa error.

### 4.6.3 Hasil Pengujian API Menggunakan Newman

Pengujian API menggunakan Newman meliputi 23 request dan 36 assertion. Semua request dan assertion berhasil dijalankan tanpa kegagalan.

## 4.7 Pembahasan

Hasil implementasi dan pengujian menunjukkan bahwa sistem COCONEXUS telah memenuhi kebutuhan fungsional utama. Backend dapat menangani proses autentikasi, otorisasi, validasi input, pengelolaan artikel, kategori, komentar, upload media, dan statistik.

Pengujian juga mengungkap bahwa sistem mampu menolak data tidak valid seperti password lemah, email duplikat, token tidak valid, upload file tidak didukung, artikel tanpa konten, dan komentar kosong. Hal ini menunjukkan bahwa sistem memiliki kontrol kualitas input yang baik.

---

# BAB V KESIMPULAN DAN SARAN

## 5.1 Kesimpulan

1. Sistem COCONEXUS berhasil diimplementasikan sebagai repository pembelajaran limbah kelapa berbasis web.
2. Backend dan frontend berhasil berjalan dengan baik, serta pengujian backend menunjukkan 28 skenario berhasil.
3. Pengujian API Newman menunjukkan semua request dan assertion berhasil tanpa kegagalan.
4. Sistem telah memenuhi kebutuhan manajemen artikel, kategori, komentar, pengguna, dan statistik.

## 5.2 Saran

1. Menambahkan pengujian end-to-end frontend untuk meningkatkan kualitas antarmuka.
2. Mengembangkan dokumentasi API dengan OpenAPI atau Postman Collection.
3. Menerapkan mekanisme refresh token atau logout server-side untuk meningkatkan keamanan JWT.
4. Mempertimbangkan penggunaan Redis untuk rate limiter pada environment produksi.
5. Mengembangkan fitur moderasi komentar serta pelacakan durasi baca artikel.

---

# DAFTAR PUSTAKA

1. Pressman, R. S. (2014). Software Engineering: A Practitioner's Approach. McGraw-Hill.
2. Rouse, M. (2018). What is an API? Definition and examples. TechTarget.
3. Dokumentasi Node.js. https://nodejs.org/
4. Dokumentasi Vue.js. https://vuejs.org/
5. Dokumentasi Sequelize. https://sequelize.org/

---

# LAMPIRAN

## Lampiran A: Hasil Pengujian API Newman

Hasil pengujian API Newman tersedia dalam `docs/newman-results/tabel-hasil-uji-api-newman.md`.

## Lampiran B: Potongan Kode Implementasi

Potongan kode dapat dilihat pada file backend dan frontend dalam repositori.

## Lampiran C: Struktur Database

Struktur database dapat dilihat melalui skema migrasi dan model dalam folder `backend/migrations` dan `backend/models`.
