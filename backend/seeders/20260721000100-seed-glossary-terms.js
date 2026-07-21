'use strict';

/**
 * Seeds the Glosarium with technical terms drawn from the coconut-waste
 * processing content already seeded across the main/detail/prosedur
 * articles (karbonisasi, cocopeat, VCO, dst). related_article_ids is
 * resolved dynamically by article title so it stays correct regardless
 * of auto-increment id drift between environments.
 */

const TERMS = [
  // ── kimia ──
  {
    term: 'Asap Cair (Liquid Smoke)',
    category: 'kimia',
    definition:
      'Cairan hasil kondensasi asap dari proses pirolisis batok kelapa, mengandung senyawa fenol dan asam organik yang berfungsi sebagai pengawet makanan alami sekaligus biopestisida.',
    relatedTitles: [
      'Produksi Asap Cair (Liquid Smoke) dari Batok Kelapa',
      'Mengenal Asap Cair (Liquid Smoke) dari Batok Kelapa',
      'Produksi Asap Cair (Liquid Smoke) dari Pirolisis Batok Kelapa',
    ],
  },
  {
    term: 'Tanin',
    category: 'kimia',
    definition:
      'Senyawa polifenol alami yang banyak terkandung pada kulit kelapa, dapat diekstraksi sebagai pewarna alami atau bahan penyamak kulit.',
    relatedTitles: [
      'Ekstraksi Pewarna Alami dari Kulit Kelapa',
      'Mengenal Pewarna Alami dari Kulit Kelapa',
    ],
  },
  {
    term: 'Chemical Oxygen Demand (COD)',
    category: 'kimia',
    definition:
      'Parameter yang mengukur jumlah oksigen yang dibutuhkan untuk mengoksidasi bahan organik dalam air limbah, umum dipakai sebagai indikator tingkat pencemaran pada limbah cair kelapa sebelum diolah lebih lanjut.',
    relatedTitles: [
      'Konversi Air Kelapa Tua Menjadi Pupuk Organik Cair (POC)',
      'Optimalisasi Proses Fermentasi Nata de Coco dari Limbah Cair Kelapa',
    ],
  },

  // ── proses ──
  {
    term: 'Karbonisasi',
    category: 'proses',
    definition:
      'Proses pembakaran bahan organik seperti batok kelapa dengan pasokan oksigen terbatas sehingga berubah menjadi arang, tahap awal sebelum arang diolah lebih lanjut menjadi briket atau arang aktif.',
    relatedTitles: [
      'Proses Produksi Arang Aktif dari Batok Kelapa',
      'Cara Membuat Briket Arang dari Batok Kelapa',
      'Batok Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya',
    ],
  },
  {
    term: 'Pirolisis',
    category: 'proses',
    definition:
      'Proses dekomposisi termal bahan organik pada suhu tinggi tanpa oksigen, menghasilkan produk sampingan berupa arang, asap cair, dan gas yang dapat dimanfaatkan lebih lanjut.',
    relatedTitles: [
      'Produksi Asap Cair (Liquid Smoke) dari Pirolisis Batok Kelapa',
      'Produksi Asap Cair (Liquid Smoke) dari Batok Kelapa',
    ],
  },
  {
    term: 'Aktivasi Karbon',
    category: 'proses',
    definition:
      'Tahap pemanasan atau perlakuan kimia pada arang untuk membuka pori-pori mikronya sehingga luas permukaan dan daya serapnya meningkat, menghasilkan arang aktif.',
    relatedTitles: [
      'Proses Produksi Arang Aktif dari Batok Kelapa',
      'Mengenal Arang Aktif dari Batok Kelapa',
    ],
  },
  {
    term: 'Fermentasi',
    category: 'proses',
    definition:
      'Proses biologis pengubahan bahan organik oleh aktivitas mikroorganisme, dimanfaatkan misalnya pada pembuatan nata de coco dan pupuk organik cair dari air kelapa.',
    relatedTitles: [
      'Optimalisasi Proses Fermentasi Nata de Coco dari Limbah Cair Kelapa',
      'Konversi Air Kelapa Tua Menjadi Pupuk Organik Cair (POC)',
    ],
  },
  {
    term: 'Pengomposan',
    category: 'proses',
    definition:
      'Proses penguraian bahan organik secara terkendali oleh mikroorganisme menjadi kompos yang dapat memperbaiki struktur dan kesuburan tanah.',
    relatedTitles: [
      'Proses Pengomposan Kulit dan Ampas Kelapa',
      'Mengenal Kompos dari Kulit dan Ampas Kelapa',
    ],
  },
  {
    term: 'Sentrifugasi',
    category: 'proses',
    definition:
      'Metode pemisahan komponen cairan berdasarkan perbedaan massa jenis menggunakan gaya sentrifugal, umum digunakan dalam ekstraksi minyak kelapa murni (VCO) tanpa pemanasan tinggi.',
    relatedTitles: [
      'Ekstraksi Virgin Coconut Oil (VCO) dengan Metode Sentrifugasi',
      'Cara Membuat Virgin Coconut Oil (VCO) dari Sisa Daging Kelapa',
    ],
  },

  // ── kualitas ──
  {
    term: 'Kadar Air',
    category: 'kualitas',
    definition:
      'Persentase kandungan air dalam suatu bahan, menjadi salah satu indikator mutu penting pada produk seperti arang, tepung tempurung, dan briket karena memengaruhi nilai kalor dan daya simpan.',
    relatedTitles: [
      'Cara Mengolah Batok Kelapa Menjadi Tepung Tempurung',
      'Proses Produksi Arang Aktif dari Batok Kelapa',
    ],
  },
  {
    term: 'Daya Serap (Adsorpsi)',
    category: 'kualitas',
    definition:
      'Kemampuan suatu bahan, seperti arang aktif, untuk menyerap zat pengotor, bau, atau warna dari cairan maupun gas di sekitarnya. Semakin luas pori-pori arang, semakin tinggi daya serapnya.',
    relatedTitles: [
      'Proses Produksi Arang Aktif dari Batok Kelapa',
      'Mengenal Arang Aktif dari Batok Kelapa',
    ],
  },
  {
    term: 'Rendemen',
    category: 'kualitas',
    definition:
      'Persentase hasil akhir suatu proses pengolahan dibandingkan dengan berat bahan baku awal, dipakai sebagai indikator efisiensi produksi.',
    relatedTitles: [
      'Ekstraksi Virgin Coconut Oil (VCO) dengan Metode Sentrifugasi',
      'Produksi Asap Cair (Liquid Smoke) dari Batok Kelapa',
    ],
  },

  // ── alat ──
  {
    term: 'Mesin Pencacah',
    category: 'alat',
    definition:
      'Alat mekanis untuk mencacah dan menghaluskan bahan baku seperti ampas atau sabut kelapa sebelum diproses lebih lanjut menjadi briket atau produk olahan lain.',
    relatedTitles: ['Produksi Briket Biomassa dari Ampas Kulit Kelapa'],
  },
  {
    term: 'Alat Pencetak Briket',
    category: 'alat',
    definition:
      'Alat bertekanan untuk memadatkan serbuk arang atau biomassa menjadi briket dengan bentuk dan kepadatan yang seragam.',
    relatedTitles: [
      'Cara Membuat Briket Arang dari Batok Kelapa',
      'Produksi Briket Biomassa dari Ampas Kulit Kelapa',
    ],
  },
  {
    term: 'Tungku Karbonisasi',
    category: 'alat',
    definition:
      'Tungku atau drum kedap udara yang digunakan untuk membakar batok kelapa dengan pasokan oksigen terbatas pada proses karbonisasi menjadi arang.',
    relatedTitles: [
      'Proses Produksi Arang Aktif dari Batok Kelapa',
      'Cara Membuat Briket Arang dari Batok Kelapa',
    ],
  },

  // ── umum ──
  {
    term: 'Briket',
    category: 'umum',
    definition:
      'Bahan bakar padat yang dipadatkan dari serbuk arang atau biomassa, digunakan sebagai alternatif pengganti kayu bakar maupun batu bara.',
    relatedTitles: [
      'Cara Membuat Briket Arang dari Batok Kelapa',
      'Produksi Briket Biomassa dari Ampas Kulit Kelapa',
      'Inovasi Briket Arang Tempurung Kelapa sebagai Energi Alternatif',
    ],
  },
  {
    term: 'Arang Aktif',
    category: 'umum',
    definition:
      'Karbon berpori dengan luas permukaan besar hasil aktivasi arang, digunakan sebagai adsorben untuk keperluan filtrasi air maupun udara.',
    relatedTitles: [
      'Proses Produksi Arang Aktif dari Batok Kelapa',
      'Mengenal Arang Aktif dari Batok Kelapa',
    ],
  },
  {
    term: 'Cocopeat',
    category: 'umum',
    definition:
      'Serbuk halus hasil pengolahan sabut kelapa yang memiliki daya serap air tinggi, banyak dimanfaatkan sebagai media tanam pembibitan dan hidroponik.',
    relatedTitles: [
      'Cara Membuat Cocopeat dari Sabut Kelapa',
      'Mengenal Cocopeat sebagai Media Tanam',
      'Pemanfaatan Sabut Kelapa Menjadi Cocopeat untuk Media Tanam Komunitas',
    ],
  },
  {
    term: 'Cocofiber',
    category: 'umum',
    definition:
      'Serat kasar hasil pemisahan dari sabut kelapa, umumnya diolah lebih lanjut menjadi tali, jok, matras, atau bahan komposit.',
    relatedTitles: [
      'Cara Mengolah Sabut Kelapa Menjadi Cocofiber (Serat Tali)',
      'Mengenal Cocofiber (Serat Tali) dari Sabut Kelapa',
    ],
  },
  {
    term: 'Cocomesh',
    category: 'umum',
    definition:
      'Jaring anyaman dari serat sabut kelapa yang digunakan untuk mencegah erosi tanah dan mempercepat pertumbuhan vegetasi pada reklamasi lahan kritis atau bekas tambang.',
    relatedTitles: [
      'Produksi Cocomesh untuk Reklamasi Lahan Kritis',
      'Mengenal Cocomesh untuk Reklamasi Lahan',
      'Cocomesh: Solusi Sabut Kelapa untuk Reklamasi Lahan Tambang',
    ],
  },
  {
    term: 'Cocodust',
    category: 'umum',
    definition:
      'Debu halus sisa pengolahan sabut kelapa (serbuk sabut) yang dapat dimanfaatkan sebagai bahan baku papan partikel ramah lingkungan.',
    relatedTitles: [
      'Pengolahan Debu Sabut Kelapa (Cocodust) Menjadi Bahan Baku Papan Partikel',
      'Mengenal Cocodust dan Pemanfaatannya',
      'Cocodust: Pengolahan Debu Sabut Kelapa Menjadi Papan Partikel Ramah Lingkungan',
    ],
  },
  {
    term: 'Virgin Coconut Oil (VCO)',
    category: 'umum',
    definition:
      'Minyak kelapa murni yang diekstraksi dari daging kelapa segar tanpa proses pemanasan tinggi, sehingga mempertahankan kandungan nutrisi alaminya.',
    relatedTitles: [
      'Cara Membuat Virgin Coconut Oil (VCO) dari Sisa Daging Kelapa',
      'Mengenal Virgin Coconut Oil (VCO)',
      'Ekstraksi Virgin Coconut Oil (VCO) dengan Metode Sentrifugasi',
    ],
  },
  {
    term: 'Nata de Coco',
    category: 'umum',
    definition:
      'Produk pangan berupa lapisan selulosa kenyal hasil fermentasi air kelapa oleh bakteri Acetobacter xylinum.',
    relatedTitles: ['Optimalisasi Proses Fermentasi Nata de Coco dari Limbah Cair Kelapa'],
  },
  {
    term: 'Bungkil Kelapa',
    category: 'umum',
    definition:
      'Ampas padat sisa ekstraksi minyak kelapa yang kaya protein, sering dimanfaatkan sebagai bahan campuran pakan ternak.',
    relatedTitles: [
      'Cara Mengolah Bungkil Kelapa Menjadi Pakan Ternak',
      'Mengenal Pakan Ternak dari Bungkil Kelapa',
      'Pemanfaatan Bungkil Kelapa sebagai Pakan Ternak Berprotein Tinggi',
    ],
  },
  {
    term: 'Pupuk Organik Cair (POC)',
    category: 'umum',
    definition:
      'Pupuk cair hasil fermentasi bahan organik, seperti air kelapa atau limbah kelapa lainnya, yang kaya unsur hara dan mudah diserap tanaman.',
    relatedTitles: [
      'Cara Membuat Pupuk Organik Cair dari Limbah Kelapa',
      'Mengenal Pupuk Organik Cair dari Limbah Kelapa',
      'Konversi Air Kelapa Tua Menjadi Pupuk Organik Cair (POC)',
    ],
  },
  {
    term: 'Kompos',
    category: 'umum',
    definition:
      'Hasil dekomposisi bahan organik oleh mikroorganisme yang dimanfaatkan sebagai pupuk untuk memperbaiki struktur dan kesuburan tanah.',
    relatedTitles: [
      'Proses Pengomposan Kulit dan Ampas Kelapa',
      'Mengenal Kompos dari Kulit dan Ampas Kelapa',
    ],
  },
  {
    term: 'Reklamasi Lahan',
    category: 'umum',
    definition:
      'Upaya pemulihan lahan kritis atau bekas tambang agar dapat kembali produktif secara ekologis, salah satunya dengan bantuan material penahan erosi seperti cocomesh.',
    relatedTitles: [
      'Produksi Cocomesh untuk Reklamasi Lahan Kritis',
      'Cocomesh: Solusi Sabut Kelapa untuk Reklamasi Lahan Tambang',
    ],
  },
  {
    term: 'Media Tanam',
    category: 'umum',
    definition:
      'Bahan tempat tumbuhnya tanaman yang menyediakan unsur hara, air, dan udara bagi akar, seperti cocopeat atau serbuk tempurung kelapa.',
    relatedTitles: [
      'Cara Membuat Cocopeat dari Sabut Kelapa',
      'Formulasi Media Tanam dari Serbuk Tempurung Kelapa',
    ],
  },
  {
    term: 'Tempurung Kelapa (Batok Kelapa)',
    category: 'umum',
    definition:
      'Lapisan keras berwarna cokelat tua yang terletak di antara sabut dan daging buah kelapa, menjadi bahan baku utama arang, briket, dan kerajinan tangan.',
    relatedTitles: ['Batok Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya'],
  },
  {
    term: 'Sabut Kelapa (Serabut Kelapa)',
    category: 'umum',
    definition:
      'Lapisan berserat yang membungkus batok kelapa, menjadi bahan baku produk turunan seperti cocopeat, cocofiber, cocomesh, dan cocodust.',
    relatedTitles: ['Serabut Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya'],
  },
  {
    term: 'Kulit Kelapa',
    category: 'umum',
    definition:
      'Lapisan terluar buah kelapa yang sering terbuang begitu saja, padahal dapat diolah menjadi pupuk organik cair, kompos, hingga pewarna alami.',
    relatedTitles: ['Kulit Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya'],
  },
  {
    term: 'Biomassa',
    category: 'umum',
    definition:
      'Bahan organik dari makhluk hidup, termasuk limbah kelapa, yang dapat dikonversi menjadi sumber energi alternatif seperti briket.',
    relatedTitles: [
      'Produksi Briket Biomassa dari Ampas Kulit Kelapa',
      'Mengenal Biomassa Briket dari Ampas Kelapa',
    ],
  },
];

