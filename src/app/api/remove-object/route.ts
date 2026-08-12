import { NextResponse } from "next/server";

/**
 * Object removal via Replicate (LaMa-based image-object-removal).
 *
 * Env:
 * - Next local: `.env.local` → process.env.REPLICATE_API_TOKEN
 * - OpenNext preview / Workers: `.dev.vars` or `wrangler secret put`
 *
 * Budgeted for Cloudflare Worker wall-clock (~30s). Prefer:wait + short poll,
 * with AbortSignal timeouts on outbound fetches.
 */
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_MODEL = "dpakkk/image-object-removal";

/** ~10MB decoded image ceiling expressed as data-URL character length. */
const MAX_DATA_URL_CHARS = 14_000_000;
/** Overall handler budget for Worker-friendly responses. */
const OVERALL_BUDGET_MS = 28_000;
const CREATE_TIMEOUT_MS = 20_000;
const POLL_INTERVAL_MS = 1_500;
const MAX_POLLS = 6;
const RESULT_FETCH_TIMEOUT_MS = 8_000;

function missingKeyResponse() {
  return NextResponse.json(
    {
      error:
        "Object removal is not configured. Set REPLICATE_API_TOKEN in .env.local (npm run dev), .dev.vars (npm run preview), or as a Cloudflare Worker secret (wrangler secret put REPLICATE_API_TOKEN), then restart/redeploy.",
      code: "MISSING_API_KEY",
    },
    { status: 503 }
  );
}

function errorResponse(
  status: number,
  code: string,
  error: string,
  extras?: Record<string, unknown>
) {
  return NextResponse.json({ error, code, ...extras }, { status });
}

function remainingMs(deadline: number) {
  return Math.max(0, deadline - Date.now());
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  if (timeoutMs <= 0) {
    throw new Error("Request timed out before fetch could start");
  }
  const signal = AbortSignal.timeout(timeoutMs);
  try {
    return await fetch(url, { ...init, signal });
  } catch (err) {
    if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
      throw new Error("Upstream request timed out. Try a smaller image or try again.");
    }
    throw err;
  }
}

async function callReplicate(
  imageBase64: string,
  maskBase64: string,
  deadline: number
): Promise<string> {
  const createTimeout = Math.min(CREATE_TIMEOUT_MS, remainingMs(deadline));
  const createRes = await fetchWithTimeout(
    `https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({
        input: {
          image: imageBase64,
          mask: maskBase64,
        },
      }),
    },
    createTimeout
  );

  if (!createRes.ok) {
    const text = await createRes.text();
    if (createRes.status === 401 || createRes.status === 403) {
      const err = new Error(
        "Replicate rejected the API token. Check that REPLICATE_API_TOKEN is valid."
      );
      (err as Error & { status?: number; code?: string }).status = 502;
      (err as Error & { status?: number; code?: string }).code = "REPLICATE_AUTH";
      throw err;
    }
    if (createRes.status === 429) {
      const err = new Error("Replicate rate limit hit. Wait a moment and try again.");
      (err as Error & { status?: number; code?: string }).status = 429;
      (err as Error & { status?: number; code?: string }).code = "REPLICATE_RATE_LIMIT";
      throw err;
    }
    const err = new Error(
      `Replicate API error: ${createRes.status} ${text.slice(0, 300)}`
    );
    (err as Error & { status?: number; code?: string }).status = 502;
    (err as Error & { status?: number; code?: string }).code = "REPLICATE_ERROR";
    throw err;
  }

  let data = await createRes.json();

  if (data.status === "succeeded") {
    return normalizeOutput(data.output);
  }

  if (data.status === "failed" || data.status === "canceled") {
    const err = new Error(data.error || `Prediction ${data.status}`);
    (err as Error & { status?: number; code?: string }).status = 502;
    (err as Error & { status?: number; code?: string }).code = "PREDICTION_FAILED";
    throw err;
  }

  const getUrl = data.urls?.get as string | undefined;
  if (!getUrl) {
    const err = new Error("Replicate did not return a result or poll URL");
    (err as Error & { status?: number; code?: string }).status = 502;
    (err as Error & { status?: number; code?: string }).code = "REPLICATE_NO_POLL_URL";
    throw err;
  }

  for (let i = 0; i < MAX_POLLS; i++) {
    if (remainingMs(deadline) < POLL_INTERVAL_MS + 500) {
      break;
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const pollTimeout = Math.min(8_000, remainingMs(deadline));
    const pollRes = await fetchWithTimeout(
      getUrl,
      { headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` } },
      pollTimeout
    );
    if (!pollRes.ok) {
      const err = new Error(`Failed to poll prediction: ${pollRes.status}`);
      (err as Error & { status?: number; code?: string }).status = 502;
      (err as Error & { status?: number; code?: string }).code = "REPLICATE_POLL_ERROR";
      throw err;
    }
    data = await pollRes.json();
    if (data.status === "succeeded") return normalizeOutput(data.output);
    if (data.status === "failed" || data.status === "canceled") {
      const err = new Error(data.error || `Prediction ${data.status}`);
      (err as Error & { status?: number; code?: string }).status = 502;
      (err as Error & { status?: number; code?: string }).code = "PREDICTION_FAILED";
      throw err;
    }
  }

  const err = new Error(
    "Prediction timed out on the Worker. Try a smaller image or try again."
  );
  (err as Error & { status?: number; code?: string }).status = 504;
  (err as Error & { status?: number; code?: string }).code = "PREDICTION_TIMEOUT";
  throw err;
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

