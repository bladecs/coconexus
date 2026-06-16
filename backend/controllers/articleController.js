'use strict';

const {
  Article,
  ArticleDetail,
  ArticleMedia,
  ArticleView,
  CategoryTag,
  Comment,
  ProductCard,
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
      };
    })
    .filter((item) => item.title || item.body_content || item.video_path);
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

      if (!['link', 'pdf'].includes(sourceType)) {
        throw badRequest(`sources[${index}].source_type hanya boleh link atau pdf.`);
      }

      if (sourceType === 'link' && !url) {
        throw badRequest(`sources[${index}].url wajib diisi untuk sumber link.`);
      }

      if (sourceType === 'pdf' && !filePath) {
        throw badRequest(`sources[${index}].file_path wajib diisi untuk sumber PDF.`);
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

async function findOrCreateCategory(categoryPayload, transaction) {
  const categoryId = categoryPayload && categoryPayload.id ? Number(categoryPayload.id) : null;
  const categoryName = normalizeCategoryName(categoryPayload && categoryPayload.name);
  const categoryDescription =
    categoryPayload && typeof categoryPayload.description === 'string'
      ? categoryPayload.description.trim()
      : null;

  if (categoryId) {
    const existingCategory = await CategoryTag.findByPk(categoryId, { transaction });

    if (!existingCategory) {
      throw notFound('Kategori tidak ditemukan.');
    }

    return existingCategory;
  }

  if (!categoryName) {
    throw badRequest('Kategori wajib diisi melalui category.id atau category.name.');
  }

  const existingByName = await CategoryTag.findOne({
    where: { name: categoryName },
    transaction,
  });

  if (existingByName) {
    return existingByName;
  }

  return CategoryTag.create(
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
        model: CategoryTag,
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
        model: Article,
        as: 'parentArticle',
        attributes: ['id', 'title', 'category_id', 'status'],
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

async function listPublishedArticles(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 6), 1), 50);
    const offset = (page - 1) * limit;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const where = {
      status: 'published',
    };

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { '$detail.body_content$': { [Op.like]: `%${search}%` } },
        { '$detail.meta_description$': { [Op.like]: `%${search}%` } },
      ];
    }

    if (category) {
      where['$category.name$'] = {
        [Op.like]: `%${category}%`,
      };
    }

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
          model: CategoryTag,
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
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Daftar artikel published berhasil diambil.',
      data: {
        articles: articles.map((article) => sanitizeArticle(article, { includeComments: false })),
        meta: {
          page,
          limit,
          total_items: count,
          total_pages: Math.ceil(count / limit),
          search,
          category,
        },
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
          model: CategoryTag,
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
          model: Article,
          as: 'parentArticle',
          attributes: ['id', 'title', 'category_id', 'status'],
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

    return res.status(200).json({
      success: true,
      message: 'Detail artikel berhasil diambil.',
      data: {
        article: sanitizeArticle(article),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function listAdminArticles(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50);
    const offset = (page - 1) * limit;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.trim().toLowerCase() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const authorOnly = req.query.author_only === 'true' || req.query.author_only === '1';
    const where = {};

    // If author_only, filter by current user
    if (authorOnly) {
      where.author_id = req.user.id;
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { '$detail.body_content$': { [Op.like]: `%${search}%` } },
        { '$author.profile.full_name$': { [Op.like]: `%${search}%` } },
      ];
    }

    if (status && ['draft', 'revision', 'published'].includes(status)) {
      where.status = status;
    }

    if (category) {
      where['$category.name$'] = {
        [Op.like]: `%${category}%`,
      };
    }

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
          model: CategoryTag,
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
      ],
      order: [['updated_at', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Daftar artikel admin berhasil diambil.',
      data: {
        articles: articles.map((article) => sanitizeArticle(article, { includeComments: false })),
        meta: {
          page,
          limit,
          total_items: count,
          total_pages: Math.ceil(count / limit),
          search,
          status,
          category,
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
    const mediaItems = normalizeMediaInput(req.body.media);
    const productCardItems = normalizeProductCardInput(req.body.product_cards);
    const sectionItems = normalizeSectionInput(req.body.sections, bodyContent);
    const sourceItems = normalizeSourceInput(req.body.sources);

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
      },
      { transaction }
    );

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
        })),
        { transaction }
      );
    }

    await transaction.commit();

    await writeAuditLog({
      actorId: req.user.id,
      action: 'admin.create_article',
      entityType: 'article',
      entityId: article.id,
      metadata: {
        title,
        status,
        category_id: category.id,
      },
    });

    const createdArticle = await getArticleByIdOrThrow(article.id);

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
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!article) {
      throw notFound('Artikel tidak ditemukan.');
    }

    if (article.status === 'published' && req.user.role !== 'admin') {
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

    await transaction.commit();

    await writeAuditLog({
      actorId: req.user.id,
      action: 'admin.update_article',
      entityType: 'article',
      entityId: article.id,
      metadata: {
        title: article.title,
        status: article.status,
        version: article.version,
      },
    });

    const updatedArticle = await getArticleByIdOrThrow(article.id);

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
  try {
    const articleId = Number(req.params.id);
    const status = normalizeStatus(req.body.status);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      throw badRequest('Parameter article id tidak valid.');
    }

    if (!isValidArticleStatus(status) || status === 'draft') {
      throw badRequest('Status validasi hanya boleh revision atau published.');
    }

    const article = await Article.findByPk(articleId);

    if (!article) {
      throw notFound('Artikel tidak ditemukan.');
    }

    const jobTitle = req.user.profile?.job_title || '';

    if (status === 'revision' && req.user.role !== 'admin' && !['Editor Konten', 'Validator Artikel'].includes(jobTitle)) {
      throw forbidden('Jabatan Anda tidak memiliki akses untuk mengubah artikel ke revision.');
    }

    if (status === 'published' && req.user.role !== 'admin' && jobTitle !== 'Publisher Artikel') {
      throw forbidden('Jabatan Anda tidak memiliki akses untuk mempublish artikel.');
    }

    if (!['draft', 'revision'].includes(article.status)) {
      throw badRequest('Hanya artikel draft atau revision yang dapat divalidasi.');
    }

    article.status = status;
    article.version += 1;
    await article.save();

    await writeAuditLog({
      actorId: req.user.id,
      action: 'admin.update_article_status',
      entityType: 'article',
      entityId: article.id,
      metadata: {
        status,
        version: article.version,
      },
    });

    const updatedArticle = await getArticleByIdOrThrow(article.id);

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

    if (req.user.role !== 'admin' && article.author_id !== req.user.id) {
      throw forbidden('Anda hanya dapat menghapus artikel milik Anda sendiri.');
    }

    await article.destroy();

    await writeAuditLog({
      actorId: req.user.id,
      action: 'admin.delete_article',
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
          model: CategoryTag,
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
          model: CategoryTag,
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

module.exports = {
  listPublishedArticles,
  getPublishedArticleDetail,
  listAdminArticles,
  getAdminArticleDetail,
  listMainArticles,
  listAvailableProductCards,
  createArticle,
  updateArticle,
  updateArticleStatus,
  deleteArticle,
};
