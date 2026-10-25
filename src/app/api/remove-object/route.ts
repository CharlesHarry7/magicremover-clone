import { NextResponse } from "next/server";

/**
 * Object removal via Replicate (LaMa-based image-object-removal).
 * Requires REPLICATE_API_TOKEN in the Worker env / .dev.vars.
 *
 * The endpoint spends money on every call, so it is treated as a paid endpoint:
 *  - only the site's own pages may call it (same-origin / SITE_ORIGIN);
 *  - one client cannot loop it (per-IP, per-isolate rate limit);
 *  - payloads and results are bounded, so a request cannot blow the Worker's
 *    memory or response limits;
 *  - upstream errors are logged server-side, never echoed to the browser.
 */

const REPLICATE_MODEL = "dpakkk/image-object-removal";

/** Both data URLs together must stay well under the Worker request/response budget. */
const MAX_DATA_URL_CHARS = 8 * 1024 * 1024;
const MAX_BODY_CHARS = 12 * 1024 * 1024;
/** Above this the result is returned as its Replicate URL instead of base64. */
const MAX_RESULT_BYTES = 6 * 1024 * 1024;
/** Workers allow ~50 subrequests per invocation; create + polls + fetch must fit. */
const POLL_MAX = 35;
const POLL_INTERVAL_MS = 2000;
const RATE = { windowMs: 60_000, max: 6 };
const hits = new Map<string, { t: number; n: number }>();

const ALLOWED_DATA_URL_PREFIXES = [
  "data:image/png",
  "data:image/jpeg",
  "data:image/jpg",
  "data:image/webp",
];

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { "cache-control": "no-store", ...headers } });

function token(): string | undefined {
  return process.env.REPLICATE_API_TOKEN?.trim() || undefined;
}

function missingKeyResponse() {
  return json(
    {
      error:
        "Object removal is not configured. Set the REPLICATE_API_TOKEN environment variable (Cloudflare Worker secret or .dev.vars) and redeploy.",
      code: "MISSING_API_KEY",
    },
    503
  );
}

function siteOrigin(request: Request): string | null {
  const configured = process.env.SITE_ORIGIN?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  const host = request.headers.get("host");
  if (!host) return null;
  const proto = request.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

/**
 * Browsers send Origin on every cross-origin POST and Sec-Fetch-Site on every
 * request. Anything that is not our own page fails closed, which stops other
 * sites (and plain scripts) from spending the Replicate budget.
 */
function isSameOrigin(request: Request): boolean {
  const expected = siteOrigin(request);
  const origin = request.headers.get("origin");
  const site = (request.headers.get("sec-fetch-site") || "").toLowerCase();

  if (origin) return expected !== null && origin.replace(/\/+$/, "") === expected;
  if (site === "same-origin") return true;
  return false;
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.t > RATE.windowMs) {
    hits.set(ip, { t: now, n: 1 });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  rec.n++;
  return rec.n > RATE.max;
}

function validateDataUrl(value: unknown, field: "image" | "mask"): string | null {
  if (typeof value !== "string") return `${field} must be a base64 data URL`;
  if (value.length > MAX_DATA_URL_CHARS) return `${field} is too large`;
  if (!ALLOWED_DATA_URL_PREFIXES.some((p) => value.startsWith(p))) {
    return `${field} must be a PNG, JPEG or WebP data URL`;
  }
  return null;
}

async function callReplicate(
  apiToken: string,
  imageBase64: string,
  maskBase64: string
): Promise<string> {
  const createRes = await fetch(
    `https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({ input: { image: imageBase64, mask: maskBase64 } }),
    }
  );

  if (!createRes.ok) {
    console.error("replicate create failed", createRes.status);
    if (createRes.status === 401 || createRes.status === 403) {
      throw new Error("Model provider rejected the API token.");
    }
    if (createRes.status === 402 || createRes.status === 429) {
      throw new Error("Model provider is out of quota right now. Try again later.");
    }
    throw new Error("Model provider rejected the request.");
  }

  let data = await createRes.json();

  if (data.status === "succeeded") return normalizeOutput(data.output);
  if (data.status === "failed" || data.status === "canceled") {
    console.error("replicate prediction failed", String(data.error).slice(0, 200));
    throw new Error("The model could not process this image.");
  }

  const getUrl = data.urls?.get as string | undefined;
  if (!getUrl) throw new Error("Model provider returned no result.");

  for (let i = 0; i < POLL_MAX; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const pollRes = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });
    if (!pollRes.ok) {
      console.error("replicate poll failed", pollRes.status);
      throw new Error("Model provider stopped responding. Try again.");
    }
    data = await pollRes.json();
    if (data.status === "succeeded") return normalizeOutput(data.output);
    if (data.status === "failed" || data.status === "canceled") {
      console.error("replicate prediction failed", String(data.error).slice(0, 200));
      throw new Error("The model could not process this image.");
    }
  }

  throw new Error("Prediction timed out. Try a smaller image.");
}

function normalizeOutput(output: unknown): string {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && typeof output[0] === "string") return output[0];
  if (output && typeof output === "object") {
    const obj = output as Record<string, unknown>;
    if (typeof obj.url === "string") return obj.url;
    if (typeof obj.image === "string") return obj.image;
    if (typeof obj.output === "string") return obj.output;
  }
  throw new Error("Unexpected response format from Replicate");
}

/**
 * Inline the result so the browser can download it without CORS problems, but
 * fall back to the remote URL when it is too big to inline.
 */
async function toDataUrl(result: string): Promise<string> {
  if (result.startsWith("data:image/")) return result;

  const res = await fetch(result);
  if (!res.ok) return result;

  const declared = Number(res.headers.get("content-length") || 0);
  if (declared > MAX_RESULT_BYTES) return result;

  const contentType = res.headers.get("content-type") || "image/png";
  if (!contentType.startsWith("image/")) return result;

  const buffer = await res.arrayBuffer();
  if (buffer.byteLength > MAX_RESULT_BYTES) return result;

  return `data:${contentType};base64,${Buffer.from(buffer).toString("base64")}`;
}

export async function POST(request: Request) {
  const apiToken = token();
  if (!apiToken) return missingKeyResponse();

  if (!isSameOrigin(request)) return json({ error: "forbidden", code: "FORBIDDEN" }, 403);

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_CHARS) {
    return json({ error: "Request is too large", code: "TOO_LARGE" }, 413);
  }

  const ip = request.headers.get("cf-connecting-ip") || "anon";
  if (rateLimited(ip)) {
    return json(
      { error: "Too many requests. Try again in a minute.", code: "RATE_LIMITED" },
      429,
      { "retry-after": "60" }
    );
  }

  let body: { image?: unknown; mask?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body", code: "BAD_JSON" }, 400);
  }

  const imageError = validateDataUrl(body?.image, "image");
  if (imageError) return json({ error: imageError, code: "BAD_IMAGE" }, 400);

  const maskError = validateDataUrl(body?.mask, "mask");
  if (maskError) return json({ error: maskError, code: "BAD_MASK" }, 400);

  try {
    const resultUrl = await callReplicate(apiToken, body.image as string, body.mask as string);
    const result = await toDataUrl(resultUrl);
    return json({ result });
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "Failed to process image",
        code: "PROCESSING_FAILED",
      },
      500
    );
  }
}
