'use strict';

const {
  Article,
  ArticleDetail,
  ArticleMedia,
  ArticleView,
  Category,
  Tag,
  Comment,
  ProductCard,
  ArticleVersion,
  User,
  UserProfile,
  sequelize,
} = require('../models');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { badRequest, forbidden, notFound } = require('../utils/httpErrors');
const fs = require('fs');
const path = require('path');
const { uploadRoot } = require('../config/storage');
const {
  isNonEmptyString,
  isValidArticleStatus,
  normalizeStatus,
  normalizeCategoryName,
} = require('../utils/validators');
const { sanitizeArticle } = require('../utils/serializers');
const { writeAuditLog } = require('../utils/auditLogger');
const { hasModeratorScope } = require('../utils/accessControl');

const WAWASAN_MIN_BODY_LENGTH = 500;

function hashIp(value) {
  if (!value) {
    return null;
  }

  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

async function recordArticleView(req, articleId) {
  await ArticleView.create({
    article_id: articleId,
    user_id: req.user?.id || null,
    session_id:
      typeof req.headers['x-coconexus-session-id'] === 'string'
        ? req.headers['x-coconexus-session-id'].slice(0, 120)
        : null,
    ip_hash: hashIp(req.ip || req.headers['x-forwarded-for']),
    user_agent:
      typeof req.headers['user-agent'] === 'string'
        ? req.headers['user-agent'].slice(0, 255)
        : null,
    read_duration_seconds: 0,
  });
}

function normalizeMediaInput(mediaInput) {
  if (mediaInput === undefined || mediaInput === null) {
    return [];
  }

  if (!Array.isArray(mediaInput)) {
    throw badRequest('media harus berupa array.');
  }

  return mediaInput.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw badRequest(`media[${index}] tidak valid.`);
    }

    const filePath = typeof item.file_path === 'string' ? item.file_path.trim() : '';
    const mediaType = typeof item.media_type === 'string' ? item.media_type.trim() : '';

    if (!filePath) {
      throw badRequest(`media[${index}].file_path wajib diisi.`);
    }

    if (!mediaType) {
      throw badRequest(`media[${index}].media_type wajib diisi.`);
    }

    return {
      file_path: filePath,
      media_type: mediaType,
    };
  });
}

function isExternalUrl(p) {
  return typeof p === 'string' && /^(https?:)\/\//i.test(p);
}

function isFolderRef(p) {
  return typeof p === 'string' && p.startsWith('folder:');
}

function inferMediaTypeFromFilename(filename) {
  const ext = path.extname(filename || '').toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) return 'image';
  if (['.mp4', '.mov', '.webm'].includes(ext)) return 'video';
  return 'document';
}

async function processMediaItemsForStorage(mediaItems) {
  // returns expanded array of { file_path, media_type }
  const out = [];
  const articleDir = path.join(uploadRoot, 'articles');

  for (const item of mediaItems) {
    const fp = item.file_path;
    const mt = item.media_type;

    if (isExternalUrl(fp)) {
      // external link: leave as-is
      out.push({ file_path: fp, media_type: mt });
      continue;
    }

    if (isFolderRef(fp)) {
      // folder:relative/path or folder:C:\absolute\path
      const folderPathRaw = fp.slice('folder:'.length).trim();
      if (!folderPathRaw) continue;

      // resolve relative to project root if not absolute
      const candidate = path.isAbsolute(folderPathRaw)
        ? folderPathRaw
        : path.resolve(process.cwd(), folderPathRaw);

      let files;
      try {
        files = await fs.promises.readdir(candidate, { withFileTypes: true });
      } catch (e) {
        // skip if folder not accessible
        continue;
      }

      for (const dirent of files) {
        if (!dirent.isFile()) continue;
        const src = path.join(candidate, dirent.name);
        const ext = path.extname(dirent.name).toLowerCase();
        const safeBase = path.basename(dirent.name, ext).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0,60) || 'file';
        const newName = `${Date.now()}-${safeBase}${ext}`;
        const dest = path.join(articleDir, newName);
        try {
          await fs.promises.copyFile(src, dest);
          out.push({ file_path: `/uploads/articles/${newName}`, media_type: inferMediaTypeFromFilename(dirent.name) });
        } catch (e) {
          // ignore individual file copy errors
        }
      }

      continue;
    }

    // treat as existing uploaded path (starting with /uploads/) or other server-relative path
    if (typeof fp === 'string' && fp.startsWith('/uploads/')) {
      out.push({ file_path: fp, media_type: mt });
      continue;
    }

    // if absolute path on server, try to copy single file
    if (typeof fp === 'string' && path.isAbsolute(fp)) {
      const src = fp;
      const ext = path.extname(src).toLowerCase();
      const safeBase = path.basename(src, ext).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0,60) || 'file';
      const newName = `${Date.now()}-${safeBase}${ext}`;
      const dest = path.join(articleDir, newName);
      try {
        await fs.promises.copyFile(src, dest);
        out.push({ file_path: `/uploads/articles/${newName}`, media_type: inferMediaTypeFromFilename(src) });
      } catch (e) {
        // ignore
      }
      continue;
    }

    // fallback: accept as-is
    out.push({ file_path: fp, media_type: mt });
  }

  return out;
}

function normalizeProductCardInput(productCardInput) {
  if (productCardInput === undefined || productCardInput === null) {
    return [];
  }

  if (!Array.isArray(productCardInput)) {
    throw badRequest('product_cards harus berupa array.');
  }

  return productCardInput.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw badRequest(`product_cards[${index}] tidak valid.`);
    }

    const title = typeof item.title === 'string' ? item.title.trim() : '';
    const description = typeof item.description === 'string' ? item.description.trim() : '';
    const image = typeof item.image === 'string' ? item.image.trim() : null;
    const processingMethod = typeof item.processing_method === 'string' ? item.processing_method.trim() : null;

    if (!title) {
      throw badRequest(`product_cards[${index}].title wajib diisi.`);
    }

    if (!description) {
      throw badRequest(`product_cards[${index}].description wajib diisi.`);
    }

    return {
      title,
      description,
      image: image || null,
      processing_method: processingMethod || null,
    };
  });
}

function normalizeSectionInput(sectionInput, fallbackBodyContent = '') {
  if (sectionInput === undefined || sectionInput === null) {
    return fallbackBodyContent
      ? [
          {
            title: 'Ringkasan',
            body_content: fallbackBodyContent,
            video_path: null,
          },
        ]
      : [];
  }

  if (!Array.isArray(sectionInput)) {
    throw badRequest('sections harus berupa array.');
  }

  return sectionInput
    .map((item, index) => {
      if (!item || typeof item !== 'object') {
        throw badRequest(`sections[${index}] tidak valid.`);
      }

      const title = typeof item.title === 'string' ? item.title.trim() : '';
      const bodyContent = typeof item.body_content === 'string' ? item.body_content.trim() : '';
      const videoPath = typeof item.video_path === 'string' ? item.video_path.trim() : '';
      const imagePath = typeof item.image_path === 'string' ? item.image_path.trim() : '';
      const validSectionTypes = ['info', 'procedure', 'tools', 'data_table', 'warning', 'formula', 'troubleshooting'];
      const sectionType = validSectionTypes.includes(item.section_type) ? item.section_type : 'info';

      if (!title) {
        throw badRequest(`sections[${index}].title wajib diisi.`);
      }

      if (!bodyContent) {
        throw badRequest(`sections[${index}].body_content wajib diisi.`);
      }

      return {
        title,
        body_content: bodyContent,
        video_path: videoPath || null,
        image_path: imagePath || null,
        section_type: sectionType,
      };
    })
    .filter((item) => item.title || item.body_content || item.video_path || item.image_path);
}

