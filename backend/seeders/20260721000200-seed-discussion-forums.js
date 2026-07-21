'use strict';

/**
 * Seeds active DiscussionForum topics (one per selected article) plus a
 * kickoff comment for each, using the moderator-forum account as both
 * creator and validator. Article is resolved by title so it stays
 * correct regardless of auto-increment id drift between environments.
 */

const FORUMS = [
  {
    articleTitle: 'Batok Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya',
    title: 'Diskusi: Potensi dan Tantangan Pengolahan Limbah Batok Kelapa',
    summary: 'Ruang berbagi pengalaman dan tanya jawab seputar pengolahan batok kelapa, mulai dari karbonisasi hingga kerajinan tangan.',
    kickoff: 'Selamat datang di forum diskusi Batok Kelapa! Silakan berbagi pengalaman, pertanyaan, atau kendala seputar pengolahan batok kelapa di komunitas masing-masing.',
  },
  {
    articleTitle: 'Serabut Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya',
    title: 'Diskusi: Peluang Usaha dari Olahan Sabut Kelapa',
    summary: 'Diskusikan peluang usaha cocopeat, cocofiber, cocomesh, dan produk turunan sabut kelapa lainnya.',
    kickoff: 'Sabut kelapa punya banyak turunan produk bernilai jual. Yuk diskusikan pengalaman usaha atau kendala produksi cocopeat, cocofiber, cocomesh, maupun cocodust di sini.',
  },
  {
    articleTitle: 'Kulit Kelapa: Karakteristik, Manfaat, dan Cara Pengelolaannya',
    title: 'Diskusi: Kulit Kelapa yang Sering Terbuang, Bagaimana Mengolahnya?',
    summary: 'Forum berbagi pengalaman mengolah kulit kelapa menjadi pupuk organik cair, kompos, hingga pewarna alami.',
    kickoff: 'Kulit kelapa sering dianggap sampah, padahal bisa diolah jadi pupuk organik cair, kompos, sampai pewarna alami. Ada yang sudah mencoba salah satunya?',
  },
  {
    articleTitle: 'Proses Produksi Arang Aktif dari Batok Kelapa',
    title: 'Diskusi: Tips Menjaga Kualitas Arang Aktif dari Batok Kelapa',
    summary: 'Bahas parameter mutu arang aktif seperti kadar air dan daya serap, serta kendala umum di lapangan.',
    kickoff: 'Kualitas arang aktif sangat dipengaruhi kadar air dan daya serapnya. Silakan berbagi tips maupun kendala yang biasa ditemui saat produksi.',
  },
  {
    articleTitle: 'Cara Membuat Briket Arang dari Batok Kelapa',
    title: 'Diskusi: Efisiensi Bahan Bakar Briket Arang Tempurung Kelapa',
    summary: 'Berbagi tips mencetak briket yang padat, cepat menyala, dan tahan lama.',
    kickoff: 'Briket yang baik harus padat, cepat menyala, dan tahan lama. Yuk berbagi resep campuran perekat dan teknik pencetakan yang biasa dipakai.',
  },
  {
    articleTitle: 'Produksi Asap Cair (Liquid Smoke) dari Batok Kelapa',
    title: 'Diskusi: Keamanan dan Manfaat Asap Cair sebagai Pengawet Alami',
    summary: 'Diskusi seputar dosis aman, cara penyimpanan, dan aplikasi asap cair pada makanan.',
    kickoff: 'Asap cair banyak dipakai sebagai pengawet alami, tapi dosis dan cara penyimpanannya perlu diperhatikan. Ada yang punya pengalaman menerapkannya?',
  },
  {
    articleTitle: 'Cara Membuat Cocopeat dari Sabut Kelapa',
    title: 'Diskusi: Cocopeat sebagai Media Tanam Ramah Lingkungan',
    summary: 'Sharing pengalaman menggunakan cocopeat untuk pembibitan dan hidroponik.',
    kickoff: 'Cocopeat cukup populer untuk media pembibitan dan hidroponik. Bagaimana pengalaman kalian mengatur kelembapan dan pH-nya?',
  },
  {
    articleTitle: 'Produksi Cocomesh untuk Reklamasi Lahan Kritis',
    title: 'Diskusi: Cocomesh untuk Reklamasi Lahan Bekas Tambang',
    summary: 'Diskusi teknis pemasangan cocomesh dan efektivitasnya mencegah erosi.',
    kickoff: 'Cocomesh cukup efektif menahan erosi di lahan bekas tambang. Ada yang punya pengalaman soal teknik pemasangan atau daya tahannya di lapangan?',
  },
  {
    articleTitle: 'Cara Membuat Virgin Coconut Oil (VCO) dari Sisa Daging Kelapa',
    title: 'Diskusi: Metode Produksi VCO Skala Rumahan yang Efektif',
    summary: 'Bandingkan metode fermentasi, pemanasan, dan sentrifugasi dalam produksi VCO.',
    kickoff: 'Ada beberapa metode produksi VCO skala rumahan: fermentasi, pemanasan, dan sentrifugasi. Menurut pengalaman kalian, mana yang paling praktis dan hasilnya konsisten?',
  },
  {
    articleTitle: 'Proses Pengomposan Kulit dan Ampas Kelapa',
    title: 'Diskusi: Mempercepat Proses Pengomposan Limbah Kelapa',
    summary: 'Tips mempercepat pengomposan dan menjaga kualitas kompos yang dihasilkan.',
    kickoff: 'Pengomposan kulit dan ampas kelapa biasanya butuh waktu cukup lama. Ada tips mempercepat proses tanpa mengorbankan kualitas komposnya?',
  },
  {
    articleTitle: 'Cara Mengolah Bungkil Kelapa Menjadi Pakan Ternak',
    title: 'Diskusi: Bungkil Kelapa sebagai Alternatif Pakan Ternak Protein Tinggi',
    summary: 'Diskusi dosis pemberian dan pengalaman peternak menggunakan bungkil kelapa.',
    kickoff: 'Bungkil kelapa kaya protein dan cukup terjangkau sebagai campuran pakan ternak. Berapa dosis campuran yang biasa kalian pakai?',
  },
  {
    articleTitle: 'Optimalisasi Proses Fermentasi Nata de Coco dari Limbah Cair Kelapa',
    title: 'Diskusi: Kendala Umum dalam Fermentasi Nata de Coco',
    summary: 'Bahas masalah kontaminasi, ketebalan lapisan nata, dan tips fermentasi yang konsisten.',
    kickoff: 'Kontaminasi dan ketebalan lapisan nata yang tidak konsisten sering jadi kendala fermentasi nata de coco. Ada tips menjaga kebersihan wadah dan starter yang biasa dipakai?',
  },
];

