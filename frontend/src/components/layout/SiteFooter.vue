<template>
  <footer class="site-footer">
    <div>
      <p class="footer-kicker">COCONEXUS</p>
      <h2>Ruang baca untuk ekonomi sirkular kelapa.</h2>
      <p>
        Menghubungkan artikel, dokumentasi praktik, dan diskusi komunitas agar pengetahuan limbah kelapa lebih mudah
        ditemukan, dipelajari, dan diterapkan.
      </p>
    </div>

    <nav class="footer-links" aria-label="Footer">
      <a href="/#articles">Artikel</a>
      <a href="/#categories">Kategori</a>
      <a href="/#needs">Analisis kebutuhan</a>
      <a href="mailto:bladecs86@gmail.com">Kontak</a>
    </nav>
  </footer>
</template>

<style scoped>
.site-footer {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.8fr);
  gap: 42px;
  width: min(1440px, calc(100% - 48px));
  margin: 0 auto;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 52px 0 64px;
  color: #fff7f0;
}

.footer-kicker {
  margin: 0 0 14px;
  color: #ffb083;
  font-size: 0.78rem;
  font-weight: 950;
  letter-spacing: 0.2em;
}

h2 {
  max-width: 620px;
  margin: 0;
  font-size: clamp(2rem, 4vw, 4rem);
  font-weight: 950;
  letter-spacing: 0;
  line-height: 0.98;
}

p:last-child {
  max-width: 640px;
  margin: 22px 0 0;
  color: #d0c3ba;
  line-height: 1.8;
}

.footer-links {
  display: grid;
  align-content: center;
  gap: 12px;
}

.footer-links a {
  border-radius: 8px;
  background: rgba(255, 123, 51, 0.12);
  color: #fff7f0;
  font-weight: 900;
  padding: 15px 18px;
  text-decoration: none;
}

@media (max-width: 760px) {
  .site-footer {
    grid-template-columns: 1fr;
  }
}
</style>
