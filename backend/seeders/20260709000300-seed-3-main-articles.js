'use strict';

/**
 * Seeds the 3 canonical "artikel utama" (one per waste category: Batok, Serabut,
 * Kulit Kelapa), each using the fixed 4-section schema (apa itu / manfaat /
 * mengapa bernilai tinggi / ragam cara pengelolaan) and derivative product cards
 * grouped by processing_method — matching the format enforced in
 * AdminArticleEditor.vue for article_type = 'main'. Also marks each as
 * is_home_featured so they appear on the homepage.
 */

const MAIN_ARTICLES = [
  {
    title: 'Batok Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya',
    category: 'Batok Kelapa',
    meta_description:
      'Pengetahuan dasar tentang batok (tempurung) kelapa: definisi, manfaat, alasan bernilai tinggi sebagai limbah, dan ragam cara pengelolaannya.',
    image_url: 'https://picsum.photos/seed/batok-kelapa-utama/800/450',
    sources: [
      { title: 'Kelapa (Wikipedia)', source_type: 'link', url: 'https://id.wikipedia.org/wiki/Kelapa', file_path: null },
      { title: 'Arang (Wikipedia)', source_type: 'link', url: 'https://id.wikipedia.org/wiki/Arang', file_path: null },
    ],
    sections: [
      {
        section_type: 'info',
        title: 'Apa Itu Batok Kelapa?',
        body_content:
          'Batok kelapa (tempurung kelapa) adalah lapisan keras berwarna cokelat tua yang terletak di antara sabut dan daging buah kelapa. Bagian ini tersusun dari lignin dan selulosa dengan struktur yang sangat padat, sehingga memiliki tingkat kekerasan dan densitas yang tinggi dibanding bagian buah kelapa lainnya.\n\nSetiap butir kelapa menghasilkan satu batok yang selama ini kerap dibuang begitu saja sebagai residu setelah daging dan air kelapa diambil, padahal batok memiliki potensi pemanfaatan yang luas.',
        video_path: '',
      },
      {
        section_type: 'info',
        title: 'Manfaat Batok Kelapa',
        body_content:
          'Batok kelapa dapat diolah menjadi berbagai produk bernilai ekonomi, di antaranya:\n\n- Arang dan briket sebagai sumber energi alternatif pengganti bahan bakar fosil\n- Arang aktif untuk keperluan filtrasi air dan udara\n- Asap cair (liquid smoke) sebagai pengawet makanan alami dan biopestisida\n- Tepung tempurung untuk campuran media tanam atau bahan komposit\n- Bahan baku kerajinan tangan seperti mangkuk, kancing, dan aksesori dekoratif',
        video_path: '',
      },
      {
        section_type: 'info',
        title: 'Mengapa Batok Kelapa Menjadi Limbah Bernilai Tinggi?',
        body_content:
          'Batok kelapa dihasilkan dalam jumlah besar sebagai produk samping industri pengolahan kelapa, sehingga ketersediaannya melimpah dan murah sebagai bahan baku. Kandungan karbon dan lignin yang tinggi membuat nilai kalornya besar saat dijadikan arang maupun briket, sementara permintaan pasar ekspor untuk arang aktif dan briket batok kelapa terus meningkat.\n\nSelain itu, tekstur batok yang keras dan bertekstur khas juga membuatnya diminati sebagai bahan kerajinan bernilai jual tinggi, menjadikan limbah ini sumber pendapatan tambahan bagi masyarakat di sentra produksi kelapa.',
        video_path: '',
      },
      {
        section_type: 'info',
        title: 'Ragam Cara Pengelolaan Batok Kelapa',
        body_content:
          'Secara umum terdapat tiga pendekatan utama dalam mengelola limbah batok kelapa:\n\n1. Dibakar (karbonisasi/pirolisis) — menghasilkan arang, briket, arang aktif, dan asap cair\n2. Dihancurkan secara mekanis — menghasilkan tepung tempurung dan media tanam\n3. Diolah menjadi kerajinan tangan — dipahat dan dibentuk menjadi produk dekoratif maupun fungsional\n\nSetiap pendekatan memiliki tahapan produksi dan target pasar yang berbeda, sehingga pemilihan metode disesuaikan dengan ketersediaan alat, keahlian pengrajin, dan permintaan pasar setempat.',
        video_path: '',
      },
    ],
    productCards: [
      { title: 'Briket Arang Tempurung', description: 'Briket berbahan dasar arang batok kelapa dengan nilai kalor tinggi sebagai pengganti bahan bakar fosil.', processing_method: 'Dibakar (Karbonisasi)' },
      { title: 'Arang Aktif', description: 'Arang batok kelapa yang diaktivasi untuk keperluan filtrasi air dan udara.', processing_method: 'Dibakar (Karbonisasi)' },
      { title: 'Asap Cair (Liquid Smoke)', description: 'Cairan hasil kondensasi asap pirolisis batok kelapa, digunakan sebagai pengawet makanan alami.', processing_method: 'Dibakar (Karbonisasi)' },
      { title: 'Tepung Tempurung Kelapa', description: 'Serbuk halus hasil penggilingan batok kelapa untuk campuran media tanam atau bahan komposit.', processing_method: 'Dihancurkan (Mekanis)' },
      { title: 'Media Tanam Serbuk Tempurung', description: 'Campuran media tanam berbasis serbuk tempurung kelapa untuk kebutuhan pembibitan.', processing_method: 'Dihancurkan (Mekanis)' },
      { title: 'Kerajinan Batok Kelapa', description: 'Produk kerajinan tangan seperti mangkuk, kancing, dan aksesori dari batok kelapa.', processing_method: 'Kerajinan Tangan' },
    ],
  },
  {
    title: 'Serabut Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya',
    category: 'Serabut Kelapa',
    meta_description:
      'Pengetahuan dasar tentang serabut (sabut) kelapa: definisi, manfaat, alasan bernilai tinggi sebagai limbah, dan ragam cara pengelolaannya.',
    image_url: 'https://picsum.photos/seed/serabut-kelapa-utama/800/450',
    sources: [
      { title: 'Sabut (Wikipedia)', source_type: 'link', url: 'https://id.wikipedia.org/wiki/Sabut', file_path: null },
      { title: 'Kelapa (Wikipedia)', source_type: 'link', url: 'https://id.wikipedia.org/wiki/Kelapa', file_path: null },
    ],
    sections: [
      {
        section_type: 'info',
        title: 'Apa Itu Serabut Kelapa?',
        body_content:
          'Serabut kelapa (sabut kelapa) adalah lapisan berserat yang terletak di antara kulit terluar dan batok kelapa. Bagian ini tersusun dari serat kasar (coir fiber) yang kuat dan elastis, serta bahan gabus halus (cocopeat/cocodust) yang mengisi ruang di antara serat-serat tersebut.\n\nSerabut merupakan bagian dengan volume terbesar dari satu butir kelapa, namun selama ini paling sering dibuang atau dibakar begitu saja tanpa diolah lebih lanjut.',
        video_path: '',
      },
      {
        section_type: 'info',
        title: 'Manfaat Serabut Kelapa',
        body_content:
          'Serabut kelapa dapat dimanfaatkan menjadi berbagai produk, di antaranya:\n\n- Cocopeat sebagai media tanam pengganti tanah yang menyimpan air dengan baik\n- Cocofiber (serat) untuk tali, keset, dan bahan anyaman\n- Cocomesh (jaring sabut) untuk mencegah erosi dan mendukung reklamasi lahan\n- Papan komposit dan matras dari serat yang dipadatkan\n- Bahan isolasi dan jok kendaraan berbahan alami',
        video_path: '',
      },
      {
        section_type: 'info',
        title: 'Mengapa Serabut Kelapa Menjadi Limbah Bernilai Tinggi?',
        body_content:
          'Volume limbah serabut kelapa sangat besar karena merupakan bagian terbesar dari struktur buah kelapa, sehingga ketersediaannya melimpah di sentra-sentra penghasil kelapa. Sifat mekanis seratnya yang kuat, elastis, dan tahan terhadap kelembapan membuatnya cocok untuk berbagai aplikasi industri maupun pertanian.\n\nSerabut kelapa juga bersifat biodegradable dan ramah lingkungan, sehingga permintaan produk turunannya terus meningkat, terutama untuk kebutuhan media tanam organik dan reklamasi lahan kritis.',
        video_path: '',
      },
      {
        section_type: 'info',
        title: 'Ragam Cara Pengelolaan Serabut Kelapa',
        body_content:
          'Terdapat tiga pendekatan utama dalam mengelola limbah serabut kelapa:\n\n1. Dipintal/dianyam — menghasilkan serat (cocofiber), tali, dan cocomesh\n2. Dihancurkan — menghasilkan cocopeat dan cocodust sebagai media tanam\n3. Dipadatkan — menghasilkan papan komposit dan matras dari serat yang dipress\n\nPemilihan metode bergantung pada ketersediaan mesin pengurai serat, permintaan pasar produk turunan, dan skala produksi yang ingin dicapai oleh pengelola.',
        video_path: '',
      },
    ],
    productCards: [
      { title: 'Cocofiber (Tali Serat)', description: 'Serat sabut kelapa yang dipintal menjadi tali dan bahan anyaman.', processing_method: 'Dipintal/Dianyam' },
      { title: 'Cocomesh (Jaring Reklamasi Lahan)', description: 'Anyaman serat sabut kelapa untuk mencegah erosi dan mendukung reklamasi lahan kritis.', processing_method: 'Dipintal/Dianyam' },
      { title: 'Cocopeat (Media Tanam)', description: 'Serbuk halus sabut kelapa yang menyimpan air dengan baik, digunakan sebagai media tanam.', processing_method: 'Dihancurkan' },
      { title: 'Cocodust', description: 'Debu halus hasil penghancuran sabut kelapa, bahan baku papan partikel ramah lingkungan.', processing_method: 'Dihancurkan' },
      { title: 'Papan Komposit Serat Kelapa', description: 'Papan hasil pemadatan serat sabut kelapa untuk kebutuhan furnitur dan konstruksi ringan.', processing_method: 'Dipadatkan' },
      { title: 'Matras Sabut Kelapa', description: 'Matras dan jok berbahan dasar serat sabut kelapa yang dipadatkan.', processing_method: 'Dipadatkan' },
    ],
  },
  {
    title: 'Kulit Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya',
    category: 'Kulit Kelapa',
    meta_description:
      'Pengetahuan dasar tentang kulit kelapa dan hasil sampingan pengolahan daging kelapa: definisi, manfaat, alasan bernilai tinggi sebagai limbah, dan ragam cara pengelolaannya.',
    image_url: 'https://picsum.photos/seed/kulit-kelapa-utama/800/450',
    sources: [
      { title: 'Minyak kelapa (Wikipedia)', source_type: 'link', url: 'https://id.wikipedia.org/wiki/Minyak_kelapa', file_path: null },
      { title: 'Kopra (Wikipedia)', source_type: 'link', url: 'https://id.wikipedia.org/wiki/Kopra', file_path: null },
    ],
    sections: [
      {
        section_type: 'info',
        title: 'Apa Itu Kulit Kelapa?',
        body_content:
          'Kulit kelapa yang dimaksud di sini mencakup lapisan tipis kecokelatan (testa) serta sisa daging dan ampas kelapa yang dihasilkan dari proses pengupasan dan pengolahan buah kelapa, seperti ampas parutan, bungkil sisa ekstraksi minyak, dan residu santan.\n\nBagian ini sering dianggap sebagai limbah akhir dari rangkaian pengolahan kelapa, padahal masih menyimpan kandungan minyak, serat, dan nutrisi yang bernilai untuk diolah lebih lanjut.',
        video_path: '',
      },
      {
        section_type: 'info',
        title: 'Manfaat Kulit Kelapa',
        body_content:
          'Kulit dan ampas kelapa dapat diolah menjadi berbagai produk, di antaranya:\n\n- Virgin Coconut Oil (VCO) hasil ekstraksi lanjutan dari sisa daging kelapa\n- Pewarna alami untuk tekstil dan pangan\n- Pupuk organik cair dan kompos untuk kebutuhan pertanian\n- Pakan ternak berprotein dari bungkil kelapa\n- Biomassa sebagai sumber energi alternatif',
        video_path: '',
      },
      {
        section_type: 'info',
        title: 'Mengapa Kulit Kelapa Menjadi Limbah Bernilai Tinggi?',
        body_content:
          'Kulit dan ampas kelapa dihasilkan dalam jumlah besar dari industri pengolahan santan, minyak, dan VCO, sehingga ketersediaannya melimpah di sentra produksi. Kandungan minyak sisa, senyawa tanin, dan pigmen alami di dalamnya membuat limbah ini masih memiliki nilai jual jika diolah lebih lanjut.\n\nSelain itu, kandungan protein dan unsur hara di dalamnya bermanfaat bagi sektor peternakan dan pertanian organik, menjadikan limbah ini sumber nilai tambah ganda bagi pelaku usaha pengolahan kelapa.',
        video_path: '',
      },
      {
        section_type: 'info',
        title: 'Ragam Cara Pengelolaan Kulit Kelapa',
        body_content:
          'Terdapat tiga pendekatan utama dalam mengelola limbah kulit kelapa:\n\n1. Ekstraksi/perendaman — menghasilkan VCO dan pewarna alami\n2. Fermentasi/pengomposan — menghasilkan pupuk organik cair dan kompos\n3. Pengeringan dan penggilingan — menghasilkan pakan ternak dan biomassa\n\nPemilihan metode bergantung pada jenis limbah yang tersedia (ampas, bungkil, atau residu santan), peralatan yang dimiliki, serta target pasar produk akhir.',
        video_path: '',
      },
    ],
    productCards: [
      { title: 'Virgin Coconut Oil (VCO)', description: 'Minyak kelapa murni hasil ekstraksi lanjutan dari sisa daging kelapa.', processing_method: 'Ekstraksi/Perendaman' },
      { title: 'Pewarna Alami Kulit Kelapa', description: 'Pigmen alami dari kulit kelapa untuk pewarnaan tekstil dan produk pangan.', processing_method: 'Ekstraksi/Perendaman' },
      { title: 'Pupuk Organik Cair', description: 'Pupuk cair hasil fermentasi limbah kelapa untuk kebutuhan pertanian organik.', processing_method: 'Fermentasi/Pengomposan' },
      { title: 'Kompos Kulit Kelapa', description: 'Kompos padat hasil pengomposan ampas dan kulit kelapa.', processing_method: 'Fermentasi/Pengomposan' },
      { title: 'Pakan Ternak Bungkil Kelapa', description: 'Pakan ternak berprotein tinggi dari bungkil sisa ekstraksi minyak kelapa.', processing_method: 'Pengeringan & Penggilingan' },
      { title: 'Biomassa Briket Kulit Kelapa', description: 'Briket energi alternatif dari ampas kelapa yang dikeringkan dan digiling.', processing_method: 'Pengeringan & Penggilingan' },
    ],
  },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const [authors] = await queryInterface.sequelize.query(
      `
      SELECT id, email
      FROM \`User\`
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

    for (const item of MAIN_ARTICLES) {
      const [existingArticles] = await queryInterface.sequelize.query(
        'SELECT id FROM `Article` WHERE title = :title LIMIT 1',
        { replacements: { title: item.title } }
      );

      if (existingArticles.length > 0) continue;

      let [categories] = await queryInterface.sequelize.query(
        'SELECT id FROM `Category` WHERE name = :name LIMIT 1',
        { replacements: { name: item.category } }
      );

      if (categories.length === 0) {
        await queryInterface.bulkInsert('Category', [
          {
            name: item.category,
            description: `Kategori pengolahan ${item.category.toLowerCase()}`,
            created_at: now,
            updated_at: now,
          },
        ]);

        [categories] = await queryInterface.sequelize.query(
          'SELECT id FROM `Category` WHERE name = :name LIMIT 1',
          { replacements: { name: item.category } }
        );
      }

      const categoryId = categories[0].id;

      // Pastikan hanya 1 artikel utama yang tampil di homepage per kategori.
      await queryInterface.sequelize.query(
        'UPDATE `Article` SET is_home_featured = false WHERE category_id = :categoryId AND is_home_featured = true',
        { replacements: { categoryId } }
      );

      await queryInterface.bulkInsert('Article', [
        {
          author_id: authorId,
          category_id: categoryId,
          parent_article_id: null,
          article_type: 'main',
          is_home_featured: true,
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

      const bodyContent = item.sections.map((section) => section.body_content).join('\n\n');

      await queryInterface.bulkInsert('ArticleDetail', [
        {
          article_id: articleId,
          body_content: bodyContent,
          meta_description: item.meta_description,
          sections: JSON.stringify(item.sections),
          sources: JSON.stringify(item.sources || []),
          created_at: now,
          updated_at: now,
        },
      ]);

      if (item.image_url) {
        await queryInterface.bulkInsert('ArticleMedia', [
          {
            article_id: articleId,
            file_path: item.image_url,
            media_type: 'image',
            created_at: now,
            updated_at: now,
          },
        ]);
      }

      await queryInterface.bulkInsert(
        'ProductCard',
        item.productCards.map((card) => ({
          article_id: articleId,
          title: card.title,
          description: card.description,
          image: null,
          processing_method: card.processing_method,
          created_at: now,
          updated_at: now,
        }))
      );
    }
  },

  async down(queryInterface) {
    const titles = MAIN_ARTICLES.map((item) => item.title);

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
