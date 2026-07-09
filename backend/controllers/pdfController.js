'use strict';

const PDFDocument = require('pdfkit');
const { Article, ArticleDetail, ArticleMedia, Category, ProductCard, User, UserProfile } = require('../models');
const { badRequest, notFound } = require('../utils/httpErrors');
const { parseRichTextToBlocks } = require('../utils/richTextBlocks');

const PAGE_MARGIN = 56;
const COLOR_PRIMARY = '#0f5132';
const COLOR_TEXT = '#1a1a1a';
const COLOR_MUTED = '#6b6b6b';

function slugify(title) {
  return (title || 'artikel')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60) || 'artikel';
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function renderSegments(doc, segments, baseFontSize) {
  segments.forEach((segment, index) => {
    const font = segment.bold ? 'Helvetica-Bold' : segment.italic ? 'Helvetica-Oblique' : 'Helvetica';
    doc.font(font).fontSize(baseFontSize).fillColor(COLOR_TEXT);
    doc.text(segment.text, {
      continued: index < segments.length - 1,
      underline: Boolean(segment.underline),
    });
  });
}

function renderBlocks(doc, blocks) {
  blocks.forEach((block) => {
    if (block.type === 'heading') {
      const sizeByLevel = { 1: 17, 2: 14, 3: 12.5 };
      doc.moveDown(0.6);
      doc.font('Helvetica-Bold').fontSize(sizeByLevel[block.level] || 13).fillColor(COLOR_PRIMARY);
      doc.text(block.segments.map((s) => s.text).join(''));
      doc.moveDown(0.2);
      return;
    }

    if (block.type === 'paragraph') {
      doc.moveDown(0.35);
      renderSegments(doc, block.segments, 10.5);
      doc.moveDown(0.1);
      return;
    }

    if (block.type === 'list') {
      doc.moveDown(0.25);
      block.items.forEach((segments, index) => {
        const prefix = block.listType === 'number' ? `${index + 1}. ` : block.listType === 'dash' ? '- ' : '• ';
        doc.font('Helvetica').fontSize(10.5).fillColor(COLOR_TEXT);
        doc.text(prefix + segments.map((s) => s.text).join(''), {
          indent: 14,
        });
      });
      doc.moveDown(0.2);
      return;
    }

    if (block.type === 'code') {
      doc.moveDown(0.3);
      const startY = doc.y;
      doc.font('Courier').fontSize(9).fillColor('#333333');
      const textHeight = doc.heightOfString(block.text, { width: doc.page.width - PAGE_MARGIN * 2 - 16 });
      doc.rect(doc.x - 6, startY - 4, doc.page.width - PAGE_MARGIN * 2 + 12, textHeight + 12).fill('#f2f2f2');
      doc.fillColor('#333333').text(block.text, doc.x, startY, { width: doc.page.width - PAGE_MARGIN * 2 - 16 });
      doc.moveDown(0.4);
      return;
    }
  });
}

function renderKeyValueList(doc, title, items) {
  if (!items || (Array.isArray(items) && items.length === 0)) return;

  doc.moveDown(0.6);
  doc.font('Helvetica-Bold').fontSize(12).fillColor(COLOR_PRIMARY).text(title);
  doc.moveDown(0.2);
  doc.font('Helvetica').fontSize(10.5).fillColor(COLOR_TEXT);

  if (Array.isArray(items)) {
    items.forEach((item) => {
      const label = typeof item === 'string' ? item : item.name || item.label || JSON.stringify(item);
      doc.text(`•  ${label}`, { indent: 14 });
    });
  } else if (typeof items === 'object') {
    Object.entries(items).forEach(([key, value]) => {
      doc.text(`•  ${key}: ${value}`, { indent: 14 });
    });
  }
}

function addFooters(doc, generatedAt) {
  const range = doc.bufferedPageRange();

  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    const bottom = doc.page.height - PAGE_MARGIN + 18;
    doc.font('Helvetica').fontSize(8).fillColor(COLOR_MUTED);
    doc.text(
      `Diunduh dari COCONEXUS pada ${generatedAt} — Halaman ${i - range.start + 1} dari ${range.count}`,
      PAGE_MARGIN,
      bottom,
      { width: doc.page.width - PAGE_MARGIN * 2, align: 'center' }
    );
  }
}