async function toDataUrl(result: string, deadline: number): Promise<string> {
  if (result.startsWith("data:image/")) return result;

  const timeoutMs = Math.min(RESULT_FETCH_TIMEOUT_MS, remainingMs(deadline));
  try {
    const res = await fetchWithTimeout(result, {}, timeoutMs);
    if (!res.ok) {
      return result;
    }
    const contentType = res.headers.get("content-type") || "image/png";
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    // Fall back to the remote URL if fetch fails; client may still display it.
    return result;
  }
}

export async function POST(request: Request) {
  if (!REPLICATE_API_TOKEN) {
    return missingKeyResponse();
  }

  const deadline = Date.now() + OVERALL_BUDGET_MS;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse(400, "INVALID_JSON", "Request body must be JSON");
    }

    const image = (body as { image?: unknown })?.image;
    const mask = (body as { mask?: unknown })?.mask;

    if (typeof image !== "string" || typeof mask !== "string") {
      return errorResponse(
        400,
        "MISSING_FIELDS",
        "Image and mask are required as base64 data URLs"
      );
    }

    if (!image.startsWith("data:image/") || !mask.startsWith("data:image/")) {
      return errorResponse(
        400,
        "INVALID_DATA_URL",
        "Image and mask must be data URLs (data:image/...)"
      );
    }

    if (image.length > MAX_DATA_URL_CHARS || mask.length > MAX_DATA_URL_CHARS) {
      return errorResponse(
        413,
        "PAYLOAD_TOO_LARGE",
        "Image or mask is too large for the Worker. Use a smaller photo (under ~10 MB)."
      );
    }

    const resultUrl = await callReplicate(image, mask, deadline);
    const result = await toDataUrl(resultUrl, deadline);
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Remove object error:", error);
    const err = error as Error & { status?: number; code?: string };
    const message = err instanceof Error ? err.message : "Failed to process image";
    const timedOut = /timed out/i.test(message);
    const status = err.status ?? (timedOut ? 504 : 500);
    const code =
      err.code ??
      (timedOut ? "PREDICTION_TIMEOUT" : status === 500 ? "INTERNAL_ERROR" : "UPSTREAM_ERROR");
    return errorResponse(status, code, message);
  }
}