module.exports = {
  async up(queryInterface) {
    const [creatorRows] = await queryInterface.sequelize.query(
      'SELECT id FROM `User` WHERE email = :email LIMIT 1',
      { replacements: { email: 'pengelola@coconexus.local' } }
    );
    const createdBy = creatorRows[0] ? creatorRows[0].id : null;

    const [articleRows] = await queryInterface.sequelize.query('SELECT id, title FROM `Article`');
    const titleToId = new Map(articleRows.map((row) => [row.title, row.id]));

    const now = new Date();

    for (const item of TERMS) {
      const [existing] = await queryInterface.sequelize.query(
        'SELECT id FROM `GlossaryTerm` WHERE term = :term LIMIT 1',
        { replacements: { term: item.term } }
      );

      if (existing.length > 0) {
        continue;
      }

      const relatedIds = item.relatedTitles
        .map((title) => titleToId.get(title))
        .filter((id) => Number.isInteger(id));

      await queryInterface.bulkInsert('GlossaryTerm', [
        {
          term: item.term,
          definition: item.definition,
          category: item.category,
          standard_reference: null,
          related_article_ids: relatedIds.length > 0 ? JSON.stringify(relatedIds) : null,
          created_by: createdBy,
          created_at: now,
          updated_at: now,
        },
      ]);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('GlossaryTerm', {
      term: TERMS.map((item) => item.term),
    });
  },
};
