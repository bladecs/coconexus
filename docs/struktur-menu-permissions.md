# Peran & Izin — Struktur Menu

Dokumen ini menjabarkan peran (roles) dan izin (permissions) untuk tiap menu/fitur utama aplikasi. Gunakan ini sebagai acuan untuk `authorize` middleware dan UI role checks.

## Definisi Peran
- SuperAdmin: akses penuh termasuk migration, seeding, audit logs.
- Admin: manajemen konten, pengguna, pengaturan aplikasi.
- Editor: membuat, mengedit, menyimpan draft, publish artikel.
- Moderator: moderasi komentar dan laporan.
- Developer: akses API/Developer tools, menjalankan test.
- User: pengguna terdaftar; membuat komentar, mengedit profil, (opsional) submit artikel.
- Guest: pengguna anonim; hanya melihat konten publik.

## Izin Per Menu (ringkas)

- Beranda (`/`)
  - View: Guest, User, Editor, Admin, SuperAdmin

- Artikel (`/articles`)
  - List / View: Guest, User, Editor, Admin
  - Create: User (if allowed), Editor, Admin
  - Edit: Owner (author), Editor, Admin
  - Publish: Editor, Admin
  - Delete: Admin
  - Drafts: Owner, Editor, Admin
  - Controller: `backend/controllers/articleController.js` (GET /articles, GET /articles/:id, POST /articles, PUT /articles/:id, DELETE /articles/:id)

- Kategori & Tag (`/categories`, `/tags`)
  - CRUD: Admin, Editor (create/update limited)
  - Controller: `backend/controllers/categoryController.js` (POST/PUT/DELETE restricted)

- Media / Uploads (`/media`)
  - Upload: Authenticated users (User, Editor, Admin)
  - Manage (delete/move): Admin
  - Controller: `backend/controllers/uploadController.js`

- Komentar (`/comments`)
  - Create: Authenticated users
  - View: Public
  - Moderate (approve/delete): Moderator, Admin
  - Controller: `backend/controllers/commentController.js`

- Kartu Produk (`/product-cards`)
  - CRUD: Editor, Admin
  - Controller/Model: `models/productCard.js`

- Pengguna (`/admin/users`, `/profile`)
  - List/Manage Users: Admin, SuperAdmin
  - Edit Profile: User (self), Admin
  - Role Assignment: SuperAdmin, Admin (restricted)
  - Controller: `backend/controllers/userController.js`

- Autentikasi (`/auth/*`)
  - Register/Login/Password Reset: Guest → Public endpoints in `authController.js`

- Admin Dashboard (`/admin`)
  - Access: Admin, SuperAdmin
  - Audit logs: SuperAdmin, Admin

- Pengaturan (`/settings`)
  - View/Edit config: Admin, SuperAdmin
  - Sensitive actions (DB seed/migration): SuperAdmin

- API / Developer (`/developer`)
  - Access: Developer, Admin

- Testing & CI
  - Run tests/scripts: Developer

- Dokumentasi
  - View: Public

## Contoh Struktur Izin untuk Middleware
JSON minimal untuk digunakan oleh `authorize` middleware:

{
  "roles": {
    "Admin": {
      "can": ["articles:crud","users:manage","settings:edit","media:manage"]
    },
    "Editor": {
      "can": ["articles:create","articles:edit","product-cards:manage"]
    },
    "Moderator": {
      "can": ["comments:moderate"]
    },
    "User": {
      "can": ["comments:create","articles:create:optional","profile:edit"]
    }
  }
}

Gunakan pola `resource:action` untuk izin, mis. `articles:create`, `articles:publish`, `users:manage`.

---
Jika Anda mau, saya bisa:
- Mengekspor file izin ke JSON (`docs/struktur-menu-permissions.json`), atau
- Menambahkan middleware contoh `backend/middlewares/rolePermissions.js` yang mengecek izin berdasarkan role.
