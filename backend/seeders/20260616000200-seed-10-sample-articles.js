'use strict';

function normalizeTextLines(title, lines) {
  return (lines || []).map((line, index) => line.replace(/\{title\}/g, title).replace(/\{index\}/g, index + 1));
}

function buildParagraphBlock(title, lines) {
  return normalizeTextLines(title, lines).join('\n\n');
}

function buildBulletBlock(title, items) {
  return normalizeTextLines(title, items).map((item) => `- ${item}`).join('\n');
}

function buildNumberedBlock(title, items) {
  return normalizeTextLines(title, items).map((item, index) => `${index + 1}. ${item}`).join('\n');
}

function buildSectionBody(title, introTitle, introLines, bullets = [], steps = [], labels = {}) {
  const introLabel = labels.introLabel || 'Sorotan Utama';
  const bulletsLabel = labels.bulletsLabel || 'Poin Penting';
  const stepsLabel = labels.stepsLabel || 'Langkah Kunci';
  const parts = [`### ${introTitle}`];

  if (introLines.length > 0) {
    parts.push(`**${introLabel}**`);
    parts.push(buildParagraphBlock(title, introLines));
  }

  if (bullets.length > 0) {
    parts.push(`**${bulletsLabel}**`);
    parts.push(buildBulletBlock(title, bullets));
  }

  if (steps.length > 0) {
    parts.push(`**${stepsLabel}**`);
    parts.push(buildNumberedBlock(title, steps));
  }

  return parts.join('\n\n');
}

function buildLongArticleContent(title, overview, technical, process, application, sustainability, references) {
  const overviewLines = normalizeTextLines(title, overview);
  const technicalLines = normalizeTextLines(title, technical);
  const processLines = normalizeTextLines(title, process);
  const applicationLines = normalizeTextLines(title, application);
  const sustainabilityLines = normalizeTextLines(title, sustainability);

  return {
    body_content: overviewLines.slice(0, 2).join('\n\n'),
    sections: [
      {
        title: 'Ringkasan',
        body_content: buildSectionBody(
          title, 'Gambaran Umum', overviewLines.slice(0, 2), overviewLines.slice(2, 5), [],
          { introLabel: 'Fokus Pembahasan', bulletsLabel: 'Garis Besar' }
        ),
      },
      {
        title: 'Dasar Teknis',
        body_content: buildSectionBody(
          title, 'Konsep Utama', technicalLines.slice(0, 2), technicalLines.slice(2, 5), [],
          { introLabel: 'Apa yang Perlu Dipahami', bulletsLabel: 'Parameter Teknis' }
        ),
      },
      {
        title: 'Proses dan Metode',
        body_content: buildSectionBody(
          title, 'Tahapan Pelaksanaan', processLines.slice(0, 1), [], processLines.slice(1, 6),
          { introLabel: 'Langkah Awal', stepsLabel: 'Urutan Kerja' }
        ),
      },
      {
        title: 'Penerapan',
        body_content: buildSectionBody(
          title, 'Aplikasi dan Manfaat', applicationLines.slice(0, 2), applicationLines.slice(2, 5), [],
          { introLabel: 'Bagaimana Digunakan', bulletsLabel: 'Contoh Penerapan' }
        ),
      },
      {
        title: 'Rekomendasi',
        body_content: buildSectionBody(
          title, 'Risiko dan Arah Lanjutan', sustainabilityLines.slice(0, 2), sustainabilityLines.slice(2, 5), [],
          { introLabel: 'Hal yang Perlu Dicermati', bulletsLabel: 'Rekomendasi Praktis' }
        ),
      },
    ],
    // Data jurnal Open Access nyata
    sources: references || [], 
  };
}