function normalizeSourceInput(sourceInput) {
  if (sourceInput === undefined || sourceInput === null) {
    return [];
  }

  if (!Array.isArray(sourceInput)) {
    throw badRequest('sources harus berupa array.');
  }

  return sourceInput
    .map((item, index) => {
      if (!item || typeof item !== 'object') {
        throw badRequest(`sources[${index}] tidak valid.`);
      }

      const title = typeof item.title === 'string' ? item.title.trim() : '';
      const sourceType = typeof item.source_type === 'string' ? item.source_type.trim() : 'link';
      const url = typeof item.url === 'string' ? item.url.trim() : '';
      const filePath = typeof item.file_path === 'string' ? item.file_path.trim() : '';

      if (!title) {
        throw badRequest(`sources[${index}].title wajib diisi.`);
      }

      if (sourceType !== 'link') {
        throw badRequest(`sources[${index}].source_type hanya boleh link.`);
      }

      if (!url) {
        throw badRequest(`sources[${index}].url wajib diisi untuk sumber link.`);
      }

      return {
        title,
        source_type: sourceType,
        url: url || null,
        file_path: filePath || null,
      };
    })
    .filter((item) => item.title);
}

function normalizeTagInput(tagInput) {
  if (tagInput === undefined || tagInput === null) {
    return [];
  }

  const rawTags = Array.isArray(tagInput)
    ? tagInput
    : typeof tagInput === 'string'
      ? tagInput.split(',')
      : [];

  return [...new Set(
    rawTags
      .map((item) => {
        if (typeof item !== 'string') {
          return '';
        }

        return item.trim().replace(/\s+/g, ' ');
      })
      .filter(Boolean)
  )];
}

function normalizeTechnicalFields(body) {
  const validDifficulty = ['pemula', 'menengah', 'lanjutan'];
  return {
    difficulty_level: validDifficulty.includes(body.difficulty_level) ? body.difficulty_level : undefined,
    time_required_minutes:
      body.time_required_minutes !== undefined
        ? (Number.isInteger(Number(body.time_required_minutes)) ? Math.max(0, Number(body.time_required_minutes)) : null)
        : undefined,
    materials_list: Array.isArray(body.materials_list) ? body.materials_list : (body.materials_list === null ? null : undefined),
    tools_list: Array.isArray(body.tools_list) ? body.tools_list : (body.tools_list === null ? null : undefined),
    process_parameters: body.process_parameters !== undefined ? body.process_parameters : undefined,
    quality_indicators: body.quality_indicators !== undefined ? body.quality_indicators : undefined,
    safety_notes:
      body.safety_notes !== undefined
        ? (typeof body.safety_notes === 'string' ? body.safety_notes.trim() || null : null)
        : undefined,
    prerequisite_article_ids:
      Array.isArray(body.prerequisite_article_ids) ? body.prerequisite_article_ids : (body.prerequisite_article_ids === null ? null : undefined),
  };
}

async function syncArticleTags(article, tagInput, transaction) {
  const tagNames = normalizeTagInput(tagInput);
  const tagInstances = [];

  for (const name of tagNames) {
    const [tag] = await Tag.findOrCreate({
      where: { name },
      defaults: {
        name,
        description: null,
      },
      transaction,
    });

    tagInstances.push(tag);
  }

  await article.setTags(tagInstances, { transaction });
}

function normalizeOptionalPositiveInteger(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const normalized = Number(value);
  return Number.isInteger(normalized) && normalized > 0 ? normalized : null;
}

async function validateParentArticle(parentArticleId, transaction) {
  if (!parentArticleId) {
    return null;
  }

  const parentArticle = await Article.findOne({
    where: {
      id: parentArticleId,
      parent_article_id: null,
    },
    transaction,
  });

  if (!parentArticle) {
    throw notFound('Artikel utama untuk linking tidak ditemukan.');
  }

  return parentArticle;
}

async function validateLinkedProductCard(linkedProductCardId, parentArticleId, currentArticleId, transaction) {
  if (!linkedProductCardId) {
    return null;
  }

  const productCard = await ProductCard.findByPk(linkedProductCardId, { transaction });

  if (!productCard) {
    throw notFound('Product card yang dipilih tidak ditemukan.');
  }

  if (!parentArticleId || productCard.article_id !== parentArticleId) {
    throw badRequest('Product card harus berasal dari artikel utama yang dipilih.');
  }

  if (productCard.linked_article_id && productCard.linked_article_id !== currentArticleId) {
    throw badRequest('Product card yang dipilih sudah terhubung ke artikel detail lain.');
  }

  return productCard;
}

async function syncProductCardLink({
  articleId,
  currentLinkedProductCardId,
  nextLinkedProductCardId,
  parentArticleId,
  transaction,
}) {
  if (currentLinkedProductCardId && currentLinkedProductCardId !== nextLinkedProductCardId) {
    await ProductCard.update(
      { linked_article_id: null },
      {
        where: {
          id: currentLinkedProductCardId,
        },
        transaction,
      }
    );
  }

  if (!nextLinkedProductCardId) {
    return;
  }

  const linkedProductCard = await validateLinkedProductCard(
    nextLinkedProductCardId,
    parentArticleId,
    articleId,
    transaction
  );

  await linkedProductCard.update(
    {
      linked_article_id: articleId,
    },
    { transaction }
  );
}

function buildArticleVersionSnapshot(articleInstance) {
  const article = articleInstance.toJSON ? articleInstance.toJSON() : articleInstance;

  return {
    title: article.title,
    category_id: article.category_id,
    parent_article_id: article.parent_article_id,
    status: article.status,
    version: article.version,
    detail: article.detail
      ? {
          body_content: article.detail.body_content,
          meta_description: article.detail.meta_description,
          sections: Array.isArray(article.detail.sections) ? article.detail.sections : [],
          sources: Array.isArray(article.detail.sources) ? article.detail.sources : [],
        }
      : null,
    tags: Array.isArray(article.tags) ? article.tags.map((tag) => tag.name) : [],
    media: Array.isArray(article.media)
      ? article.media.map((media) => ({
          file_path: media.file_path,
          media_type: media.media_type,
        }))
      : [],
    product_cards: Array.isArray(article.productCards)
      ? article.productCards
          .filter((productCard) => !productCard.linked_article_id)
          .map((productCard) => ({
            title: productCard.title,
            description: productCard.description,
            image: productCard.image,
            processing_method: productCard.processing_method,
          }))
      : [],
    linked_product_card_id: article.linkedProductCard?.id || null,
  };
}

async function recordArticleVersionSnapshot({
  articleSnapshot,
  articleId,
  versionNumber,
  sourceVersionNumber = null,
  action,
  actorId = null,
  transaction,
}) {
  return ArticleVersion.create(
    {
      article_id: articleId,
      version_number: versionNumber,
      source_version_number: sourceVersionNumber,
      action,
      snapshot: articleSnapshot,
      actor_id: actorId,
    },
    { transaction }
  );
}

async function applyArticleVersionSnapshot({
  article,
  snapshot,
  actorId,
  transaction,
}) {
  article.title = snapshot.title;
  article.category_id = snapshot.category_id;
  article.parent_article_id = snapshot.parent_article_id;
  article.status = 'published';
  article.version += 1;

  await article.save({ transaction });

  if (!article.detail) {
    article.detail = await ArticleDetail.create(
      {
        article_id: article.id,
        body_content: snapshot.detail?.body_content || '',
        meta_description: snapshot.detail?.meta_description || null,
        sections: snapshot.detail?.sections || [],
        sources: snapshot.detail?.sources || [],
      },
      { transaction }
    );
  } else if (snapshot.detail) {
    article.detail.body_content = snapshot.detail.body_content || '';
    article.detail.meta_description = snapshot.detail.meta_description || null;
    article.detail.sections = snapshot.detail.sections || [];
    article.detail.sources = snapshot.detail.sources || [];
    await article.detail.save({ transaction });
  }

  await syncArticleTags(article, snapshot.tags || [], transaction);

  await ArticleMedia.destroy({
    where: { article_id: article.id },
    transaction,
  });

  if (Array.isArray(snapshot.media) && snapshot.media.length > 0) {
    await ArticleMedia.bulkCreate(
      snapshot.media.map((item) => ({
        article_id: article.id,
        file_path: item.file_path,
        media_type: item.media_type,
      })),
      { transaction }
    );
  }

  await ProductCard.destroy({
    where: {
      article_id: article.id,
      linked_article_id: null,
    },
    transaction,
  });

  if (Array.isArray(snapshot.product_cards) && snapshot.product_cards.length > 0) {
    await ProductCard.bulkCreate(
      snapshot.product_cards.map((item) => ({
        article_id: article.id,
        title: item.title,
        description: item.description,
        image: item.image,
        processing_method: item.processing_method,
      })),
      { transaction }
    );
  }

  await syncProductCardLink({
    articleId: article.id,
    currentLinkedProductCardId: article.linkedProductCard?.id || null,
    nextLinkedProductCardId: snapshot.linked_product_card_id || null,
    parentArticleId: article.parent_article_id,
    transaction,
  });

  await recordArticleVersionSnapshot({
    articleSnapshot: snapshot,
    articleId: article.id,
    versionNumber: article.version,
    sourceVersionNumber: snapshot.version,
    action: 'publish_version',
    actorId,
    transaction,
  });

  return article;
}

