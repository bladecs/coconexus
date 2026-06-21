'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const titles = [
      'Panduan Singkat Menyusun Kebun Komunitas',
      'Cara Mengolah Sabut Kelapa Menjadi Cocopeat',
      'Langkah Praktis Mengolah Sampah Organik Rumah Tangga',
      'Panduan Dasar Urban Farming untuk Pemula',
      'Teknik Irigasi Hemat Air untuk Kebun Kecil',
      'Membangun Jaringan Komunitas untuk Pengelolaan Sampah',
      'Panduan Praktis Membuat Pupuk Organik Padat',
      'Cara Mengawetkan Hasil Panen Sederhana di Rumah',
      'Mengenal Teknik Pemuliaan Tanaman Dasar',
      'Panduan Singkat Menyusun Kebun Komunitas'
    ];

    let idx = 1;
    for (const title of titles) {
      try {
        const [aRows] = await queryInterface.sequelize.query('SELECT id FROM `Article` WHERE title = :title LIMIT 1', { replacements: { title } });
        if (!aRows || aRows.length === 0) continue;
        const aid = aRows[0].id;

        // create richer sections content with simple markdown-like formatting
        const sections = [
          {
            title: 'Ringkasan',
            body_content:
              `Ringkasan\n\n${title} adalah panduan praktis yang dirancang agar pembaca mudah memahami teori sekaligus praktik. Dalam ringkasan ini kami menjelaskan tujuan utama, hasil yang diharapkan, dan langkah sederhana yang bisa langsung dicoba oleh komunitas atau rumah tangga.`,
            video_path: null,
          },
          {
            title: 'Langkah Utama',
            body_content:
              'Langkah Utama\n\n1. Persiapan: Siapkan bahan dan alat yang diperlukan. Pastikan lokasi aman dan memiliki akses air.\n\n2. Pelaksanaan: Ikuti tahapan berikut secara berurutan.\n- Buat area kerja yang bersih\n- Lakukan pemrosesan dasar sesuai panduan\n- Catat parameter penting setiap sesi seperti waktu, suhu, dan jumlah bahan\n\n3. Pemeliharaan: Lakukan pengecekan rutin dan dokumentasikan perbaikan yang diperlukan.',
            video_path: null,
          },
          {
            title: 'Tips dan Trik',
            body_content:
              'Tips dan Trik\n\n- Gunakan alat sederhana yang mudah diperoleh agar biaya rendah.\n- Catat hasil setiap minggu untuk melihat tren perbaikan.\n- Berbagi pengalaman antar anggota kelompok untuk mempercepat pembelajaran.\n\nDengan kebiasaan ini, proses akan semakin efisien dan hasil lebih stabil.',
            video_path: null,
          },
        ];

        const sources = [
          { title: 'Jurnal Praktik Lapangan', source_type: 'link', url: 'https://example.com/jurnal-praktik-lapangan', file_path: null },
          { title: 'Artikel Referensi Online', source_type: 'link', url: 'https://www.example.org/research', file_path: null },
        ];

        const body = sections.map((s) => s.body_content).join('\n\n');

        // upsert ArticleDetail
        const [existingDetail] = await queryInterface.sequelize.query('SELECT id FROM `ArticleDetail` WHERE article_id = :aid LIMIT 1', { replacements: { aid } });
        if (!existingDetail || existingDetail.length === 0) {
          await queryInterface.bulkInsert('ArticleDetail', [{ article_id: aid, body_content: body, meta_description: body.slice(0,200), sections: JSON.stringify(sections), sources: JSON.stringify(sources), created_at: now, updated_at: now }]);
        } else {
          await queryInterface.sequelize.query('UPDATE `ArticleDetail` SET body_content = :body, sections = :sections, sources = :sources, updated_at = :now WHERE article_id = :aid', { replacements: { body, sections: JSON.stringify(sections), sources: JSON.stringify(sources), now, aid } });
        }

        // ensure external video media exists for some articles
        const [existingMedia] = await queryInterface.sequelize.query('SELECT id FROM `ArticleMedia` WHERE article_id = :aid LIMIT 1', { replacements: { aid } });
        // ensure external media: one youtube video + one external image
        const imageUrl = `https://picsum.photos/seed/article${idx}/800/480`;
        const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

        if (!existingMedia || existingMedia.length === 0) {
          const rows = [
            { article_id: aid, file_path: videoUrl, media_type: 'video', created_at: now, updated_at: now },
            { article_id: aid, file_path: imageUrl, media_type: 'image', created_at: now, updated_at: now },
          ];
          await queryInterface.bulkInsert('ArticleMedia', rows);
        } else {
          const [hasVideo] = await queryInterface.sequelize.query('SELECT id FROM `ArticleMedia` WHERE article_id = :aid AND (file_path LIKE "https://%" OR media_type = "video") LIMIT 1', { replacements: { aid } });
          if (!hasVideo || hasVideo.length === 0) {
            await queryInterface.bulkInsert('ArticleMedia', [{ article_id: aid, file_path: videoUrl, media_type: 'video', created_at: now, updated_at: now }]);
          }

          const [hasImage] = await queryInterface.sequelize.query('SELECT id FROM `ArticleMedia` WHERE article_id = :aid AND file_path LIKE "https://%" AND media_type = "image" LIMIT 1', { replacements: { aid } });
          if (!hasImage || hasImage.length === 0) {
            await queryInterface.bulkInsert('ArticleMedia', [{ article_id: aid, file_path: imageUrl, media_type: 'image', created_at: now, updated_at: now }]);
          }
        }

        idx += 1;
      } catch (e) {
        // ignore per-article errors
      }
    }
  },

  async down(queryInterface) {
    // do not attempt to revert content edits
  },
};
