'use strict';

const { ChatbotSetting, Article, ArticleDetail, Category } = require('../models');
const { Op } = require('sequelize');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const STOP_WORDS = new Set([
  'dan', 'yang', 'ini', 'itu', 'atau', 'untuk', 'dengan', 'dari', 'pada', 'ke',
  'di', 'juga', 'ada', 'bisa', 'akan', 'saya', 'apa', 'bagaimana', 'cara',
  'the', 'and', 'for', 'are', 'is', 'in', 'of', 'to', 'a', 'how', 'what',
  'can', 'i', 'me', 'my', 'you', 'your', 'we', 'our', 'they',
]);

async function getOrCreateSetting() {
  let setting = await ChatbotSetting.findOne();
  if (!setting) {
    setting = await ChatbotSetting.create({});
  }
  return setting;
}

async function groqRequest(apiKey, model, messages, { temperature, maxOutputTokens } = {}) {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: temperature ?? 0.7,
      max_tokens: maxOutputTokens ?? 1024,
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || `Groq error ${res.status}`);
  }

  return json.choices?.[0]?.message?.content || '';
}

function extractKeywords(message) {
  return message
    .toLowerCase()
    .replace(/[^a-z0-9À-ɏ\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w))
    .slice(0, 6);
}

async function findRelevantArticles(message, limit = 3) {
  const keywords = extractKeywords(message);
  if (!keywords.length) return [];

  const titleConditions = keywords.map((kw) => ({
    title: { [Op.like]: `%${kw}%` },
  }));

  const articles = await Article.findAll({
    where: {
      status: 'published',
      [Op.or]: titleConditions,
    },
    include: [
      {
        model: ArticleDetail,
        as: 'detail',
        attributes: ['meta_description', 'body_content'],
      },
      {
        model: Category,
        as: 'category',
        attributes: ['name'],
      },
    ],
    limit,
    order: [['updated_at', 'DESC']],
  });

  return articles;
}

function buildArticleContext(articles) {
  if (!articles.length) return '';

  const parts = articles.map((a) => {
    const category = a.category?.name || 'Umum';
    const desc = a.detail?.meta_description || '';
    const body = (a.detail?.body_content || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500);
    return `### ${a.title} [${a.article_type} / ${category}]\n${desc}\n${body}`;
  });

  return `\n\n---\nARTIKEL REFERENSI DARI BASIS PENGETAHUAN COCONEXUS:\n${parts.join('\n\n')}\n---`;
}

// GET /api/admin/chatbot/settings
async function getSettings(req, res) {
  try {
    const setting = await getOrCreateSetting();
    const data = setting.toJSON();
    if (data.api_key) {
      const masked = data.api_key.length > 6
        ? '••••••••' + data.api_key.slice(-6)
        : '••••••••';
      data.api_key_masked = masked;
      delete data.api_key;
    }
    return res.json({ data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// PUT /api/admin/chatbot/settings
async function updateSettings(req, res) {
  try {
    const {
      api_key,
      model,
      system_prompt,
      temperature,
      max_tokens,
      max_context_articles,
      is_enabled,
      welcome_message,
    } = req.body;

    const setting = await getOrCreateSetting();

    if (api_key !== undefined && !api_key.startsWith('••')) {
      setting.api_key = api_key || null;
    }
    if (model !== undefined) setting.model = model;
    if (system_prompt !== undefined) setting.system_prompt = system_prompt;
    if (temperature !== undefined) setting.temperature = Number(temperature);
    if (max_tokens !== undefined) setting.max_tokens = Number(max_tokens);
    if (max_context_articles !== undefined) setting.max_context_articles = Number(max_context_articles);
    if (is_enabled !== undefined) setting.is_enabled = Boolean(is_enabled);
    if (welcome_message !== undefined) setting.welcome_message = welcome_message;

    await setting.save();

    return res.json({ message: 'Pengaturan chatbot berhasil disimpan.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// POST /api/admin/chatbot/test
async function testConnection(req, res) {
  try {
    const setting = await getOrCreateSetting();
    if (!setting.api_key) {
      return res.status(400).json({ error: 'API key belum dikonfigurasi.' });
    }

    const text = await groqRequest(
      setting.api_key,
      setting.model || 'llama-3.3-70b-versatile',
      [{ role: 'user', content: 'Hai, balas hanya dengan "OK".' }],
    );

    return res.json({ message: 'Koneksi berhasil.', response: text });
  } catch (err) {
    return res.status(400).json({ error: `Koneksi gagal: ${err.message}` });
  }
}

// GET /api/chatbot/config
async function getPublicConfig(req, res) {
  try {
    const setting = await getOrCreateSetting();
    return res.json({
      data: {
        is_enabled: setting.is_enabled,
        welcome_message: setting.welcome_message || 'Halo! Ada yang bisa saya bantu?',
        model: setting.model,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// POST /api/chatbot/chat
async function chat(req, res) {
  try {
    const { message, history = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
    }

    const setting = await getOrCreateSetting();

    if (!setting.is_enabled) {
      return res.status(503).json({ error: 'Chatbot belum diaktifkan oleh admin.' });
    }

    if (!setting.api_key) {
      return res.status(503).json({ error: 'API key belum dikonfigurasi.' });
    }

    const limit = Number(setting.max_context_articles) || 3;
    const articles = await findRelevantArticles(message, limit);
    const articleContext = buildArticleContext(articles);

    const defaultPrompt =
      'Kamu adalah asisten Knowledge Management System COCONEXUS, platform pengetahuan pengolahan limbah kelapa. ' +
      'Bantu pengguna dengan informasi akurat seputar pengolahan limbah kelapa berdasarkan artikel yang tersedia. ' +
      'Jawab dalam Bahasa Indonesia yang jelas dan ramah. Jika informasi tidak tersedia di basis pengetahuan, katakan dengan jujur.';

    const systemInstruction = (setting.system_prompt?.trim() || defaultPrompt) + articleContext;

    const messages = [
      { role: 'system', content: systemInstruction },
      ...history
        .filter((h) => h.role && h.text)
        .map((h) => ({
          role: h.role === 'assistant' ? 'assistant' : 'user',
          content: h.text,
        })),
      { role: 'user', content: message.trim() },
    ];

    const responseText = await groqRequest(
      setting.api_key,
      setting.model || 'llama-3.3-70b-versatile',
      messages,
      {
        temperature: Number(setting.temperature) || 0.7,
        maxOutputTokens: Number(setting.max_tokens) || 1024,
      },
    );

    return res.json({
      message: responseText,
      articles_used: articles.map((a) => ({ id: a.id, title: a.title })),
    });
  } catch (err) {
    return res.status(500).json({ error: `Terjadi kesalahan: ${err.message}` });
  }
}

module.exports = {
  getSettings,
  updateSettings,
  testConnection,
  getPublicConfig,
  chat,
};
