// api/proxy.js - Vercel Serverless Function Proxy for AccessiVision
import path from 'path';

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
};

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, asset } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url query parameter' });
  }

  try {
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }

    const parsedTarget = new URL(normalized);
    const isStaticAsset =
      asset === '1' ||
      /\.(css|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|eot)(\?|$)/i.test(parsedTarget.pathname);

    // ==========================================
    // CASE A: Static Asset Proxy (CSS, Images, Fonts)
    // ==========================================
    if (isStaticAsset) {
      const assetRes = await fetch(parsedTarget.toString(), {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          Accept: '*/*',
        },
      });

      const ext = path.extname(parsedTarget.pathname).toLowerCase();
      let contentType = assetRes.headers.get('content-type') || '';

      if (ext === '.css' || parsedTarget.pathname.endsWith('.css') || contentType.includes('text/css')) {
        contentType = 'text/css; charset=utf-8';
      } else if (MIME_TYPES[ext]) {
        contentType = MIME_TYPES[ext];
      }

      if (contentType.includes('text/css')) {
        let cssText = await assetRes.text();
        const origin = parsedTarget.origin;
        cssText = cssText.replace(/url\(\s*(['"]?)\/(?!\/)([^'"\)]+)\1\s*\)/gi, (_m, q, p) => {
          return `url(${q}${origin}/${p}${q})`;
        });

        res.setHeader('Content-Type', 'text/css; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.status(200).send(cssText);
      }

      const buf = await assetRes.arrayBuffer();
      res.setHeader('Content-Type', contentType || 'application/octet-stream');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.status(200).send(Buffer.from(buf));
    }

    // ==========================================
    // CASE B: HTML Webpage Proxy
    // ==========================================
    const response = await fetch(parsedTarget.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Target website responded with status ${response.status} (${response.statusText})`,
      });
    }

    let html = await response.text();
    const origin = parsedTarget.origin;

    // Inject base tag so relative CSS, fonts, and images load correctly
    if (!/<base\s/i.test(html)) {
      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/<head[^>]*>/i, (match) => `${match}\n<base href="${origin}/">`);
      } else {
        html = `<base href="${origin}/">\n${html}`;
      }
    }

    // Rewrite root-relative <link rel="stylesheet" href="/..."> to /api/proxy?asset=1
    html = html.replace(
      /\b(href|src)=["']\/(?!\/|api\/proxy)([^"']*)["']/gi,
      (_match, attr, p) => {
        const full = `${origin}/${p}`;
        return `${attr}="/api/proxy?asset=1&url=${encodeURIComponent(full)}"`;
      }
    );

    // Strip Content-Security-Policy meta tags so iframe sandbox can render correctly
    html = html.replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, '');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (err) {
    return res.status(502).json({
      error: `Proxy failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}