async function generateArticlePdf(req, res, next) {
  try {
    const articleId = Number(req.params.id);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      throw badRequest('Parameter article id tidak valid.');
    }

    const article = await Article.findOne({
      where: { id: articleId, status: 'published' },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'email'],
          include: [{ model: UserProfile, as: 'profile', attributes: ['full_name'] }],
        },
        { model: Category, as: 'category' },
        { model: ArticleDetail, as: 'detail' },
        { model: ArticleMedia, as: 'media' },
        {
          model: ProductCard,
          as: 'productCards',
          separate: true,
          order: [['created_at', 'ASC']],
        },
      ],
    });

    if (!article) {
      throw notFound('Artikel tidak ditemukan.');
    }

    const detail = article.detail;
    const generatedAt = formatDate(new Date());
    const filename = `${slugify(article.title)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: PAGE_MARGIN, bufferPages: true, size: 'A4' });
    doc.pipe(res);

    // Cover / header
    if (article.category?.name) {
      doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR_PRIMARY);
      doc.text(article.category.name.toUpperCase(), { characterSpacing: 0.6 });
      doc.moveDown(0.3);
    }

    doc.font('Helvetica-Bold').fontSize(20).fillColor(COLOR_TEXT).text(article.title);
    doc.moveDown(0.3);

    const authorName = article.author?.profile?.full_name || 'Tim COCONEXUS';
    doc.font('Helvetica').fontSize(9.5).fillColor(COLOR_MUTED);
    doc.text(`Ditulis oleh ${authorName} · Dipublikasikan ${formatDate(article.created_at)}`);
    doc.moveDown(0.8);
    doc.moveTo(PAGE_MARGIN, doc.y).lineTo(doc.page.width - PAGE_MARGIN, doc.y).strokeColor('#dddddd').stroke();
    doc.moveDown(0.8);

    // Body
    const sections = Array.isArray(detail?.sections) ? detail.sections : [];

    if (sections.length > 0) {
      sections.forEach((section) => {
        if (section.title) {
          doc.moveDown(0.4);
          doc.font('Helvetica-Bold').fontSize(14).fillColor(COLOR_PRIMARY).text(section.title);
        }
        renderBlocks(doc, parseRichTextToBlocks(section.body_content || ''));
      });
    } else {
      renderBlocks(doc, parseRichTextToBlocks(detail?.body_content || ''));
    }

    // Technical fields (prosedur/panduan/referensi/studi_kasus/troubleshooting)
    if (detail) {
      if (detail.difficulty_level || detail.time_required_minutes) {
        doc.moveDown(0.6);
        doc.font('Helvetica-Bold').fontSize(12).fillColor(COLOR_PRIMARY).text('Informasi Teknis');
        doc.font('Helvetica').fontSize(10.5).fillColor(COLOR_TEXT);
        if (detail.difficulty_level) doc.text(`•  Tingkat kesulitan: ${detail.difficulty_level}`, { indent: 14 });
        if (detail.time_required_minutes) doc.text(`•  Estimasi waktu: ${detail.time_required_minutes} menit`, { indent: 14 });
      }

      renderKeyValueList(doc, 'Bahan/Materi', detail.materials_list);
      renderKeyValueList(doc, 'Alat', detail.tools_list);
      renderKeyValueList(doc, 'Parameter Proses', detail.process_parameters);
      renderKeyValueList(doc, 'Indikator Kualitas', detail.quality_indicators);

      if (detail.safety_notes) {
        doc.moveDown(0.6);
        doc.font('Helvetica-Bold').fontSize(12).fillColor(COLOR_PRIMARY).text('Catatan Keselamatan');
        doc.font('Helvetica').fontSize(10.5).fillColor(COLOR_TEXT).text(detail.safety_notes);
      }
    }

    // Produk turunan (artikel utama)
    if (article.article_type === 'main' && Array.isArray(article.productCards) && article.productCards.length > 0) {
      doc.moveDown(0.8);
      doc.font('Helvetica-Bold').fontSize(13).fillColor(COLOR_PRIMARY).text('Produk Turunan');
      doc.moveDown(0.2);

      article.productCards.forEach((card) => {
        doc.font('Helvetica-Bold').fontSize(10.5).fillColor(COLOR_TEXT).text(`•  ${card.title}`, { indent: 14 });
        doc.font('Helvetica').fontSize(9.5).fillColor(COLOR_MUTED).text(card.description, { indent: 24 });
        doc.moveDown(0.2);
      });
    }

    addFooters(doc, generatedAt);
    doc.end();
  } catch (error) {
    return next(error);
  }
}

module.exports = { generateArticlePdf };