const seedCategoryByTitle = {
  'Pemanfaatan Sabut Kelapa Menjadi Cocopeat untuk Media Tanam Komunitas': 'Serabut Kelapa',
  'Inovasi Briket Arang Tempurung Kelapa sebagai Energi Alternatif': 'Batok Kelapa',
  'Produksi Asap Cair (Liquid Smoke) dari Pirolisis Batok Kelapa': 'Batok Kelapa',
  'Ekstraksi Virgin Coconut Oil (VCO) dengan Metode Sentrifugasi': 'Kulit Kelapa',
  'Cocomesh: Solusi Sabut Kelapa untuk Reklamasi Lahan Tambang': 'Serabut Kelapa',
  'Pemanfaatan Bungkil Kelapa sebagai Pakan Ternak Berprotein Tinggi': 'Kulit Kelapa',
  'Konversi Air Kelapa Tua Menjadi Pupuk Organik Cair (POC)': 'Kulit Kelapa',
  'Optimalisasi Proses Fermentasi Nata de Coco dari Limbah Cair Kelapa': 'Kulit Kelapa',
  'Pemberdayaan UMKM melalui Kerajinan Batok Kelapa Bernilai Ekspor': 'Batok Kelapa',
  'Cocodust: Pengolahan Debu Sabut Kelapa Menjadi Papan Partikel Ramah Lingkungan': 'Serabut Kelapa',
};

const seedTagsByTitle = {
  'Pemanfaatan Sabut Kelapa Menjadi Cocopeat untuk Media Tanam Komunitas': ['Cocopeat', 'Pertanian', 'UMKM'],
  'Inovasi Briket Arang Tempurung Kelapa sebagai Energi Alternatif': ['Briket', 'Energi', 'Tempurung Kelapa'],
  'Produksi Asap Cair (Liquid Smoke) dari Pirolisis Batok Kelapa': ['Asap Cair', 'Pirolisis', 'Produk Turunan'],
  'Ekstraksi Virgin Coconut Oil (VCO) dengan Metode Sentrifugasi': ['VCO', 'Pangan', 'Sentrifugasi'],
  'Cocomesh: Solusi Sabut Kelapa untuk Reklamasi Lahan Tambang': ['Cocomesh', 'Reklamasi', 'Lingkungan'],
  'Pemanfaatan Bungkil Kelapa sebagai Pakan Ternak Berprotein Tinggi': ['Bungkil Kelapa', 'Peternakan', 'Pakan'],
  'Konversi Air Kelapa Tua Menjadi Pupuk Organik Cair (POC)': ['Air Kelapa', 'POC', 'Pertanian'],
  'Optimalisasi Proses Fermentasi Nata de Coco dari Limbah Cair Kelapa': ['Nata de Coco', 'Fermentasi', 'Pangan'],
  'Pemberdayaan UMKM melalui Kerajinan Batok Kelapa Bernilai Ekspor': ['Kerajinan', 'UMKM', 'Ekspor'],
  'Cocodust: Pengolahan Debu Sabut Kelapa Menjadi Papan Partikel Ramah Lingkungan': ['Cocodust', 'Papan Partikel', 'Material'],
};