module.exports = {
  async up(queryInterface) {
    const [moderatorRows] = await queryInterface.sequelize.query(
      'SELECT id FROM `User` WHERE email = :email LIMIT 1',
      { replacements: { email: 'moderator.forum@coconexus.local' } }
    );
    const moderatorId = moderatorRows[0] ? moderatorRows[0].id : null;

    if (!moderatorId) {
      return;
    }

    const [articleRows] = await queryInterface.sequelize.query('SELECT id, title FROM `Article`');
    const titleToId = new Map(articleRows.map((row) => [row.title, row.id]));

    const now = new Date();

    for (const item of FORUMS) {
      const articleId = titleToId.get(item.articleTitle);

      if (!articleId) {
        continue;
      }

      const [existing] = await queryInterface.sequelize.query(
        'SELECT id FROM `DiscussionForum` WHERE article_id = :articleId LIMIT 1',
        { replacements: { articleId } }
      );

      if (existing.length > 0) {
        continue;
      }

      await queryInterface.bulkInsert('DiscussionForum', [
        {
          article_id: articleId,
          title: item.title,
          summary: item.summary,
          status: 'active',
          created_by_id: moderatorId,
          validated_by_id: moderatorId,
          validated_at: now,
          notes: null,
          created_at: now,
          updated_at: now,
        },
      ]);

      const [forumRows] = await queryInterface.sequelize.query(
        'SELECT id FROM `DiscussionForum` WHERE article_id = :articleId LIMIT 1',
        { replacements: { articleId } }
      );
      const forumId = forumRows[0].id;

      await queryInterface.bulkInsert('Comment', [
        {
          body: item.kickoff,
          status: 'approved',
          user_id: moderatorId,
          article_id: articleId,
          discussion_forum_id: forumId,
          parent_id: null,
          attachment_name: null,
          attachment_path: null,
          attachment_mime_type: null,
          attachment_size: null,
          created_at: now,
          updated_at: now,
        },
      ]);
    }
  },

  async down(queryInterface) {
    const [articleRows] = await queryInterface.sequelize.query('SELECT id, title FROM `Article`');
    const titleToId = new Map(articleRows.map((row) => [row.title, row.id]));
    const articleIds = FORUMS.map((item) => titleToId.get(item.articleTitle)).filter(Boolean);

    if (articleIds.length === 0) {
      return;
    }

    const [forumRows] = await queryInterface.sequelize.query(
      'SELECT id FROM `DiscussionForum` WHERE article_id IN (:articleIds)',
      { replacements: { articleIds } }
    );
    const forumIds = forumRows.map((row) => row.id);

    if (forumIds.length > 0) {
      await queryInterface.bulkDelete('Comment', { discussion_forum_id: forumIds });
      await queryInterface.bulkDelete('DiscussionForum', { id: forumIds });
    }
  },
};
