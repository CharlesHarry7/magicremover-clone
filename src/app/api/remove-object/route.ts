import { NextResponse } from "next/server";

import {
  CREATE_TIMEOUT_MS,
  MAX_DATA_URL_CHARS,
  MAX_POLLS,
  OVERALL_BUDGET_MS,
  POLL_INTERVAL_MS,
  RESULT_FETCH_TIMEOUT_MS,
} from "@/lib/remove-limits";
import { SERVICE_UNAVAILABLE_API_ERROR, mentionsSecret } from "@/lib/remove-errors";

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

class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function missingKeyResponse() {
  console.error(
    "MISSING_API_KEY: removal provider token is not set; configure it in the Worker secrets and redeploy."
  );
  return NextResponse.json(
    {
      error: SERVICE_UNAVAILABLE_API_ERROR,
      code: "MISSING_API_KEY",
    },
    { status: 503 }
  );
}

function clientSafeCode(code: string): string {
  return code.startsWith("REPLICATE_")
    ? `PROVIDER_${code.slice("REPLICATE_".length)}`
    : code;
}

function errorResponse(
  status: number,
  code: string,
  error: string,
  extras?: Record<string, unknown>
) {
  if (code === "MISSING_API_KEY" || status === 503) {
    return NextResponse.json(
      { error: SERVICE_UNAVAILABLE_API_ERROR, code: "MISSING_API_KEY", ...extras },
      { status: 503 }
    );
  }
  const safeCode = clientSafeCode(code);
  const safeError =
    mentionsSecret(error) || mentionsSecret(code)
      ? "Removal failed. Please try again."
      : error;
  return NextResponse.json(
    { error: safeError, code: safeCode, ...extras },
    { status }
  );
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
    if (
      err instanceof Error &&
      (err.name === "TimeoutError" || err.name === "AbortError")
    ) {
      throw new Error(
        "Upstream request timed out. Try a smaller image or try again."
      );
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
    console.error(
      "Removal provider create failed:",
      createRes.status,
      text.slice(0, 300)
    );
    if (createRes.status === 401 || createRes.status === 403) {
      throw new ApiError(
        502,
        "PROVIDER_AUTH",
        "The removal service rejected the request. Please try again later."
      );
    }
    if (createRes.status === 429) {
      throw new ApiError(
        429,
        "PROVIDER_RATE_LIMIT",
        "Removal provider is rate-limiting requests. Try again shortly."
      );
    }
    throw new ApiError(
      502,
      "PROVIDER_ERROR",
      "Removal failed. Please try again."
    );
  }

  let data = await createRes.json();

  if (data.status === "succeeded") {
    return normalizeOutput(data.output);
  }

  if (data.status === "failed" || data.status === "canceled") {
    throw new ApiError(
      502,
      "PREDICTION_FAILED",
      data.error || `Prediction ${data.status}`
    );
  }

  const getUrl = data.urls?.get as string | undefined;
  if (!getUrl) {
    throw new ApiError(
      502,
      "PROVIDER_NO_POLL_URL",
      "Removal did not return a result. Please try again."
    );
  }

  for (let i = 0; i < MAX_POLLS; i++) {
    if (remainingMs(deadline) < POLL_INTERVAL_MS + 500) {
      break;
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const pollTimeout = Math.min(RESULT_FETCH_TIMEOUT_MS, remainingMs(deadline));
    const pollRes = await fetchWithTimeout(
      getUrl,
      { headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` } },
      pollTimeout
    );
    if (!pollRes.ok) {
      throw new ApiError(
        502,
        "PROVIDER_POLL_ERROR",
        `Failed to poll prediction: ${pollRes.status}`
      );
    }
    data = await pollRes.json();
    if (data.status === "succeeded") return normalizeOutput(data.output);
    if (data.status === "failed" || data.status === "canceled") {
      throw new ApiError(
        502,
        "PREDICTION_FAILED",
        data.error || `Prediction ${data.status}`
      );
    }
  }

  throw new ApiError(
    504,
    "PREDICTION_TIMEOUT",
    "Prediction timed out (~28s Worker budget). Try a smaller image or try again."
  );
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
  throw new Error("Unexpected response format from the removal provider");
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
    if (error instanceof ApiError) {
      return errorResponse(error.status, error.code, error.message);
    }
    const message =
      error instanceof Error ? error.message : "Failed to process image";
    const timedOut = /timed out/i.test(message);
    return errorResponse(
      timedOut ? 504 : 500,
      timedOut ? "PREDICTION_TIMEOUT" : "INTERNAL_ERROR",
      message
    );
  }
}
