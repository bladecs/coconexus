function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function applyInlineFormatting(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

export function renderSimpleRichText(input = '') {
  const safeText = escapeHtml(input || '');
  const lines = safeText.split(/\r?\n/);
  const blocks = [];
  let listBuffer = [];

  function flushList() {
    if (!listBuffer.length) {
      return;
    }

    blocks.push(`<ul>${listBuffer.join('')}</ul>`);
    listBuffer = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    if (line.startsWith('- ')) {
      listBuffer.push(`<li>${applyInlineFormatting(line.slice(2))}</li>`);
      continue;
    }

    flushList();

    if (line.startsWith('### ')) {
      blocks.push(`<h3>${applyInlineFormatting(line.slice(4))}</h3>`);
      continue;
    }

    if (line.startsWith('## ')) {
      blocks.push(`<h2>${applyInlineFormatting(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith('# ')) {
      blocks.push(`<h1>${applyInlineFormatting(line.slice(2))}</h1>`);
      continue;
    }

    blocks.push(`<p>${applyInlineFormatting(line)}</p>`);
  }

  flushList();

  return blocks.join('');
}
