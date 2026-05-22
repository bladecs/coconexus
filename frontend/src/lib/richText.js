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
    .replace(/\+\+(.+?)\+\+/g, '<u>$1</u>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

export function renderSimpleRichText(input = '') {
  const safeText = escapeHtml(input || '');
  const lines = safeText.split(/\r?\n/);
  const blocks = [];
  let listBuffer = [];
  let listType = null;

  function flushList() {
    if (!listBuffer.length) {
      return;
    }

    const tagName = listType === 'number' ? 'ol' : 'ul';
    const className = listType === 'dash' ? ' class="dash-list"' : '';

    blocks.push(`<${tagName}${className}>${listBuffer.join('')}</${tagName}>`);
    listBuffer = [];
    listType = null;
  }

  function pushListItem(type, content) {
    if (listType && listType !== type) {
      flushList();
    }

    listType = type;
    listBuffer.push(`<li>${applyInlineFormatting(content)}</li>`);
  }

  for (const rawLine of lines) {
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
