'use strict';

/**
 * Seeds one "artikel detail" (wawasan) per derivative product card created by
 * 20260709000300-seed-3-main-articles.js, so every card in "Pohon Turunan
 * Limbah" links to a real, published article instead of showing "Segera
 * tersedia". Links via ProductCard.linked_article_id.
 *
 * These articles are wawasan-only (apa itu / mengapa penting / di mana
 * dipakai) — deliberately WITHOUT bahan/alat/langkah pembuatan, so the
 * information stays focused. The hands-on "how to make it" steps live in a
 * separate article_type='prosedur' article, linked back via
 * wawasan_article_id (see 20260709000500-seed-derivative-procedure-articles.js)
 * and surfaced automatically by ArticleDetailPage.vue's "Panduan Praktis
 * Terkait" callout.
 *
 * Images use Lorem Picsum (https://picsum.photos/seed/<slug>/800/450) — a real,
 * verified-working stock photo service. References use verified real
 * Indonesian Wikipedia articles. Both were checked with curl (HTTP 200)
 * before use.
 */

const WIKI_BASE = 'https://id.wikipedia.org/wiki/';

function wikiSource(title, slug) {
  return { title: `${title} (Wikipedia)`, source_type: 'link', url: `${WIKI_BASE}${slug}`, file_path: null };
}

function pic(slug) {
  return `https://picsum.photos/seed/${slug}/800/450`;
}

const CLOSING_NOTE =
  'Untuk mempelajari langkah pembuatannya secara praktis, buka artikel prosedur terkait pada bagian "Panduan Praktis Terkait" di bawah.';

