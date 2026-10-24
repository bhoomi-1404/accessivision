// supabase/functions/cors-proxy/index.ts
// Supabase Edge Function — CORS Proxy for AccessiVision Studio
//
// This function runs on Deno Deploy (Supabase Edge) and fetches any public
// website server-side, bypassing browser CORS restrictions. It returns the
// HTML with proper CORS headers so AccessiVision's iframe sandbox can render it.
//
// Deploy:
//   supabase functions deploy cors-proxy --no-verify-jwt

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let targetUrl: string | null = null;

    // Support both GET query param and POST JSON body
    if (req.method === "GET") {
      const url = new URL(req.url);
      targetUrl = url.searchParams.get("url");
    } else {
      const body = await req.json().catch(() => ({}));
      targetUrl = body.url || null;
    }

    if (!targetUrl) {
      return new Response(
        JSON.stringify({
          error: 'Missing "url" parameter. Usage: ?url=https://example.com',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Normalize the URL
    let normalized = targetUrl.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }

    // Block requests to private/local addresses
    const parsedTarget = new URL(normalized);
    const hostname = parsedTarget.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.endsWith(".local") ||
      /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(hostname)
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Cannot proxy localhost or private network addresses from the cloud. Use the Paste HTML tab or run AccessiVision locally.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[cors-proxy] Fetching: ${normalized}`);

    // Fetch the target website server-side (no CORS restrictions here)
    const targetRes = await fetch(normalized, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    if (!targetRes.ok) {
      return new Response(
        JSON.stringify({
          error: `Target responded with ${targetRes.status} ${targetRes.statusText}`,
        }),
        {
          status: targetRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const contentType =
      targetRes.headers.get("content-type") || "text/html; charset=utf-8";

    // If it's a CSS/JS/image asset, stream it directly with correct MIME type
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml")
    ) {
      const body = await targetRes.arrayBuffer();
      return new Response(body, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // For HTML pages: inject <base href> and strip CSP
    let html = await targetRes.text();
    const origin = parsedTarget.origin;

    // Inject <base href="..."> so relative assets (CSS, images, fonts) resolve correctly
    if (!/<base\s/i.test(html)) {
      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(
          /<head[^>]*>/i,
          (match) => `${match}\n<base href="${origin}/">`
        );
      } else {
        html = `<base href="${origin}/">\n${html}`;
      }
    }

    // Strip Content-Security-Policy meta tags so iframe sandbox renders correctly
    html = html.replace(
      /<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi,
      ""
    );

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cors-proxy] Error:", message);
    return new Response(JSON.stringify({ error: `Proxy failed: ${message}` }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
