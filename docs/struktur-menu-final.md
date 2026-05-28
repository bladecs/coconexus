# Struktur Menu — Final

Versi akhir struktur menu aplikasi, menggabungkan pemetaan routes/controllers/models dan peran/izin.

Lihat juga: `docs/struktur-menu.md` (draft), `docs/struktur-menu.json` (config JSON), `docs/struktur-menu-permissions.md` (detail izin).

## Ringkasan
- File menu JSON: `docs/struktur-menu.json` — bisa langsung diimpor ke frontend.
- Izin peran: `docs/struktur-menu-permissions.json` dan `docs/struktur-menu-permissions.md`.

## Panduan Implementasi Singkat

- Frontend
  - Tarik `docs/struktur-menu.json` ke `frontend/src/config/menu.js` atau konversi menjadi module ES.
  - Render menu berdasarkan `roles` di user session; sembunyikan item yang tidak punya role.

- Backend
  - Gunakan `backend/middlewares/authenticate.js` untuk memastikan session/JWT.
  - Implement `authorize` middleware yang memeriksa permissions dari `docs/struktur-menu-permissions.json`.

## Contoh Pengecekan Izin (pseudo)

1. Ambil role user dari token/session.
2. Load permissions map (`struktur-menu-permissions.json`).
3. Periksa apakah role memiliki permission `resource:action`.

Contoh: untuk publish artikel, cek `articles:publish`.

---
Jika Anda ingin, saya bisa langsung membuat `frontend/src/config/menu.js` starter atau contoh middleware `backend/middlewares/rolePermissions.js`.
