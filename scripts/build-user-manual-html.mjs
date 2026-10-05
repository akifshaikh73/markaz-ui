// Builds the HTML user manual from docs/functional-manual-user.md (the single source).
//
//   node scripts/build-user-manual-html.mjs
//
// Writes public/user-manual.html (served by the app at /user-manual.html). The screenshots are
// not copied: they already live in public/user-manual/ (captured there by
// scripts/capture-manual-screenshots.mjs — run that first when screens change).
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SRC = 'docs/functional-manual-user.md';

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// GitHub-style heading anchors, so links like (#5-adding-an-address-and-the-duplicate-check) keep working.
const slug = (s) => s.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s/g, '-');

function inline(text, imgBase) {
    const codes = [];
    let s = escapeHtml(text).replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`);
    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) =>
        `<img src="${imgBase}${path.basename(src)}" alt="${alt}" loading="lazy">`);
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) =>
        href.startsWith('#') || /^https?:/.test(href) ? `<a href="${href}">${label}</a>` : `<strong>${label}</strong>`);
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
}

function render(md, imgBase) {
    const lines = md.replace(/\r\n/g, '\n').split('\n');
    const out = [];
    const toc = [];
    let title = 'User Manual';
    let i = 0;
    const isBlockStart = (l) => /^(#{1,3} |[-*] |\d+\. |\||!\[)/.test(l) || l.trim() === '';

    while (i < lines.length) {
        const line = lines[i];
        if (!line.trim()) { i++; continue; }

        const h = line.match(/^(#{1,3}) (.*)$/);
        if (h) {
            const level = h[1].length;
            const text = h[2].trim();
            if (level === 1) { title = text; out.push(`<h1>${inline(text, imgBase)}</h1>`); }
            else {
                const id = slug(text);
                if (level === 2) toc.push({ id, text });
                out.push(`<h${level} id="${id}">${inline(text, imgBase)}</h${level}>`);
            }
            i++; continue;
        }

        const img = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
        if (img) {
            out.push(`<figure><a href="${imgBase}${path.basename(img[2])}"><img src="${imgBase}${path.basename(img[2])}" alt="${escapeHtml(img[1])}" loading="lazy"></a><figcaption>${escapeHtml(img[1])}</figcaption></figure>`);
            i++; continue;
        }

        if (line.startsWith('|')) {
            const rows = [];
            while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
            const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
            const [head, , ...body] = rows;
            out.push('<div class="table-wrap"><table><thead><tr>' + cells(head).map(c => `<th>${inline(c, imgBase)}</th>`).join('') +
                '</tr></thead><tbody>' + body.map(r => '<tr>' + cells(r).map(c => `<td>${inline(c, imgBase)}</td>`).join('') + '</tr>').join('') +
                '</tbody></table></div>');
            continue;
        }

        const list = line.match(/^([-*]|\d+\.) /);
        if (list) {
            const ordered = /\d/.test(list[1]);
            const items = [];
            while (i < lines.length && /^([-*]|\d+\.) /.test(lines[i])) {
                let item = lines[i++].replace(/^([-*]|\d+\.) /, '');
                while (i < lines.length && /^\s{2,}\S/.test(lines[i])) item += ' ' + lines[i++].trim();
                items.push(`<li>${inline(item, imgBase)}</li>`);
            }
            out.push(`<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`);
            continue;
        }

        const para = [];
        while (i < lines.length && !isBlockStart(lines[i])) para.push(lines[i++].trim());
        out.push(`<p>${inline(para.join(' '), imgBase)}</p>`);
    }
    return { title, toc, body: out.join('\n') };
}

function page({ title, toc, body }) {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Visitations User Manual</title>
<style>
  :root { --bg: #ffffff; --fg: #1f2328; --muted: #59636e; --line: #d1d9e0; --soft: #f6f8fa; --accent: #1976d2; --code: #eff1f3; }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #0d1117; --fg: #e6edf3; --muted: #9198a1; --line: #30363d; --soft: #151b23; --accent: #4493f8; --code: #262c36; }
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .layout { display: grid; grid-template-columns: 250px minmax(0, 1fr); max-width: 1180px; margin: 0 auto; }
  nav { position: sticky; top: 0; align-self: start; height: 100vh; overflow: auto; padding: 24px 16px; border-right: 1px solid var(--line); }
  nav strong { display: block; margin-bottom: 8px; font-size: 0.85rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  nav a { display: block; padding: 4px 0; color: var(--fg); text-decoration: none; font-size: 0.92rem; }
  nav a:hover { color: var(--accent); }
  main { padding: 24px 40px 80px; min-width: 0; }
  h1 { font-size: 1.9rem; margin: 0 0 12px; }
  h2 { font-size: 1.4rem; margin: 40px 0 12px; padding-bottom: 6px; border-bottom: 1px solid var(--line); scroll-margin-top: 16px; }
  h3 { font-size: 1.1rem; margin: 28px 0 8px; scroll-margin-top: 16px; }
  a { color: var(--accent); }
  code { background: var(--code); padding: 1px 5px; border-radius: 4px; font-size: 0.9em; }
  figure { margin: 16px 0 24px; }
  figure img { display: block; max-width: 100%; height: auto; border: 1px solid var(--line); border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); background: #fff; }
  figcaption { margin-top: 6px; font-size: 0.85rem; color: var(--muted); }
  .table-wrap { overflow-x: auto; }
  table { border-collapse: collapse; margin: 12px 0; }
  th, td { border: 1px solid var(--line); padding: 6px 12px; text-align: left; vertical-align: top; }
  th { background: var(--soft); }
  li { margin: 4px 0; }
  .note { color: var(--muted); font-size: 0.85rem; }
  @media (max-width: 800px) {
    .layout { display: block; }
    nav { position: static; height: auto; border-right: 0; border-bottom: 1px solid var(--line); padding: 16px; }
    main { padding: 16px 16px 60px; }
  }
</style>
</head>
<body>
<div class="layout">
<nav><strong>Contents</strong>${toc.map(t => `<a href="#${t.id}">${escapeHtml(t.text)}</a>`).join('')}</nav>
<main>
${body}
<p class="note">Generated from docs/functional-manual-user.md on ${new Date().toISOString().slice(0, 10)}.</p>
</main>
</div>
</body>
</html>
`;
}

const md = readFileSync(SRC, 'utf8');
writeFileSync('public/user-manual.html', page(render(md, 'user-manual/')));
console.log('wrote public/user-manual.html');
