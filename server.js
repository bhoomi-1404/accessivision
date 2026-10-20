// server.js - Production Node.js Server for AccessiVision Studio
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

// Disable TLS verification for self-signed localhost testing (e.g. localhost:8030)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
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

// Locate Chrome / Chromium executable if available
function findChromeExecutable() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

const CHROME_PATH = findChromeExecutable();
let puppeteerModule = null;
let sharedBrowser = null;
let currentProfileDir = null;
let browserLaunchPromise = null;

// Dynamically load puppeteer-core if available
async function loadPuppeteer() {
  if (puppeteerModule) return puppeteerModule;
  if (!CHROME_PATH) return null;
  try {
    const mod = await import('puppeteer-core');
    puppeteerModule = mod.default || mod;
    return puppeteerModule;
  } catch {
    return null;
  }
}

async function getHeadlessBrowser() {
  const p = await loadPuppeteer();
  if (!p || !CHROME_PATH) return null;

  if (sharedBrowser && sharedBrowser.connected) {
    return sharedBrowser;
  }
  if (browserLaunchPromise) {
    return browserLaunchPromise;
  }

  browserLaunchPromise = (async () => {
    try {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'accessivision-chrome-'));
      currentProfileDir = tmpDir;

      const browser = await p.launch({
        executablePath: CHROME_PATH,
        headless: true,
        userDataDir: tmpDir,
        acceptInsecureCerts: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-crash-reporter',
          '--disable-breakpad',
          '--ignore-certificate-errors',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
        ],
      });

      browser.on('disconnected', () => {
        sharedBrowser = null;
        browserLaunchPromise = null;
        if (currentProfileDir) {
          try {
            fs.rmSync(currentProfileDir, { recursive: true, force: true });
          } catch {}
          currentProfileDir = null;
        }
      });

      sharedBrowser = browser;
      browserLaunchPromise = null;
      return browser;
    } catch (err) {
      sharedBrowser = null;
      browserLaunchPromise = null;
      console.warn('⚠️ Headless Chrome launch failed, falling back to HTTP fetch:', err.message);
      return null;
    }
  })();

  return browserLaunchPromise;
}

let latestPushedSnapshot = null;