async function getArticleVersionByNumberOrThrow(articleId, versionNumber, transaction) {
  const articleVersion = await ArticleVersion.findOne({
    where: {
      article_id: articleId,
      version_number: versionNumber,
    },
    transaction,
  });

  if (!articleVersion) {
    throw notFound('Versi artikel tidak ditemukan.');
  }

  return articleVersion;
}

async function findOrCreateCategory(categoryPayload, transaction) {
  const categoryId = categoryPayload && categoryPayload.id ? Number(categoryPayload.id) : null;
  const categoryName = normalizeCategoryName(categoryPayload && categoryPayload.name);
  const categoryDescription =
    categoryPayload && typeof categoryPayload.description === 'string'
      ? categoryPayload.description.trim()
      : null;

  if (categoryId) {
    const existingCategory = await Category.findByPk(categoryId, { transaction });

    if (!existingCategory) {
      throw notFound('Kategori tidak ditemukan.');
    }

    return existingCategory;
  }

  if (!categoryName) {
    throw badRequest('Kategori wajib diisi melalui category.id atau category.name.');
  }

  const existingByName = await Category.findOne({
    where: { name: categoryName },
    transaction,
  });

  if (existingByName) {
    return existingByName;
  }

  return Category.create(
    {
      name: categoryName,
      description: categoryDescription,
    },
    { transaction }
  );
}

async function getArticleByIdOrThrow(articleId, options = {}) {
  const article = await Article.findByPk(articleId, {
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'email', 'role', 'created_at', 'updated_at'],
        include: [
          {
            model: UserProfile,
            as: 'profile',
            attributes: ['user_id', 'full_name', 'bio', 'avatar_url'],
          },
        ],
      },
      {
        model: Category,
        as: 'category',
      },
      {
        model: Tag,
        as: 'tags',
        through: {
          attributes: [],
        },
        attributes: ['id', 'name', 'description'],
      },
      {
        model: ArticleDetail,
        as: 'detail',
      },
      {
        model: ArticleMedia,
        as: 'media',
      },
      {
        model: Article,
        as: 'parentArticle',
        attributes: ['id', 'title', 'category_id', 'status'],
      },
      {
        model: Article,
        as: 'wawasanArticle',
        attributes: ['id', 'title', 'article_type', 'status'],
      },
      {
        model: Article,
        as: 'technicalArticles',
        attributes: ['id', 'title', 'article_type', 'status'],
        where: { status: 'published' },
        required: false,
      },
      {
        model: ProductCard,
        as: 'productCards',
        separate: true,
        order: [['created_at', 'ASC']],
        include: [
          {
            model: Article,
            as: 'linkedArticle',
            attributes: ['id', 'title', 'status'],
          },
        ],
      },
      {
        model: ProductCard,
        as: 'linkedProductCard',
        include: [
          {
            model: Article,
            as: 'linkedArticle',
            attributes: ['id', 'title', 'status'],
          },
        ],
      },
    ],
    ...options,
  });

  if (!article) {
    throw notFound('Artikel tidak ditemukan.');
  }

  return article;
}

// async function listPublishedArticles(req, res, next) {
//   try {
//     const page = Math.max(Number(req.query.page || 1), 1);
//     const limit = Math.min(Math.max(Number(req.query.limit || 6), 1), 50);
//     const offset = (page - 1) * limit;
//     const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
//     const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
//     const tag = typeof req.query.tag === 'string' ? req.query.tag.trim() : '';
//     const where = {
//       status: 'published',
//     };

//     if (search) {
//       where[Op.or] = [
//         { title: { [Op.like]: `%${search}%` } },
//         { '$detail.body_content$': { [Op.like]: `%${search}%` } },
//         { '$detail.meta_description$': { [Op.like]: `%${search}%` } },
//       ];
//     }

//     if (category) {
//       where['$category.name$'] = {
//         [Op.like]: `%${category}%`,
//       };
//     }

//     const { rows: articles, count } = await Article.findAndCountAll({
//     where,
//       include: [
//         {
//           model: User,
//           as: 'author',
//           attributes: ['id', 'email', 'role'],
//           include: [
//             {
//               model: UserProfile,
//               as: 'profile',
//               attributes: ['user_id', 'full_name', 'bio', 'avatar_url'],
//             },
//           ],
//         },
//         {
//           model: Category,
//           as: 'category',
//           duplicating: false
//         },
//         {
//           model: Tag,
//           as: 'tags',
//           through: {
//             attributes: [],
//           },
//           attributes: ['id', 'name', 'description'],
//           where: tag ? { name: tag } : undefined, 
//           required: !!tag 
//         },
//         {
//           model: ArticleDetail,
//           as: 'detail',
//           duplicating: false 
//         },
//         {
//           model: ArticleMedia,
//           as: 'media',
//         },
//       ],
//       order: [['created_at', 'DESC']],
//       limit,
//       offset,
//       distinct: true,
//     });

//     return res.status(200).json({
//       success: true,
//       message: 'Daftar artikel published berhasil diambil.',
//       data: {
//         articles: articles.map((article) => sanitizeArticle(article, { includeComments: false })),
//         meta: {
//           page,
//           limit,
//           total_items: count,
//           total_pages: Math.ceil(count / limit),
//           search,
//           category,
//         },
//       },
//     });
//   } catch (error) {
//     return next(error);
//   }
// }

