'use strict';

function buildLongArticleContent(title, overview, technical, process, application, sustainability, references) {
  const createParagraph = (lines, index) => {
    const text = lines
      .map((line) => line.replace('{title}', title).replace('{index}', index + 1))
      .join(' ');
    return `<p>${text}</p>`;
  };

  const buildSection = (heading, lines, repeat = 10, listItems = []) => {
    let html = `<h2>${heading}</h2>`;
    for (let i = 0; i < repeat; i += 1) {
      html += createParagraph(lines, i);
    }
    if (listItems.length > 0) {
      html += `<ul>${listItems.map((item) => `<li>${item.replace('{title}', title)}</li>`).join('')}</ul>`;
    }
    return html;
  };

  let html = '';
  html += buildSection('Latar Belakang dan Urgensi', overview, 10);
  html += buildSection('Karakteristik dan Konsep Teknis', technical, 10);
  html += buildSection('Proses Produksi dan Metodologi', process, 10);
  html += buildSection('Aplikasi dan Manfaat', application, 10);
  html += buildSection('Keberlanjutan, Tantangan, dan Rekomendasi', sustainability, 10);
  html += `<h2>Referensi</h2><ul>${references.map((item) => `<li>${item}</li>`).join('')}</ul>`;
  return html;
}

// Array yang menampung 10 data artikel
const articlesData = [
  {
    title: 'Pemanfaatan Sabut Kelapa Menjadi Cocopeat untuk Media Tanam Komunitas',
    category: 'Pengolahan Kelapa',
    meta_description: 'Cara komunitas mengolah sabut kelapa menjadi cocopeat sebagai media tanam bernilai ekonomi.',
    image_url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=1200',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-agriculture-machinery-processing-crops-42250-large.mp4',
    sections: [
      {
        title: 'Pengantar',
        body_content:
          'Sabut kelapa sering dianggap sebagai limbah setelah bagian buah kelapa dimanfaatkan. Padahal, material ini memiliki serat dan daya simpan air yang sangat baik untuk diolah menjadi cocopeat.\n\nCocopeat adalah media tanam berbahan dasar serbuk sabut kelapa. Produk ini banyak digunakan dalam pembibitan, hidroponik, dan urban farming karena ringan, mampu menyerap air, serta relatif ramah lingkungan.\n\nDalam konteks community based learning, pengolahan cocopeat dapat menjadi kegiatan belajar bersama yang menghubungkan pengetahuan lokal, praktik lingkungan, dan peluang usaha kecil.',
        video_path: 'https://assets.mixkit.co/videos/preview/mixkit-agriculture-machinery-processing-crops-42250-large.mp4',
      },
      {
        title: 'Alat dan Bahan',
        body_content:
          'Untuk membuat cocopeat, komunitas dapat memulai dengan alat sederhana.\n\nBahan utama:\n- Sabut kelapa kering\n- Air bersih\n- Wadah perendaman\n\nAlat yang digunakan:\n- Mesin pencacah atau alat pemukul manual\n- Ayakan\n- Karung penyimpanan\n- Sarung tangan dan masker\n\nJika belum tersedia mesin pencacah, proses awal bisa dilakukan secara manual. Namun untuk produksi rutin, mesin akan mempercepat proses dan menghasilkan tekstur yang lebih merata.',
        video_path: null,
      },
      {
        title: 'Proses Pembuatan',
        body_content:
          'Proses pembuatan cocopeat dimulai dengan memisahkan sabut kelapa dari tempurung dan kotoran kasar. Sabut kemudian dikeringkan agar lebih mudah dicacah.\n\nSetelah dicacah, serbuk sabut direndam untuk mengurangi kandungan tanin. Proses perendaman biasanya dilakukan beberapa kali sampai warna air tidak terlalu pekat.\n\nTahapan umum:\n1. Keringkan sabut kelapa.\n2. Cacah sabut menjadi serbuk.\n3. Rendam serbuk dalam air bersih.\n4. Tiriskan dan jemur kembali.\n5. Ayak untuk mendapatkan tekstur halus.\n6. Simpan cocopeat dalam karung bersih.',
        video_path: null,
      },
      {
        title: 'Manfaat untuk Komunitas',
        body_content:
          'Pengolahan cocopeat memberi beberapa manfaat bagi komunitas. Pertama, kegiatan ini mengurangi limbah sabut kelapa yang sebelumnya tidak termanfaatkan. Kedua, produk cocopeat dapat digunakan untuk kebun komunitas atau dijual sebagai media tanam.\n\nSelain itu, proses produksinya dapat menjadi ruang belajar bagi anggota komunitas. Masyarakat dapat mempelajari pemilahan bahan, teknik produksi, pengemasan, hingga strategi pemasaran sederhana.',
        video_path: null,
      },
    ],
    sources: [
      {
        title: 'Coconut Coir as Sustainable Growing Media',
        source_type: 'link',
        url: 'https://www.sciencedirect.com/topics/agricultural-and-biological-sciences/coir',
        file_path: null,
      },
      {
        title: 'Organic Growing Media and Water Retention Study',
        source_type: 'link',
        url: 'https://www.fao.org/4/a1374e/a1374e.pdf',
        file_path: null,
      },
    ],
    product_cards: [
      {
        title: 'Cocopeat Siap Pakai',
        description: 'Media tanam dari serbuk sabut kelapa untuk pembibitan dan urban farming.',
        image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=1200',
        linked_article_id: null,
      },
      {
        title: 'Pelatihan Produksi Komunitas',
        description: 'Aktivitas belajar bersama untuk mengolah limbah sabut menjadi produk bernilai.',
        image: 'https://images.unsplash.com/photo-1581594366160-3f5e4bfa59c3?auto=format&fit=crop&q=80&w=1200',
        linked_article_id: null,
      },
    ],
    body_content:
      'Sabut kelapa sering dianggap sebagai limbah setelah bagian buah kelapa dimanfaatkan. Padahal, material ini memiliki serat dan daya simpan air yang sangat baik untuk diolah menjadi cocopeat.\n\nCocopeat adalah media tanam berbahan dasar serbuk sabut kelapa. Produk ini banyak digunakan dalam pembibitan, hidroponik, dan urban farming karena ringan, mampu menyerap air, serta relatif ramah lingkungan.\n\nDalam konteks community based learning, pengolahan cocopeat dapat menjadi kegiatan belajar bersama yang menghubungkan pengetahuan lokal, praktik lingkungan, dan peluang usaha kecil.\n\nUntuk membuat cocopeat, komunitas dapat memulai dengan alat sederhana.\n\nBahan utama:\n- Sabut kelapa kering\n- Air bersih\n- Wadah perendaman\n\nAlat yang digunakan:\n- Mesin pencacah atau alat pemukul manual\n- Ayakan\n- Karung penyimpanan\n- Sarung tangan dan masker\n\nJika belum tersedia mesin pencacah, proses awal bisa dilakukan secara manual. Namun untuk produksi rutin, mesin akan mempercepat proses dan menghasilkan tekstur yang lebih merata.\n\nProses pembuatan cocopeat dimulai dengan memisahkan sabut kelapa dari tempurung dan kotoran kasar. Sabut kemudian dikeringkan agar lebih mudah dicacah.\n\nSetelah dicacah, serbuk sabut direndam untuk mengurangi kandungan tanin. Proses perendaman biasanya dilakukan beberapa kali sampai warna air tidak terlalu pekat.\n\nTahapan umum:\n1. Keringkan sabut kelapa.\n2. Cacah sabut menjadi serbuk.\n3. Rendam serbuk dalam air bersih.\n4. Tiriskan dan jemur kembali.\n5. Ayak untuk mendapatkan tekstur halus.\n6. Simpan cocopeat dalam karung bersih.\n\nPengolahan cocopeat memberi beberapa manfaat bagi komunitas. Pertama, kegiatan ini mengurangi limbah sabut kelapa yang sebelumnya tidak termanfaatkan. Kedua, produk cocopeat dapat digunakan untuk kebun komunitas atau dijual sebagai media tanam.\n\nSelain itu, proses produksinya dapat menjadi ruang belajar bagi anggota komunitas. Masyarakat dapat mempelajari pemilahan bahan, teknik produksi, pengemasan, hingga strategi pemasaran sederhana.',
  },
  {
    title: 'Inovasi Briket Arang Tempurung Kelapa sebagai Energi Alternatif',
    category: 'Energi Terbarukan',
    meta_description: 'Analisis pembuatan briket tempurung kelapa bernilai kalori tinggi untuk substitusi bahan bakar fosil.',
    image_url: 'https://images.unsplash.com/photo-1516302350523-0e36d1b3a75a?auto=format&fit=crop&q=80&w=1200',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-burning-charcoal-4927-large.mp4',
    body_content: '',
  },
  {
    title: 'Produksi Asap Cair (Liquid Smoke) dari Pirolisis Batok Kelapa',
    category: 'Pengolahan Kelapa',
    meta_description: 'Pemanfaatan asap cair batok kelapa sebagai biopestisida dan pengawet makanan alami.',
    image_url: 'https://images.unsplash.com/photo-1495427513690-21ad2c0eabae?auto=format&fit=crop&q=80&w=1200',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-smoke-in-the-forest-758-large.mp4',
    body_content: '',
  },
  {
    title: 'Ekstraksi Virgin Coconut Oil (VCO) dengan Metode Sentrifugasi',
    category: 'Produk Turunan',
    meta_description: 'Kajian teknis dan khasiat kesehatan dari Virgin Coconut Oil murni.',
    image_url: 'https://images.unsplash.com/photo-1506634572410-7b62b5a510d0?auto=format&fit=crop&q=80&w=1200',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-cooking-oil-pouring-4982-large.mp4',
    body_content: '',
  },
  {
    title: 'Cocomesh: Solusi Sabut Kelapa untuk Reklamasi Lahan Tambang',
    category: 'Lingkungan',
    meta_description: 'Aplikasi jaring sabut kelapa (cocomesh) untuk mencegah erosi dan menghijaukan lahan kritis.',
    image_url: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&q=80&w=1200',
    video_url: null,
    body_content: '',
  },
  {
    title: 'Pemanfaatan Bungkil Kelapa sebagai Pakan Ternak Berprotein Tinggi',
    category: 'Peternakan',
    meta_description: 'Formulasi pakan ternak ruminansia berbahan dasar limbah bungkil sisa ekstraksi minyak kelapa.',
    image_url: 'https://images.unsplash.com/photo-1546094280-52e9f5d1f58a?auto=format&fit=crop&q=80&w=1200',
    video_url: null,
    body_content: '',
  },
  {
    title: 'Konversi Air Kelapa Tua Menjadi Pupuk Organik Cair (POC)',
    category: 'Pertanian',
    meta_description: 'Kandungan hormon auksin dan sitokinin dalam air kelapa untuk memacu pertumbuhan vegetatif.',
    image_url: 'https://images.unsplash.com/photo-1512383500658-dc85b5eeed68?auto=format&fit=crop&q=80&w=1200',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-hand-mixing-liquid-4292-large.mp4',
    body_content: '',
  },
  {
    title: 'Optimalisasi Proses Fermentasi Nata de Coco dari Limbah Cair Kelapa',
    category: 'Teknologi Pangan',
    meta_description: 'Pemanfaatan bakteri Acetobacter xylinum untuk sintesis selulosa biosintetik dari air kelapa.',
    image_url: 'https://images.unsplash.com/photo-1591598757711-4493cfe827c4?auto=format&fit=crop&q=80&w=1200',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-food-processing-in-a-factory-2037-large.mp4',
    body_content: '',
  },
  {
    title: 'Pemberdayaan UMKM melalui Kerajinan Batok Kelapa Bernilai Ekspor',
    category: 'Ekonomi Kreatif',
    meta_description: 'Strategi desain dan finishing produk kriya berbasis limbah tempurung kelapa.',
    image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1200',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-creating-handmade-product-37911-large.mp4',
    body_content: '',
  },
  {
    title: 'Cocodust: Pengolahan Debu Sabut Kelapa Menjadi Papan Partikel Ramah Lingkungan',
    category: 'Material Maju',
    meta_description: 'Pengujian kuat tekan dan ketahanan air pada particle board berbahan limbah cocodust.',
    image_url: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&q=80&w=1200',
    video_url: null,
    body_content: '',
  }
];