const server = http.createServer(async (req, res) => {
  // Global CORS headers for API endpoints
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url || '/', `http://localhost:${PORT}`);

  // 1. Health check endpoint
  if (reqUrl.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        uptime: process.uptime(),
        chromeAvailable: Boolean(CHROME_PATH),
      })
    );
    return;
  }

  // 2. DOM push endpoint (for local console snippet capture)
  if (reqUrl.pathname === '/api/push-dom') {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          latestPushedSnapshot = {
            id: Date.now(),
            url: parsed.url || 'http://localhost',
            html: parsed.html || '',
          };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, id: latestPushedSnapshot.id }));
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        }
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(latestPushedSnapshot || { id: 0 }));
    return;
  }

  // 3. Proxy endpoint (/api/proxy?url=...&asset=1)
  if (reqUrl.pathname === '/api/proxy') {
    const targetUrl = reqUrl.searchParams.get('url');
    const isAssetParam = reqUrl.searchParams.get('asset') === '1';

    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing url query parameter' }));
      return;
    }

    let parsedTarget = null;
    try {
      let normalized = targetUrl.trim();
      if (!/^https?:\/\//i.test(normalized)) {
        normalized = `https://${normalized}`;
      }
      parsedTarget = new URL(normalized);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid target URL' }));
      return;
    }

    const isStaticAsset =
      isAssetParam ||
      /\.(css|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|eot)(\?|$)/i.test(parsedTarget.pathname);

    // ==========================================
    // CASE A: Static Asset Proxy (CSS, Images, Fonts)
    // ==========================================
    if (isStaticAsset) {
      try {
        const assetRes = await fetch(parsedTarget.toString(), {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            Accept: '*/*',
          },
        });

        const ext = path.extname(parsedTarget.pathname).toLowerCase();
        let contentType = assetRes.headers.get('content-type') || '';

        // Enforce correct Content-Type so browsers don't block stylesheets or fonts
        if (ext === '.css' || parsedTarget.pathname.endsWith('.css') || contentType.includes('text/css')) {
          contentType = 'text/css; charset=utf-8';
        } else if (MIME_TYPES[ext]) {
          contentType = MIME_TYPES[ext];
        } else if (!contentType || contentType.includes('text/plain') || contentType.includes('application/octet-stream')) {
          contentType = 'text/css; charset=utf-8';
        }

        // If it's a CSS file, rewrite root-relative url(/...) to url(origin/...)
        if (contentType.includes('text/css')) {
          let cssText = await assetRes.text();
          const origin = parsedTarget.origin;
          cssText = cssText.replace(/url\(\s*(['"]?)\/(?!\/)([^'"\)]+)\1\s*\)/gi, (_m, q, p) => {
            return `url(${q}${origin}/${p}${q})`;
          });

          res.writeHead(assetRes.status || 200, {
            'Content-Type': 'text/css; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=86400',
          });
          res.end(cssText);
          return;
        }

        // Binary asset (images, fonts, etc.)
        const buf = await assetRes.arrayBuffer();
        res.writeHead(assetRes.status || 200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400',
        });
        res.end(Buffer.from(buf));
        return;
      } catch (err) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Asset fetch failed: ${err.message}` }));
        return;
      }
    }

    // ==========================================
    // CASE B: HTML Webpage Proxy (with CSS Inlining)
    // ==========================================
    // Try Headless Chrome first to capture all rendered CSS rules
    try {
      const browser = await getHeadlessBrowser();
      if (browser) {
        const page = await browser.newPage();
        try {
          await page.setViewport({ width: 1280, height: 840 });
          await page.setUserAgent(
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
          );

          try {
            await page.goto(parsedTarget.toString(), {
              waitUntil: 'networkidle2',
              timeout: 12000,
            });
          } catch {
            // Keep rendered DOM even if background polling keeps network active
          }

          await new Promise((r) => setTimeout(r, 800));

          const renderedHtml = await page.evaluate((originUrl) => {
            let cssText = '';
            for (const sheet of Array.from(document.styleSheets)) {
              try {
                const rules = sheet.cssRules;
                if (rules) {
                  for (const rule of Array.from(rules)) {
                    cssText += rule.cssText + '\n';
                  }
                }
              } catch {
                // Cross-origin stylesheet will be requested via <link>
              }
            }

            document.querySelectorAll('input, textarea').forEach((el) => {
              const inp = el;
              if (inp.value) inp.setAttribute('value', inp.value);
            });

            const clone = document.documentElement.cloneNode(true);
            clone
              .querySelectorAll(
                'script, .ReactQueryDevtools, [aria-label="React Query Devtools"], meta[http-equiv="Content-Security-Policy"]'
              )
              .forEach((el) => el.remove());

            const toProxyUrl = (raw) => {
              if (!raw || raw.startsWith('data:') || raw.startsWith('#')) return raw;
              try {
                const abs = new URL(raw, originUrl).toString();
                return `/api/proxy?asset=1&url=${encodeURIComponent(abs)}`;
              } catch {
                return raw;
              }
            };

            clone.querySelectorAll('link[href]').forEach((el) => {
              const href = el.getAttribute('href');
              const updated = toProxyUrl(href);
              if (updated) el.setAttribute('href', updated);
            });

            clone.querySelectorAll('img[src]').forEach((el) => {
              const src = el.getAttribute('src');
              const updated = toProxyUrl(src);
              if (updated) el.setAttribute('src', updated);
            });

            let head = clone.querySelector('head');
            if (!head) {
              head = document.createElement('head');
              clone.prepend(head);
            }

            const baseEl = document.createElement('base');
            baseEl.setAttribute('href', `${originUrl}/`);
            head.prepend(baseEl);

            if (cssText.trim().length > 0) {
              const styleEl = document.createElement('style');
              styleEl.setAttribute('data-av-captured-css', 'true');
              styleEl.textContent = cssText;
              head.appendChild(styleEl);
            }

            return '<!DOCTYPE html>\n' + clone.outerHTML;
          }, parsedTarget.origin);

          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          });
          res.end(renderedHtml);
          return;
        } finally {
          await page.close().catch(() => {});
        }
      }
    } catch (chromeErr) {
      console.warn('⚠️ Chrome rendering error, falling back to HTTP fetch:', chromeErr.message);
    }

    // Graceful HTTP Fetch Fallback
    try {
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
        res.writeHead(response.status, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: `Target website responded with status ${response.status} (${response.statusText})`,
          })
        );
        return;
      }

      let html = await response.text();
      const origin = parsedTarget.origin;

      // Inject <base href="...">
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

      // Strip Content-Security-Policy meta tags
      html = html.replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, '');

      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(html);
      return;
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Proxy failed: ${err.message}` }));
      return;
    }
  }

  // 4. Static File Serving from dist/
  let sanitizedPath = path.normalize(reqUrl.pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(DIST_DIR, sanitizedPath);

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // Single Page App fallback: serve index.html for all client routes
    const indexPath = path.join(DIST_DIR, 'index.html');
    fs.readFile(indexPath, (readErr, content) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('AccessiVision build not found. Run "npm run build" first.');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`🚀 AccessiVision Server running on port ${PORT}`);
  console.log(`   - Studio: http://localhost:${PORT}/#studio`);
  console.log(`   - Proxy:  http://localhost:${PORT}/api/proxy?url=https://example.com`);
  console.log(`   - Headless Chrome CSS Engine: ${CHROME_PATH ? '✅ Enabled' : '❌ Fallback to HTTP'}`);
});
