/** Copy-locked ZH title. Do not add punctuation, codes, or env-var names. */
export const SERVICE_UNAVAILABLE_ZH = "去物服务暂未开通，请稍后再试";
/** EN description under the locked ZH title — honest, no secrets. */
export const SERVICE_UNAVAILABLE_EN =
  "Object removal isn’t available in this preview right now. You can still upload and brush a mask — try Remove again later.";

/**
 * Neutral JSON `error` for missing-key 503.
 * MUST stay free of REPLICATE_*, env-var names, and wrangler secret instructions.
 */
export const SERVICE_UNAVAILABLE_API_ERROR = "Object removal is not available.";

/** Exact 503 JSON body — two fields only. Never spread extras into this object. */
export const MISSING_API_KEY_JSON = {
  error: SERVICE_UNAVAILABLE_API_ERROR,
  code: "MISSING_API_KEY",
} as const;

/** Leaked provider/env names that must never appear in the UI. */
const SECRET_LEAK =
  /REPLICATE|API_TOKEN|api token|\.env(?:\.local)?|\.dev\.vars|process\.env|wrangler secret/i;

export function mentionsSecret(text: string | undefined): boolean {
  return Boolean(text && SECRET_LEAK.test(text));
}

/** Alert title + description for missing remove service (ZH then EN). */
export function serviceUnavailableUi(): {
  title: string;
  description: string;
} {
  return {
    title: SERVICE_UNAVAILABLE_ZH,
    description: SERVICE_UNAVAILABLE_EN,
  };
}

function looksLikeMissingProvider(
  status: number,
  data: { error?: string; code?: string }
): boolean {
  if (data.code === "MISSING_API_KEY" || status === 503) return true;
  if (data.code === "REPLICATE_AUTH" || data.code === "PROVIDER_AUTH") {
    // Auth failures from a missing/invalid token — same human copy, no token names.
    if (mentionsSecret(data.error) || /not configured|missing|unauthorized/i.test(data.error ?? "")) {
      return true;
    }
  }
  if (/not configured/i.test(data.error ?? "") || mentionsSecret(data.error)) {
    return true;
  }
  return false;
}

function isKnownLightFailure(
  status: number,
  code: string | undefined
): boolean {
  if (status === 429 || status === 413 || status === 504) return true;
  return (
    code === "PREDICTION_TIMEOUT" ||
    code === "PAYLOAD_TOO_LARGE" ||
    code === "REPLICATE_RATE_LIMIT" ||
    code === "PROVIDER_RATE_LIMIT"
  );
}

/**
 * Map a remove-API failure to UI copy.
 * Order is required:
 * 1) `code === "MISSING_API_KEY"` / HTTP 503 / REPLICATE-missing dumps → service ZH
 * 2) known light failures → toast-friendly EN
 * Never toast or render raw `data.error` first (it may name REPLICATE_* / env vars).
 */
export function classifyRemoveFailure(
  status: number,
  data: { error?: string; code?: string }
): { kind: "service" | "light"; message: string } {
  if (looksLikeMissingProvider(status, data)) {
    return { kind: "service", message: SERVICE_UNAVAILABLE_ZH };
  }
  if (isKnownLightFailure(status, data.code)) {
    return { kind: "light", message: formatLightApiError(status, data) };
  }
  return { kind: "light", message: formatLightApiError(status, data) };
}

export function isServiceUnavailable(
  status: number,
  data: { error?: string; code?: string }
): boolean {
  return classifyRemoveFailure(status, data).kind === "service";
}

/** Strip credential / env-var / REPLICATE_* names from any message shown in the UI. */
export function sanitizeClientError(message: string): string {
  if (mentionsSecret(message) || /not configured/i.test(message)) {
    return SERVICE_UNAVAILABLE_ZH;
  }
  return message;
}

export function formatLightApiError(
  status: number,
  data: { error?: string; code?: string }
): string {
  // Always classify missing-key / secret dumps before any other branch.
  if (looksLikeMissingProvider(status, data)) {
    return SERVICE_UNAVAILABLE_ZH;
  }

  const code = data.code;
  if (code === "PREDICTION_TIMEOUT" || status === 504) {
    return "Removal timed out on the Worker (~30s budget). Try a smaller image.";
  }
  if (code === "PAYLOAD_TOO_LARGE" || status === 413) {
    return "That photo is too large for the Worker. Use a file under ~10 MB.";
  }
  if (
    code === "REPLICATE_RATE_LIMIT" ||
    code === "PROVIDER_RATE_LIMIT" ||
    status === 429
  ) {
    return "Removal provider is rate-limiting requests. Try again shortly.";
  }
  if (
    code === "REPLICATE_AUTH" ||
    code === "REPLICATE_ERROR" ||
    code === "REPLICATE_NO_POLL_URL" ||
    code === "REPLICATE_POLL_ERROR" ||
    code === "PROVIDER_AUTH" ||
    code === "PROVIDER_ERROR" ||
    code === "PROVIDER_NO_POLL_URL" ||
    code === "PROVIDER_POLL_ERROR"
  ) {
    return "Removal failed. Please try again.";
  }
  // Do not surface raw data.error — it may name REPLICATE_* even when code is unset.
  if (data.error && mentionsSecret(data.error)) {
    return SERVICE_UNAVAILABLE_ZH;
  }
  if (status > 0) {
    return `Failed to process image (HTTP ${status})`;
  }
  return "Removal failed. Please try again.";
}
