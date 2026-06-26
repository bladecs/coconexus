import katex from 'katex';

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

function renderKaTeX(latex, displayMode = false) {
  try {
    return katex.renderToString(latex, { throwOnError: false, displayMode });
  } catch {
    return `<code class="katex-error">${escapeHtml(latex)}</code>`;
  }
}

function processInlineFormulas(text) {
  // $$...$$ → display math (before inline so $$ is matched first)
  text = text.replace(/\$\$(.+?)\$\$/g, (_, latex) => renderKaTeX(latex.trim(), true));
  // $...$ → inline math
  text = text.replace(/\$([^$\n]+?)\$/g, (_, latex) => renderKaTeX(latex.trim(), false));
  return text;
}

export function renderLatex(latex, displayMode = true) {
  return renderKaTeX(latex, displayMode);
}

export function renderSimpleRichText(input = '') {
  const rawLines = (input || '').split(/\r?\n/);
  const blocks = [];
  let listBuffer = [];
  let listType = null;
  let inMermaid = false;
  let mermaidBuffer = [];
  let inFencedCode = false;
  let codeBuffer = [];
  let codeLang = '';

  function flushList() {
    if (!listBuffer.length) return;
    const tagName = listType === 'number' ? 'ol' : 'ul';
    const className = listType === 'dash' ? ' class="dash-list"' : '';
    blocks.push(`<${tagName}${className}>${listBuffer.join('')}</${tagName}>`);
    listBuffer = [];
    listType = null;
  }

  function pushListItem(type, content) {
    if (listType && listType !== type) flushList();
    listType = type;
    listBuffer.push(`<li>${applyInlineFormatting(processInlineFormulas(escapeHtml(content)))}</li>`);
  }

  for (const rawLine of rawLines) {
    // Detect mermaid fenced block
    if (!inFencedCode && rawLine.trim() === '```mermaid') {
      flushList();
      inMermaid = true;
      mermaidBuffer = [];
      continue;
    }
    if (inMermaid) {
      if (rawLine.trim() === '```') {
        // Render mermaid as a placeholder div (mermaid.js initialized in component)
        const mermaidCode = escapeHtml(mermaidBuffer.join('\n'));
        blocks.push(`<div class="mermaid-diagram"><pre class="mermaid">${mermaidCode}</pre></div>`);
        inMermaid = false;
        mermaidBuffer = [];
      } else {
        mermaidBuffer.push(rawLine);
      }
      continue;
    }

    // Detect generic fenced code block
    const fenceMatch = rawLine.trim().match(/^```(\w*)$/);
    if (!inFencedCode && fenceMatch) {
      flushList();
      inFencedCode = true;
      codeLang = fenceMatch[1] || '';
      codeBuffer = [];
      continue;
    }
    if (inFencedCode) {
      if (rawLine.trim() === '```') {
        const codeHtml = codeBuffer.map((l) => escapeHtml(l)).join('\n');
        blocks.push(`<pre class="code-block"><code class="language-${codeLang}">${codeHtml}</code></pre>`);
        inFencedCode = false;
        codeBuffer = [];
        codeLang = '';
      } else {
        codeBuffer.push(rawLine);
      }
      continue;
    }

    const line = rawLine.trim();

    // Display math: $$...$$  on its own line
    if (line.startsWith('$$') && line.endsWith('$$') && line.length > 4) {
      flushList();
      const latex = line.slice(2, -2).trim();
      blocks.push(`<div class="katex-display">${renderKaTeX(latex, true)}</div>`);
      continue;
    }

    if (!line) {
      flushList();
      continue;
    }

    const safeText = escapeHtml(line);

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

    const safeWithFormulas = processInlineFormulas(safeText);

    if (line.startsWith('### ')) {
      blocks.push(`<h3>${applyInlineFormatting(processInlineFormulas(escapeHtml(line.slice(4))))}</h3>`);
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push(`<h2>${applyInlineFormatting(processInlineFormulas(escapeHtml(line.slice(3))))}</h2>`);
      continue;
    }
    if (line.startsWith('# ')) {
      blocks.push(`<h1>${applyInlineFormatting(processInlineFormulas(escapeHtml(line.slice(2))))}</h1>`);
      continue;
    }

    blocks.push(`<p>${applyInlineFormatting(safeWithFormulas)}</p>`);
  }

  flushList();
  return blocks.join('');
}