const DETAIL_ARTICLES = [
  // ── Batok Kelapa ──
  {
    mainArticleTitle: 'Batok Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya',
    productTitle: 'Briket Arang Tempurung',
    title: 'Mengenal Briket Arang Tempurung Kelapa',
    imageSeed: 'briket-arang-tempurung',
    sources: [wikiSource('Arang', 'Arang'), wikiSource('Briket', 'Briket')],
    body:
      'Briket arang tempurung kelapa adalah bahan bakar padat yang dibuat dari arang batok kelapa hasil karbonisasi. Dibandingkan kayu bakar biasa, briket ini menghasilkan panas yang lebih stabil, asap yang jauh lebih sedikit, dan sisa abu yang lebih rendah.\n\nProduk ini menjadi salah satu komoditas ekspor unggulan dari limbah kelapa karena permintaan pasar internasional untuk bahan bakar shisha, barbeku, dan industri yang tinggi. Nilai kalornya yang besar membuatnya sebanding dengan bahan bakar fosil dalam hal efisiensi pembakaran, namun jauh lebih ramah lingkungan karena berasal dari limbah pertanian yang terbarukan.\n\n' +
      CLOSING_NOTE,
  },
  {
    mainArticleTitle: 'Batok Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya',
    productTitle: 'Arang Aktif',
    title: 'Mengenal Arang Aktif dari Batok Kelapa',
    imageSeed: 'arang-aktif-batok',
    sources: [wikiSource('Karbon aktif', 'Karbon_aktif')],
    body:
      'Arang aktif dari batok kelapa adalah arang yang telah melalui proses aktivasi lanjutan sehingga memiliki jutaan pori mikroskopis pada permukaannya. Struktur pori inilah yang membuatnya sangat efektif menyerap kotoran, bau, dan zat kimia tertentu.\n\nArang aktif berbahan batok kelapa dianggap sebagai salah satu yang berkualitas terbaik di dunia industri filtrasi, digunakan mulai dari penjernihan air minum, masker gas, hingga produk kesehatan seperti tablet penyerap racun. Kualitas arang batok kelapa yang padat menghasilkan luas permukaan pori yang lebih besar dibanding arang aktif dari bahan lain.\n\n' +
      CLOSING_NOTE,
  },
  {
    mainArticleTitle: 'Batok Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya',
    productTitle: 'Asap Cair (Liquid Smoke)',
    title: 'Mengenal Asap Cair (Liquid Smoke) dari Batok Kelapa',
    imageSeed: 'asap-cair-liquid-smoke',
    sources: [wikiSource('Asap cair', 'Asap_cair')],
    body:
      'Asap cair (liquid smoke) adalah cairan hasil kondensasi asap pembakaran batok kelapa yang dikendalikan pada suhu tertentu. Cairan ini mengandung senyawa fenol dan asam organik yang bersifat mengawetkan sekaligus memberi aroma khas smokey pada makanan.\n\nSelain digunakan sebagai pengawet alami untuk ikan asap, daging, dan tahu, asap cair grade tertentu juga dimanfaatkan sebagai biopestisida nabati yang ramah lingkungan karena mampu mengusir hama tanpa residu kimia berbahaya. Produk ini menjadi solusi bernilai tambah dari limbah batok kelapa yang selama ini hanya dibakar begitu saja.\n\n' +
      CLOSING_NOTE,
  },
  {
    mainArticleTitle: 'Batok Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya',
    productTitle: 'Tepung Tempurung Kelapa',
    title: 'Mengenal Tepung Tempurung Kelapa',
    imageSeed: 'tepung-tempurung-kelapa',
    sources: [wikiSource('Kelapa', 'Kelapa')],
    body:
      'Tepung tempurung kelapa adalah serbuk halus hasil penggilingan batok kering. Berbeda dengan tepung pangan, tepung ini digunakan sebagai bahan pengisi (filler) untuk industri komposit, campuran media tanam, hingga bahan baku produk kesehatan kulit seperti scrub alami.\n\nKeunggulan tepung tempurung terletak pada teksturnya yang keras namun ringan, sehingga banyak dipakai sebagai bahan abrasif alami pengganti mikroplastik pada produk perawatan tubuh, sekaligus sebagai penguat pada material komposit ramah lingkungan.\n\n' +
      CLOSING_NOTE,
  },
  {
    mainArticleTitle: 'Batok Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya',
    productTitle: 'Media Tanam Serbuk Tempurung',
    title: 'Mengenal Media Tanam dari Serbuk Tempurung Kelapa',
    imageSeed: 'media-tanam-tempurung',
    sources: [wikiSource('Kompos', 'Kompos')],
    body:
      'Serbuk tempurung kelapa dapat diformulasikan menjadi media tanam alternatif yang ringan dan berpori. Sifatnya yang mampu menahan kelembapan sekaligus menjaga drainase membuatnya cocok digunakan pada tahap pembibitan tanaman.\n\nMedia tanam berbasis serbuk tempurung sering dikombinasikan dengan bahan organik lain seperti kompos dan sekam bakar untuk menghasilkan campuran yang seimbang antara aerasi, retensi air, dan kandungan hara. Alternatif ini membantu mengurangi ketergantungan pada tanah topsoil yang semakin langka.\n\n' +
      CLOSING_NOTE,
  },
  {
    mainArticleTitle: 'Batok Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya',
    productTitle: 'Kerajinan Batok Kelapa',
    title: 'Mengenal Kerajinan Tangan dari Batok Kelapa',
    imageSeed: 'kerajinan-batok-kelapa',
    sources: [wikiSource('Kelapa', 'Kelapa')],
    body:
      'Batok kelapa yang keras dan bertekstur khas telah lama dimanfaatkan sebagai bahan baku kerajinan tangan, mulai dari mangkuk, kancing baju, hingga aksesori dekoratif seperti lampu hias dan gantungan kunci.\n\nProduk kerajinan berbasis batok kelapa banyak diminati pasar ekspor karena tampilannya yang alami dan ramah lingkungan, sejalan dengan tren produk berkelanjutan (sustainable products). Industri kerajinan ini juga menjadi sumber penghasilan penting bagi UMKM di sentra-sentra penghasil kelapa.\n\n' +
      CLOSING_NOTE,
  },

  // ── Serabut Kelapa ──
  {
    mainArticleTitle: 'Serabut Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya',
    productTitle: 'Cocofiber (Tali Serat)',
    title: 'Mengenal Cocofiber (Serat Tali) dari Sabut Kelapa',
    imageSeed: 'cocofiber-tali-serat',
    sources: [wikiSource('Sabut', 'Sabut')],
    body:
      'Cocofiber adalah serat kasar dan kuat hasil pemisahan sabut kelapa, yang banyak dipintal menjadi tali, keset, dan berbagai bahan anyaman. Karakteristik seratnya yang tahan terhadap kelembapan membuatnya lebih awet dibanding serat alami lain untuk aplikasi luar ruangan.\n\nCocofiber juga digunakan sebagai bahan baku jok kendaraan, tali kapal, dan geotekstil karena kekuatan tariknya yang cukup tinggi. Permintaan global terhadap cocofiber terus meningkat seiring tren penggantian material sintetis dengan bahan alami yang terbarukan.\n\n' +
      CLOSING_NOTE,
  },
  {
    mainArticleTitle: 'Serabut Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya',
    productTitle: 'Cocomesh (Jaring Reklamasi Lahan)',
    title: 'Mengenal Cocomesh untuk Reklamasi Lahan',
    imageSeed: 'cocomesh-reklamasi-lahan',
    sources: [wikiSource('Sabut', 'Sabut')],
    body:
      'Cocomesh adalah anyaman serat sabut kelapa berbentuk jaring yang digunakan untuk mencegah erosi tanah, terutama pada lahan kritis, lereng curam, dan area bekas tambang. Jaring ini membantu menahan permukaan tanah sekaligus mendukung tumbuhnya vegetasi baru.\n\nBerbeda dengan material sintetis, cocomesh bersifat biodegradable sehingga akan terurai secara alami seiring waktu setelah vegetasi berhasil tumbuh, tanpa meninggalkan residu plastik di lahan reklamasi. Hal ini menjadikannya solusi ramah lingkungan yang banyak dipilih dalam program rehabilitasi lahan.\n\n' +
      CLOSING_NOTE,
  },
  {
    mainArticleTitle: 'Serabut Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya',
    productTitle: 'Cocopeat (Media Tanam)',
    title: 'Mengenal Cocopeat sebagai Media Tanam',
    imageSeed: 'cocopeat-media-tanam',
    sources: [wikiSource('Sabut', 'Sabut'), wikiSource('Kompos', 'Kompos')],
    body:
      'Cocopeat adalah serbuk halus hasil penghancuran sabut kelapa yang memiliki daya serap air sangat tinggi, menjadikannya populer sebagai media tanam pengganti tanah, terutama untuk hidroponik dan pembibitan tanaman.\n\nSelain ringan dan mudah didistribusikan, cocopeat juga membantu menjaga kelembapan akar tanaman lebih lama dibanding tanah biasa. Produk ini banyak diekspor dalam bentuk briket padat (cocopeat block) yang lebih hemat ruang penyimpanan dan pengiriman.\n\n' +
      CLOSING_NOTE,
  },
  {
    mainArticleTitle: 'Serabut Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya',
    productTitle: 'Cocodust',
    title: 'Mengenal Cocodust dan Pemanfaatannya',
    imageSeed: 'cocodust-papan-partikel',
    sources: [wikiSource('Papan partikel', 'Papan_partikel')],
    body:
      'Cocodust adalah debu halus sisa penggilingan sabut kelapa yang sebelumnya sering terbuang begitu saja. Kini, cocodust dimanfaatkan sebagai bahan baku papan partikel ramah lingkungan yang menjadi alternatif kayu lapis konvensional.\n\nPemanfaatan cocodust mendukung prinsip ekonomi sirkular karena mengubah residu proses produksi cocofiber dan cocopeat menjadi produk baru yang bernilai jual, sekaligus mengurangi limbah yang berakhir di tempat pembuangan.\n\n' +
      CLOSING_NOTE,
  },
  {
    mainArticleTitle: 'Serabut Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya',
    productTitle: 'Papan Komposit Serat Kelapa',
    title: 'Mengenal Papan Komposit dari Serat Kelapa',
    imageSeed: 'papan-komposit-serat',
    sources: [wikiSource('Papan partikel', 'Papan_partikel')],
    body:
      'Papan komposit serat kelapa dibuat dengan memadatkan serat sabut bersama bahan perekat, menghasilkan material yang ringan namun cukup kuat untuk kebutuhan furnitur dan konstruksi ringan.\n\nDibandingkan papan kayu konvensional, papan komposit serat kelapa lebih tahan terhadap kelembapan dan serangan rayap, menjadikannya pilihan menarik untuk produk mebel luar ruangan maupun panel dinding interior yang ramah lingkungan.\n\n' +
      CLOSING_NOTE,
  },
  {
    mainArticleTitle: 'Serabut Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya',
    productTitle: 'Matras Sabut Kelapa',
    title: 'Mengenal Matras dan Jok dari Sabut Kelapa',
    imageSeed: 'matras-sabut-kelapa',
    sources: [wikiSource('Sabut', 'Sabut')],
    body:
      'Serat sabut kelapa yang bertekstur pegas dapat diolah menjadi matras dan jok kendaraan berbahan alami. Kombinasi serat dengan lateks menghasilkan produk yang empuk, memiliki sirkulasi udara baik, dan lebih tahan lama dibanding busa sintetis biasa.\n\nMatras berbahan sabut kelapa juga dikenal lebih ramah bagi kesehatan tulang belakang karena tingkat kekenyalannya yang moderat, serta lebih mudah terurai secara alami di akhir masa pakainya dibanding busa berbahan minyak bumi.\n\n' +
      CLOSING_NOTE,
  },

  // ── Kulit Kelapa ──
  {
    mainArticleTitle: 'Kulit Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya',
    productTitle: 'Virgin Coconut Oil (VCO)',
    title: 'Mengenal Virgin Coconut Oil (VCO)',
    imageSeed: 'vco-virgin-coconut-oil',
    sources: [wikiSource('Minyak kelapa', 'Minyak_kelapa')],
    body:
      'Virgin Coconut Oil (VCO) adalah minyak kelapa murni yang diekstraksi dari sisa daging kelapa tanpa melalui proses pemanasan tinggi maupun bahan kimia, sehingga kandungan nutrisinya tetap terjaga.\n\nVCO dikenal luas sebagai produk kesehatan dan kecantikan karena kandungan asam lauratnya yang tinggi, digunakan mulai dari suplemen, minyak goreng premium, hingga bahan dasar kosmetik alami. Permintaan pasar global terhadap VCO terus tumbuh seiring tren gaya hidup sehat berbasis bahan alami.\n\n' +
      CLOSING_NOTE,
  },
  {
    mainArticleTitle: 'Kulit Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya',
    productTitle: 'Pewarna Alami Kulit Kelapa',
    title: 'Mengenal Pewarna Alami dari Kulit Kelapa',
    imageSeed: 'pewarna-alami-kulit-kelapa',
    sources: [wikiSource('Pewarna alami', 'Pewarna_alami')],
    body:
      'Kulit kelapa mengandung pigmen alami berwarna cokelat yang dapat diekstraksi menjadi pewarna alami untuk kebutuhan tekstil, kerajinan batik, maupun produk pangan tertentu.\n\nPewarna alami dari kulit kelapa menjadi alternatif menarik di tengah meningkatnya kekhawatiran terhadap dampak kesehatan dan lingkungan dari pewarna sintetis. Warna yang dihasilkan cenderung lebih lembut dan khas, sering dimanfaatkan pada produk kerajinan bernuansa etnik.\n\n' +
      CLOSING_NOTE,
  },
  {
    mainArticleTitle: 'Kulit Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya',
    productTitle: 'Pupuk Organik Cair',
    title: 'Mengenal Pupuk Organik Cair dari Limbah Kelapa',
    imageSeed: 'pupuk-organik-cair',
    sources: [wikiSource('Kompos', 'Kompos')],
    body:
      'Air kelapa dan residu santan yang biasanya terbuang ternyata mengandung hormon pertumbuhan alami seperti sitokinin, sehingga dapat difermentasi menjadi pupuk organik cair yang bermanfaat bagi tanaman.\n\nPenggunaan pupuk organik cair dari limbah kelapa membantu mengurangi ketergantungan petani terhadap pupuk kimia, sekaligus memanfaatkan limbah cair industri kelapa yang selama ini kerap dibuang langsung ke lingkungan tanpa pengolahan.\n\n' +
      CLOSING_NOTE,
  },
  {
    mainArticleTitle: 'Kulit Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya',
    productTitle: 'Kompos Kulit Kelapa',
    title: 'Mengenal Kompos dari Kulit dan Ampas Kelapa',
    imageSeed: 'kompos-kulit-kelapa',
    sources: [wikiSource('Kompos', 'Kompos')],
    body:
      'Ampas dan kulit kelapa yang kaya bahan organik dapat dikomposkan menjadi pupuk padat yang menyuburkan tanah pertanian. Proses dekomposisi alami mengubah limbah ini menjadi humus yang memperbaiki struktur dan kesuburan tanah.\n\nKompos berbahan limbah kelapa banyak digunakan pada pertanian organik karena selain menyuburkan tanah, juga membantu menekan populasi patogen tanah tertentu berkat kandungan senyawa alami dalam kulit kelapa.\n\n' +
      CLOSING_NOTE,
  },
  {
    mainArticleTitle: 'Kulit Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya',
    productTitle: 'Pakan Ternak Bungkil Kelapa',
    title: 'Mengenal Pakan Ternak dari Bungkil Kelapa',
    imageSeed: 'pakan-ternak-bungkil-kelapa',
    sources: [wikiSource('Pakan', 'Pakan'), wikiSource('Kopra', 'Kopra')],
    body:
      'Bungkil kelapa adalah sisa hasil ekstraksi minyak dari kopra yang masih mengandung protein cukup tinggi, sehingga dapat diolah menjadi bahan pakan ternak berprotein untuk sapi, kambing, maupun unggas.\n\nPemanfaatan bungkil kelapa sebagai pakan membantu menekan biaya produksi peternak karena harganya jauh lebih terjangkau dibanding pakan konsentrat komersial, sekaligus mengurangi limbah dari industri pengolahan minyak kelapa.\n\n' +
      CLOSING_NOTE,
  },
  {
    mainArticleTitle: 'Kulit Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya',
    productTitle: 'Biomassa Briket Kulit Kelapa',
    title: 'Mengenal Biomassa Briket dari Ampas Kelapa',
    imageSeed: 'biomassa-briket-kulit',
    sources: [wikiSource('Biomassa', 'Biomassa'), wikiSource('Briket', 'Briket')],
    body:
      'Ampas kelapa yang dikeringkan dan dipadatkan dapat diolah menjadi briket biomassa, alternatif bahan bakar padat untuk kebutuhan rumah tangga maupun industri kecil menengah.\n\nBriket biomassa dari ampas kelapa menawarkan solusi energi terbarukan yang murah dan mudah didapat di sentra-sentra penghasil kelapa, sekaligus mengurangi tekanan terhadap kebutuhan kayu bakar dari hutan.\n\n' +
      CLOSING_NOTE,
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

    for (const item of DETAIL_ARTICLES) {
      const [existingArticles] = await queryInterface.sequelize.query(
        'SELECT id FROM `Article` WHERE title = :title LIMIT 1',
        { replacements: { title: item.title } }
      );

      if (existingArticles.length > 0) continue;

      const [mainArticles] = await queryInterface.sequelize.query(
        'SELECT id, category_id FROM `Article` WHERE title = :title LIMIT 1',
        { replacements: { title: item.mainArticleTitle } }
      );

      if (mainArticles.length === 0) continue;
      const mainArticle = mainArticles[0];

      const [productCards] = await queryInterface.sequelize.query(
        'SELECT id FROM `ProductCard` WHERE article_id = :articleId AND title = :title LIMIT 1',
        { replacements: { articleId: mainArticle.id, title: item.productTitle } }
      );

      if (productCards.length === 0) continue;
      const productCardId = productCards[0].id;

      await queryInterface.bulkInsert('Article', [
        {
          author_id: authorId,
          category_id: mainArticle.category_id,
          parent_article_id: mainArticle.id,
          article_type: 'detail',
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

      await queryInterface.bulkInsert('ArticleDetail', [
        {
          article_id: articleId,
          body_content: item.body,
          meta_description: item.body.slice(0, 200),
          sections: JSON.stringify([{ section_type: 'info', title: 'Ringkasan', body_content: item.body, video_path: null, image_path: null }]),
          sources: JSON.stringify(item.sources),
          created_at: now,
          updated_at: now,
        },
      ]);

      await queryInterface.bulkInsert('ArticleMedia', [
        {
          article_id: articleId,
          file_path: pic(item.imageSeed),
          media_type: 'image',
          created_at: now,
          updated_at: now,
        },
      ]);

      await queryInterface.sequelize.query(
        'UPDATE `ProductCard` SET linked_article_id = :articleId, image = :image, updated_at = :now WHERE id = :productCardId',
        {
          replacements: { articleId, image: pic(item.imageSeed), productCardId, now },
        }
      );
    }
  },

  async down(queryInterface) {
    const titles = DETAIL_ARTICLES.map((item) => item.title);

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
