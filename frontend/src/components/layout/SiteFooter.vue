<template>
  <footer class="mt-16 pt-6 border-t border-outline-variant/30">
    <div class="max-w-container-max mx-auto px-6 pb-10 grid grid-cols-1 md:grid-cols-2 gap-10">
      <div>
        <p class="text-xs font-semibold tracking-widest uppercase text-secondary mb-3">COCONEXUS</p>
        <h2 class="font-display text-2xl font-bold text-on-surface leading-tight mb-3">
          Ruang baca untuk ekonomi sirkular kelapa.
        </h2>
        <p class="text-on-surface-variant text-sm leading-relaxed max-w-lg">
          Menghubungkan artikel, dokumentasi praktik, dan diskusi komunitas agar pengetahuan
          limbah kelapa lebih mudah ditemukan, dipelajari, dan diterapkan.
        </p>
      </div>

      <nav class="flex flex-col gap-2 md:justify-center" aria-label="Footer">
        <a href="/#articles"  class="footer-link">Artikel</a>
        <a href="/#categories" class="footer-link">Kategori</a>
        <a href="/#needs"     class="footer-link">Analisis kebutuhan</a>
        <a href="mailto:bladecs86@gmail.com" class="footer-link">Kontak</a>
      </nav>
    </div>
    <div class="border-t border-outline-variant/20 py-4 text-center text-on-surface-variant text-xs">
      © 2024 COCONEXUS — Industrial Diversification Platform
    </div>
  </footer>
</template>

<style scoped>
.footer-link {
  display: inline-flex;
  align-items: center;
  padding: 10px 14px;
  border-radius: 8px;
  background: rgb(var(--color-primary) / 0.06);
  color: rgb(var(--color-primary));
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 150ms ease, transform 150ms ease;
}

.footer-link:hover {
  background: rgb(var(--color-primary) / 0.12);
  transform: translateX(2px);
}
</style>
