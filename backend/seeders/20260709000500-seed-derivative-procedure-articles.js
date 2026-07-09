'use strict';

/**
 * Seeds one "artikel prosedur" (article_type='prosedur') per derivative
 * product, containing the actual hands-on "how to make it" steps that were
 * deliberately kept OUT of the wawasan/detail articles
 * (20260709000400-seed-derivative-detail-articles.js). Each is linked back to
 * its wawasan article via wawasan_article_id, which ArticleDetailPage.vue
 * surfaces automatically as a "Panduan Praktis Terkait" callout on the
 * wawasan article — so the reading flow is: artikel utama -> pohon turunan
 * card -> artikel wawasan (apa/mengapa) -> artikel prosedur (cara membuat).
 *
 * Every section here is section_type='procedure' and carries its own
 * image_path (a real, verified-working Lorem Picsum photo) — required by the
 * publish-gate in articleController.updateArticleStatus for article_type
 * 'prosedur' (every procedure section must have image_path or video_path).
 */

function pic(slug) {
  return `https://picsum.photos/seed/${slug}/800/450`;
}

function proc(title, steps, imageSeed) {
  return {
    section_type: 'procedure',
    title,
    body_content: steps.map((s, i) => `${i + 1}. ${s}`).join('\n'),
    video_path: null,
    image_path: pic(imageSeed),
  };
}

function tools(materials, toolsList) {
  return {
    section_type: 'tools',
    title: 'Bahan & Alat',
    body_content: 'Berikut daftar bahan dan alat yang diperlukan untuk membuat produk ini.',
    video_path: null,
    image_path: null,
    type_data: {
      items: [
        ...materials.map((name) => ({ name, group: 'bahan', quantity: '', unit: '', note: '' })),
        ...toolsList.map((name) => ({ name, group: 'alat', spec: '', purpose: '' })),
      ],
    },
  };
}

