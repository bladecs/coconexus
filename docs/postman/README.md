# Pengujian API COCONEXUS dengan Newman

File pada folder ini digunakan untuk menjalankan pengujian API COCONEXUS menggunakan Newman.

## File

- `coconexus-api-newman.collection.json`: koleksi request API Postman/Newman.
- `coconexus-api-newman.environment.json`: environment variable untuk Newman.

## Menyiapkan Database Test

Pastikan MySQL berjalan, lalu jalankan:

```bash
cd backend
node scripts/newmanSetup.js
```

Jika menjalankan secara manual, gunakan environment berikut:

```bash
NODE_ENV=test
JWT_SECRET=test-secret-coconexus
RATE_LIMIT_MAX_REQUESTS=10000
AUTH_RATE_LIMIT_MAX_REQUESTS=10000
```

## Menjalankan Backend Test

Jalankan backend pada port 3001:

```bash
cd backend
set NODE_ENV=test
set PORT=3001
set JWT_SECRET=test-secret-coconexus
set RATE_LIMIT_MAX_REQUESTS=10000
set AUTH_RATE_LIMIT_MAX_REQUESTS=10000
node server.js
```

## Menjalankan Newman

Dari root repository:

```bash
npx newman run docs/postman/coconexus-api-newman.collection.json -e docs/postman/coconexus-api-newman.environment.json --reporters "cli,json" --reporter-json-export docs/newman-results/coconexus-api-newman-result.json
```

Hasil ringkasan tabel tersedia di:

```text
docs/newman-results/tabel-hasil-uji-api-newman.md
```
