'use strict';

const SAMPLE_TITLE = 'Pemanfaatan Sabut Kelapa Menjadi Cocopeat untuk Media Tanam Komunitas';
const CATEGORY_NAME = 'Serabut Kelapa';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@coconexus.local';

    const [admins] = await queryInterface.sequelize.query(
      'SELECT id FROM `User` WHERE email = :email LIMIT 1',
      {
        replacements: { email: adminEmail },
      }
    );

    if (admins.length === 0) {
      return;
    }

    const [existingArticles] = await queryInterface.sequelize.query(
      'SELECT id FROM `Article` WHERE title = :title LIMIT 1',
      {
        replacements: { title: SAMPLE_TITLE },
      }
    );

    let articleId;

    if (existingArticles.length > 0) {
      articleId = existingArticles[0].id;
    }

    const [existingCategories] = await queryInterface.sequelize.query(
      'SELECT id FROM `Category` WHERE name = :name LIMIT 1',
      {
        replacements: { name: CATEGORY_NAME },
      }
    );

    let categoryId = existingCategories[0]?.id;

    if (!categoryId) {
      await queryInterface.bulkInsert('Category', [
        {
          name: CATEGORY_NAME,
          description: 'Materi pengolahan turunan kelapa berbasis komunitas.',
          created_at: now,
          updated_at: now,
        },
      ]);

      const [insertedCategories] = await queryInterface.sequelize.query(
        'SELECT id FROM `Category` WHERE name = :name LIMIT 1',
        {
          replacements: { name: CATEGORY_NAME },
        }
      );

      categoryId = insertedCategories[0]?.id;
    }

    if (!categoryId) {
      return;
    }

    if (!articleId) {
      await queryInterface.bulkInsert('Article', [
        {
          author_id: admins[0].id,
          parent_article_id: null,
          category_id: categoryId,
          title: SAMPLE_TITLE,
          version: 1,
          status: 'published',
          created_at: now,
          updated_at: now,
        },
      ]);

      const [insertedArticles] = await queryInterface.sequelize.query(
        'SELECT id FROM `Article` WHERE title = :title LIMIT 1',
        {
          replacements: { title: SAMPLE_TITLE },
        }
      );

      articleId = insertedArticles[0]?.id;

      if (!articleId) {
        return;
      }
    }

    const sections = [
      {
        title: 'Pengantar',
        body_content:
          '### Gambaran Umum\n\n**Fokus Pembahasan**\n\nSabut kelapa sering dianggap sebagai limbah setelah bagian buah kelapa dimanfaatkan. Padahal, material ini memiliki serat dan daya simpan air yang sangat baik untuk diolah menjadi cocopeat.\n\nCocopeat adalah media tanam berbahan dasar serbuk sabut kelapa. Produk ini banyak digunakan dalam pembibitan, hidroponik, dan urban farming karena ringan, mampu menyerap air, serta relatif ramah lingkungan.\n\n**Hal yang Perlu Dicermati**\n\n- Material sabut kelapa mudah diperoleh di sentra kelapa.\n- Cocopeat cocok untuk pembibitan, urban farming, dan kebun komunitas.\n- Pengolahan sederhana sudah cukup untuk menghasilkan media tanam siap pakai.',
        video_path: '/uploads/articles/video-proses-cocopeat.mp4',
      },
      {
        title: 'Alat dan Bahan',
        body_content:
          '### Alat dan Bahan\n\n**Bahan Utama**\n\n- Sabut kelapa kering\n- Air bersih\n- Wadah perendaman\n\n**Peralatan Kerja**\n\n- Mesin pencacah atau alat pemukul manual\n- Ayakan\n- Karung penyimpanan\n- Sarung tangan dan masker\n\n**Catatan Praktis**\n\nJika belum tersedia mesin pencacah, proses awal bisa dilakukan secara manual. Namun untuk produksi rutin, mesin akan mempercepat proses dan menghasilkan tekstur yang lebih merata.',
        video_path: null,
      },
      {
        title: 'Proses Pembuatan',
        body_content:
          '### Proses Pembuatan\n\n**Langkah Awal**\n\nProses pembuatan cocopeat dimulai dengan memisahkan sabut kelapa dari tempurung dan kotoran kasar. Sabut kemudian dikeringkan agar lebih mudah dicacah.\n\n**Urutan Kerja**\n\n1. Keringkan sabut kelapa.\n2. Cacah sabut menjadi serbuk.\n3. Rendam serbuk dalam air bersih.\n4. Tiriskan dan jemur kembali.\n5. Ayak untuk mendapatkan tekstur halus.\n6. Simpan cocopeat dalam karung bersih.\n\n**Kenapa Penting**\n\nSetelah dicacah, serbuk sabut direndam untuk mengurangi kandungan tanin. Proses perendaman biasanya dilakukan beberapa kali sampai warna air tidak terlalu pekat.',
        video_path: null,
      },
      {
        title: 'Manfaat untuk Komunitas',
        body_content:
          '### Manfaat untuk Komunitas\n\n**Peluang Utama**\n\nPengolahan cocopeat memberi beberapa manfaat bagi komunitas. Pertama, kegiatan ini mengurangi limbah sabut kelapa yang sebelumnya tidak termanfaatkan. Kedua, produk cocopeat dapat digunakan untuk kebun komunitas atau dijual sebagai media tanam.\n\n**Dampak Sosial**\n\n- Membuka ruang belajar bagi anggota komunitas.\n- Mendorong kolaborasi antarwarga.\n- Menambah nilai ekonomi dari limbah yang sebelumnya dibuang.\n\nSelain itu, proses produksinya dapat menjadi ruang belajar bagi anggota komunitas. Masyarakat dapat mempelajari pemilahan bahan, teknik produksi, pengemasan, hingga strategi pemasaran sederhana.',
        video_path: null,
      },
    ];

    const sources = [
      {
        title: 'Coconut Coir as Sustainable Growing Media',
        source_type: 'link',
        url: 'https://www.sciencedirect.com/topics/agricultural-and-biological-sciences/coir',
        file_path: null,
      },
      {
        title: 'Organic Growing Media and Water Retention Study',
        source_type: 'link',
        url: 'https://example.com/referensi-cocopeat',
        file_path: null,
      },
    ];

    // Insert ArticleDetail if missing
    const [existingDetail] = await queryInterface.sequelize.query(
      'SELECT id FROM `ArticleDetail` WHERE article_id = :aid LIMIT 1',
      { replacements: { aid: articleId } }
    );

    if (existingDetail.length === 0) {
      await queryInterface.bulkInsert('ArticleDetail', [
        {
          article_id: articleId,
          body_content: sections.map((section) => section.body_content).join('\n\n'),
          meta_description:
            'Cara komunitas mengolah sabut kelapa menjadi cocopeat sebagai media tanam bernilai ekonomi.',
          sections: JSON.stringify(sections),
          sources: JSON.stringify(sources),
          created_at: now,
          updated_at: now,
        },
      ]);
    }

    // Insert ArticleMedia items if none exist for this article
    const [existingMedia] = await queryInterface.sequelize.query(
      'SELECT id FROM `ArticleMedia` WHERE article_id = :aid LIMIT 1',
      { replacements: { aid: articleId } }
    );

    if (existingMedia.length === 0) {
      await queryInterface.bulkInsert('ArticleMedia', [
        {
          article_id: articleId,
          file_path: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=1200',
          media_type: 'image',
          created_at: now,
          updated_at: now,
        },
        {
          article_id: articleId,
          file_path: 'https://assets.mixkit.co/videos/preview/mixkit-agriculture-machinery-processing-crops-42250-large.mp4',
          media_type: 'video',
          created_at: now,
          updated_at: now,
        },
      ]);
    }

    // Insert ProductCards if none exist for this article
    const [existingProducts] = await queryInterface.sequelize.query(
      'SELECT id FROM `ProductCard` WHERE article_id = :aid LIMIT 1',
      { replacements: { aid: articleId } }
    );

    if (existingProducts.length === 0) {
      await queryInterface.bulkInsert('ProductCard', [
        {
          article_id: articleId,
          title: 'Cocopeat Siap Pakai',
          description: 'Media tanam dari serbuk sabut kelapa untuk pembibitan dan urban farming.',
          image: '/uploads/articles/cocopeat-community.jpg',
          linked_article_id: null,
          created_at: now,
          updated_at: now,
        },
        {
          article_id: articleId,
          title: 'Pelatihan Produksi Komunitas',
          description: 'Aktivitas belajar bersama untuk mengolah limbah sabut menjadi produk bernilai.',
          image: '/uploads/articles/cocopeat-community.jpg',
          linked_article_id: null,
          created_at: now,
          updated_at: now,
        },
      ]);
    }
  },

  async down(queryInterface) {
    const [articles] = await queryInterface.sequelize.query(
      'SELECT id FROM `Article` WHERE title = :title LIMIT 1',
      {
        replacements: { title: SAMPLE_TITLE },
      }
    );

    if (articles.length === 0) {
      return;
    }

    await queryInterface.bulkDelete('Article', {
      id: articles[0].id,
    });
  },
};