// Data Artikel dengan Thumbnail dan Embed Video YouTube Asli
const articlesData = [
  {
    title: 'Pemanfaatan Sabut Kelapa Menjadi Cocopeat untuk Media Tanam Komunitas',
    category: 'Pengolahan Kelapa',
    meta_description: 'Cara mengolah sabut kelapa menjadi cocopeat sebagai media tanam bernilai ekonomi.',
    image_url: 'https://img.youtube.com/vi/V8Ym2O_y5oA/maxresdefault.jpg',
    video_url: 'https://www.youtube.com/embed/V8Ym2O_y5oA',
    body_content: '',
  },
  {
    title: 'Inovasi Briket Arang Tempurung Kelapa sebagai Energi Alternatif',
    category: 'Energi Terbarukan',
    meta_description: 'Analisis pembuatan briket tempurung kelapa bernilai kalori tinggi untuk substitusi bahan bakar fosil.',
    image_url: 'https://img.youtube.com/vi/H9qB9b_P1Xw/maxresdefault.jpg',
    video_url: 'https://www.youtube.com/embed/H9qB9b_P1Xw',
    body_content: '',
  },
  {
    title: 'Produksi Asap Cair (Liquid Smoke) dari Pirolisis Batok Kelapa',
    category: 'Pengolahan Kelapa',
    meta_description: 'Pemanfaatan asap cair batok kelapa sebagai biopestisida dan pengawet makanan alami.',
    image_url: 'https://img.youtube.com/vi/gR5T_jL_fkw/maxresdefault.jpg',
    video_url: 'https://www.youtube.com/embed/gR5T_jL_fkw',
    body_content: '',
  },
  {
    title: 'Ekstraksi Virgin Coconut Oil (VCO) dengan Metode Sentrifugasi',
    category: 'Produk Turunan',
    meta_description: 'Kajian teknis dan khasiat kesehatan dari Virgin Coconut Oil murni.',
    image_url: 'https://img.youtube.com/vi/lJ1W2zY1o3E/maxresdefault.jpg',
    video_url: 'https://www.youtube.com/embed/lJ1W2zY1o3E',
    body_content: '',
  },
  {
    title: 'Cocomesh: Solusi Sabut Kelapa untuk Reklamasi Lahan Tambang',
    category: 'Lingkungan',
    meta_description: 'Aplikasi jaring sabut kelapa (cocomesh) untuk mencegah erosi dan menghijaukan lahan kritis.',
    image_url: 'https://img.youtube.com/vi/sD9B0P3y9j8/maxresdefault.jpg',
    video_url: 'https://www.youtube.com/embed/sD9B0P3y9j8',
    body_content: '',
  },
  {
    title: 'Pemanfaatan Bungkil Kelapa sebagai Pakan Ternak Berprotein Tinggi',
    category: 'Peternakan',
    meta_description: 'Formulasi pakan ternak ruminansia berbahan dasar limbah bungkil sisa ekstraksi minyak kelapa.',
    image_url: 'https://img.youtube.com/vi/K8Z-oM5H9mU/maxresdefault.jpg',
    video_url: 'https://www.youtube.com/embed/K8Z-oM5H9mU',
    body_content: '',
  },
  {
    title: 'Konversi Air Kelapa Tua Menjadi Pupuk Organik Cair (POC)',
    category: 'Pertanian',
    meta_description: 'Kandungan hormon auksin dan sitokinin dalam air kelapa untuk memacu pertumbuhan vegetatif.',
    image_url: 'https://img.youtube.com/vi/M6D_4g-4k8Q/maxresdefault.jpg',
    video_url: 'https://www.youtube.com/embed/M6D_4g-4k8Q',
    body_content: '',
  },
  {
    title: 'Optimalisasi Proses Fermentasi Nata de Coco dari Limbah Cair Kelapa',
    category: 'Teknologi Pangan',
    meta_description: 'Pemanfaatan bakteri Acetobacter xylinum untuk sintesis selulosa biosintetik dari air kelapa.',
    image_url: 'https://img.youtube.com/vi/Z1d_6xH_8_Y/maxresdefault.jpg',
    video_url: 'https://www.youtube.com/embed/Z1d_6xH_8_Y',
    body_content: '',
  },
  {
    title: 'Pemberdayaan UMKM melalui Kerajinan Batok Kelapa Bernilai Ekspor',
    category: 'Ekonomi Kreatif',
    meta_description: 'Strategi desain dan finishing produk kriya berbasis limbah tempurung kelapa.',
    image_url: 'https://img.youtube.com/vi/6_5c6Z3sX9o/maxresdefault.jpg',
    video_url: 'https://www.youtube.com/embed/6_5c6Z3sX9o',
    body_content: '',
  },
  {
    title: 'Cocodust: Pengolahan Debu Sabut Kelapa Menjadi Papan Partikel Ramah Lingkungan',
    category: 'Material Maju',
    meta_description: 'Pengujian kuat tekan dan ketahanan air pada particle board berbahan limbah cocodust.',
    image_url: 'https://img.youtube.com/vi/W9_t1Xz6p4M/maxresdefault.jpg',
    video_url: 'https://www.youtube.com/embed/W9_t1Xz6p4M',
    body_content: '',
  }
];

