# Struktur Menu Proyek Community Based Learning

Dokumen ini merinci struktur menu aplikasi, mapping ke backend controllers, model, dan frontend routes serta hak akses yang direkomendasikan.

## Ringkasan Top-Level
- Beranda (`/`): feed publik, artikel unggulan. Akses: Public.
- Artikel (`/articles`): list, detail, create, edit, drafts. Akses: Public / Authenticated / Editor.
- Kategori & Tag (`/categories`, `/tags`): manajemen kategori dan tag. Akses: Admin, Editor.
- Media / Uploads (`/uploads`): file manager, avatar. Akses: Authenticated (upload), Admin (manage).
- Komentar (`/comments`): moderasi komentar. Akses: Moderator, Admin.
- Kartu Produk (`/product-cards`): manage product cards. Akses: Admin, Editor.
- Pengguna (`/users`): daftar pengguna, profil, role. Akses: Admin (manage), User (profile).
- Autentikasi (`/auth/*`): login, register, forgot. Akses: Public.
- Admin Dashboard (`/admin`): statistik, audit logs, quick actions. Akses: SuperAdmin, Admin.
- Pengaturan (`/settings`): app settings, storage, email. Akses: Admin.
- API / Developer (`/developer`): API docs, tokens, Postman. Akses: Developer, Admin.
- Testing & CI (`/tests`): test runner, smoke tests. Akses: Developer.
- Dokumentasi (`/docs`): ERD, laporan pengujian. Akses: Public / Tim.

## Detil Menu & Mapping

1) Beranda
   - Frontend route: `/`
   - Backend: lihat controller artikel untuk feed publik: `backend/controllers/articleController.js`
   - Model: `models/article.js`, `models/articleView.js`
   - Akses: Public

2) Artikel
   - Submenu:
     - Daftar Artikel (list, filter, search)
       - Frontend: `/articles`
       - Backend: `backend/controllers/articleController.js` (index, list endpoints)
       - Model: `models/article.js`, `models/articleDetail.js`
       - Akses: Public (listing), Authenticated untuk kontrol lebih lanjut
     - Detail Artikel
       - Frontend: `/articles/:slug` atau `/articles/:id`
       - Backend: show endpoint di `articleController.js`
       - Model: `models/articleView.js` untuk statistik views
       - Akses: Public
     - Buat Artikel / Edit Artikel
       - Frontend: `/articles/new`, `/articles/:id/edit`
       - Backend: create/update endpoints di `articleController.js`
       - Middlewares: `backend/middlewares/authenticate.js`, `backend/middlewares/authorize.js`
       - Akses: Editor, Admin
     - Drafts
       - Frontend: `/articles/drafts`
       - Backend: endpoints yang mengembalikan draft berdasarkan `userId`
       - Akses: Pemilik draft, Editor, Admin
     - Parent/Child Articles
       - DB: migration `migrations/20260422000100-add-parent-article-to-article.js`

3) Kategori & Tag
   - Frontend: `/categories`, `/categories/:id`, `/tags`
   - Backend: `backend/controllers/categoryController.js`
   - Model: `models/categoryTag.js`
   - Akses: Admin, Editor

4) Media / Uploads
   - Frontend: `/media`, upload modal
   - Backend: `backend/controllers/uploadController.js`
   - Storage config: `backend/config/storage.js`
   - Upload folders: `uploads/articles/`, `uploads/avatars/`
   - Akses: Authenticated (upload), Admin (manage)

5) Komentar
   - Frontend: komentar di setiap artikel, moderator panel `/comments`
   - Backend: `backend/controllers/commentController.js`, model `models/comment.js`
   - Fitur: approve/reject, thread replies
   - Akses: Moderator, Admin (moderasi), User (buat komentar)

6) Kartu Produk (Product Card)
   - Frontend: `/product-cards`
   - Backend/Model: `models/productCard.js`, endpoints di `articleController.js` atau controller terpisah
   - Akses: Admin, Editor

7) Pengguna
   - Submenu:
     - Daftar Pengguna: `/admin/users`
     - Profil: `/users/:id` atau `/profile`
     - Role & Permission UI: `/admin/users/:id/roles`
   - Backend: `backend/controllers/userController.js`, model `models/user.js`, `models/userProfile.js`
   - Akses: Admin (manage), User (profile self)

8) Autentikasi & Keamanan
   - Routes frontend: `/auth/login`, `/auth/register`, `/auth/forgot`
   - Backend: `backend/controllers/authController.js`, util `utils/jwt.js`
   - Middleware: `backend/middlewares/authenticate.js`, `backend/middlewares/authorize.js`

9) Admin Dashboard
   - Frontend: `/admin`
   - Fitur: statistik artikel, pengguna aktif, laporan, quick links
   - Audit logs: model `models/auditLog.js`, migration `migrations/20260421000900-create-audit-log.js`
   - Akses: SuperAdmin, Admin

10) Pengaturan Aplikasi
    - Frontend: `/settings`
    - Backend config files: `backend/config/config.js`, `backend/config/env.js`
    - Sub-item: Storage, Email/SMTP, Rate limits (`backend/middlewares/rateLimiter.js`)
    - Akses: Admin

11) API / Developer
    - Frontend: `/developer` atau `/api-docs`
    - Assets: `postman/`, `docs/newman-results/`
    - Akses: Developer, Admin

12) Testing & CI
    - Scripts: `scripts/smoke.js`, `scripts/newmanSetup.js` dan test files di `tests/`
    - Akses: Developer

13) Dokumentasi & Bantuan
    - Lokasi: `docs/`, `README.md`
    - File penting: `docs/ERD.md`, `docs/BAB-IV-Pengujian-Black-Box-dan-UAT.md`
    - Akses: Public / Tim

## Rekomendasi Role & Izin Singkat
- SuperAdmin: semua akses termasuk seeding/migration/audit
- Admin: manajemen konten, pengguna, pengaturan
- Editor: buat/edit/publish artikel
- Moderator: moderasi komentar
- User: profil sendiri, buat komentar, (opsional) buat artikel
- Guest: lihat konten publik

## Saran Implementasi Frontend Menu
- Buat config menu JSON di frontend `src/config/menu.js` dengan struktur:
  - id, title, path, icon, roles, children
- Contoh entry:
  {
    "id": "articles",
    "title": "Artikel",
    "path": "/articles",
    "roles": ["Guest","User","Editor","Admin"],
    "children": [ ... ]
  }

## Langkah Selanjutnya
- Jika Anda mau, saya bisa:
  - Mengekspor versi JSON (`docs/struktur-menu.json`) untuk frontend.
  - Membuat file menu frontend starter `frontend/src/config/menu.js`.
  - Memetakan tiap endpoint secara lebih rinci ke method HTTP dan nama route.

---
Dokumen ini dibuat otomatis oleh asisten; beri tahu saya jika Anda ingin format lain (JSON, CSV, atau langsung scaffolding frontend).