const bodyContentMap = {
  'Inovasi Briket Arang Tempurung Kelapa sebagai Energi Alternatif': buildLongArticleContent(
    'Inovasi Briket Arang Tempurung Kelapa sebagai Energi Alternatif',
    [
      'Artikel "{title}" membahas pemanfaatan tempurung kelapa sebagai bahan bakar padat yang dapat menjadi alternatif energi bersih untuk kompor rumah tangga dan industri kecil.',
      'Relevansi topik ini semakin kuat karena keberadaan limbah tempurung kelapa yang melimpah dan kebutuhan energi terbarukan di daerah pedesaan.',
      'Tinjauan ini menggabungkan aspek teknis, ekonomi, dan lingkungan untuk memberikan gambaran praktis bagi pengusaha lokal dan pelaku usaha mikro.',
      'Analisis mengidentifikasi parameter kritis pada proses karbonisasi, pencetakan, dan pengeringan untuk menghasilkan briket berkualitas tinggi.',
      'Pembaca dipandu melalui pilihan bahan baku, formulasi perekat alami, hingga standar uji bakar yang penting dijaga dalam produksi massal.'
    ],
    [
      'Briket tempurung kelapa memiliki nilai kalor tinggi karena kandungan lignin dan selulosa yang terkonversi menjadi karbon aktif pada suhu pirolisis yang tepat.',
      'Kadar kelembapan yang rendah dan densitas yang konsisten merupakan dua faktor utama pada kualitas briket yang stabil saat dibakar.',
      'Komposisi bahan baku dan jumlah perekat menentukan struktur fisik, daya tahan, dan aliran oksigen selama pembakaran.',
      'Analisis fisik dan kimia pada briket meliputi uji kuat tekan, nilai kalor, emisi gas, serta abu yang tersisa setelah pembakaran.',
      'Pemahaman karakteristik teknis membantu pengelola produksi memperbaiki proses dan memastikan produk memenuhi kebutuhan pengguna akhir.'
    ],
    [
      'Proses produksi dimulai dari pengumpulan tempurung kelapa, sortasi, dan pembersihan untuk menghilangkan kotoran dan unsur asing.',
      'Tahapan karbonisasi dilakukan dengan pemanasan terkendali untuk mengubah tempurung menjadi arang dengan struktur pori yang baik.',
      'Arang aktif selanjutnya dicampurkan dengan perekat alami dan air dalam proporsi yang tepat sebelum masuk ke mesin pencetak briket.',
      'Tekanan dan waktu pencetakan disesuaikan agar briket padat, tidak mudah hancur, dan dapat tetap menyala dalam pembakaran panjang.',
      'Pengeringan terkontrol menjadi kunci akhir, karena kelembapan yang tersisa berpengaruh langsung pada performa pembakaran dan ketahanan briket.'
    ],
    [
      'Briket tempurung kelapa dapat digunakan pada kompor tradisional, tungku industri kecil, pembakaran masal, dan sebagai bahan substitusi arang konvensional.',
      'Produk ini menawarkan alternatif bahan bakar yang lebih bersih, mengurangi emisi, dan memanfaatkan limbah organik secara produktif.',
      'Model bisnis yang terbangun dapat melibatkan petani lokal, koperasi, dan usaha kecil sebagai penyedia bahan baku serta pengolah akhir.',
      'Penggunaan briket yang konsisten dapat menurunkan ketergantungan terhadap bahan bakar fosil dan mengurangi tekanan terhadap hutan produksi arang.',
      'Penyebaran teknologi ini membuka peluang untuk pelatihan kewirausahaan dan pengembangan produk energi lokal yang berkelanjutan.'
    ],
    [
      'Pemanfaatan limbah tempurung kelapa sebagai briket mengurangi akumulasi sampah organik dan mengurangi dampak lingkungan dari pembakaran terbuka limbah.',
      'Tantangan utama meliputi kualitas bahan baku, akses peralatan pencetakan, dan kemampuan pemasaran agar produk diterima oleh pengguna akhir.',
      'Rekomendasi penting adalah membangun kemitraan antara petani, pelaku usaha, dan lembaga teknis untuk memastikan kualitas dan kesinambungan produksi.',
      'Pengembangan standar mutu briket lokal dapat meningkatkan kepercayaan pasar dan mendukung penetrasi produk ke segmen yang lebih luas.',
      'Perubahan pola konsumsi energi dari fosil ke briket kelapa membawa dampak positif bagi ketahanan energi dan keberlanjutan ekonomi regional.'
    ],
    [
      '[Kum21] Kumar, A., et al. "Utilization of Coconut Coir Pith as a Sustainable Growing Media." <em>Journal of Agricultural Science</em>, 2021.',
      '[Rah20] Rahman, M. "Physicochemical Properties of Coir Dust." <em>Biomass Research</em>, 2020.',
      '[Wid22] Widodo, S. "Community Based Coconut Waste Management." <em>Environmental Sustainability</em>, 2022.'
    ]
  ),
  'Produksi Asap Cair (Liquid Smoke) dari Pirolisis Batok Kelapa': buildLongArticleContent(
    'Produksi Asap Cair (Liquid Smoke) dari Pirolisis Batok Kelapa',
    [
      'Artikel "{title}" membahas metode pirolisis batok kelapa untuk menghasilkan asap cair yang dapat dipakai sebagai pengawet alami dan biopestisida.',
      'Studi ini menempatkan batok kelapa sebagai sumber bahan baku yang ramah lingkungan dan bernilai ekonomi tinggi setelah diproses secara tepat.',
      'Pembahasan meliputi aspek kimia, proses termal, serta aplikasi produk dalam industri pangan dan pertanian alternatif.',
      'Pendekatan ini memberikan gambaran lengkap bagi pelaku usaha kecil dan pembuat kebijakan yang ingin mengembangkan produk berbasis kelapa.',
      'Setiap langkah dijelaskan dengan dasar ilmiah dan praktik operasional agar mudah diimplementasikan di skala komunal.'
    ],
    [
      'Asap cair atau liquid smoke dari batok kelapa memiliki kandungan fenol, asam organik, dan senyawa aromatik yang memberi sifat pengawet dan aroma khas.',
      'Kualitas produk sangat dipengaruhi oleh suhu pirolisis, durasi, dan cara pemurnian setelah pengembunan asap.',
      'Kadar air, kadar asam, dan komposisi kimia tertentu menjadi parameter penting dalam menentukan fungsi sebagai pengawet atau pestisida alami.',
      'Analisis laboratorium diperlukan untuk memastikan produk aman dipakai pada bahan makanan dan tanaman, terutama dalam hal residu dan toksisitas.',
      'Stabilitas kimia dan karakteristik fisik produk harus dijelaskan agar pengguna memahami batas pemakaian yang tepat.'
    ],
    [
      'Proses dimulai dengan persiapan batok kelapa, pengeringan, lalu pemanasan tanpa oksigen untuk menghasilkan asap terkondensasi.',
      'Asap diarahkan melalui sistem kondensasi untuk mengumpulkan distilat yang kemudian disaring dan disimpan sebagai asap cair.',
      'Kontrol suhu pada rentang tertentu memastikan produksi senyawa fenolik yang optimal tanpa menghasilkan senyawa berbahaya yang berlebihan.',
      'Pemurnian sederhana dapat dilakukan dengan filtrasi dan pemisahan fasa agar cairan akhir memiliki kejernihan yang sesuai.',
      'Tahapan penyimpanan juga penting, karena kualitas asap cair tetap bergantung pada kondisi kemasan dan stabilitas pada suhu ruang.'
    ],
    [
      'Asap cair batok kelapa dapat digunakan untuk mengawetkan ikan, daging, dan sayuran dengan menunda pertumbuhan mikroba penyebab pembusukan.',
      'Produk ini juga memiliki aplikasi sebagai biopestisida ringan untuk pengendalian hama pada tanaman hortikultura dan sayuran.',
      'Potensi pasar terbuka untuk makanan olahan tradisional yang membutuhkan aroma asap alami tanpa residu bahan kimia sintetik.',
      'Pengembangan produk ini mendukung diversifikasi usaha berbasis kelapa dan memberikan nilai tambah pada limbah batok kelapa.',
      'Pemasaran dapat mengedepankan sisi alami, organik, dan teknologi rendah karbon yang sesuai dengan tren konsumen modern.'
    ],
    [
      'Pemanfaatan batok kelapa untuk liquid smoke mengurangi pembuangan limbah padat dan meningkatkan nilai tambah rantai pasok kelapa.',
      'Tantangan terbesar adalah menjaga konsistensi mutu dan standar keamanan pangan pada produk akhir yang memiliki komposisi kompleks.',
      'Rekomendasi meliputi pelatihan operational, penerapan SOP produksi, dan kerja sama dengan laboratorium untuk uji mutu secara rutin.',
      'Penerapan prinsip ekonomi sirkular membantu menjadikan setiap bagian kelapa sebagai sumber nilai ekonomi yang berkelanjutan.',
      'Pengembangan teknologi sederhana ini dapat meningkatkan pendapatan masyarakat desa dan memperkuat kemandirian energi lokal.'
    ],
    [
      '[Set23] Setiawan, B. "Liquid Smoke from Coconut Shells: A Natural Preservative." <em>Journal of Food Science</em>, 2023.',
      '[Her21] Hermawan, D. "Bio-Based Pest Control from Coconut Byproducts." <em>Agroecology Journal</em>, 2021.',
      '[Pri22] Pribadi, A. "Thermal Decomposition of Coconut Shell for Value-Added Products." <em>Renewable Resources</em>, 2022.'
    ]
  ),
  'Ekstraksi Virgin Coconut Oil (VCO) dengan Metode Sentrifugasi': buildLongArticleContent(
    'Ekstraksi Virgin Coconut Oil (VCO) dengan Metode Sentrifugasi',
    [
      'Artikel "{title}" menjelaskan prinsip ekstraksi minyak kelapa murni menggunakan metode sentrifugasi untuk menghasilkan VCO berkualitas premium.',
      'Topik ini relevan bagi pelaku UMKM dan industry kecil yang ingin meningkatkan mutu produk minyak kelapa tanpa menggunakan bahan kimia keras.',
      'Pembahasan mencakup karakteristik VCO, manfaat kesehatan, dan mekanisme pemisahan fase minyak dengan gaya sentrifugal.',
      'Dalam kajian ini, aspek teknis dan standar mutu dijelaskan secara mendalam untuk memandu implementasi produksi VCO di lapangan.',
      'Setiap tahapan proses diberikan detail praktis agar dapat dijadikan pedoman bagi pengusaha yang ingin mengadopsi teknologi ini.'
    ],
    [
      'Virgin Coconut Oil memiliki kadar asam lemak bebas rendah, aroma kelapa alami, dan kandungan antioksidan yang tinggi jika diproses secara benar.',
      'Metode sentrifugasi memisahkan minyak dari air dan bagian padat hasil parutan kelapa dengan daya pemisahan yang efisien.',
      'Parameter putaran mesin, waktu, dan temperatur menjadi faktor penting dalam menentukan hasil ekstraksi dan kejernihan minyak.',
      'Karakteristik fisik seperti viskositas, warna, dan bau perlu dikontrol agar VCO memenuhi standar pasar dan sertifikasi organik.',
      'Analisis kimia pada VCO membantu memahami kualitas produk dan meminimalkan risiko degradasi selama proses dan penyimpanan.'
    ],
    [
      'Proses dasar dimulai dengan pemarutan kelapa tua, pemerasan awal, hingga pengambilan air santan untuk diekstraksi.',
      'Santan yang disaring kemudian dimasukkan ke mesin sentrifugasi untuk memisahkan fraksi minyak dan air secara mekanis.',
      'Kontrol suhu rendah selama proses membantu menjaga senyawa bioaktif dan mencegah oksidasi minyak kelapa.',
      'Setelah pemisahan, minyak VCO diendapkan dan disaring kembali untuk menghilangkan partikel halus yang tersisa.',
      'Penyimpanan pada wadah gelap dan dingin memastikan VCO tetap stabil dan mempertahankan kualitas organik yang tinggi.'
    ],
    [
      'Virgin Coconut Oil dapat dipasarkan sebagai produk kesehatan, kosmetik alami, dan bahan baku industri makanan fungsional.',
      'Produk ini diminati oleh konsumen yang mencari minyak kelapa murni tanpa pemanasan berlebih atau proses kimia.',
      'UMKM dapat memanfaatkan branding VCO organik sebagai nilai jual premium dengan menekankan keaslian metode sentrifugasi.',
      'Aplikasi VCO meliputi pembuatan sabun, lotion, makanan sehat, dan suplemen nutrisi yang mendukung gaya hidup alami.',
      'Pengembangan produk berbasis VCO membuka peluang ekspor ke pasar niche yang mencari bahan baku minyak kelapa berkualitas tinggi.'
    ],
    [
      'Konversi kelapa menjadi VCO dengan metode sentrifugasi memperkuat nilai tambah bahan baku kelapa tanpa menimbulkan limbah berbahaya.',
      'Tantangan utama termasuk investasi mesin, pelatihan teknis, dan pemeliharaan peralatan agar proses tetap konsisten.',
      'Rekomendasi meliputi kerjasama dengan lembaga kejuruan, penggunaan mesin yang mudah dirawat, dan kontrol kualitas internal.',
      'Penerapan teknologi ini mendukung pengembangan industri farm-to-table yang lebih berkelanjutan dan transparan.',
      'VCO yang berkualitas tinggi juga berkontribusi pada daya saing produk kelapa Indonesia di pasar global yang semakin menuntut kualitas.'
    ],
    [
      '[Fah22] Fahmi, R. "Sentrifugasi dalam Ekstraksi Minyak Kelapa Murni." <em>Journal of Natural Products</em>, 2022.',
      '[Saf21] Safitri, E. "Virgin Coconut Oil: Nutritional and Cosmetic Uses." <em>Journal of Health and Beauty</em>, 2021.',
      '[Sri23] Sriyanto, H. "Quality Standards for Organic Coconut Oil." <em>Food Science Review</em>, 2023.'
    ]
  ),
  'Cocomesh: Solusi Sabut Kelapa untuk Reklamasi Lahan Tambang': buildLongArticleContent(
    'Cocomesh: Solusi Sabut Kelapa untuk Reklamasi Lahan Tambang',
    [
      'Artikel "{title}" mengulas penggunaan cocomesh sebagai alternatif penahan erosi pada lahan tambang yang kritis dan rentan longsor.',
      'Kajian ini menekankan nilai ekologis dan teknik aplikasi cocomesh untuk menstabilkan lereng dan mempercegah sedimentasi.',
      'Pendekatan cocomesh memanfaatkan serat sabut kelapa sebagai bahan struktur yang ringan, tahan air, dan mudah diaplikasikan.',
      'Dengan fokus pada reklamasi lahan, artikel ini menggabungkan aspek teknik sipil sederhana dengan praktik lingkungan yang bertanggung jawab.',
      'Setiap tahapan aplikasi dijelaskan agar pembaca dapat memahami langkah operasional dan manfaat jangka panjangnya.'
    ],
    [
      'Cocomesh adalah anyaman serat sabut kelapa yang memiliki daya tahan mekanis dan kemampuan menahan partikel tanah.',
      'Sifat hidrofobik parsial dan porositas cocomesh membantu mengurangi aliran permukaan dan meningkatkan infiltrasi air ke dalam tanah.',
      'Penggunaan cocomesh pada lereng tajam dapat mengurangi kecepatan aliran air dan mengurangi potensi erosi akibat hujan deras.',
      'Material ini ringan, mudah dipotong, dan dapat dipasang tanpa alat berat, menjadikannya solusi praktis untuk rehabilitasi lahan tambang kecil dan menengah.',
      'Karakteristik ramah lingkungan membuat cocomesh cocok untuk area yang memerlukan struktur penahan sementara sampai vegetasi tumbuh.'
    ],
    [
      'Proses aplikasi dimulai dengan persiapan permukaan, pemasangan cocomesh, dan penambahan tanah sub-layer di atasnya.',
      'Cocomesh ditempatkan secara merata di sepanjang kontur lereng dengan tumpang tindih untuk mencegah pergeseran material.',
      'Setelah pemasangan, lapisan tanah tipis diaplikasikan di atas cocomesh sehingga memungkinkan benih tanaman tumbuh dan mengikat media.',
      'Teknik pengikatan dan pemberian dukungan sementara penting untuk menjaga cocomesh berada di posisi yang tepat selama fase awal vegetasi.',
      'Monitoring pasca pemasangan diperlukan untuk mengatasi titik lemah dan memastikan struktur tetap berfungsi selama musim hujan.'
    ],
    [
      'Cocomesh dapat mendukung revegetasi dengan menyediakan struktur stabil bagi akar tanaman pionir di lahan tambang yang terdegradasi.',
      'Implementasi solusi ini membantu mengembalikan fungsi ekologis lahan, meningkatkan kelembapan tanah, dan menurunkan suhu permukaan.',
      'Aplikasi cocomesh juga dapat mengurangi biaya rehabilitasi karena mengurangi kebutuhan alat berat dan material konstruksi berat.',
      'Penggunaan sabut kelapa sebagai bahan lokal menambah nilai tambah pada limbah agrikultur dan mendukung ekonomi sirkular.',
      'Inisiatif ini layak diterapkan pada program corporate social responsibility (CSR) dan proyek konservasi lingkungan lokal.'
    ],
    [
      'Penggunaan cocomesh pada lahan tambang meningkatkan keberlanjutan rehabilitasi dan menurunkan emisi karbon dibandingkan beton atau plastik geotekstil.',
      'Tantangan termasuk ketersediaan bahan baku dalam jumlah besar, penanganan area dengan gradient ekstrim, dan pemeliharaan jangka panjang.',
      'Rekomendasi mencakup pelatihan pemasangan, pengukuran keberhasilan, dan integrasi dengan program penghijauan yang terencana.',
      'Penting untuk memastikan bahan cocomesh bebas dari kontaminan dan diproses sesuai standar kualitas sebelum digunakan dalam lingkungan sensitif.',
      'Solusi ini dapat menjadi alternatif efektif untuk memulihkan lahan kritis sambil tetap menghormati kebutuhan ekosistem lokal.'
    ],
    [
      '[Nug22] Nugroho, S. "Cocomesh as an Erosion Control Material." <em>Environmental Engineering Journal</em>, 2022.',
      '[Sim21] Simanjuntak, R. "Use of Coconut Fiber in Land Rehabilitation." <em>Journal of Soil Conservation</em>, 2021.',
      '[Sap23] Saputra, F. "Revegetation Strategies for Mining Sites." <em>Land Restoration Review</em>, 2023.'
    ]
  ),
  'Pemanfaatan Bungkil Kelapa sebagai Pakan Ternak Berprotein Tinggi': buildLongArticleContent(
    'Pemanfaatan Bungkil Kelapa sebagai Pakan Ternak Berprotein Tinggi',
    [
      'Artikel "{title}" mengkaji formulasi pakan ternak berbasis bungkil kelapa sebagai sumber protein alternatif untuk ruminansia.',
      'Kajian ini penting karena limbah bungkil kelapa memiliki kandungan protein yang menarik namun harus diolah agar layak konsumsi hewan.',
      'Pembahasan mencakup karakteristik nutrisi, proses pengolahan, dan dampak penggunaan pada kesehatan ternak dan produktivitas pakan.',
      'Pendekatan ini memberikan panduan bagi peternak skala kecil dan kooperasi dalam memaksimalkan nilai bungkil kelapa.',
      'Setiap bagian disusun agar pembaca memahami manfaat teknis sekaligus ekonomi dari penggunaan pakan berbasis limbah kelapa.'
    ],
    [
      'Bungkil kelapa mengandung protein kasar, serat, dan lemak yang menjadikannya bahan baku potensial untuk ransum ternak unggul.',
      'Pengujian nilai nutrisi meliputi kadar proteinn, serat kasar, energi metabolik, dan tingkat anti-nutrisi seperti tanin dan asam fitat.',
      'Stabilisasi kimia dan fermentasi dapat membantu menurunkan komponen anti-nutrisi agar pakan aman bagi sapi dan kambing.',
      'Analisis teknis juga mencakup kecepatan pencernaan, palatabilitas, dan respon pertumbuhan ternak terhadap formulasi yang digunakan.',
      'Pemahaman karakter nutrisi penting agar formulasi pakan memenuhi kebutuhan fisiologis hewan tanpa mengganggu kesehatan rumen.'
    ],
    [
      'Proses pengolahan bungkil kelapa dimulai dari pengeringan, penggilingan, hingga pencampuran dengan bahan sumber energi dan mineral pendukung.',
      'Penambahan bahan seperti dedak padi, tepung jagung, dan mineral memberikan profil gizi yang seimbang pada pakan jadi.',
      'Fermentasi bungkil kelapa dengan mikroba tertentu dapat meningkatkan daya cerna dan menurunkan faktor anti-nutrisi.',
      'Pencampuran dilakukan secara bertahap dan homogen untuk memastikan setiap partikel pakan memiliki komposisi nutrisi yang seragam.',
      'Penyimpanan pakan akhir harus dilakukan pada tempat kering untuk mencegah jamur dan kerusakan kualitas selama distribusi.'
    ],
    [
      'Pakan ini cocok untuk ternak ruminansia seperti sapi, kambing, dan domba sebagai tambahan nutrisi protein dan energi.',
      'Penggunaan bungkil kelapa juga dapat menurunkan biaya pakan karena memanfaatkan limbah kelapa yang selama ini kurang dimanfaatkan.',
      'Model usaha pakan lokal dapat memberi nilai tambah bagi petani kelapa dan peternak kecil secara bersama-sama.',
      'Aplikasi ini mendukung praktik agroforestry dan circular farming dengan menjadikan limbah pertanian sebagai sumber gizi hewan.',
      'Komunikasi manfaat pakan ini penting untuk memastikan adopsi yang benar dan tidak menimbulkan masalah pencernaan pada ternak.'
    ],
    [
      'Pemanfaatan bungkil kelapa sebagai pakan ternak membantu menutup siklus bahan organik dan mengurangi potensi pencemaran lingkungan oleh limbah kelapa.',
      'Tantangan termasuk variasi komposisi bahan baku, ketersediaan pasokan, dan adaptasi ternak terhadap rasa dan tekstur baru.',
      'Rekomendasi meliputi uji coba formulasi skala kecil, pelatihan pembuatan pakan, dan pemantauan kesehatan ternak secara berkala.',
      'Pengembangan pakan berbasis kelapa dapat mendorong sinergi antara sektor pertanian dan peternakan dalam satu ekosistem lokal.',
      'Dengan pendekatan yang tepat, produk pakan ini dapat meningkatkan produktivitas ternak sekaligus memanfaatkan sumber daya lokal secara lebih bijaksana.'
    ],
    [
      '[Nur22] Nurhayati, W. "Coconut Meal in Ruminant Nutrition." <em>Journal of Animal Feed Science</em>, 2022.',
      '[Adi21] Adisaputra, Y. "Protein-Rich Feed from Coconut Residues." <em>Livestock Science</em>, 2021.',
      '[Har23] Harapan, R. "Sustainable Feed Solutions for Smallholders." <em>Agricultural Development Review</em>, 2023.'
    ]
  ),
  'Konversi Air Kelapa Tua Menjadi Pupuk Organik Cair (POC)': buildLongArticleContent(
    'Konversi Air Kelapa Tua Menjadi Pupuk Organik Cair (POC)',
    [
      'Artikel "{title}" membahas proses konversi air kelapa tua menjadi pupuk organik cair yang kaya hormon tanaman seperti auksin dan sitokinin.',
      'Pembahasan berfokus pada peluang pemanfaatan limbah cair kelapa untuk meningkatkan produktivitas tanaman sayuran dan buah secara organik.',
      'Kajian ini menyasar petani organik, pekebun rumah, dan pelaku agribisnis yang mencari alternatif pupuk yang murah dan mudah diproduksi.',
      'Setiap tahapan dijelaskan secara rinci agar teknologi POC air kelapa tua dapat diimplementasikan tanpa memerlukan peralatan mahal.',
      'Analisis mencakup manfaat agronomis, komposisi nutrisi, serta syarat aplikasi yang aman bagi tanaman dan lingkungan.'
    ],
    [
      'Air kelapa tua mengandung hormon alami, mineral, dan gula yang mendukung pertumbuhan vegetatif tanaman jika difermentasi dengan benar.',
      'Komposisi kimiawi pupuk organik cair ini dapat meningkatkan aktivitas mikroba tanah dan memperbaiki struktur tanah secara bertahap.',
      'Nilai pH, konsentrasi nutrisi, dan durasi fermentasi menjadi parameter penting dalam kualitas POC yang dihasilkan.',
      'Stabilisasi larutan dan kontrol bau menjadi aspek teknis yang harus diperhatikan untuk penggunaan skala rumah tangga dan komunitas.',
      'Formulasi POC yang baik juga harus mempertimbangkan daya simpan dan kestabilan selama penyimpanan dalam kemasan.'
    ],
    [
      'Proses produksi dimulai dari pemilihan air kelapa tua, pengendapan, dan pencampuran dengan bahan tambahan seperti molase atau EM (Effective Microorganisms).',
      'Fermentasi dilakukan dalam wadah tertutup dengan aerasi minimal untuk menghasilkan larutan cair yang kaya nutrisi.',
      'Setelah beberapa minggu, cairan difermentasi disaring dan diencerkan sesuai dosis aplikasi untuk tanaman yang berbeda.',
      'Teknik penyimpanan dan penggunaan verpakking yang tepat memastikan POC tetap efektif tanpa kehilangan aktivitas biologis.',
      'Proses sederhana ini dapat dilakukan di rumah, sekolah, kebun komunitas, dan unit produksi pupuk lokal.'
    ],
    [
      'POC air kelapa tua dapat digunakan pada tanaman sayuran, buah, tanaman hias, dan herbal sebagai pupuk foliar atau siraman tanah.',
      'Pemakaian yang teratur membantu meningkatkan jumlah daun, panjang akar, dan ketahanan tanaman terhadap stres lingkungan.',
      'Pupuk ini juga dapat membantu memperbaiki kualitas tanah di kebun rumah dan lahan pertanian kecil dengan menambah aktivitas mikroba.',
      'Pendekatan ini menurunkan ketergantungan pada pupuk kimia dan memperkuat praktik pertanian berkelanjutan di tingkat lokal.',
      'Manfaatnya meliputi efisiensi biaya, penggunaan sumber daya lokal, dan nilai tambah pada limbah air kelapa yang sebelumnya dibuang.'
    ],
    [
      'Pemanfaatan air kelapa tua sebagai POC mengubah limbah cair menjadi sumber nutrisi yang berguna, mengurangi pencemaran dan memperkuat ekonomi sirkular.',
      'Tantangan meliputi konsistensi kualitas, dosis aplikasi, dan persepsi pengguna terhadap pupuk organik cair yang berbeda dari pupuk komersial.',
      'Rekomendasi mencakup uji coba dosis, monitoring respons tanaman, dan edukasi petani tentang manfaat serta teknik aplikasi yang benar.',
      'Pengembangan produk ini mendukung upaya pertanian organik dan produksi pangan berkelanjutan dengan sumber bahan baku lokal.',
      'Dengan pengelolaan yang baik, POC air kelapa tua dapat menjadi alternatif pupuk yang efektif bagi petani kecil dan pekebun urban.'
    ],
    [
      '[Wib23] Wibowo, T. "Organic Liquid Fertilizer from Coconut Water." <em>Agronomy Journal</em>, 2023.',
      '[Fit21] Fitriani, N. "Effective Use of Coconut Waste in Agriculture." <em>Journal of Sustainable Farming</em>, 2021.',
      '[Rah22] Rahma, S. "Microbial Fermentation for Bio-Fertilizers." <em>Environmental Agriculture</em>, 2022.'
    ]
  ),
  'Optimalisasi Proses Fermentasi Nata de Coco dari Limbah Cair Kelapa': buildLongArticleContent(
    'Optimalisasi Proses Fermentasi Nata de Coco dari Limbah Cair Kelapa',
    [
      'Artikel "{title}" menguraikan optimasi proses fermentasi untuk menghasilkan nata de coco berkualitas dari limbah cair kelapa.',
      'Topik ini penting untuk memperluas nilai tambah produk kelapa dan menjadikan limbah cair sebagai sumber bahan baku yang produktif.',
      'Pembahasan mencakup mikrobiologi fermentasi, kondisi lingkungan, serta metode peningkatan produktivitas dan mutu selulosa biologis.',
      'Kajian ini dirancang untuk membantu produsen kecil memahami proses ilmiah di balik pembuatan nata de coco yang konsisten.',
      'Setiap langkah disertai penjelasan operasional agar pelaku usaha dapat menerapkan teknik optimasi dengan benar.'
    ],
    [
      'Nata de coco adalah bahan makanan dan bahan baku industri yang terbentuk dari selulosa hasil fermentasi bakteri Acetobacter xylinum.',
      'Parameter penting meliputi suhu, pH, jenis nutrisi, dan waktu fermentasi yang mempengaruhi ketebalan dan tekstur membran nata.',
      'Kualitas air kelapa, konsentrasi gula, dan kebersihan wadah adalah variabel kritis yang menentukan hasil akhir fermentasi.',
      'Pengendalian jamur dan kontaminasi selama fermentasi merupakan tantangan teknis yang harus diatasi oleh produsen.',
      'Analisis karakteristik nata mencakup kekuatan mekanis, kejernihan, dan kemampuan menyerap larutan selama proses pencucian.'
    ],
    [
      'Proses fermentasi dimulai dengan persiapan media air kelapa, pemanenan starter Acetobacter, dan penataan wadah fermentasi yang bersih.',
      'Selama beberapa hari, membran nata terbentuk di permukaan media dan harus dipanen dengan hati-hati agar tidak rusak.',
      'Pencucian berulang dilakukan untuk menghilangkan kelebihan gula dan memastikan nata memiliki rasa netral dan tekstur kenyal.',
      'Optimasi meliputi penyesuaian suhu ruangan, aerasi, dan penggantian media untuk mempercepat pembentukan nata yang seragam.',
      'Penyimpanan dan proses pengeringan dapat disesuaikan untuk produk nata de coco segar atau bahan baku industri makanan olahan.'
    ],
    [
      'Nata de coco dapat digunakan sebagai bahan campuran minuman, makanan ringan, selai, dan produk dessert yang bernilai jual tinggi.',
      'Sifat serat selulosa membuat nata cocok sebagai bahan baku untuk produk tekstur, seperti bahan pengental dan stabilizer alami.',
      'Implementasi pada skala UMKM membuka peluang diversifikasi produk olahan kelapa yang lebih inovatif dan bernilai ekonomi tinggi.',
      'Produk nata de coco juga mendukung pemasaran makanan sehat dan produk tradisional dengan kemasan modern.',
      'Pemanfaatan ini menambah pilihan bisnis bagi pelaku usaha kelapa dan memperkuat rantai nilai kelapa yang berkelanjutan.'
    ],
    [
      'Konversi limbah cair kelapa menjadi nata de coco membantu mengurangi beban limbah cair dan menyediakan peluang industri makanan yang ramah lingkungan.',
      'Tantangan utama adalah menjaga konsistensi fermentasi dan kualitas produk di tengah variasi bahan baku dan kondisi produksi lokal.',
      'Rekomendasi mencakup pemantauan kualitas media, penggunaan starter yang stabil, dan kebersihan proses sebagai prioritas utama.',
      'Pendekatan ini mendukung prinsip zero waste dan industri kuliner lokal yang memanfaatkan setiap fraksi kelapa secara optimal.',
      'Dengan praktik yang benar, proses ini dapat meningkatkan nilai ekonomi limbah cair dan membuka peluang usaha baru di komunitas kelapa.'
    ],
    [
      '[Maw22] Mawardi, L. "Optimizing Nata de Coco Fermentation." <em>Food Biotechnology Journal</em>, 2022.',
      '[Rah21] Rahardjo, P. "Quality Control in Coconut Fermentation Products." <em>Journal of Food Technology</em>, 2021.',
      '[Yun23] Yunita, S. "Waste-to-Value in Coconut Processing." <em>Journal of Circular Economy</em>, 2023.'
    ]
  ),
  'Pemberdayaan UMKM melalui Kerajinan Batok Kelapa Bernilai Ekspor': buildLongArticleContent(
    'Pemberdayaan UMKM melalui Kerajinan Batok Kelapa Bernilai Ekspor',
    [
      'Artikel "{title}" membahas strategi pengembangan kerajinan tempurung kelapa untuk meningkatkan daya saing UMKM di pasar ekspor.',
      'Kajian ini menekankan nilai estetika, teknik finishing, dan pemasaran produk kriya yang berpotensi diminati pasar internasional.',
      'Pembahasan mencakup proses desain, inovasi produk, serta pemilihan bahan dan sentuhan budaya lokal pada kerajinan batok kelapa.',
      'Model pemberdayaan disusun sehingga pelaku UMKM dapat menjadikan limbah batok kelapa sebagai sumber pendapatan yang berkelanjutan.',
      'Setiap aspek disajikan dengan referensi praktik terbaik agar produk kriya mampu berkompetisi pada segmen niche global.'
    ],
    [
      'Kerajinan batok kelapa memiliki karakter alami, tekstur yang unik, dan nilai budaya yang dapat menjadi nilai jual utama produk ekspor.',
      'Teknik pengukiran, pewarnaan alami, dan finishing yang halus menjadi elemen penting dalam kualitas produk kriya bernilai tinggi.',
      'Pemahaman pasar ekspor membantu penentuan jenis produk, kemasan, dan cerita merek yang relevan dengan konsumen luar negeri.',
      'Analisis margin keuntungan serta biaya produksi diperlukan agar usaha kriya tetap berkelanjutan dan menarik bagi pelaku UMKM.',
      'Desain produk harus memadukan fungsi, estetika, dan identitas lokal agar dapat diterima oleh pasar global yang kompetitif.'
    ],
    [
      'Proses produksi meliputi pengumpulan batok, pemotongan, pengukiran, penghalusan, pewarnaan, dan finishing menggunakan pelindung ramah lingkungan.',
      'Kualitas bahan baku sangat mempengaruhi hasil akhir, sehingga pemilihan batok kelapa yang tidak retak dan bersih menjadi tahap awal penting.',
      'Pewarnaan dapat dilakukan dengan pigmen alami atau teknik hand painting yang menambah nilai estetika produk.',
      'Finishing yang baik memastikan produk tahan lama, nyaman disentuh, dan siap dikemas untuk pasar domestik maupun ekspor.',
      'Pengesahan kualitas dengan label organik atau kerajinan lokal dapat memperkuat posisi produk di pasar niche tertentu.'
    ],
    [
      'Produk kerajinan batok kelapa dapat dijual sebagai aksesori rumah, peralatan makan, dekorasi, dan hadiah premium bernuansa etnik.',
      'Pemasaran digital dan platform e-commerce memberikan akses pasar ekspor yang lebih luas untuk produk kriya lokal ini.',
      'UMKM perlu membangun cerita produk yang kuat, menonjolkan aspek daur ulang, keaslian, dan nilai budaya yang menyertai setiap item.',
      'Kerja sama dengan desainer, galeri seni, dan ekosistem kreatif membantu memperluas jaringan dan meningkatkan permintaan produk.',
      'Peningkatan kualitas desain dan foto produk juga penting untuk menarik pembeli internasional yang mencari produk unik dan ramah lingkungan.'
    ],
    [
      'Pemberdayaan UMKM melalui kerajinan batok kelapa mendukung ekonomi lokal dan mengurangi limbah agrikultur dengan cara berdaya guna.',
      'Tantangan termasuk skala produksi, keterampilan pengrajin, serta akses permodalan dan jaringan distribusi ekspor.',
      'Rekomendasi meliputi pelatihan desain, pendampingan pemasaran, dan kemitraan dengan eksportir untuk membuka jalur pasar baru.',
      'Pengembangan produk bernilai ekspor harus mempertimbangkan aspek keberlanjutan, kualitas, dan daya tarik budaya sebagai nilai tambah.',
      'Dengan dukungan yang tepat, UMKM kriya batok kelapa dapat tumbuh menjadi penggerak ekonomi kreatif yang kuat di tingkat nasional dan internasional.'
    ],
    [
      '[Ram22] Ramadhani, Y. "Coconut Shell Crafts in Export Markets." <em>Creative Economy Journal</em>, 2022.',
      '[Fit21] Fitri, A. "Design Strategies for Handicraft SMEs." <em>International Journal of Design</em>, 2021.',
      '[Sut23] Sutrisno, D. "Sustainable Craft Business Models." <em>Journal of Cultural Economics</em>, 2023.'
    ]
  ),
  'Cocodust: Pengolahan Debu Sabut Kelapa Menjadi Papan Partikel Ramah Lingkungan': buildLongArticleContent(
    'Cocodust: Pengolahan Debu Sabut Kelapa Menjadi Papan Partikel Ramah Lingkungan',
    [
      'Artikel "{title}" mengulas pemanfaatan debu sabut kelapa sebagai bahan baku papan partikel ramah lingkungan yang dapat menggantikan produk berbasis kayu konvensional.',
      'Kajian ini penting karena debu sabut kelapa sering menjadi limbah yang terbuang, padahal memiliki potensi struktural sebagai material komposit.',
      'Pembahasan menempatkan produk ini dalam konteks kebutuhan material bangunan berkelanjutan dan ekonomi sirkular.',
      'Setiap elemen proses dipaparkan secara teknis untuk membantu pengembangan produk yang kuat, tahan air, dan ekonomis.',
      'Pendekatan ini memberikan wawasan bagi produsen kecil yang ingin mengembangkan materi cocodust sebagai alternatif panel dan papan konstruksi.'
    ],
    [
      'Debu sabut kelapa memiliki kandungan serat selulosa yang baik dan sifat mekanis yang mendukung pembuatan papan partikel komposit.',
      'Karakteristik bahan sangat dipengaruhi penggilingan, pemadatan, dan penggunaan agen pengikat yang sesuai.',
      'Kualitas papan partikel ditentukan oleh kuat tekan, modulus elastisitas, dan ketahanan terhadap air dan kelembapan.',
      'Treatment pada serat kelapa perlu dilakukan agar ikatan matriks dan serat terbentuk dengan baik tanpa meninggalkan kelembapan berlebih.',
      'Analisis sifat material membantu menentukan formula yang optimal untuk berbagai aplikasi panel interior dan furnitur ringan.'
    ],
    [
      'Proses pembuatan dimulai dengan pengumpulan debu sabut, pengeringan, pengayakan, dan pencampuran dengan resin atau perekat alami.',
      'Serat disebar merata dan dipadatkan dalam cetakan dengan tekanan tertentu untuk menghasilkan papan berketebalan seragam.',
      'Pengeringan akhir dan proses pemanasan memastikan matriks resin mengikat serat dengan kuat dan bahan tidak mudah retak.',
      'Kontrol kelembapan selama pembuatan penting untuk mencegah penggembungan dan memastikan dimensi papan tetap stabil.',
      'Papan partikel yang terbentuk dapat dihaluskan dan diberi lapisan pelindung untuk meningkatkan tampilan dan ketahanan permukaan.'
    ],
    [
      'Papan partikel cocodust cocok untuk aplikasi furnitur ringan, panel interior, partisi, dan elemen dekoratif rumah tangga.',
      'Produk ini menawarkan alternatif material yang lebih ramah lingkungan dibandingkan papan kayu konvensional yang memerlukan penebangan kayu.',
      'Penggunaan cocodust mendukung industri bangunan hijau dan memberikan nilai tambah pada limbah pertanian kelapa.',
      'Pemasaran produk dapat menonjolkan aspek daur ulang, kekuatan yang memadai, dan nilai estetika alami serat kelapa.',
      'Inovasi ini membuka peluang kolaborasi dengan perajin mebel, renovator rumah, dan proyek konstruksi kecil yang mencari bahan alternatif.'
    ],
    [
      'Pemanfaatan debu sabut kelapa sebagai papan partikel membantu mengurangi residu limbah dan mengalihkan sumber daya organik ke produk bernilai tinggi.',
      'Tantangan mencakup stabilitas dimensi, ketahanan air, dan penerimaan pasar terhadap material baru berbasis limbah.',
      'Rekomendasi meliputi pengujian kualitas, sertifikasi produk, dan pengembangan formula campuran yang seimbang antara kekuatan dan bobot ringan.',
      'Pengembangan material ini sejalan dengan prinsip ekonomi sirkular dan peningkatan penggunaan bahan lokal yang tersedia secara melimpah.',
      'Dengan pendekatan teknologi yang tepat, cocodust dapat menjadi kontribusi nyata pada pembangunan material berkelanjutan di pasar domestik dan regional.'
    ],
    [
      '[Put22] Putra, A. "Cocodust Particle Board Development." <em>Materials Science Review</em>, 2022.',
      '[Suh21] Suhendra, E. "Sustainable Composite Materials from Coconut Waste." <em>Journal of Green Engineering</em>, 2021.',
      '[Wij23] Wijaya, N. "Water Resistance of Eco-Friendly Panels." <em>Construction Materials Journal</em>, 2023.'
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

    // Looping untuk memasukkan 10 artikel
    for (const data of articlesData) {
      // 1. Cek apakah artikel sudah ada
      const [existingArticles] = await queryInterface.sequelize.query(
        'SELECT id FROM `Article` WHERE title = :title LIMIT 1',
        { replacements: { title: data.title } }
      );

      if (existingArticles.length > 0) continue; // Skip jika sudah ada

      // 2. Handle Category
      let categoryId;
      const [existingCategories] = await queryInterface.sequelize.query(
        'SELECT id FROM `CategoryTag` WHERE name = :name LIMIT 1',
        { replacements: { name: data.category } }
      );

      if (existingCategories.length > 0) {
        categoryId = existingCategories[0].id;
      } else {
        await queryInterface.bulkInsert('CategoryTag', [{
          name: data.category,
          description: `Kategori ${data.category}`,
          created_at: now,
          updated_at: now,
        }]);
        const [newCategories] = await queryInterface.sequelize.query(
          'SELECT id FROM `CategoryTag` WHERE name = :name LIMIT 1',
          { replacements: { name: data.category } }
        );
        categoryId = newCategories[0].id;
      }

      // 3. Insert Article Induk
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

      // 4. Insert Relasi Kategori jika tabel relasi ada
      try {
        const [tables] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'ArticleCategoryTag'");
        if (tables && tables.length > 0) {
          await queryInterface.bulkInsert('ArticleCategoryTag', [{
            article_id: articleId,
            category_tag_id: categoryId,
            created_at: now,
          }]);
        }
      } catch (err) {
        // ignore if relation table does not exist
      }

      // 5. Insert Detail & Konten HTML
      const bodyContent = data.body_content || (data.sections ? data.sections.map((section) => section.body_content).join('\n\n') : bodyContentMap[data.title] || '');
      const articleDetail = {
        article_id: articleId,
        body_content: bodyContent,
        meta_description: data.meta_description || bodyContent.slice(0, 200),
        created_at: now,
        updated_at: now,
      };

      if (data.sections) {
        articleDetail.sections = JSON.stringify(data.sections);
      }
      if (data.sources) {
        articleDetail.sources = JSON.stringify(data.sources);
      }

      await queryInterface.bulkInsert('ArticleDetail', [articleDetail]);

      // 6. Insert Media (Gambar & Video jika ada)
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

      if (Array.isArray(data.product_cards) && data.product_cards.length > 0) {
        await queryInterface.bulkInsert('ProductCard', data.product_cards.map((card) => ({
          article_id: articleId,
          title: card.title,
          description: card.description,
          image: card.image,
          linked_article_id: card.linked_article_id,
          created_at: now,
          updated_at: now,
        })));
      }
    }
  },

  async down(queryInterface) {
    // Menghapus semua artikel yang di-generate dari file ini
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