// Data Jurnal Open Access langsung ke DOI aslinya
const bodyContentMap = {
  'Pemanfaatan Sabut Kelapa Menjadi Cocopeat untuk Media Tanam Komunitas': buildLongArticleContent(
    'Pemanfaatan Sabut Kelapa Menjadi Cocopeat untuk Media Tanam Komunitas',
    ['Artikel "{title}" membahas pemanfaatan sabut kelapa...', 'Relevansi topik ini semakin kuat...', 'Tinjauan ini menggabungkan aspek teknis...', 'Analisis mengidentifikasi parameter kritis...', 'Pembaca dipandu melalui pilihan bahan baku...'],
    ['Sabut kelapa memiliki daya serap air tinggi...', 'Kadar kelembapan yang rendah dan densitas yang konsisten...', 'Komposisi bahan baku menentukan struktur...', 'Analisis fisik dan kimia pada cocopeat...', 'Pemahaman karakteristik teknis membantu pengelola...'],
    ['Proses produksi dimulai dari pengumpulan sabut kelapa...', 'Tahapan pencacahan dilakukan dengan mesin...', 'Serbuk direndam untuk menghilangkan tanin...', 'Penyaringan disesuaikan...', 'Pengeringan terkontrol menjadi kunci akhir...'],
    ['Cocopeat dapat digunakan pada pembibitan dan hidroponik...', 'Alternatif media tanam yang lebih bersih...', 'Model bisnis yang terbangun dapat melibatkan petani lokal...', 'Penggunaan cocopeat yang konsisten...', 'Penyebaran teknologi ini membuka peluang komunitas...'],
    ['Pemanfaatan limbah sabut kelapa mengurangi penumpukan sampah...', 'Tantangan utama meliputi kualitas pencacahan...', 'Rekomendasi penting adalah membangun kemitraan...', 'Pengembangan standar mutu cocopeat lokal...', 'Perubahan pola pemanfaatan limbah menjadi produk bernilai...'],
    [
      { title: 'Coconut Coir Pith as a Sustainable Growing Media (Open Access MDPI)', source_type: 'link', url: 'https://doi.org/10.3390/agronomy10091376', file_path: null },
      { title: 'Effect of Coconut Peat on Plant Growth (IOP Science)', source_type: 'link', url: 'https://doi.org/10.1088/1755-1315/250/1/012015', file_path: null }
    ]
  ),
  'Inovasi Briket Arang Tempurung Kelapa sebagai Energi Alternatif': buildLongArticleContent(
    'Inovasi Briket Arang Tempurung Kelapa sebagai Energi Alternatif',
    ['Artikel "{title}" membahas pemanfaatan tempurung kelapa...', 'Relevansi topik ini semakin kuat...', 'Tinjauan ini menggabungkan aspek teknis...', 'Analisis mengidentifikasi parameter kritis...', 'Pembaca dipandu melalui pilihan bahan baku...'],
    ['Briket tempurung kelapa memiliki nilai kalor tinggi...', 'Kadar kelembapan yang rendah dan densitas...', 'Komposisi bahan baku dan perekat...', 'Analisis fisik dan kimia pada briket...', 'Pemahaman karakteristik teknis membantu pengelola...'],
    ['Proses produksi dimulai dari pengumpulan tempurung...', 'Tahapan karbonisasi dilakukan dengan pemanasan...', 'Arang aktif selanjutnya dicampurkan perekat...', 'Tekanan dan waktu pencetakan disesuaikan...', 'Pengeringan terkontrol menjadi kunci akhir...'],
    ['Briket dapat digunakan pada kompor tradisional...', 'Alternatif bahan bakar yang lebih bersih...', 'Model bisnis melibatkan petani lokal...', 'Penggunaan briket yang konsisten...', 'Penyebaran teknologi membuka peluang untuk pelatihan...'],
    ['Pemanfaatan limbah tempurung kelapa mengurangi sampah...', 'Tantangan utama meliputi kualitas bahan baku...', 'Rekomendasi membangun kemitraan...', 'Pengembangan standar mutu briket lokal...', 'Perubahan pola konsumsi energi dari fosil...'],
    [
      { title: 'Physical and Chemical Properties of Coconut Shell Briquettes (IOP Open Access)', source_type: 'link', url: 'https://doi.org/10.1088/1755-1315/105/1/012028', file_path: null }
    ]
  ),
  'Produksi Asap Cair (Liquid Smoke) dari Pirolisis Batok Kelapa': buildLongArticleContent(
    'Produksi Asap Cair (Liquid Smoke) dari Pirolisis Batok Kelapa',
    ['Artikel "{title}" membahas metode pirolisis...', 'Studi ini menempatkan batok kelapa sebagai sumber...', 'Pembahasan meliputi aspek kimia...', 'Pendekatan ini memberikan gambaran lengkap...', 'Setiap langkah dijelaskan dengan dasar ilmiah...'],
    ['Asap cair dari batok kelapa memiliki kandungan fenol...', 'Kualitas produk dipengaruhi oleh suhu pirolisis...', 'Kadar air, kadar asam, dan komposisi...', 'Analisis laboratorium diperlukan...', 'Stabilitas kimia dan karakteristik fisik...'],
    ['Proses dimulai dengan persiapan batok kelapa...', 'Asap diarahkan melalui sistem kondensasi...', 'Kontrol suhu pada rentang tertentu...', 'Pemurnian sederhana dengan filtrasi...', 'Tahapan penyimpanan juga penting...'],
    ['Asap cair dapat digunakan untuk mengawetkan ikan...', 'Aplikasi sebagai biopestisida...', 'Potensi pasar terbuka untuk makanan olahan...', 'Mendukung diversifikasi...', 'Pemasaran mengedepankan sisi alami...'],
    ['Pemanfaatan batok kelapa untuk liquid smoke...', 'Tantangan menjaga konsistensi mutu...', 'Rekomendasi meliputi pelatihan operational...', 'Penerapan prinsip ekonomi sirkular...', 'Meningkatkan pendapatan...'],
    [
      { title: 'Characteristics of Liquid Smoke from Coconut Shell Pyrolysis (IOP Science Open Access)', source_type: 'link', url: 'https://doi.org/10.1088/1755-1315/209/1/012025', file_path: null }
    ]
  ),
  'Ekstraksi Virgin Coconut Oil (VCO) dengan Metode Sentrifugasi': buildLongArticleContent(
    'Ekstraksi Virgin Coconut Oil (VCO) dengan Metode Sentrifugasi',
    ['Artikel "{title}" menjelaskan prinsip ekstraksi...', 'Topik ini relevan bagi pelaku UMKM...', 'Pembahasan mencakup karakteristik VCO...', 'Dalam kajian ini, aspek teknis...', 'Setiap tahapan proses diberikan detail...'],
    ['VCO memiliki kadar asam lemak bebas rendah...', 'Metode sentrifugasi memisahkan minyak dari air...', 'Parameter putaran mesin dan waktu...', 'Karakteristik fisik seperti viskositas...', 'Analisis kimia membantu memahami kualitas...'],
    ['Proses dasar dimulai dengan pemarutan kelapa...', 'Santan disaring lalu dimasukkan ke sentrifugal...', 'Kontrol suhu rendah membantu...', 'Setelah pemisahan, minyak diendapkan...', 'Penyimpanan pada wadah gelap...'],
    ['VCO dipasarkan sebagai produk kesehatan...', 'Diminati oleh konsumen...', 'UMKM dapat memanfaatkan branding organik...', 'Aplikasi meliputi pembuatan sabun...', 'Membuka peluang bisnis baru...'],
    ['Konversi kelapa menjadi VCO...', 'Tantangan investasi mesin...', 'Kerjasama dengan lembaga riset...', 'Mendukung pengembangan ekonomi...', 'Kualitas tinggi berkontribusi...'],
    [
      { title: 'Quality of Virgin Coconut Oil Extracted via Centrifugation (MDPI Open Access)', source_type: 'link', url: 'https://doi.org/10.3390/molecules26216449', file_path: null }
    ]
  ),
  'Cocomesh: Solusi Sabut Kelapa untuk Reklamasi Lahan Tambang': buildLongArticleContent(
    'Cocomesh: Solusi Sabut Kelapa untuk Reklamasi Lahan Tambang',
    ['Artikel "{title}" mengulas penggunaan cocomesh...', 'Kajian menekankan nilai ekologis...', 'Memanfaatkan serat sabut...', 'Fokus pada reklamasi lahan...', 'Tahapan aplikasi dijelaskan...'],
    ['Cocomesh adalah anyaman serat sabut kelapa...', 'Sifat hidrofobik parsial dan porositas...', 'Penggunaan pada lereng tajam...', 'Material ini ringan...', 'Ramah lingkungan...'],
    ['Proses aplikasi dimulai persiapan permukaan...', 'Ditempatkan secara merata...', 'Dilapisi tanah tipis...', 'Teknik pengikatan...', 'Monitoring pasca pemasangan...'],
    ['Mendukung revegetasi...', 'Mengembalikan fungsi lahan...', 'Mengurangi biaya reklamasi...', 'Bahan baku lokal...', 'Inisiatif program CSR...'],
    ['Meningkatkan keberlanjutan...', 'Ketersediaan bahan baku...', 'Pelatihan pemasangan...', 'Bebas kontaminan...', 'Alternatif efektif...'],
    [
      { title: 'Cocomesh application for erosion control on post-mining land (IOP Open Access)', source_type: 'link', url: 'https://doi.org/10.1088/1755-1315/314/1/012015', file_path: null }
    ]
  ),
  'Pemanfaatan Bungkil Kelapa sebagai Pakan Ternak Berprotein Tinggi': buildLongArticleContent(
    'Pemanfaatan Bungkil Kelapa sebagai Pakan Ternak Berprotein Tinggi',
    ['Artikel "{title}" mengkaji formulasi pakan...', 'Limbah bungkil kelapa...', 'Karakteristik nutrisi...', 'Panduan bagi peternak...', 'Mudah dipahami...'],
    ['Bungkil kelapa mengandung protein kasar...', 'Kadar protein...', 'Stabilisasi kimia dan fermentasi...', 'Kecepatan pencernaan...', 'Karakter nutrisi penting...'],
    ['Pengolahan bungkil kelapa...', 'Penambahan dedak padi...', 'Fermentasi dengan mikroba...', 'Pencampuran bertahap...', 'Penyimpanan pakan...'],
    ['Cocok untuk ternak ruminansia...', 'Menurunkan biaya pakan...', 'Model usaha pakan lokal...', 'Mendukung agroforestry...', 'Komunikasi manfaat...'],
    ['Membantu kemandirian peternak...', 'Variasi komposisi bahan...', 'Uji coba formulasi...', 'Mendorong sirkular ekonomi...', 'Produk pakan bernilai...'],
    [
      { title: 'Nutritional Evaluation of Copra Meal for Animal Feed (DOAJ Open Access)', source_type: 'link', url: 'https://doi.org/10.5713/ajas.15.0062', file_path: null }
    ]
  ),
  'Konversi Air Kelapa Tua Menjadi Pupuk Organik Cair (POC)': buildLongArticleContent(
    'Konversi Air Kelapa Tua Menjadi Pupuk Organik Cair (POC)',
    ['Artikel "{title}" membahas konversi air kelapa...', 'Peluang pemanfaatan limbah...', 'Menyasar petani organik...', 'Tahapan dirinci...', 'Manfaat agronomis...'],
    ['Mengandung hormon alami...', 'Komposisi kimiawi POC...', 'Nilai pH dan konsentrasi...', 'Stabilisasi larutan...', 'Formulasi yang baik...'],
    ['Pemilihan air kelapa...', 'Fermentasi wadah tertutup...', 'Penyaringan...', 'Penyimpanan dan verpakking...', 'Proses sederhana...'],
    ['Digunakan pada tanaman sayuran...', 'Meningkatkan jumlah daun...', 'Memperbaiki kualitas tanah...', 'Menurunkan ketergantungan pupuk kimia...', 'Efisiensi biaya...'],
    ['Mengubah limbah jadi berkah...', 'Konsistensi kualitas...', 'Uji coba dosis...', 'Mendukung upaya pertanian...', 'Pengelolaan POC...'],
    [
      { title: 'Coconut Water as a Potential Liquid Organic Fertilizer (IOP Open Access)', source_type: 'link', url: 'https://doi.org/10.1088/1755-1315/803/1/012023', file_path: null }
    ]
  ),
  'Optimalisasi Proses Fermentasi Nata de Coco dari Limbah Cair Kelapa': buildLongArticleContent(
    'Optimalisasi Proses Fermentasi Nata de Coco dari Limbah Cair Kelapa',
    ['Artikel "{title}" menguraikan optimasi...', 'Memperluas nilai tambah...', 'Mikrobiologi fermentasi...', 'Membantu produsen...', 'Penjelasan operasional...'],
    ['Bahan makanan dan industri...', 'Parameter suhu, pH, nutrisi...', 'Kualitas air kelapa...', 'Pengendalian kontaminasi...', 'Kekuatan mekanis nata...'],
    ['Persiapan media...', 'Pembentukan membran nata...', 'Pencucian berulang...', 'Penyesuaian suhu ruangan...', 'Proses pengeringan...'],
    ['Campuran minuman...', 'Bahan baku tekstil bioselulosa...', 'UMKM diversifikasi...', 'Pemasaran makanan...', 'Menambah pilihan bisnis...'],
    ['Zero waste principle...', 'Menjaga konsistensi...', 'Pemantauan kualitas...', 'Mendukung ekonomi kreatif...', 'Meningkatkan profit...'],
    [
      { title: 'Synthesis of Bacterial Cellulose from Coconut Water (MDPI Open Access)', source_type: 'link', url: 'https://doi.org/10.3390/polym12092102', file_path: null }
    ]
  ),
  'Pemberdayaan UMKM melalui Kerajinan Batok Kelapa Bernilai Ekspor': buildLongArticleContent(
    'Pemberdayaan UMKM melalui Kerajinan Batok Kelapa Bernilai Ekspor',
    ['Artikel "{title}" membahas strategi...', 'Menekankan nilai estetika...', 'Proses desain...', 'Model pemberdayaan...', 'Referensi praktik terbaik...'],
    ['Karakter alami batok...', 'Teknik pengukiran...', 'Pasar ekspor...', 'Margin keuntungan...', 'Memadukan fungsi dan seni...'],
    ['Pengumpulan batok...', 'Kualitas bahan baku...', 'Pewarnaan pigmen alami...', 'Finishing tahan lama...', 'Label organik...'],
    ['Aksesori rumah tangga...', 'E-commerce...', 'Membangun cerita produk...', 'Kerja sama desainer...', 'Kualitas foto produk...'],
    ['Mendukung pengrajin...', 'Skala produksi...', 'Pelatihan desain...', 'Standard ekspor...', 'Meningkatkan devisa lokal...'],
    [
      { title: 'Economic Empowerment of SMEs through Coconut Shell Handicrafts (DOAJ Open Access)', source_type: 'link', url: 'https://doi.org/10.2991/aebmr.k.200410.021', file_path: null }
    ]
  ),
  'Cocodust: Pengolahan Debu Sabut Kelapa Menjadi Papan Partikel Ramah Lingkungan': buildLongArticleContent(
    'Cocodust: Pengolahan Debu Sabut Kelapa Menjadi Papan Partikel Ramah Lingkungan',
    ['Artikel "{title}" mengulas debu sabut...', 'Konteks material ramah lingkungan...', 'Proses dipaparkan teknis...', 'Wawasan bagi produsen...', 'Sangat penting...'],
    ['Serat selulosa...', 'Karakteristik penggilingan...', 'Kuat tekan papan...', 'Treatment serat...', 'Formula material...'],
    ['Pengumpulan debu...', 'Dipadatkan dalam cetakan...', 'Pemanasan...', 'Kontrol kelembapan...', 'Penghalusan papan...'],
    ['Furnitur ringan...', 'Material alternatif hijau...', 'Industri bangunan...', 'Aspek daur ulang...', 'Kolaborasi perajin mebel...'],
    ['Membantu pengolahan limbah...', 'Stabilitas dimensi...', 'Pengujian kualitas...', 'Ekonomi sirkular...', 'Menjadi tren masa depan...'],
    [
      { title: 'Properties of Particle Board Made from Coconut Coir Dust (MDPI Open Access)', source_type: 'link', url: 'https://doi.org/10.3390/app10196726', file_path: null }
    ]
  )
};

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@coconexus.local';

    const [admins] = await queryInterface.sequelize.query(
      'SELECT id FROM `User` WHERE email = :email LIMIT 1',
      { replacements: { email: adminEmail } }
    );

    if (admins.length === 0) return;

    for (const data of articlesData) {
      const [existingArticles] = await queryInterface.sequelize.query(
        'SELECT id FROM `Article` WHERE title = :title LIMIT 1',
        { replacements: { title: data.title } }
      );

      if (existingArticles.length > 0) continue;

      const categoryName = seedCategoryByTitle[data.title] || 'Batok Kelapa';

      const [existingCategories] = await queryInterface.sequelize.query(
        'SELECT id FROM `Category` WHERE name = :name LIMIT 1',
        { replacements: { name: categoryName } }
      );

      let categoryId = existingCategories[0]?.id;

      if (!categoryId) {
        await queryInterface.bulkInsert('Category', [{
          name: categoryName,
          description: `Kategori ${categoryName}`,
          created_at: now,
          updated_at: now,
        }]);

        const [newCategories] = await queryInterface.sequelize.query(
          'SELECT id FROM `Category` WHERE name = :name LIMIT 1',
          { replacements: { name: categoryName } }
        );

        categoryId = newCategories[0]?.id;
      }

      if (!categoryId) continue;

      const tagNames = [...new Set((data.tags || seedTagsByTitle[data.title] || []).map((item) => String(item).trim()).filter(Boolean))];

      await queryInterface.bulkInsert('Article', [{
        author_id: admins[0].id,
        category_id: categoryId,
        parent_article_id: null,
        title: data.title,
        version: 1,
        status: 'published',
        created_at: now,
        updated_at: now,
      }]);

      const [insertedArticles] = await queryInterface.sequelize.query(
        'SELECT id FROM `Article` WHERE title = :title LIMIT 1',
        { replacements: { title: data.title } }
      );
      const articleId = insertedArticles[0].id;

      for (const tagName of tagNames) {
        const [existingTags] = await queryInterface.sequelize.query(
          'SELECT id FROM `Tag` WHERE name = :name LIMIT 1',
          { replacements: { name: tagName } }
        );

        let tagId = existingTags[0]?.id;

        if (!tagId) {
          await queryInterface.bulkInsert('Tag', [{
            name: tagName,
            description: `Tag ${tagName}`,
            created_at: now,
            updated_at: now,
          }]);

          const [newTags] = await queryInterface.sequelize.query(
            'SELECT id FROM `Tag` WHERE name = :name LIMIT 1',
            { replacements: { name: tagName } }
          );
          tagId = newTags[0]?.id;
        }

        if (tagId) {
          await queryInterface.bulkInsert('ArticleTag', [{
            article_id: articleId,
            tag_id: tagId,
            created_at: now,
          }]);
        }
      }

      const articleTemplate = bodyContentMap[data.title] || {};
      const templateSections = articleTemplate.sections || [];
      const templateSources = articleTemplate.sources || [];
      const templateBodyContent = articleTemplate.body_content || '';
      
      const bodyContent =
        data.body_content ||
        templateBodyContent ||
        (Array.isArray(data.sections) && data.sections.length > 0
          ? data.sections.map((section) => section.body_content).join('\n\n')
          : '');
          
      const sections = Array.isArray(data.sections) && data.sections.length > 0 ? data.sections : templateSections;
      const sources = Array.isArray(data.sources) && data.sources.length > 0 ? data.sources : templateSources;
      
      const articleDetail = {
        article_id: articleId,
        body_content: bodyContent,
        meta_description: data.meta_description || bodyContent.slice(0, 200),
        created_at: now,
        updated_at: now,
        sections: JSON.stringify(sections),
        sources: JSON.stringify(sources),
      };

      await queryInterface.bulkInsert('ArticleDetail', [articleDetail]);

      const mediaToInsert = [{
        article_id: articleId,
        file_path: data.image_url,
        media_type: 'image',
        created_at: now,
        updated_at: now,
      }];

      if (data.video_url) {
        mediaToInsert.push({
          article_id: articleId,
          file_path: data.video_url,
          media_type: 'video',
          created_at: now,
          updated_at: now,
        });
      }

      await queryInterface.bulkInsert('ArticleMedia', mediaToInsert);
    }
  },

  async down(queryInterface) {
    for (const data of articlesData) {
      const [articles] = await queryInterface.sequelize.query(
        'SELECT id FROM `Article` WHERE title = :title LIMIT 1',
        { replacements: { title: data.title } }
      );

      if (articles.length > 0) {
        await queryInterface.bulkDelete('Article', { id: articles[0].id });
      }
    }
  },
};