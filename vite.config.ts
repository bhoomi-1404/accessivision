import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-ignore
import { addExtra } from 'puppeteer-extra';
import puppeteerCore, { Browser } from 'puppeteer-core';
// @ts-ignore
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
// @ts-ignore
import fs from 'fs';
// @ts-ignore
import os from 'os';
// @ts-ignore
import path from 'path';

const puppeteerStealth = addExtra(puppeteerCore);
puppeteerStealth.use(StealthPlugin());

declare const process: { env: Record<string, string | undefined>; cwd: () => string };
if (typeof process !== 'undefined' && process.env) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const LOCAL_HEADLESS = path.join(
  process.cwd(),
  'chrome-headless-shell/mac_arm-158.0.8121.0/chrome-headless-shell-mac-arm64/chrome-headless-shell'
);

const CHROME_EXECUTABLE =
  fs.existsSync(LOCAL_HEADLESS)
    ? LOCAL_HEADLESS
    : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

let sharedBrowser: Browser | null = null;
let currentProfileDir: string | null = null;
let browserLaunchPromise: Promise<Browser> | null = null;
let latestPushedSnapshot: { id: number; url: string; html: string } | null = null;

async function getHeadlessBrowser(): Promise<Browser> {
  if (sharedBrowser && sharedBrowser.connected) {
    return sharedBrowser;
  }
  if (browserLaunchPromise) {
    return browserLaunchPromise;
  }

  browserLaunchPromise = (async () => {
    try {
      const tmpDir = fs.mkdtempSync(
        path.join(os.tmpdir(), 'accessivision-chrome-')
      );
      currentProfileDir = tmpDir;

      const browser = await puppeteerStealth.launch({
        executablePath: CHROME_EXECUTABLE,
        headless: true,
        userDataDir: tmpDir,
        acceptInsecureCerts: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-infobars',
          '--window-position=0,0',
          '--ignore-certificate-errors',
          '--ignore-certificate-errors-spki-list',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--window-size=1280,840',
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
      throw err;
    }
  })();

  return browserLaunchPromise;
}

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'accessivision-url-proxy',
      configureServer(server) {
        // 0. Interactive Login Browser Window (/api/auth-browser?url=...)
        server.middlewares.use(
          '/api/auth-browser',
          async (req: { url?: string }, res) => {
            try {
              const urlObj = new URL(req.url || '', 'http://localhost');
              const targetUrl =
                urlObj.searchParams.get('url') || 'https://localhost:8030';

              const authTmpDir = fs.mkdtempSync(
                path.join(os.tmpdir(), 'accessivision-auth-')
              );

              const headfulBrowser = await puppeteerStealth.launch({
                executablePath: CHROME_EXECUTABLE,
                headless: false,
                userDataDir: authTmpDir,
                acceptInsecureCerts: true,
                defaultViewport: null,
                args: [
                  '--no-sandbox',
                  '--disable-crash-reporter',
                  '--disable-breakpad',
                  '--ignore-certificate-errors',
                  '--window-size=1200,820',
                ],
              });

              const pages = await headfulBrowser.pages();
              const page = pages[0] || (await headfulBrowser.newPage());
              await page.goto(targetUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true }));
            } catch (err: unknown) {
              res.statusCode = 500;
              res.end(
                JSON.stringify({
                  error: err instanceof Error ? err.message : 'Failed to open browser',
                })
              );
            }
          }
        );
        // 1. Live Tab Bridge Endpoint (/api/push-dom) for Logged-In Localhost Tabs
        server.middlewares.use(
          '/api/push-dom',
          async (
            req: {
              method?: string;
              on?: (event: string, cb: (chunk?: unknown) => void) => void;
            },
            res
          ) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            res.setHeader('Access-Control-Allow-Private-Network', 'true');

            if (req.method === 'OPTIONS') {
              res.statusCode = 204;
              res.end();
              return;
            }

            if (req.method === 'POST' && req.on) {
              let body = '';
              req.on('data', (chunk: unknown) => {
                body += String(chunk);
              });
              req.on('end', () => {
                try {
                  const parsed = JSON.parse(body);
                  latestPushedSnapshot = {
                    id: Date.now(),
                    url: parsed.url || 'http://localhost',
                    html: parsed.html || '',
                  };
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 200;
                  res.end(JSON.stringify({ ok: true, id: latestPushedSnapshot.id }));
                } catch {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
                }
              });
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify(latestPushedSnapshot || { id: 0 }));
          }
        );

        // 2. Headless Chrome SPA & Asset Proxy (/api/proxy)
        server.middlewares.use('/api/proxy', async (req: { url?: string }, res) => {
          let parsedTarget: URL | null = null;
          try {
            const urlObj = new URL(req.url || '', 'http://localhost');
            const targetUrl = urlObj.searchParams.get('url');
            const isAsset = urlObj.searchParams.get('asset') === '1';

            if (!targetUrl) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing url parameter' }));
              return;
            }

            parsedTarget = new URL(targetUrl);

            if (
              isAsset ||
              /\.(css|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|eot)(\?|$)/i.test(
                parsedTarget.pathname
              )
            ) {
              const assetRes = await fetch(parsedTarget.toString(), {
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                  Accept: '*/*',
                },
              });
              const contentType =
                assetRes.headers.get('content-type') || 'application/octet-stream';
              const buf = await assetRes.arrayBuffer();
              res.setHeader('Content-Type', contentType);
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.statusCode = 200;
              res.end(new Uint8Array(buf));
              return;
            }

            const browser = await getHeadlessBrowser();
            const page = await browser.newPage();

            try {
              await page.setViewport({ width: 1280, height: 840 });
              await page.setUserAgent(
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
              );
              await page.setExtraHTTPHeaders({
                'Accept-Language': 'en-US,en;q=0.9',
                'Sec-Ch-Ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"macOS"',
                'Upgrade-Insecure-Requests': '1',
              });

              try {
                await page.goto(parsedTarget.toString(), {
                  waitUntil: 'domcontentloaded',
                  timeout: 16000,
                });
              } catch {
                // Keep rendered DOM even if background polling keeps network busy
              }

              // 1. If Cloudflare Turnstile challenge is active, allow up to 3.5s for stealth solve
              try {
                const hasChallenge = await page.evaluate(() => {
                  return Boolean(document.querySelector('#challenge-running, .cf-turnstile, #cf-stage'));
                });
                if (hasChallenge) {
                  await new Promise((r) => setTimeout(r, 3500));
                }
              } catch {}

              // 2. Wait for splash / page loaders to complete and real sections/headings to render
              try {
                await page.waitForFunction(
                  () => {
                    const loader = document.querySelector(
                      '.page-loader, [data-testid="loader"], .LoadingBlock, .spinner-overlay, #splash, [role="progressbar"]'
                    );
                    const sections = document.querySelectorAll(
                      'section, nav, header, main, article, footer, [id="principles"], h1, h2, h3'
                    ).length;
                    return (!loader && sections >= 1) || sections >= 3;
                  },
                  { timeout: 10000 }
                );
              } catch {
                // If timeout, proceed with current DOM
              }

              // Give 800ms for animations and layout positioning
              await new Promise((r) => setTimeout(r, 800));

              // 3. Scroll to hash target if present
              if (parsedTarget.hash) {
                try {
                  const targetHash = parsedTarget.hash.replace('#', '');
                  await page.evaluate((hashId: string) => {
                    const targetEl =
                      document.getElementById(hashId) ||
                      document.querySelector(`[name="${hashId}"]`) ||
                      document.querySelector(`.${hashId}-section`) ||
                      document.querySelector(`[data-section="${hashId}"]`);
                    if (targetEl) {
                      targetEl.scrollIntoView({ behavior: 'instant', block: 'start' });
                    }
                  }, targetHash);
                } catch {}
              }

              const renderedHtml = await page.evaluate((originUrl: string) => {
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
                    // Cross-origin stylesheet handled via <link>
                  }
                }

                document.querySelectorAll('input, textarea').forEach((el) => {
                  const inp = el as HTMLInputElement;
                  if (inp.value) {
                    inp.setAttribute('value', inp.value);
                  }
                });

                const clone = document.documentElement.cloneNode(true) as HTMLElement;

                // Remove devtool overlays & scripts so they don't pollute or wipe the snapshot
                clone
                  .querySelectorAll(
                    'script, .ReactQueryDevtools, [aria-label="React Query Devtools"], meta[http-equiv="Content-Security-Policy"], .page-loader, .spinner-overlay, [data-testid="loader"]'
                  )
                  .forEach((el) => el.remove());

                // Check if the page is stuck on an unauthenticated SPA loader (like LoadingBlock / LoadingDots)
                const appContainer =
                  clone.querySelector('#app, #root, main') || clone.querySelector('body');
                const visibleText = (appContainer?.textContent || '').trim();
                const hasOnlyLoader =
                  Boolean(
                    clone.querySelector(
                      '[data-testid="loader"], .LoadingBlock, .LoadingDots, [role="progressbar"]'
                    )
                  ) && visibleText.length < 30;

                const toProxyUrl = (raw: string | null) => {
                  if (!raw || raw.startsWith('data:') || raw.startsWith('#')) return raw;
                  try {
                    const abs = new URL(raw, originUrl).toString();
                    if (abs.includes('localhost') || abs.includes('127.0.0.1')) {
                      return `/api/proxy?asset=1&url=${encodeURIComponent(abs)}`;
                    }
                    return abs;
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

                if (hasOnlyLoader || visibleText.length === 0) {
                  const authMeta = document.createElement('meta');
                  authMeta.setAttribute('name', 'av-auth-required');
                  authMeta.setAttribute('content', 'true');
                  head.appendChild(authMeta);
                }

                if (cssText.trim().length > 0) {
                  const styleEl = document.createElement('style');
                  styleEl.setAttribute('data-av-captured-css', 'true');
                  styleEl.textContent = cssText;
                  head.appendChild(styleEl);
                }

                return '<!DOCTYPE html>\n' + clone.outerHTML;
              }, parsedTarget.origin);

              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.statusCode = 200;
              res.end(renderedHtml);
            } finally {
              await page.close().catch(() => {});
            }
          } catch (err: unknown) {
            // If Headless Chrome rendering fails, attempt a graceful direct HTTP fetch fallback
            try {
              if (parsedTarget) {
                const fallbackRes = await fetch((parsedTarget as URL).toString(), {
                  headers: {
                    'User-Agent':
                      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                    Accept:
                      'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                  },
                });
                if (fallbackRes.ok) {
                  const fallbackHtml = await fallbackRes.text();
                  res.setHeader('Content-Type', 'text/html; charset=utf-8');
                  res.setHeader('Access-Control-Allow-Origin', '*');
                  res.statusCode = 200;
                  res.end(fallbackHtml);
                  return;
                }
              }
            } catch {
              // Fall through to error response
            }

            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            const rawMsg = err instanceof Error ? err.message : String(err);
            res.end(
              JSON.stringify({
                error: `Could not render target URL (${rawMsg}). Make sure the server is running.`,
              })
            );
          }
        });
      },
    },
  ],
});