const PROCEDURE_ARTICLES = [
  // ── Batok Kelapa ──
  {
    wawasanTitle: 'Mengenal Briket Arang Tempurung Kelapa',
    productTitle: 'Briket Arang Tempurung',
    title: 'Cara Membuat Briket Arang dari Batok Kelapa',
    difficulty: 'menengah',
    minutes: 480,
    materials: ['Batok kelapa kering', 'Perekat tapioka', 'Air'],
    toolsList: ['Tungku karbonisasi (drum kiln)', 'Alat pencetak briket', 'Oven/alat pengering'],
    safety: 'Gunakan sarung tangan dan masker saat menangani arang panas dan serbuk halus. Pastikan tungku karbonisasi berada di area dengan ventilasi baik.',
    phases: [
      { title: 'Persiapan & Karbonisasi', imageSeed: 'briket-arang-tempurung-tahap-1', steps: [
        'Kumpulkan dan keringkan batok kelapa hingga kadar air rendah.',
        'Masukkan batok ke tungku karbonisasi tertutup, bakar pada suhu 300-500°C dengan oksigen terbatas selama beberapa jam.',
        'Biarkan arang dingin sepenuhnya sebelum dikeluarkan dari tungku.',
      ]},
      { title: 'Pencetakan & Finishing', imageSeed: 'briket-arang-tempurung-tahap-2', steps: [
        'Haluskan arang hasil karbonisasi menjadi serbuk menggunakan penumbuk atau mesin giling.',
        'Campurkan serbuk arang dengan perekat tapioka yang sudah dilarutkan air hingga merata.',
        'Cetak campuran menjadi briket menggunakan alat cetak bertekanan.',
        'Keringkan briket di bawah sinar matahari atau oven hingga kadar air di bawah 8%.',
      ]},
    ],
  },
  {
    wawasanTitle: 'Mengenal Arang Aktif dari Batok Kelapa',
    productTitle: 'Arang Aktif',
    title: 'Proses Produksi Arang Aktif dari Batok Kelapa',
    difficulty: 'lanjutan',
    minutes: 600,
    materials: ['Arang batok kelapa hasil karbonisasi', 'Aktivator (uap panas atau larutan ZnCl2/H3PO4)', 'Air bersih untuk pencucian'],
    toolsList: ['Tungku aktivasi', 'Alat pencuci dan pengering', 'Ayakan bertingkat'],
    safety: 'Aktivator kimia bersifat korosif — gunakan sarung tangan, kacamata pelindung, dan bekerja di area berventilasi.',
    phases: [
      { title: 'Aktivasi Arang', imageSeed: 'arang-aktif-batok-tahap-1', steps: [
        'Siapkan arang batok kelapa hasil karbonisasi awal.',
        'Lakukan aktivasi fisika (uap panas suhu tinggi) atau aktivasi kimia (rendam dalam larutan aktivator) sesuai kapasitas alat.',
        'Panaskan arang teraktivasi pada suhu tinggi dalam tungku aktivasi selama waktu yang ditentukan.',
      ]},
      { title: 'Pencucian & Pengemasan', imageSeed: 'arang-aktif-batok-tahap-2', steps: [
        'Cuci arang aktif berulang kali untuk menghilangkan residu aktivator.',
        'Keringkan arang aktif hingga kadar air stabil.',
        'Ayak arang aktif sesuai ukuran mesh yang dibutuhkan, lalu kemas dalam wadah kedap udara.',
      ]},
    ],
  },
  {
    wawasanTitle: 'Mengenal Asap Cair (Liquid Smoke) dari Batok Kelapa',
    productTitle: 'Asap Cair (Liquid Smoke)',
    title: 'Produksi Asap Cair (Liquid Smoke) dari Batok Kelapa',
    difficulty: 'menengah',
    minutes: 300,
    materials: ['Batok kelapa kering'],
    toolsList: ['Tungku pirolisis', 'Pipa kondensor', 'Wadah penampung', 'Alat penyaring'],
    safety: 'Proses pembakaran menghasilkan panas tinggi dan asap — pastikan sistem kondensor tertutup rapat dan area kerja berventilasi baik.',
    phases: [
      { title: 'Pirolisis & Kondensasi', imageSeed: 'asap-cair-liquid-smoke-tahap-1', steps: [
        'Bakar batok kelapa dalam tungku pirolisis pada suhu terkendali.',
        'Alirkan asap hasil pembakaran melalui pipa kondensor.',
        'Dinginkan dan embunkan asap hingga menjadi cairan yang tertampung.',
      ]},
      { title: 'Penyaringan & Pemurnian', imageSeed: 'asap-cair-liquid-smoke-tahap-2', steps: [
        'Saring cairan untuk memisahkan tar dan endapan kasar.',
        'Diamkan cairan beberapa hari agar tar mengendap sempurna.',
        'Lakukan pemurnian bertahap (redistilasi) sesuai grade penggunaan (pangan atau non-pangan).',
      ]},
    ],
  },
  {
    wawasanTitle: 'Mengenal Tepung Tempurung Kelapa',
    productTitle: 'Tepung Tempurung Kelapa',
    title: 'Cara Mengolah Batok Kelapa Menjadi Tepung Tempurung',
    difficulty: 'pemula',
    minutes: 180,
    materials: ['Batok kelapa kering'],
    toolsList: ['Mesin crusher atau hammer mill', 'Ayakan mesh bertingkat', 'Alat pengemas'],
    safety: 'Gunakan masker saat penggilingan karena debu halus tempurung dapat terhirup.',
    phases: [
      { title: 'Pencacahan & Penggilingan', imageSeed: 'tepung-tempurung-kelapa-tahap-1', steps: [
        'Keringkan batok kelapa hingga benar-benar kering.',
        'Cacah batok menjadi potongan kasar.',
        'Giling potongan kasar dengan hammer mill hingga halus.',
      ]},
      { title: 'Pengayakan & Pengemasan', imageSeed: 'tepung-tempurung-kelapa-tahap-2', steps: [
        'Ayak hasil gilingan sesuai ukuran partikel yang diinginkan.',
        'Pisahkan tepung kasar dan halus sesuai peruntukan (komposit atau media tanam).',
        'Kemas tepung tempurung dalam wadah kedap udara.',
      ]},
    ],
  },
  {
    wawasanTitle: 'Mengenal Media Tanam dari Serbuk Tempurung Kelapa',
    productTitle: 'Media Tanam Serbuk Tempurung',
    title: 'Formulasi Media Tanam dari Serbuk Tempurung Kelapa',
    difficulty: 'pemula',
    minutes: 240,
    materials: ['Serbuk tempurung halus', 'Kompos atau pupuk kandang', 'Sekam bakar'],
    toolsList: ['Wadah pencampur', 'Ayakan'],
    safety: 'Gunakan sarung tangan saat mencampur bahan organik untuk menghindari iritasi kulit.',
    phases: [
      { title: 'Pencampuran Bahan', imageSeed: 'media-tanam-tempurung-tahap-1', steps: [
        'Siapkan serbuk tempurung yang sudah halus dan kering.',
        'Campurkan serbuk tempurung dengan kompos dan sekam bakar sesuai rasio yang diinginkan.',
      ]},
      { title: 'Fermentasi & Pengayakan Akhir', imageSeed: 'media-tanam-tempurung-tahap-2', steps: [
        'Fermentasikan campuran secara singkat agar lebih stabil.',
        'Ayak campuran untuk memastikan tekstur seragam.',
        'Kemas media tanam siap pakai.',
      ]},
    ],
  },
  {
    wawasanTitle: 'Mengenal Kerajinan Tangan dari Batok Kelapa',
    productTitle: 'Kerajinan Batok Kelapa',
    title: 'Proses Pembuatan Kerajinan dari Batok Kelapa',
    difficulty: 'menengah',
    minutes: 360,
    materials: ['Batok kelapa utuh yang tua dan kering', 'Pernis atau minyak finishing'],
    toolsList: ['Gergaji atau alat pemotong', 'Amplas berbagai tingkat kehalusan', 'Alat ukir'],
    safety: 'Gunakan pelindung mata saat memotong dan mengukir batok agar terhindar dari serpihan.',
    phases: [
      { title: 'Pemotongan & Pengamplasan', imageSeed: 'kerajinan-batok-kelapa-tahap-1', steps: [
        'Pilih batok kelapa yang tua, kering, dan bebas retak.',
        'Potong batok sesuai desain produk yang diinginkan.',
        'Amplas permukaan hingga halus.',
      ]},
      { title: 'Pengukiran & Finishing', imageSeed: 'kerajinan-batok-kelapa-tahap-2', steps: [
        'Ukir atau bentuk motif sesuai desain.',
        'Lakukan finishing dengan pernis atau minyak alami agar tahan lama.',
        'Keringkan hasil finishing sebelum dikemas.',
      ]},
    ],
  },

  // ── Serabut Kelapa ──
  {
    wawasanTitle: 'Mengenal Cocofiber (Serat Tali) dari Sabut Kelapa',
    productTitle: 'Cocofiber (Tali Serat)',
    title: 'Cara Mengolah Sabut Kelapa Menjadi Cocofiber (Serat Tali)',
    difficulty: 'menengah',
    minutes: 300,
    materials: ['Sabut kelapa basah'],
    toolsList: ['Mesin defiberizer (pemisah serat)', 'Alat pemintal', 'Alat penggulung'],
    safety: 'Jauhkan tangan dari bagian berputar mesin defiberizer saat beroperasi.',
    phases: [
      { title: 'Pemisahan Serat', imageSeed: 'cocofiber-tali-serat-tahap-1', steps: [
        'Rendam sabut kelapa untuk melunakkan jaringan gabusnya.',
        'Pisahkan serat dengan mesin defiberizer.',
        'Cuci dan keringkan serat yang telah dipisahkan.',
      ]},
      { title: 'Pemintalan', imageSeed: 'cocofiber-tali-serat-tahap-2', steps: [
        'Pintal serat kering menjadi tali atau benang.',
        'Gulung hasil pintalan sesuai ukuran jual.',
      ]},
    ],
  },
  {
    wawasanTitle: 'Mengenal Cocomesh untuk Reklamasi Lahan',
    productTitle: 'Cocomesh (Jaring Reklamasi Lahan)',
    title: 'Produksi Cocomesh untuk Reklamasi Lahan Kritis',
    difficulty: 'menengah',
    minutes: 240,
    materials: ['Serat sabut kasar', 'Benang penguat alami'],
    toolsList: ['Mesin tenun/anyam jaring'],
    safety: 'Perhatikan posisi tangan saat mengoperasikan mesin tenun agar terhindar dari terjepit.',
    phases: [
      { title: 'Penganyaman', imageSeed: 'cocomesh-reklamasi-lahan-tahap-1', steps: [
        'Pilah serat kasar yang cukup panjang untuk dianyam.',
        'Anyam serat menjadi jaring menggunakan mesin tenun.',
      ]},
      { title: 'Finishing & Pengujian', imageSeed: 'cocomesh-reklamasi-lahan-tahap-2', steps: [
        'Potong hasil anyaman sesuai ukuran gulungan standar.',
        'Uji kekuatan anyaman sebelum didistribusikan.',
        'Kemas dalam gulungan siap pasang di lokasi reklamasi.',
      ]},
    ],
  },
  {
    wawasanTitle: 'Mengenal Cocopeat sebagai Media Tanam',
    productTitle: 'Cocopeat (Media Tanam)',
    title: 'Cara Membuat Cocopeat dari Sabut Kelapa',
    difficulty: 'pemula',
    minutes: 300,
    materials: ['Sabut kelapa kering', 'Air bersih untuk pencucian'],
    toolsList: ['Mesin penghancur/crusher', 'Ayakan'],
    safety: 'Gunakan masker saat penghancuran karena debu sabut dapat terhirup.',
    phases: [
      { title: 'Penghancuran', imageSeed: 'cocopeat-media-tanam-tahap-1', steps: [
        'Cacah sabut kelapa menjadi potongan kasar.',
        'Hancurkan potongan kasar menjadi serbuk halus (cocopeat).',
      ]},
      { title: 'Pencucian & Pengeringan', imageSeed: 'cocopeat-media-tanam-tahap-2', steps: [
        'Cuci serbuk berulang kali untuk menurunkan kadar tanin dan garam.',
        'Jemur atau keringkan cocopeat hingga kadar air rendah.',
        'Ayak dan kemas cocopeat siap pakai.',
      ]},
    ],
  },
  {
    wawasanTitle: 'Mengenal Cocodust dan Pemanfaatannya',
    productTitle: 'Cocodust',
    title: 'Pengolahan Debu Sabut Kelapa (Cocodust) Menjadi Bahan Baku Papan Partikel',
    difficulty: 'menengah',
    minutes: 300,
    materials: ['Debu sisa penggilingan sabut', 'Perekat resin'],
    toolsList: ['Mesin press panas'],
    safety: 'Gunakan sarung tangan tahan panas saat mengoperasikan mesin press.',
    phases: [
      { title: 'Persiapan Debu', imageSeed: 'cocodust-papan-partikel-tahap-1', steps: [
        'Kumpulkan debu sisa hasil penggilingan sabut kelapa.',
        'Keringkan debu hingga kadar air rendah.',
      ]},
      { title: 'Pengepresan', imageSeed: 'cocodust-papan-partikel-tahap-2', steps: [
        'Campurkan debu dengan perekat resin secara merata.',
        'Cetak dan pres campuran dengan mesin press panas.',
        'Potong lembaran papan sesuai ukuran standar.',
      ]},
    ],
  },
  {
    wawasanTitle: 'Mengenal Papan Komposit dari Serat Kelapa',
    productTitle: 'Papan Komposit Serat Kelapa',
    title: 'Cara Membuat Papan Komposit dari Serat Sabut Kelapa',
    difficulty: 'menengah',
    minutes: 300,
    materials: ['Serat sabut kasar', 'Perekat alami atau resin'],
    toolsList: ['Cetakan papan', 'Mesin press'],
    safety: 'Pastikan area kerja berventilasi baik saat menggunakan perekat resin.',
    phases: [
      { title: 'Persiapan Serat', imageSeed: 'papan-komposit-serat-tahap-1', steps: [
        'Sortir serat sesuai panjang dan ketebalan.',
        'Campurkan serat dengan perekat secara merata.',
      ]},
      { title: 'Pencetakan & Finishing', imageSeed: 'papan-komposit-serat-tahap-2', steps: [
        'Cetak campuran serat dalam cetakan papan.',
        'Pres campuran dengan tekanan dan suhu tinggi.',
        'Dinginkan dan rapikan tepi papan hasil cetakan.',
      ]},
    ],
  },
  {
    wawasanTitle: 'Mengenal Matras dan Jok dari Sabut Kelapa',
    productTitle: 'Matras Sabut Kelapa',
    title: 'Proses Produksi Matras dan Jok dari Sabut Kelapa',
    difficulty: 'lanjutan',
    minutes: 360,
    materials: ['Serat sabut kasar bertekstur pegas', 'Lateks alami'],
    toolsList: ['Cetakan matras', 'Oven vulkanisasi'],
    safety: 'Gunakan sarung tangan saat menangani lateks dan pastikan ventilasi baik selama proses vulkanisasi.',
    phases: [
      { title: 'Pencelupan Serat', imageSeed: 'matras-sabut-kelapa-tahap-1', steps: [
        'Pilih serat kasar dengan tekstur pegas yang baik.',
        'Celupkan serat ke dalam lateks alami secara merata.',
      ]},
      { title: 'Pencetakan & Vulkanisasi', imageSeed: 'matras-sabut-kelapa-tahap-2', steps: [
        'Cetak serat berlapis lateks sesuai ukuran matras atau jok.',
        'Vulkanisasi hasil cetakan dengan panas untuk mengeraskan lateks.',
        'Keringkan dan kemas produk akhir.',
      ]},
    ],
  },

  // ── Kulit Kelapa ──
  {
    wawasanTitle: 'Mengenal Virgin Coconut Oil (VCO)',
    productTitle: 'Virgin Coconut Oil (VCO)',
    title: 'Cara Membuat Virgin Coconut Oil (VCO) dari Sisa Daging Kelapa',
    difficulty: 'menengah',
    minutes: 240,
    materials: ['Sisa daging kelapa parut/santan'],
    toolsList: ['Mesin sentrifugal atau starter fermentasi', 'Wadah penampung kedap cahaya'],
    safety: 'Jaga kebersihan alat dan wadah agar minyak tidak terkontaminasi selama proses.',
    phases: [
      { title: 'Ekstraksi Santan', imageSeed: 'vco-virgin-coconut-oil-tahap-1', steps: [
        'Peras santan dari sisa daging kelapa.',
        'Diamkan santan hingga krim terpisah dari air.',
      ]},
      { title: 'Pemisahan & Pengemasan Minyak', imageSeed: 'vco-virgin-coconut-oil-tahap-2', steps: [
        'Pisahkan minyak dari krim dengan sentrifugasi atau fermentasi alami.',
        'Saring minyak hingga benar-benar murni.',
        'Kemas minyak pada wadah kedap cahaya.',
      ]},
    ],
  },
  {
    wawasanTitle: 'Mengenal Pewarna Alami dari Kulit Kelapa',
    productTitle: 'Pewarna Alami Kulit Kelapa',
    title: 'Ekstraksi Pewarna Alami dari Kulit Kelapa',
    difficulty: 'pemula',
    minutes: 180,
    materials: ['Kulit/testa kelapa', 'Air panas'],
    toolsList: ['Kain saring', 'Wadah perebusan'],
    safety: 'Hati-hati saat menangani air panas selama proses perebusan.',
    phases: [
      { title: 'Perebusan', imageSeed: 'pewarna-alami-kulit-kelapa-tahap-1', steps: [
        'Kumpulkan dan cacah kulit kelapa.',
        'Rebus kulit kelapa dalam air panas untuk mengekstrak pigmen.',
      ]},
      { title: 'Penyaringan & Pemekatan', imageSeed: 'pewarna-alami-kulit-kelapa-tahap-2', steps: [
        'Saring larutan pewarna dari ampas.',
        'Pekatkan larutan dengan pemanasan lanjutan.',
        'Kemas pewarna dalam bentuk cair atau pasta.',
      ]},
    ],
  },
  {
    wawasanTitle: 'Mengenal Pupuk Organik Cair dari Limbah Kelapa',
    productTitle: 'Pupuk Organik Cair',
    title: 'Cara Membuat Pupuk Organik Cair dari Limbah Kelapa',
    difficulty: 'pemula',
    minutes: 20160,
    materials: ['Air kelapa/residu santan', 'EM4 atau starter fermentasi', 'Molase atau gula'],
    toolsList: ['Wadah fermentasi tertutup'],
    safety: 'Buka wadah fermentasi secara berkala untuk melepas tekanan gas dan hindari area tertutup rapat tanpa ventilasi.',
    phases: [
      { title: 'Fermentasi', imageSeed: 'pupuk-organik-cair-tahap-1', steps: [
        'Kumpulkan limbah cair kelapa.',
        'Campurkan dengan starter fermentasi dan molase.',
        'Fermentasikan secara anaerob dalam wadah tertutup selama 1-2 minggu.',
      ]},
      { title: 'Penyaringan & Aplikasi', imageSeed: 'pupuk-organik-cair-tahap-2', steps: [
        'Saring hasil fermentasi.',
        'Encerkan pupuk sebelum diaplikasikan ke tanaman.',
      ]},
    ],
  },
  {
    wawasanTitle: 'Mengenal Kompos dari Kulit dan Ampas Kelapa',
    productTitle: 'Kompos Kulit Kelapa',
    title: 'Proses Pengomposan Kulit dan Ampas Kelapa',
    difficulty: 'pemula',
    minutes: 30240,
    materials: ['Ampas dan kulit kelapa', 'Bahan hijau (sisa sayuran)', 'Aktivator kompos'],
    toolsList: ['Bak pengomposan'],
    safety: 'Gunakan sarung tangan saat membalik tumpukan kompos untuk menghindari kontak langsung dengan mikroorganisme.',
    phases: [
      { title: 'Pencampuran', imageSeed: 'kompos-kulit-kelapa-tahap-1', steps: [
        'Cacah ampas dan kulit kelapa.',
        'Campurkan dengan bahan hijau untuk menyeimbangkan rasio C/N.',
        'Tambahkan aktivator kompos.',
      ]},
      { title: 'Pematangan', imageSeed: 'kompos-kulit-kelapa-tahap-2', steps: [
        'Balik tumpukan kompos secara berkala.',
        'Panen kompos setelah matang dan siap digunakan.',
      ]},
    ],
  },
  {
    wawasanTitle: 'Mengenal Pakan Ternak dari Bungkil Kelapa',
    productTitle: 'Pakan Ternak Bungkil Kelapa',
    title: 'Cara Mengolah Bungkil Kelapa Menjadi Pakan Ternak',
    difficulty: 'pemula',
    minutes: 240,
    materials: ['Bungkil sisa ekstraksi minyak', 'Bahan campuran pakan tambahan'],
    toolsList: ['Mesin pengering', 'Mesin penggiling'],
    safety: 'Gunakan masker saat penggilingan bungkil kering untuk menghindari debu terhirup.',
    phases: [
      { title: 'Pengeringan & Penggilingan', imageSeed: 'pakan-ternak-bungkil-kelapa-tahap-1', steps: [
        'Kumpulkan bungkil sisa ekstraksi minyak kelapa.',
        'Keringkan bungkil hingga kadar air rendah.',
        'Giling bungkil menjadi tepung.',
      ]},
      { title: 'Pencampuran & Pengemasan', imageSeed: 'pakan-ternak-bungkil-kelapa-tahap-2', steps: [
        'Campurkan tepung bungkil dengan bahan pakan lain sesuai formulasi.',
        'Kemas pakan jadi siap distribusi.',
      ]},
    ],
  },
  {
    wawasanTitle: 'Mengenal Biomassa Briket dari Ampas Kelapa',
    productTitle: 'Biomassa Briket Kulit Kelapa',
    title: 'Produksi Briket Biomassa dari Ampas Kulit Kelapa',
    difficulty: 'pemula',
    minutes: 300,
    materials: ['Ampas kelapa kering', 'Perekat alami secukupnya'],
    toolsList: ['Mesin pencacah', 'Alat pencetak briket bertekanan'],
    safety: 'Gunakan sarung tangan saat mengoperasikan alat pencetak bertekanan tinggi.',
    phases: [
      { title: 'Pengeringan & Pencacahan', imageSeed: 'biomassa-briket-kulit-tahap-1', steps: [
        'Keringkan ampas kelapa hingga kadar air rendah.',
        'Cacah dan haluskan ampas kering.',
      ]},
      { title: 'Pencetakan', imageSeed: 'biomassa-briket-kulit-tahap-2', steps: [
        'Campurkan dengan sedikit perekat alami.',
        'Cetak briket dengan tekanan tinggi.',
        'Jemur briket sebelum dikemas.',
      ]},
    ],
  },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const [authors] = await queryInterface.sequelize.query(
      `
      SELECT id FROM \`User\`
      WHERE email IN (:emails)
      ORDER BY FIELD(email, :preferredEmail, :fallbackEmail)
      LIMIT 1
      `,
      {
        replacements: {
          emails: ['pengelola@coconexus.local', 'pengelola.editor@coconexus.local'],
          preferredEmail: 'pengelola@coconexus.local',
          fallbackEmail: 'pengelola.editor@coconexus.local',
        },
      }
    );

    if (authors.length === 0) return;
    const authorId = authors[0].id;

    for (const item of PROCEDURE_ARTICLES) {
      const [existingArticles] = await queryInterface.sequelize.query(
        'SELECT id FROM `Article` WHERE title = :title LIMIT 1',
        { replacements: { title: item.title } }
      );

      if (existingArticles.length > 0) continue;

      const [wawasanArticles] = await queryInterface.sequelize.query(
        'SELECT id, category_id FROM `Article` WHERE title = :title LIMIT 1',
        { replacements: { title: item.wawasanTitle } }
      );

      if (wawasanArticles.length === 0) continue;
      const wawasanArticle = wawasanArticles[0];

      await queryInterface.bulkInsert('Article', [
        {
          author_id: authorId,
          category_id: wawasanArticle.category_id,
          parent_article_id: null,
          article_type: 'prosedur',
          wawasan_article_id: wawasanArticle.id,
          is_home_featured: false,
          title: item.title,
          version: 1,
          status: 'published',
          created_at: now,
          updated_at: now,
        },
      ]);

      const [insertedArticles] = await queryInterface.sequelize.query(
        'SELECT id FROM `Article` WHERE title = :title LIMIT 1',
        { replacements: { title: item.title } }
      );
      const articleId = insertedArticles[0].id;

      const toolsSection = tools(item.materials, item.toolsList);
      const procedureSections = item.phases.map((phase) => proc(phase.title, phase.steps, phase.imageSeed));
      const sections = [toolsSection, ...procedureSections];
      const bodyContent = sections.map((s) => s.body_content).join('\n\n');

      await queryInterface.bulkInsert('ArticleDetail', [
        {
          article_id: articleId,
          body_content: bodyContent,
          meta_description: `Panduan praktis: ${item.title}`.slice(0, 200),
          sections: JSON.stringify(sections),
          sources: JSON.stringify([]),
          difficulty_level: item.difficulty,
          time_required_minutes: item.minutes,
          materials_list: JSON.stringify(item.materials.map((name) => ({ name, quantity: '', unit: '', note: '' }))),
          tools_list: JSON.stringify(item.toolsList.map((name) => ({ name, spec: '', purpose: '' }))),
          safety_notes: item.safety,
          created_at: now,
          updated_at: now,
        },
      ]);

      await queryInterface.bulkInsert('ArticleMedia', [
        {
          article_id: articleId,
          file_path: item.phases[0].imageSeed ? pic(item.phases[0].imageSeed) : null,
          media_type: 'image',
          created_at: now,
          updated_at: now,
        },
      ]);
    }
  },

  async down(queryInterface) {
    const titles = PROCEDURE_ARTICLES.map((item) => item.title);

    const [articles] = await queryInterface.sequelize.query(
      'SELECT id FROM `Article` WHERE title IN (:titles)',
      { replacements: { titles } }
    );

    if (articles.length > 0) {
      const ids = articles.map((row) => row.id);
      await queryInterface.bulkDelete('Article', { id: ids });
    }
  },
};
