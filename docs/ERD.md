# ERD — COCONEXUS

Berikut ERD dalam format Mermaid dan ringkasan entitas/relasi. Simpan file ini jika ingin mengekspor ke PNG/SVG menggunakan tool eksternal.

```mermaid
erDiagram
    USERS {
        INT id PK
        VARCHAR email
        VARCHAR password
        VARCHAR role
        BOOLEAN is_deleted
        DATETIME createdAt
        DATETIME updatedAt
    }
    USER_PROFILES {
        INT id PK
        INT userId FK
        VARCHAR display_name
        TEXT bio
        VARCHAR avatar_path
        DATETIME createdAt
        DATETIME updatedAt
    }
    CATEGORY_TAGS {
        INT id PK
        VARCHAR name
        TEXT description
        DATETIME createdAt
        DATETIME updatedAt
    }
    ARTICLES {
        INT id PK
        INT authorId FK
        VARCHAR title
        VARCHAR slug
        VARCHAR status
        DATETIME publishedAt
        DATETIME createdAt
        DATETIME updatedAt
    }
    ARTICLES_CATEGORY_TAGS {
        INT id PK
        INT articleId FK
        INT categoryTagId FK
        DATETIME createdAt
    }
    ARTICLE_DETAILS {
        INT id PK
        INT articleId FK
        TEXT content
        JSON sections
        JSON sources
        DATETIME createdAt
        DATETIME updatedAt
    }
    ARTICLE_MEDIA {
        INT id PK
        INT articleId FK
        VARCHAR file_path
        VARCHAR mime_type
        VARCHAR role
        DATETIME createdAt
        DATETIME updatedAt
    }
    COMMENTS {
        INT id PK
        INT articleId FK
        INT userId FK
        INT parentId FK
        TEXT body
        BOOLEAN is_deleted
        DATETIME createdAt
        DATETIME updatedAt
    }
    ARTICLE_VIEWS {
        INT id PK
        INT articleId FK
        INT userId FK
        INT count
        DATETIME lastViewedAt
        DATETIME createdAt
        DATETIME updatedAt
    }
    PRODUCT_CARDS {
        INT id PK
        INT articleId FK
        VARCHAR title
        TEXT description
        JSON metadata
        DATETIME createdAt
        DATETIME updatedAt
    }
    AUDIT_LOGS {
        INT id PK
        INT userId FK
        VARCHAR action
        JSON meta
        DATETIME createdAt
    }

    USERS ||--|| USER_PROFILES : has
    USERS ||--o{ ARTICLES : authors
    ARTICLES ||--o{ ARTICLES_CATEGORY_TAGS : links
    CATEGORY_TAGS ||--o{ ARTICLES_CATEGORY_TAGS : links
    ARTICLES ||--|| ARTICLE_DETAILS : has
    ARTICLES ||--o{ ARTICLE_MEDIA : has
    ARTICLES ||--o{ COMMENTS : has
    COMMENTS ||--o{ COMMENTS : replies
    ARTICLES ||--o{ ARTICLE_VIEWS : tracked_by
    USERS ||--o{ COMMENTS : authors
    USERS ||--o{ ARTICLE_VIEWS : viewers
    ARTICLES ||--o{ PRODUCT_CARDS : has
    USERS ||--o{ AUDIT_LOGS : generates
```

**Catatan desain penting**

- Kategori/tags dibuat sebagai entitas `CATEGORY_TAGS` dan dihubungkan ke `ARTICLES` melalui tabel junction `ARTICLES_CATEGORY_TAGS` (many-to-many). Jika sistem hanya butuh satu kategori per artikel, junction dapat dihapus dan gunakan `categoryTagId` di `ARTICLES`.
- `ARTICLE_DETAILS` menyimpan isi lengkap, `ARTICLE_MEDIA` menyimpan file pendukung.
- `COMMENTS` mendukung nested comments melalui `parentId` (FK ke `COMMENTS.id`).
- `ARTICLE_VIEWS` dapat dipakai sebagai per-user view log atau diubah menjadi agregat (hanya `articleId` + `count`).
- `AUDIT_LOGS` menyimpan aktivitas penting; `meta` dapat berisi objek JSON (ip, endpoint, perubahan).

Jika mau, saya bisa:
- Ekspor diagram ke PNG/SVG (butuh tool eksternal);
- Tambahkan DDL SQL migration (Sequelize) untuk tabel-tabel di atas;
- Sesuaikan ERD menjadi versi simplified (no junction) atau versioned (history).
