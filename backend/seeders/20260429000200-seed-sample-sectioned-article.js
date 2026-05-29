'use strict';

const SAMPLE_TITLE = 'Pemanfaatan Sabut Kelapa Menjadi Cocopeat untuk Media Tanam Komunitas';
const CATEGORY_NAME = 'Pengolahan Kelapa';

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

    if (existingArticles.length > 0) {
      return;
    }

    const [existingCategories] = await queryInterface.sequelize.query(
      'SELECT id FROM `CategoryTag` WHERE name = :name LIMIT 1',
      {
        replacements: { name: CATEGORY_NAME },
      }
    );

    let categoryId = existingCategories[0]?.id;

    if (!categoryId) {
      await queryInterface.bulkInsert('CategoryTag', [
        {
          name: CATEGORY_NAME,
          description: 'Materi pengolahan turunan kelapa berbasis komunitas.',
          created_at: now,
          updated_at: now,
        },
      ]);

      const [insertedCategories] = await queryInterface.sequelize.query(
        'SELECT id FROM `CategoryTag` WHERE name = :name LIMIT 1',
        {
          replacements: { name: CATEGORY_NAME },
        }
      );

      categoryId = insertedCategories[0]?.id;
    }

    if (!categoryId) {
      return;
    }

    await queryInterface.bulkInsert('Article', [
      {
        author_id: admins[0].id,
        parent_article_id: null,
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

    const articleId = insertedArticles[0]?.id;

    if (!articleId) {
      return;
    }

    // Mapping to junction table as per ERD many-to-many design
    await queryInterface.bulkInsert('ArticleCategoryTag', [
      {
        article_id: articleId,
        category_tag_id: categoryId,
        created_at: now,
      },
    ]);

    const sections = [
      {
        title: 'Pengantar',
        body_content:
          'Sabut kelapa sering dianggap sebagai limbah setelah bagian buah kelapa dimanfaatkan. Padahal, material ini memiliki serat dan daya simpan air yang sangat baik untuk diolah menjadi cocopeat.\n\nCocopeat adalah media tanam berbahan dasar serbuk sabut kelapa. Produk ini banyak digunakan dalam pembibitan, hidroponik, dan urban farming karena ringan, mampu menyerap air, serta relatif ramah lingkungan.\n\nDalam konteks community based learning, pengolahan cocopeat dapat menjadi kegiatan belajar bersama yang menghubungkan pengetahuan lokal, praktik lingkungan, dan peluang usaha kecil.',
        video_path: '/uploads/articles/video-proses-cocopeat.mp4',
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
        url: 'https://www.fao.org/4/a1374e/a1374e.pdf',
        file_path: null,
      },
    ];

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

    await queryInterface.bulkInsert('ArticleMedia', [
      {
        article_id: articleId,
        file_path: '/uploads/articles/cocopeat-community.jpg',
        media_type: 'image',
        created_at: now,
        updated_at: now,
      },
      {
        article_id: articleId,
        file_path: '/uploads/articles/video-proses-cocopeat.mp4',
        media_type: 'video',
        created_at: now,
        updated_at: now,
      },
    ]);

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
