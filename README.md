# COCONEXUS

COCONEXUS adalah aplikasi web repository pengolahan limbah kelapa dengan backend `Node.js + Express + Sequelize + MySQL` dan frontend `Vue 3 + Pinia + Tailwind CSS`.

## Struktur Project

```text
.
|-- backend
|-- frontend
|-- .sequelizerc
`-- README.md
```

## Fitur yang Sudah Tersedia

- Autentikasi register dan login berbasis JWT
- Manajemen user dan soft delete oleh admin
- CMS artikel dengan workflow `draft -> revision -> published`
- Pengelolaan kategori otomatis saat create/update artikel
- Detail artikel, media artikel, dan nested comments
- Frontend landing page, detail artikel, login, dan dashboard admin

## Prasyarat

- Node.js 20+
- MySQL 8+
- npm 10+

## Setup Backend

1. Masuk ke folder backend.
2. Salin `backend/.env.example` menjadi `backend/.env`.
3. Isi kredensial database dan JWT secret.
4. Install dependency dan jalankan migrasi.

```bash
cd backend
npm install
npm run db:create
npm run db:migrate
npm run dev
```

Backend berjalan di `http://localhost:3000`.

Command tambahan backend:

```bash
npm run db:seed
npm test
npm run smoke
```

## Setup Frontend

1. Masuk ke folder frontend.
2. Salin `frontend/.env.example` menjadi `frontend/.env`.
3. Pastikan `VITE_API_BASE_URL` mengarah ke backend.

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173`.

## Menjalankan dari Root Repo

```bash
npm install
npm run dev
```

Perintah ini akan menjalankan backend dan frontend secara bersamaan.

## Integrasi MySQL Lokal Laragon

Untuk development lokal dengan Laragon, konfigurasi default yang saat ini dipakai adalah:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=coconexus_db
DB_USER=root
DB_PASSWORD=
```

Setelah MySQL Laragon aktif:

```bash
cd backend
npm run db:migrate
npm run db:seed
```

Jika ingin membuat database manual:

```sql
CREATE DATABASE coconexus_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Menjalankan dengan Docker Compose

Project ini juga sudah disiapkan untuk dijalankan secara containerized:

```bash
docker compose up --build
```

Service yang akan aktif:

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:3000`
- MySQL: `localhost:3306`

Pada mode Docker, frontend otomatis me-request API melalui reverse proxy `/api` ke container backend.

## Environment Penting

### Backend

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_DIALECT`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CORS_ORIGIN`
- `LOG_LEVEL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_FULL_NAME`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`
- `AUTH_RATE_LIMIT_WINDOW_MS`
- `AUTH_RATE_LIMIT_MAX_REQUESTS`

### Frontend

- `VITE_API_BASE_URL`

## Quality Checks

```bash
# dari root
npm run check

# atau manual
cd backend && npm run check
cd backend && npm test
cd backend && npm run smoke
cd frontend && npm run build
```

## Upload Media Artikel

Backend sekarang mendukung upload media artikel melalui endpoint admin:

```http
POST /api/uploads/articles
Authorization: Bearer <token-admin>
Content-Type: multipart/form-data
```

Frontend dashboard admin sudah mendukung upload file dari editor artikel. Hasil upload akan otomatis mengisi `file_path` dan `media_type` ke daftar media artikel.

Avatar user juga bisa diunggah melalui:

```http
POST /api/uploads/avatars/me
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

## Catatan Production

- Gunakan `JWT_SECRET` yang kuat dan berbeda untuk setiap environment.
- Batasi `CORS_ORIGIN` ke domain frontend production.
- Gunakan reverse proxy seperti Nginx untuk TLS dan static asset delivery.
- Jalankan migrasi database sebagai bagian dari deployment pipeline.
- Pertimbangkan menambahkan Redis untuk rate limiting terdistribusi dan session invalidation bila trafik meningkat.
- Workflow CI dasar tersedia di `.github/workflows/ci.yml` untuk memeriksa backend dan build frontend pada setiap push atau pull request.