async function listPublishedArticles(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 6), 1), 50);
    const offset = (page - 1) * limit;

    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const tag = typeof req.query.tag === 'string' ? req.query.tag.trim() : '';
    const validArticleTypes = ['main', 'detail', 'prosedur', 'panduan', 'referensi', 'studi_kasus', 'troubleshooting'];
    const articleTypeFilter = validArticleTypes.includes(req.query.article_type) ? req.query.article_type : '';
    const validDifficulty = ['pemula', 'menengah', 'lanjutan'];
    const difficultyFilter = validDifficulty.includes(req.query.difficulty_level) ? req.query.difficulty_level : '';

    // 1. Where utama hanya fokus pada tabel Article dan Search konten
    const where = {
      status: 'published',
    };

    if (articleTypeFilter) {
      where.article_type = articleTypeFilter;
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { '$detail.body_content$': { [Op.like]: `%${search}%` } },
        { '$detail.meta_description$': { [Op.like]: `%${search}%` } },
      ];
    }

    // CATATAN: Logika filter "where['$category.name$']" sudah dihapus dari sini!

    const { rows: articles, count } = await Article.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'email', 'role'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['user_id', 'full_name', 'bio', 'avatar_url'],
            },
          ],
        },
        {
          model: Category,
          as: 'category',
          // 2. Filter Kategori dipindah ke sini
          where: category ? { name: { [Op.like]: `%${category}%` } } : undefined,
          required: !!category, // Memaksa database melakukan INNER JOIN ke dalam subquery
        },
        {
          model: Tag,
          as: 'tags',
          through: { attributes: [] },
          attributes: ['id', 'name', 'description'],
          // 3. Filter Tag dipindah ke sini
          where: tag ? { name: tag } : undefined,
          required: !!tag,
        },
        {
          model: ArticleDetail,
          as: 'detail',
          required: !!(search || difficultyFilter),
          duplicating: false,
          where: difficultyFilter ? { difficulty_level: difficultyFilter } : undefined,
        },
        {
          model: ArticleMedia,
          as: 'media',
          duplicating: false,
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true, // Memastikan jumlah count() akurat meski ada tags & media
    });

    const articleIds = articles.map((a) => a.id);
    const viewCountMap = {};
    if (articleIds.length) {
      const rows = await sequelize.query(
        `SELECT article_id, COUNT(*) AS view_count FROM \`ArticleView\` WHERE article_id IN (:ids) GROUP BY article_id`,
        { replacements: { ids: articleIds }, type: sequelize.QueryTypes.SELECT }
      );
      rows.forEach((r) => { viewCountMap[r.article_id] = Number(r.view_count); });
    }

    return res.status(200).json({
      success: true,
      message: 'Daftar artikel published berhasil diambil.',
      data: {
        articles: articles.map((article) => ({
          ...sanitizeArticle(article, { includeComments: false }),
          view_count: viewCountMap[article.id] || 0,
        })),
        meta: {
          page,
          limit,
          total_items: count,
          total_pages: Math.ceil(count / limit),
          search,
          category,
          tag,
          article_type: articleTypeFilter,
          difficulty_level: difficultyFilter,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function listFeaturedMainArticles(req, res, next) {
  try {
    const articles = await Article.findAll({
      where: {
        status: 'published',
        article_type: 'main',
        is_home_featured: true,
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'email', 'role'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['user_id', 'full_name', 'bio', 'avatar_url'],
            },
          ],
        },
        {
          model: Category,
          as: 'category',
        },
        {
          model: ArticleDetail,
          as: 'detail',
        },
        {
          model: ArticleMedia,
          as: 'media',
        },
        {
          model: ProductCard,
          as: 'productCards',
          separate: true,
          order: [['created_at', 'ASC']],
        },
      ],
      order: [['category_id', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Daftar artikel utama homepage berhasil diambil.',
      data: {
        articles: articles.map((article) => sanitizeArticle(article, { includeComments: false })),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getPublishedArticleDetail(req, res, next) {
  try {
    const articleId = Number(req.params.id);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      throw badRequest('Parameter article id tidak valid.');
    }

    const article = await Article.findOne({
      where: {
        id: articleId,
        status: 'published',
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'email', 'role'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['user_id', 'full_name', 'bio', 'avatar_url'],
            },
          ],
        },
        {
          model: Category,
          as: 'category',
        },
        {
          model: Tag,
          as: 'tags',
          through: {
            attributes: [],
          },
          attributes: ['id', 'name', 'description'],
        },
        {
          model: ArticleDetail,
          as: 'detail',
        },
        {
          model: ArticleMedia,
          as: 'media',
        },
        {
          model: Article,
          as: 'parentArticle',
          attributes: ['id', 'title', 'category_id', 'status'],
        },
        {
          model: Article,
          as: 'wawasanArticle',
          attributes: ['id', 'title', 'article_type', 'status'],
        },
        {
          model: Article,
          as: 'technicalArticles',
          attributes: ['id', 'title', 'article_type', 'status'],
          where: { status: 'published' },
          required: false,
        },
        {
          model: ProductCard,
          as: 'productCards',
          separate: true,
          order: [['created_at', 'ASC']],
          include: [
            {
              model: Article,
              as: 'linkedArticle',
              attributes: ['id', 'title', 'status'],
            },
          ],
        },
        {
          model: ProductCard,
          as: 'linkedProductCard',
          include: [
            {
              model: Article,
              as: 'linkedArticle',
              attributes: ['id', 'title', 'status'],
            },
          ],
        },
        {
          model: Comment,
          as: 'comments',
          separate: true,
          where: {
            status: 'approved',
          },
          order: [['created_at', 'ASC']],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'email', 'role'],
              include: [
                {
                  model: UserProfile,
                  as: 'profile',
                  attributes: ['user_id', 'full_name', 'bio', 'avatar_url'],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!article) {
      throw notFound('Artikel published tidak ditemukan.');
    }

    await recordArticleView(req, article.id);

    const viewCount = await ArticleView.count({ where: { article_id: article.id } });

    return res.status(200).json({
      success: true,
      message: 'Detail artikel berhasil diambil.',
      data: {
        article: {
          ...sanitizeArticle(article),
          view_count: viewCount,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

// async function listAdminArticles(req, res, next) {
//   try {
//     const page = Math.max(Number(req.query.page || 1), 1);
//     const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50);
//     const offset = (page - 1) * limit;
//     const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
//     const status = typeof req.query.status === 'string' ? req.query.status.trim().toLowerCase() : '';
//     const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
//     const authorOnly = req.query.author_only === 'true' || req.query.author_only === '1';
//     const where = {};

//     // If author_only, filter by current user
//     if (authorOnly) {
//       where.author_id = req.user.id;
//     }

//     if (search) {
//       where[Op.or] = [
//         { title: { [Op.like]: `%${search}%` } },
//         { '$detail.body_content$': { [Op.like]: `%${search}%` } },
//         { '$author.profile.full_name$': { [Op.like]: `%${search}%` } },
//       ];
//     }

//     if (status && ['draft', 'revision', 'published'].includes(status)) {
//       where.status = status;
//     }

//     if (category) {
//       where['$category.name$'] = {
//         [Op.like]: `%${category}%`,
//       };
//     }

//     const { rows: articles, count } = await Article.findAndCountAll({
//       where,
//       include: [
//         {
//           model: User,
//           as: 'author',
//           attributes: ['id', 'email', 'role'],
//           include: [
//             {
//               model: UserProfile,
//               as: 'profile',
//               attributes: ['user_id', 'full_name', 'bio', 'avatar_url'],
//             },
//           ],
//         },
//         {
//           model: Category,
//           as: 'category',
//         },
//         {
//           model: Tag,
//           as: 'tags',
//           through: {
//             attributes: [],
//           },
//           attributes: ['id', 'name', 'description'],
//         },
//         {
//           model: ArticleDetail,
//           as: 'detail',
//         },
//         {
//           model: ArticleMedia,
//           as: 'media',
//         },
//       ],
//       order: [['updated_at', 'DESC']],
//       limit,
//       offset,
//       distinct: true,
//     });

//     return res.status(200).json({
//       success: true,
//       message: 'Daftar artikel admin berhasil diambil.',
//       data: {
//         articles: articles.map((article) => sanitizeArticle(article, { includeComments: false })),
//         meta: {
//           page,
//           limit,
//           total_items: count,
//           total_pages: Math.ceil(count / limit),
//           search,
//           status,
//           category,
//         },
//       },
//     });
//   } catch (error) {
//     return next(error);
//   }
// }

async function listAdminArticles(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 500), 1), 500);
    const offset = (page - 1) * limit;

    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.trim().toLowerCase() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const tag = typeof req.query.tag === 'string' ? req.query.tag.trim() : ''; // Opsional jika ingin support filter tag di admin
    const authorOnly = req.query.author_only === 'true' || req.query.author_only === '1';

    const where = {};

    if (authorOnly) {
      where.author_id = req.user.id;
    }

    if (status && ['draft', 'revision', 'published'].includes(status)) {
      where.status = status;
    }

    // Klausa search utama tetap sama
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { '$detail.body_content$': { [Op.like]: `%${search}%` } },
        { '$author.profile.full_name$': { [Op.like]: `%${search}%` } },
      ];
    }

    // CATATAN: Filter 'where['$category.name$']' sengaja dihapus dari sini karena dipindahkan ke bawah

    const { rows: articles, count } = await Article.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'email', 'role'],
          required: !!search, // <--- PENTING: Memaksa JOIN User masuk subquery saat search aktif
          duplicating: false,
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['user_id', 'full_name', 'bio', 'avatar_url'],
              required: !!search, // <--- PENTING: Memaksa JOIN Profile masuk subquery saat search aktif
              duplicating: false,
            },
          ],
        },
        {
          model: Category,
          as: 'category',
          // Memindahkan filter kategori langsung ke dalam modelnya
          where: category ? { name: { [Op.like]: `%${category}%` } } : undefined,
          required: !!category, // <--- PENTING: Memaksa JOIN Kategori jika ada filter kategori
          duplicating: false,
        },
        {
          model: Tag,
          as: 'tags',
          through: { attributes: [] },
          attributes: ['id', 'name', 'description'],
          where: tag ? { name: tag } : undefined,
          required: !!tag,
        },
        {
          model: ArticleDetail,
          as: 'detail',
          required: !!search, // <--- PENTING: Memaksa JOIN Detail masuk subquery saat search aktif
          duplicating: false,
        },
        {
          model: ArticleMedia,
          as: 'media',
          duplicating: false,
        },
      ],
      order: [['updated_at', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    const articleIds = articles.map((a) => a.id);
    const viewCountMap = {};
    if (articleIds.length) {
      const rows = await sequelize.query(
        `SELECT article_id, COUNT(*) AS view_count FROM \`ArticleView\` WHERE article_id IN (:ids) GROUP BY article_id`,
        { replacements: { ids: articleIds }, type: sequelize.QueryTypes.SELECT }
      );
      rows.forEach((r) => { viewCountMap[r.article_id] = Number(r.view_count); });
    }

    return res.status(200).json({
      success: true,
      message: 'Daftar artikel admin berhasil diambil.',
      data: {
        articles: articles.map((article) => ({
          ...sanitizeArticle(article, { includeComments: false }),
          view_count: viewCountMap[article.id] || 0,
        })),
        meta: {
          page,
          limit,
          total_items: count,
          total_pages: Math.ceil(count / limit),
          search,
          status,
          category,
          tag,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function createArticle(req, res, next) {
  const transaction = await sequelize.transaction();

  try {
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    let bodyContent = typeof req.body.body_content === 'string' ? req.body.body_content.trim() : '';
    const metaDescription =
      typeof req.body.meta_description === 'string' ? req.body.meta_description.trim() : null;
    const status = req.body.status === undefined ? 'draft' : normalizeStatus(req.body.status);
    const parentArticleId = normalizeOptionalPositiveInteger(req.body.parent_article_id);
    const linkedProductCardId = normalizeOptionalPositiveInteger(req.body.linked_product_card_id);
    const wawasanArticleId = normalizeOptionalPositiveInteger(req.body.wawasan_article_id);
    const validArticleTypes = ['main', 'detail', 'prosedur', 'panduan', 'referensi', 'studi_kasus', 'troubleshooting'];
    const articleType = validArticleTypes.includes(req.body.article_type)
      ? req.body.article_type
      : parentArticleId ? 'detail' : 'main';

    if (articleType === 'main' && req.user.role !== 'pengelola') {
      throw forbidden('Hanya pengelola yang dapat membuat artikel utama.');
    }

    const mediaItems = normalizeMediaInput(req.body.media);
    const productCardItems = normalizeProductCardInput(req.body.product_cards);
    const sectionItems = normalizeSectionInput(req.body.sections, bodyContent);
    const sourceItems = normalizeSourceInput(req.body.sources);
    const tagItems = normalizeTagInput(req.body.tags);
    const technicalFields = normalizeTechnicalFields(req.body);

    if (!bodyContent && sectionItems.length > 0) {
      bodyContent = sectionItems.map((section) => section.body_content).join('\n\n');
    }

    if (!isNonEmptyString(title)) {
      throw badRequest('title wajib diisi.');
    }

    if (!isNonEmptyString(bodyContent)) {
      throw badRequest('body_content wajib diisi.');
    }

    if (!isValidArticleStatus(status) || status === 'published') {
      throw badRequest('Saat create, status artikel hanya boleh draft atau revision.');
    }

    if (parentArticleId && productCardItems.length > 0) {
      throw badRequest('Artikel detail tidak dapat memiliki product cards baru.');
    }

    if (!parentArticleId && linkedProductCardId) {
      throw badRequest('Link ke product card hanya berlaku untuk artikel detail.');
    }

    const category = await findOrCreateCategory(req.body.category, transaction);
    await validateParentArticle(parentArticleId, transaction);

    const article = await Article.create(
      {
        author_id: req.user.id,
        category_id: category.id,
        parent_article_id: parentArticleId,
        article_type: articleType,
        wawasan_article_id: wawasanArticleId,
        title,
        version: 1,
        status,
      },
      { transaction }
    );

    await ArticleDetail.create(
      {
        article_id: article.id,
        body_content: bodyContent,
        meta_description: metaDescription,
        sections: sectionItems,
        sources: sourceItems,
        ...technicalFields,
      },
      { transaction }
    );

    if (tagItems.length > 0) {
      await syncArticleTags(article, tagItems, transaction);
    }

    if (mediaItems.length > 0) {
      const processedMedia = await processMediaItemsForStorage(mediaItems);
      if (processedMedia.length > 0) {
        await ArticleMedia.bulkCreate(
          processedMedia.map((item) => ({
            article_id: article.id,
            file_path: item.file_path,
            media_type: item.media_type,
          })),
          { transaction }
        );
      }
    }

    if (parentArticleId) {
      await syncProductCardLink({
        articleId: article.id,
        currentLinkedProductCardId: null,
        nextLinkedProductCardId: linkedProductCardId,
        parentArticleId,
        transaction,
      });
    }

    if (productCardItems.length > 0) {
      await ProductCard.bulkCreate(
        productCardItems.map((item) => ({
          article_id: article.id,
          title: item.title,
          description: item.description,
          image: item.image,
          processing_method: item.processing_method,
        })),
        { transaction }
      );
    }

    const createdArticle = await getArticleByIdOrThrow(article.id, { transaction });

    await recordArticleVersionSnapshot({
      articleSnapshot: buildArticleVersionSnapshot(createdArticle),
      articleId: article.id,
      versionNumber: createdArticle.version,
      sourceVersionNumber: createdArticle.version,
      action: 'create',
      actorId: req.user.id,
      transaction,
    });

    await transaction.commit();

    await writeAuditLog({
      actorId: req.user.id,
      action: 'pengelola.create_article',
      entityType: 'article',
      entityId: article.id,
      metadata: {
        title,
        status,
        category_id: category.id,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Artikel berhasil dibuat.',
      data: {
        article: sanitizeArticle(createdArticle, { includeComments: false }),
      },
    });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
}

async function updateArticle(req, res, next) {
  const transaction = await sequelize.transaction();

  try {
    const articleId = Number(req.params.id);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      throw badRequest('Parameter article id tidak valid.');
    }

    const article = await Article.findByPk(articleId, {
      include: [
        {
          model: ArticleDetail,
          as: 'detail',
        },
        {
          model: ArticleMedia,
          as: 'media',
        },
        {
          model: ProductCard,
          as: 'productCards',
        },
        {
          model: ProductCard,
          as: 'linkedProductCard',
        },
        {
          model: Tag,
          as: 'tags',
          through: {
            attributes: [],
          },
          attributes: ['id', 'name', 'description'],
        },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!article) {
      throw notFound('Artikel tidak ditemukan.');
    }

    if (req.user.role !== 'pengelola' && article.author_id !== req.user.id) {
      throw forbidden('Anda hanya dapat mengubah artikel milik Anda sendiri.');
    }

    if (article.status === 'published') {
      throw badRequest('Artikel published tidak dapat diubah. Ubah status ke revision terlebih dahulu.');
    }

    const parentArticleId =
      req.body.parent_article_id === undefined
        ? article.parent_article_id
        : normalizeOptionalPositiveInteger(req.body.parent_article_id);
    const linkedProductCardId =
      req.body.linked_product_card_id === undefined
        ? article.linkedProductCard?.id || null
        : normalizeOptionalPositiveInteger(req.body.linked_product_card_id);

    if (parentArticleId && req.body.product_cards !== undefined) {
      const productCardItems = normalizeProductCardInput(req.body.product_cards);

      if (productCardItems.length > 0) {
        throw badRequest('Artikel detail tidak dapat memiliki product cards baru.');
      }
    }

    if (!parentArticleId && linkedProductCardId) {
      throw badRequest('Link ke product card hanya berlaku untuk artikel detail.');
    }

    await validateParentArticle(parentArticleId, transaction);

    if (req.body.parent_article_id !== undefined) {
      article.parent_article_id = parentArticleId;
    }

    const validArticleTypes = ['main', 'detail', 'prosedur', 'panduan', 'referensi', 'studi_kasus', 'troubleshooting'];
    if (req.body.article_type !== undefined && validArticleTypes.includes(req.body.article_type)) {
      if (req.body.article_type === 'main' && req.user.role !== 'pengelola') {
        throw forbidden('Hanya pengelola yang dapat membuat artikel utama.');
      }

      article.article_type = req.body.article_type;
    }

    if (req.body.wawasan_article_id !== undefined) {
      article.wawasan_article_id = normalizeOptionalPositiveInteger(req.body.wawasan_article_id);
    }

    if (req.body.title !== undefined) {
      const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';

      if (!isNonEmptyString(title)) {
        throw badRequest('title tidak boleh kosong.');
      }

      article.title = title;
    }

    if (req.body.status !== undefined) {
      const status = normalizeStatus(req.body.status);

      if (!isValidArticleStatus(status) || status === 'published') {
        throw badRequest('Saat edit konten, status hanya boleh draft atau revision. Gunakan endpoint validasi untuk publish.');
      }

      article.status = status;
    }

    if (req.body.category !== undefined) {
      const category = await findOrCreateCategory(req.body.category, transaction);
      article.category_id = category.id;
    }

    if (req.body.tags !== undefined) {
      const tagItems = normalizeTagInput(req.body.tags);
      await syncArticleTags(article, tagItems, transaction);
    }

    article.version += 1;
    await article.save({ transaction });

    if (
      req.body.body_content !== undefined ||
      req.body.meta_description !== undefined ||
      req.body.sections !== undefined ||
      req.body.sources !== undefined
    ) {
      if (!article.detail) {
        throw notFound('Detail artikel tidak ditemukan.');
      }

      if (req.body.body_content !== undefined) {
        const bodyContent =
          typeof req.body.body_content === 'string' ? req.body.body_content.trim() : '';

        if (!isNonEmptyString(bodyContent)) {
          throw badRequest('body_content tidak boleh kosong.');
        }

        article.detail.body_content = bodyContent;
      }

      if (req.body.meta_description !== undefined) {
        article.detail.meta_description = isNonEmptyString(req.body.meta_description)
          ? req.body.meta_description.trim()
          : null;
      }

      if (req.body.sections !== undefined) {
        const fallbackBodyContent = article.detail.body_content || '';
        const sectionItems = normalizeSectionInput(req.body.sections, fallbackBodyContent);
        article.detail.sections = sectionItems;
        article.detail.body_content = sectionItems.map((section) => section.body_content).join('\n\n');
      }

      if (req.body.sources !== undefined) {
        article.detail.sources = normalizeSourceInput(req.body.sources);
      }

      const technicalFieldKeys = [
        'difficulty_level', 'time_required_minutes', 'materials_list', 'tools_list',
        'process_parameters', 'quality_indicators', 'safety_notes', 'prerequisite_article_ids',
      ];
      const hasTechnicalUpdate = technicalFieldKeys.some((key) => req.body[key] !== undefined);
      if (hasTechnicalUpdate) {
        Object.assign(article.detail, normalizeTechnicalFields(req.body));
      }

      await article.detail.save({ transaction });
    }

    if (req.body.media !== undefined) {
      const mediaItems = normalizeMediaInput(req.body.media);

      await ArticleMedia.destroy({
        where: { article_id: article.id },
        transaction,
      });

      if (mediaItems.length > 0) {
        const processedMedia = await processMediaItemsForStorage(mediaItems);
        if (processedMedia.length > 0) {
          await ArticleMedia.bulkCreate(
            processedMedia.map((item) => ({
              article_id: article.id,
              file_path: item.file_path,
              media_type: item.media_type,
            })),
            { transaction }
          );
        }
      }
    }

    if (req.body.product_cards !== undefined) {
      const productCardItems = normalizeProductCardInput(req.body.product_cards);

      await ProductCard.destroy({
        where: {
          article_id: article.id,
          linked_article_id: null,
        },
        transaction,
      });

      if (productCardItems.length > 0) {
        await ProductCard.bulkCreate(
          productCardItems.map((item) => ({
            article_id: article.id,
            title: item.title,
            description: item.description,
            image: item.image,
            processing_method: item.processing_method,
          })),
          { transaction }
        );
      }
    }

    if (req.body.parent_article_id !== undefined || req.body.linked_product_card_id !== undefined) {
      await syncProductCardLink({
        articleId: article.id,
        currentLinkedProductCardId: article.linkedProductCard?.id || null,
        nextLinkedProductCardId: linkedProductCardId,
        parentArticleId,
        transaction,
      });
    }

    const updatedArticle = await getArticleByIdOrThrow(article.id, { transaction });

    await recordArticleVersionSnapshot({
      articleSnapshot: buildArticleVersionSnapshot(updatedArticle),
      articleId: article.id,
      versionNumber: updatedArticle.version,
      sourceVersionNumber: updatedArticle.version,
      action: 'update',
      actorId: req.user.id,
      transaction,
    });

    await transaction.commit();

    await writeAuditLog({
      actorId: req.user.id,
      action: 'pengelola.update_article',
      entityType: 'article',
      entityId: article.id,
      metadata: {
        title: article.title,
        status: article.status,
        version: article.version,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Artikel berhasil diperbarui.',
      data: {
        article: sanitizeArticle(updatedArticle, { includeComments: false }),
      },
    });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
}

async function updateArticleStatus(req, res, next) {
  const transaction = await sequelize.transaction();

  try {
    const articleId = Number(req.params.id);
    const status = normalizeStatus(req.body.status);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      throw badRequest('Parameter article id tidak valid.');
    }

    if (!isValidArticleStatus(status) || status === 'draft') {
      throw badRequest('Status validasi hanya boleh revision atau published.');
    }

    const article = await Article.findByPk(articleId, {
      include: [
        {
          model: ArticleDetail,
          as: 'detail',
        },
        {
          model: ArticleMedia,
          as: 'media',
        },
        {
          model: ProductCard,
          as: 'productCards',
        },
        {
          model: ProductCard,
          as: 'linkedProductCard',
        },
        {
          model: Tag,
          as: 'tags',
          through: {
            attributes: [],
          },
          attributes: ['id', 'name', 'description'],
        },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!article) {
      throw notFound('Artikel tidak ditemukan.');
    }

    if (
      status === 'revision' &&
      req.user.role !== 'pengelola' &&
      !hasModeratorScope(req.user, 'content', 'publication')
    ) {
      throw forbidden('Akun Anda tidak memiliki akses untuk mengubah artikel ke revision.');
    }

    if (
      status === 'published' &&
      req.user.role !== 'pengelola' &&
      !hasModeratorScope(req.user, 'publication')
    ) {
      throw forbidden('Akun Anda tidak memiliki akses untuk mempublish artikel.');
    }

    if (article.status === 'published' && status !== 'revision') {
      throw badRequest('Artikel published hanya dapat dikembalikan ke revision.');
    }

    if (!['draft', 'revision', 'published'].includes(article.status)) {
      throw badRequest('Status artikel tidak valid untuk divalidasi.');
    }

    if (status === 'published' && ['main', 'detail'].includes(article.article_type)) {
      if (!Array.isArray(article.media) || !article.media.some((m) => m.media_type === 'image')) {
        throw badRequest('Artikel wawasan wajib memiliki minimal 1 foto sebelum dipublikasikan.');
      }

      const sources = article.detail?.sources;
      if (!Array.isArray(sources) || sources.length === 0) {
        throw badRequest('Artikel wawasan wajib memiliki minimal 1 referensi sebelum dipublikasikan.');
      }

      const bodyLength = (article.detail?.body_content || '').replace(/\s+/g, ' ').trim().length;
      if (bodyLength < WAWASAN_MIN_BODY_LENGTH) {
        throw badRequest(
          `Konten artikel wawasan masih terlalu singkat. Tambahkan penjelasan lebih detail sebelum dipublikasikan (minimal ${WAWASAN_MIN_BODY_LENGTH} karakter).`
        );
      }
    }

    if (status === 'published' && article.article_type === 'prosedur') {
      const sections = Array.isArray(article.detail?.sections) ? article.detail.sections : [];
      const procedureSections = sections.filter((s) => s.section_type === 'procedure');

      if (procedureSections.length === 0) {
        throw badRequest('Artikel prosedur wajib memiliki minimal 1 section bertipe Prosedur (langkah bernomor).');
      }

      if (procedureSections.some((s) => !s.image_path && !s.video_path)) {
        throw badRequest('Setiap section prosedur wajib memiliki foto atau video yang menggambarkan langkah tersebut.');
      }
    }

    article.status = status;
    article.version += 1;
    await article.save({ transaction });

    const updatedArticle = await getArticleByIdOrThrow(article.id, { transaction });

    await recordArticleVersionSnapshot({
      articleSnapshot: buildArticleVersionSnapshot(updatedArticle),
      articleId: article.id,
      versionNumber: updatedArticle.version,
      sourceVersionNumber: updatedArticle.version,
      action: 'status_change',
      actorId: req.user.id,
      transaction,
    });

    await transaction.commit();

    await writeAuditLog({
      actorId: req.user.id,
      action: status === 'published' ? 'publication.publish_article' : 'content.return_article_to_revision',
      entityType: 'article',
      entityId: article.id,
      metadata: {
        status,
        version: article.version,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        status === 'published'
          ? 'Artikel berhasil dipublish.'
          : 'Artikel dikembalikan ke status revision.',
      data: {
        article: sanitizeArticle(updatedArticle, { includeComments: false }),
      },
    });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
}

async function setArticleHomeFeature(req, res, next) {
  const transaction = await sequelize.transaction();

  try {
    const articleId = Number(req.params.id);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      throw badRequest('Parameter article id tidak valid.');
    }

    const isHomeFeatured = Boolean(req.body.is_home_featured);

    const article = await Article.findByPk(articleId, { transaction, lock: transaction.LOCK.UPDATE });

    if (!article) {
      throw notFound('Artikel tidak ditemukan.');
    }

    if (isHomeFeatured && article.article_type !== 'main') {
      throw badRequest('Hanya artikel utama (main) yang dapat ditampilkan sebagai artikel utama homepage.');
    }

    if (isHomeFeatured) {
      await Article.update(
        { is_home_featured: false },
        {
          where: {
            category_id: article.category_id,
            is_home_featured: true,
            id: { [Op.ne]: article.id },
          },
          transaction,
        }
      );
    }

    article.is_home_featured = isHomeFeatured;
    await article.save({ transaction });

    const updatedArticle = await getArticleByIdOrThrow(article.id, { transaction });

    await transaction.commit();

    await writeAuditLog({
      actorId: req.user.id,
      action: isHomeFeatured ? 'pengelola.feature_article_on_home' : 'pengelola.unfeature_article_on_home',
      entityType: 'article',
      entityId: article.id,
      metadata: { is_home_featured: isHomeFeatured },
    });

    return res.status(200).json({
      success: true,
      message: isHomeFeatured
        ? 'Artikel ditandai sebagai artikel utama homepage.'
        : 'Artikel dilepas dari artikel utama homepage.',
      data: {
        article: sanitizeArticle(updatedArticle, { includeComments: false }),
      },
    });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
}

async function listArticleVersions(req, res, next) {
  try {
    const articleId = Number(req.params.id);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      throw badRequest('Parameter article id tidak valid.');
    }

    const article = await Article.findByPk(articleId);
    if (!article) {
      throw notFound('Artikel tidak ditemukan.');
    }

    const versions = await ArticleVersion.findAll({
      where: { article_id: articleId },
      include: [
        {
          model: User,
          as: 'actor',
          attributes: ['id', 'email', 'role'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['user_id', 'full_name', 'job_title'],
            },
          ],
        },
      ],
      order: [
        ['version_number', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });

    return res.status(200).json({
      success: true,
      message: 'Riwayat versi artikel berhasil diambil.',
      data: {
        versions: versions.map((version) => ({
          id: version.id,
          article_id: version.article_id,
          version_number: version.version_number,
          source_version_number: version.source_version_number,
          action: version.action,
          snapshot: version.snapshot,
          actor: version.actor
            ? {
                id: version.actor.id,
                email: version.actor.email,
                role: version.actor.role,
                profile: version.actor.profile
                  ? {
                      user_id: version.actor.profile.user_id,
                      full_name: version.actor.profile.full_name,
                      job_title: version.actor.profile.job_title,
                    }
                  : null,
              }
            : null,
          created_at: version.created_at,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function publishArticleVersion(req, res, next) {
  const transaction = await sequelize.transaction();

  try {
    const articleId = Number(req.params.id);
    const versionNumber = Number(req.params.version);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      throw badRequest('Parameter article id tidak valid.');
    }

    if (!Number.isInteger(versionNumber) || versionNumber <= 0) {
      throw badRequest('Parameter version tidak valid.');
    }

    const article = await Article.findByPk(articleId, {
      include: [
        {
          model: ArticleDetail,
          as: 'detail',
        },
        {
          model: ArticleMedia,
          as: 'media',
        },
        {
          model: ProductCard,
          as: 'productCards',
        },
        {
          model: ProductCard,
          as: 'linkedProductCard',
        },
        {
          model: Tag,
          as: 'tags',
          through: {
            attributes: [],
          },
          attributes: ['id', 'name', 'description'],
        },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!article) {
      throw notFound('Artikel tidak ditemukan.');
    }

    const articleVersion = await getArticleVersionByNumberOrThrow(articleId, versionNumber, transaction);

    await applyArticleVersionSnapshot({
      article,
      snapshot: articleVersion.snapshot,
      actorId: req.user.id,
      transaction,
    });

    await transaction.commit();

    await writeAuditLog({
      actorId: req.user.id,
      action: 'publication.publish_article',
      entityType: 'article',
      entityId: article.id,
      metadata: {
        published_from_version: versionNumber,
        version: article.version,
      },
    });

    const updatedArticle = await getArticleByIdOrThrow(article.id);

    return res.status(200).json({
      success: true,
      message: `Versi ${versionNumber} berhasil dipublish.`,
      data: {
        article: sanitizeArticle(updatedArticle, { includeComments: false }),
      },
    });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
}

async function deleteArticle(req, res, next) {
  try {
    const articleId = Number(req.params.id);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      throw badRequest('Parameter article id tidak valid.');
    }

    const article = await Article.findByPk(articleId);

    if (!article) {
      throw notFound('Artikel tidak ditemukan.');
    }

    if (req.user.role !== 'pengelola' && article.author_id !== req.user.id) {
      throw forbidden('Anda hanya dapat menghapus artikel milik Anda sendiri.');
    }

    await article.destroy();

    await writeAuditLog({
      actorId: req.user.id,
      action: 'pengelola.delete_article',
      entityType: 'article',
      entityId: articleId,
      metadata: {
        title: article.title,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Artikel berhasil dihapus.',
    });
  } catch (error) {
    return next(error);
  }
}

async function getAdminArticleDetail(req, res, next) {
  try {
    const articleId = Number(req.params.id);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      throw badRequest('Parameter article id tidak valid.');
    }

    const article = await Article.findByPk(articleId, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'email', 'role'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['user_id', 'full_name', 'bio', 'avatar_url'],
            },
          ],
        },
        {
          model: Category,
          as: 'category',
        },
        {
          model: Tag,
          as: 'tags',
          through: {
            attributes: [],
          },
          attributes: ['id', 'name', 'description'],
        },
        {
          model: ArticleDetail,
          as: 'detail',
        },
        {
          model: ArticleMedia,
          as: 'media',
        },
        {
          model: Article,
          as: 'parentArticle',
          attributes: ['id', 'title', 'category_id', 'status'],
        },
        {
          model: ProductCard,
          as: 'productCards',
          separate: true,
          order: [['created_at', 'ASC']],
        },
        {
          model: ProductCard,
          as: 'linkedProductCard',
        },
        {
          model: Comment,
          as: 'comments',
          separate: true,
          order: [['created_at', 'ASC']],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'email', 'role'],
              include: [
                {
                  model: UserProfile,
                  as: 'profile',
                  attributes: ['user_id', 'full_name', 'bio', 'avatar_url'],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!article) {
      throw notFound('Artikel tidak ditemukan.');
    }

    return res.status(200).json({
      success: true,
      message: 'Detail artikel admin berhasil diambil.',
      data: {
        article: sanitizeArticle(article),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function listAvailableProductCards(req, res, next) {
  try {
    const articleId = Number(req.query.article_id);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      throw badRequest('Query article_id tidak valid.');
    }

    const parentArticle = await Article.findOne({
      where: {
        id: articleId,
        parent_article_id: null,
      },
      attributes: ['id', 'title', 'status', 'parent_article_id'],
    });

    if (!parentArticle) {
      throw notFound('Artikel utama tidak ditemukan.');
    }

    const productCards = await ProductCard.findAll({
      where: {
        article_id: articleId,
        linked_article_id: null,
      },
      order: [['created_at', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Daftar product card yang belum terhubung berhasil diambil.',
      data: {
        article: {
          id: parentArticle.id,
          title: parentArticle.title,
          status: parentArticle.status,
        },
        product_cards: productCards.map((productCard) => ({
          id: productCard.id,
          article_id: productCard.article_id,
          title: productCard.title,
          description: productCard.description,
          image: productCard.image,
          processing_method: productCard.processing_method,
          linked_article_id: productCard.linked_article_id,
          created_at: productCard.created_at,
          updated_at: productCard.updated_at,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function listMainArticles(req, res, next) {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const excludeArticleId = normalizeOptionalPositiveInteger(req.query.exclude_article_id);
    const where = {
      parent_article_id: null,
    };

    if (excludeArticleId) {
      where.id = {
        [Op.ne]: excludeArticleId,
      };
    }

    if (search) {
      where.title = {
        [Op.like]: `%${search}%`,
      };
    }

    const articles = await Article.findAll({
      where,
      attributes: ['id', 'title', 'status', 'category_id', 'updated_at'],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
      ],
      order: [['updated_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Daftar artikel utama berhasil diambil.',
      data: {
        articles: articles.map((article) => ({
          id: article.id,
          title: article.title,
          status: article.status,
          category: article.category
            ? {
                id: article.category.id,
                name: article.category.name,
              }
            : null,
          updated_at: article.updated_at,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getRelatedArticles(req, res, next) {
  try {
    const articleId = Number(req.params.id);
    if (!Number.isInteger(articleId) || articleId <= 0) throw badRequest('Parameter id tidak valid.');

    const current = await Article.findOne({
      where: { id: articleId, status: 'published' },
      attributes: ['id', 'category_id'],
      include: [{ model: Tag, as: 'tags', through: { attributes: [] }, attributes: ['id'] }],
    });
    if (!current) throw notFound('Artikel tidak ditemukan.');

    const tagIds = current.tags.map((t) => t.id);
    const categoryId = current.category_id;

    const candidates = await Article.findAll({
      where: { id: { [Op.ne]: articleId }, status: 'published', category_id: categoryId },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'email', 'role'],
          include: [{ model: UserProfile, as: 'profile', attributes: ['user_id', 'full_name', 'avatar_url'] }],
        },
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Tag, as: 'tags', through: { attributes: [] }, attributes: ['id', 'name'] },
        { model: ArticleDetail, as: 'detail', attributes: ['difficulty_level', 'meta_description'] },
        { model: ArticleMedia, as: 'media', attributes: ['id', 'file_path', 'media_type'] },
      ],
      limit: 20,
      order: [['created_at', 'DESC']],
    });

    const tagSet = new Set(tagIds);
    const scored = candidates
      .map((a) => ({ article: a, score: a.tags.filter((t) => tagSet.has(t.id)).length }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(({ article }) => sanitizeArticle(article, { includeComments: false }));

    return res.status(200).json({ success: true, data: { articles: scored } });
  } catch (err) {
    return next(err);
  }
}

async function listPublicTags(req, res, next) {
  try {
    const tags = await Tag.findAll({
      include: [
        {
          model: Article,
          as: 'articles',
          where: { status: 'published' },
          attributes: [],
          required: true,
          through: { attributes: [] },
        },
      ],
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      data: {
        tags: tags.map((t) => ({ id: t.id, name: t.name })),
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function listMyArticles(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50);
    const offset = (page - 1) * limit;
    const statusFilter = typeof req.query.status === 'string' && req.query.status !== 'all'
      ? { status: req.query.status }
      : {};

    const { rows: articles, count } = await Article.findAndCountAll({
      where: { author_id: req.user.id, ...statusFilter },
      include: [
        { model: ArticleDetail, as: 'detail', attributes: ['meta_description'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] },
      ],
      order: [['updated_at', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Daftar artikel Anda berhasil diambil.',
      data: {
        articles: articles.map((a) => ({
          id: a.id,
          title: a.title,
          status: a.status,
          article_type: a.article_type,
          category: a.category ? { id: a.category.id, name: a.category.name } : null,
          meta_description: a.detail?.meta_description || null,
          created_at: a.created_at,
          updated_at: a.updated_at,
        })),
        meta: { page, limit, total_items: count, total_pages: Math.ceil(count / limit) },
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function submitMyArticle(req, res, next) {
  try {
    const articleId = Number(req.params.id);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      throw badRequest('Parameter article id tidak valid.');
    }

    const article = await Article.findOne({
      where: { id: articleId, author_id: req.user.id },
    });

    if (!article) {
      throw notFound('Artikel tidak ditemukan atau bukan milik Anda.');
    }

    if (article.status !== 'draft') {
      throw badRequest('Hanya artikel berstatus draft yang dapat disubmit untuk ditinjau.');
    }

    article.status = 'revision';
    await article.save();

    return res.status(200).json({
      success: true,
      message: 'Artikel berhasil disubmit untuk ditinjau oleh pengelola.',
      data: { article: { id: article.id, title: article.title, status: article.status } },
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteMyArticle(req, res, next) {
  try {
    const articleId = Number(req.params.id);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      throw badRequest('Parameter article id tidak valid.');
    }

    const article = await Article.findOne({
      where: { id: articleId, author_id: req.user.id },
    });

    if (!article) {
      throw notFound('Artikel tidak ditemukan atau bukan milik Anda.');
    }

    if (article.status === 'published') {
      throw forbidden('Artikel yang sudah dipublikasikan tidak dapat dihapus oleh kontributor.');
    }

    await article.destroy();

    return res.status(200).json({
      success: true,
      message: 'Artikel berhasil dihapus.',
    });
  } catch (error) {
    return next(error);
  }
}

async function getMyArticleDetail(req, res, next) {
  try {
    const articleId = Number(req.params.id);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      throw badRequest('Parameter article id tidak valid.');
    }

    const article = await Article.findOne({
      where: { id: articleId, author_id: req.user.id },
      include: [
        { model: User, as: 'author', attributes: ['id', 'email', 'role'],
          include: [{ model: UserProfile, as: 'profile', attributes: ['user_id', 'full_name', 'bio', 'avatar_url'] }] },
        { model: Category, as: 'category' },
        { model: Tag, as: 'tags', through: { attributes: [] }, attributes: ['id', 'name', 'description'] },
        { model: ArticleDetail, as: 'detail' },
        { model: ArticleMedia, as: 'media' },
        { model: Article, as: 'parentArticle', attributes: ['id', 'title', 'category_id', 'status'] },
        { model: ProductCard, as: 'productCards', separate: true, order: [['created_at', 'ASC']] },
        { model: ProductCard, as: 'linkedProductCard' },
      ],
    });

    if (!article) {
      throw notFound('Artikel tidak ditemukan atau bukan milik Anda.');
    }

    return res.status(200).json({
      success: true,
      message: 'Detail artikel kontributor berhasil diambil.',
      data: { article: sanitizeArticle(article) },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listPublishedArticles,
  listFeaturedMainArticles,
  getPublishedArticleDetail,
  listAdminArticles,
  getAdminArticleDetail,
  listMainArticles,
  listAvailableProductCards,
  listPublicTags,
  getRelatedArticles,
  createArticle,
  updateArticle,
  updateArticleStatus,
  setArticleHomeFeature,
  listArticleVersions,
  publishArticleVersion,
  deleteArticle,
  listMyArticles,
  getMyArticleDetail,
  submitMyArticle,
  deleteMyArticle,
};
