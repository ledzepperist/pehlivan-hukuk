// Build step (run by Vercel on every deploy — see vercel.json "buildCommand").
// Renders a static, crawlable /article/{slug}/index.html for every post in posts.json
// and keeps the article entries in sitemap.xml in sync. The admin panel only commits
// posts.json, so without this step a newly added post has no page and returns 404.
//
// Never fails the deploy: any error is logged and the build still exits 0.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://www.hukukpehlivan.com';

const AREAS = {
  'aile-hukuku': 'Aile Hukuku',
  'miras-hukuku': 'Miras Hukuku',
  'tuketici-hukuku': 'Tüketici Hukuku',
  'ceza-hukuku': 'Ceza Hukuku',
  'ticaret-hukuku': 'Ticaret Hukuku',
  'is-hukuku': 'İş Hukuku',
  'sozlesmeler-hukuku': 'Sözleşmeler Hukuku',
  'gayrimenkul-hukuku': 'Gayrimenkul ve Kira Hukuku',
  'icra-iflas-hukuku': 'İcra ve İflas Hukuku',
  'gayrimenkul-yonetimi': 'Gayrimenkul Yönetimi',
};

const MONTHS = {
  ocak: 1, şubat: 2, mart: 3, nisan: 4, mayıs: 5, haziran: 6,
  temmuz: 7, ağustos: 8, eylül: 9, ekim: 10, kasım: 11, aralık: 12,
};

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// JSON string literal that is also safe inside an inline <script>
function jsonStr(s) {
  return JSON.stringify(String(s)).replace(/</g, '\\u003c');
}

// "5 Ekim 2026" -> "2026-10-05" (null if unparseable)
function isoDate(tr) {
  const m = String(tr || '').trim().match(/^(\d{1,2})\s+(\S+)\s+(\d{4})$/);
  if (!m) return null;
  const month = MONTHS[m[2].toLocaleLowerCase('tr-TR')];
  if (!month) return null;
  return `${m[3]}-${String(month).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
}

function render(template, post) {
  const area = post.practiceArea;
  const areaName = AREAS[area] || area;
  const vars = {
    SLUG: post.slug,
    TITLE: escHtml(post.title),
    TITLE_JSON: jsonStr(post.title),
    DESC: escHtml(post.excerpt || ''),
    DESC_JSON: jsonStr(post.excerpt || ''),
    DATE_ISO: isoDate(post.date) || new Date().toISOString().slice(0, 10),
    DATE_TR: escHtml(post.date || ''),
    TAG: escHtml(post.tag || 'Rehber'),
    AREA_SLUG: area,
    AREA_NAME: escHtml(areaName),
    AREA_NAME_JSON: jsonStr(areaName),
    CONTENT: post.content || '',
  };
  // single pass so substituted content is never re-scanned for placeholders
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (all, k) => (k in vars ? vars[k] : all));
}

function updateSitemap(posts) {
  const file = path.join(ROOT, 'sitemap.xml');
  let xml = fs.readFileSync(file, 'utf8');
  // drop every existing article entry, then re-add from posts.json
  xml = xml.replace(/\s*<url>\s*<loc>[^<]*\/article\/[^<]*<\/loc>[\s\S]*?<\/url>/g, '');
  const entries = posts.map((p) => {
    const lastmod = isoDate(p.date);
    return [
      '  <url>',
      `    <loc>${SITE}/article/${p.slug}/</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
      '    <changefreq>yearly</changefreq>',
      '    <priority>0.6</priority>',
      '  </url>',
    ].filter(Boolean).join('\n');
  });
  xml = xml.replace('</urlset>', entries.join('\n') + '\n</urlset>');
  fs.writeFileSync(file, xml);
}

// Static, crawlable list of every post on the homepage (#makaleler section).
function renderHomeArticles(posts) {
  const file = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  const start = '<!-- MAKALELER:START -->';
  const end = '<!-- MAKALELER:END -->';
  const a = html.indexOf(start), b = html.indexOf(end);
  if (a < 0 || b < a) return;
  const byDate = posts.slice().sort((x, y) => (isoDate(y.date) || '').localeCompare(isoDate(x.date) || ''));
  const cards = byDate.map((p, i) => [
    `      <a href="article/${p.slug}/" class="blog-card reveal stagger-${Math.min(i + 1, 6)}">`,
    '        <div class="blog-card-top">',
    `          <span class="blog-card-date">${escHtml(p.date || '')}</span>`,
    p.featured ? '          <span class="blog-card-featured">Öne Çıkan</span>' : null,
    p.tag ? `          <span class="blog-card-tag">${escHtml(p.tag)}</span>` : null,
    '        </div>',
    `        <h3 class="blog-card-title">${escHtml(p.title)}</h3>`,
    `        <p class="blog-card-excerpt">${escHtml(p.excerpt || '')}</p>`,
    '        <div class="blog-card-footer"><span class="blog-card-read">Devamını Oku</span><span class="blog-card-arrow">→</span></div>',
    '      </a>',
  ].filter(Boolean).join('\n')).join('\n');
  html = html.slice(0, a + start.length) + '\n' + cards + '\n' + html.slice(b);
  fs.writeFileSync(file, html);
}

function main() {
  const template = fs.readFileSync(path.join(__dirname, 'article-template.html'), 'utf8');
  const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'posts.json'), 'utf8'))
    .filter((p) => p && /^[a-z0-9-]+$/.test(p.slug || '') && p.title);

  // oldest first in the sitemap, matching the existing order
  const sorted = posts.slice().reverse();

  for (const post of posts) {
    const dir = path.join(ROOT, 'article', post.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), render(template, post));
  }
  updateSitemap(sorted);
  renderHomeArticles(posts);
  console.log(`build-articles: wrote ${posts.length} article page(s), sitemap entries and homepage list`);
}

try {
  main();
} catch (err) {
  console.error('build-articles: FAILED (deploy continues):', err);
}
