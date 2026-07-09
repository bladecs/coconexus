'use strict';

// Parser ini merupakan port dari frontend/src/lib/richText.js (renderSimpleRichText),
// tapi menghasilkan blok data terstruktur (bukan HTML) supaya bisa dirender langsung
// oleh PDFKit dengan kontrol font/spacing per blok.

function parseInlineSegments(text) {
  const segments = [];
  let remaining = text;
  const pattern = /\*\*(.+?)\*\*|\+\+(.+?)\+\+|\*(.+?)\*/;

  while (remaining.length > 0) {
    const match = remaining.match(pattern);

    if (!match) {
      segments.push({ text: remaining, bold: false, italic: false, underline: false });
      break;
    }

    if (match.index > 0) {
      segments.push({ text: remaining.slice(0, match.index), bold: false, italic: false, underline: false });
    }

    if (match[1] !== undefined) {
      segments.push({ text: match[1], bold: true, italic: false, underline: false });
    } else if (match[2] !== undefined) {
      segments.push({ text: match[2], bold: false, italic: false, underline: true });
    } else if (match[3] !== undefined) {
      segments.push({ text: match[3], bold: false, italic: true, underline: false });
    }

    remaining = remaining.slice(match.index + match[0].length);
  }

  return segments.filter((segment) => segment.text.length > 0);
}

function parseRichTextToBlocks(input = '') {
  const rawLines = (input || '').split(/\r?\n/);
  const blocks = [];
  let listBuffer = [];
  let listType = null;
  let inFencedCode = false;
  let codeBuffer = [];

  function flushList() {
    if (!listBuffer.length) return;
    blocks.push({ type: 'list', listType, items: listBuffer });
    listBuffer = [];
    listType = null;
  }

  function pushListItem(type, content) {
    if (listType && listType !== type) flushList();
    listType = type;
    listBuffer.push(parseInlineSegments(content));
  }

  for (const rawLine of rawLines) {
    const fenceMatch = rawLine.trim().match(/^```(\w*)$/);

    if (!inFencedCode && fenceMatch) {
      flushList();
      inFencedCode = true;
      codeBuffer = [];
      continue;
    }

    if (inFencedCode) {
      if (rawLine.trim() === '```') {
        blocks.push({ type: 'code', text: codeBuffer.join('\n') });
        inFencedCode = false;
        codeBuffer = [];
      } else {
        codeBuffer.push(rawLine);
      }
      continue;
    }

    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    if (line.startsWith('* ')) {
      pushListItem('bullet', line.slice(2));
      continue;
    }
    if (line.startsWith('- ')) {
      pushListItem('dash', line.slice(2));
      continue;
    }
    const orderedListMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedListMatch) {
      pushListItem('number', orderedListMatch[1]);
      continue;
    }

    flushList();

    if (line.startsWith('### ')) {
      blocks.push({ type: 'heading', level: 3, segments: parseInlineSegments(line.slice(4)) });
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'heading', level: 2, segments: parseInlineSegments(line.slice(3)) });
      continue;
    }
    if (line.startsWith('# ')) {
      blocks.push({ type: 'heading', level: 1, segments: parseInlineSegments(line.slice(2)) });
      continue;
    }

    blocks.push({ type: 'paragraph', segments: parseInlineSegments(line) });
  }

  flushList();
  return blocks;
}

module.exports = { parseRichTextToBlocks };
