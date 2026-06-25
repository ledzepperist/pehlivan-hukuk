// Vercel serverless function — /api/posts
// GET  → return all posts (or ?area=slug to filter)
// POST → authenticate, then commit updated posts.json to GitHub (triggers redeploy)

const https = require('https');

function githubRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'pehlivan-hukuk-cms',
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, (res) => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const token  = process.env.GITHUB_TOKEN;
    const repo   = process.env.GITHUB_REPO;   // e.g. "username/pehlivan-hukuk"
    const branch = process.env.GITHUB_BRANCH || 'main';

    const { status, body } = await githubRequest('GET', `/repos/${repo}/contents/posts.json?ref=${branch}`, null, token);
    if (status !== 200) return res.status(500).json({ error: 'Could not fetch posts' });

    const posts = JSON.parse(Buffer.from(body.content, 'base64').toString('utf8'));
    const area  = req.query && req.query.area;
    res.status(200).json(area ? posts.filter(p => p.practiceArea === area) : posts);
    return;
  }

  // ── POST ─────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const token    = process.env.GITHUB_TOKEN;
    const repo     = process.env.GITHUB_REPO;
    const branch   = process.env.GITHUB_BRANCH || 'main';
    const adminPwd = process.env.ADMIN_PASSWORD;

    let body;
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = JSON.parse(Buffer.concat(chunks).toString());
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    if (!adminPwd || body.password !== adminPwd) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Password-only check (login verification from admin)
    if (body._check) return res.status(200).json({ ok: true });

    const post = body.post;
    if (!post || !post.slug || !post.title || !post.practiceArea) {
      return res.status(400).json({ error: 'Missing required fields: slug, title, practiceArea' });
    }

    // Fetch current posts.json + its SHA (needed for update commit)
    const getRes = await githubRequest('GET', `/repos/${repo}/contents/posts.json?ref=${branch}`, null, token);
    if (getRes.status !== 200) return res.status(500).json({ error: 'Could not fetch posts.json' });

    const sha   = getRes.body.sha;
    const posts = JSON.parse(Buffer.from(getRes.body.content, 'base64').toString('utf8'));

    // Upsert: replace existing post with same slug, or append
    const idx = posts.findIndex(p => p.slug === post.slug);
    if (idx >= 0) posts[idx] = post;
    else posts.unshift(post); // newest first

    const updated = Buffer.from(JSON.stringify(posts, null, 2)).toString('base64');
    const commitRes = await githubRequest('PUT', `/repos/${repo}/contents/posts.json`, {
      message: `cms: ${idx >= 0 ? 'update' : 'add'} post "${post.title}"`,
      content: updated,
      sha,
      branch,
    }, token);

    if (commitRes.status !== 200 && commitRes.status !== 201) {
      const msg = commitRes.body && commitRes.body.message ? commitRes.body.message : JSON.stringify(commitRes.body);
      return res.status(500).json({ error: 'GitHub: ' + msg });
    }

    res.status(200).json({ ok: true, post });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
