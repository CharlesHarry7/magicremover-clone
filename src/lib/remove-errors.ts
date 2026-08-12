/** Copy-locked. Do not add punctuation, codes, or env-var names. */
export const SERVICE_UNAVAILABLE_ZH = "去物服务暂未开通，请稍后再试";
export const SERVICE_UNAVAILABLE_EN =
  "Object removal isn’t available right now. Please try again later.";

const ENV_OR_SECRET =
  /REPLICATE_[A-Z0-9_]*|process\.env|\.env\.local|\.dev\.vars|wrangler secret|MISSING_API_KEY/i;

export function isServiceUnavailable(
  status: number,
  data: { error?: string; code?: string }
): boolean {
  if (data.code === "MISSING_API_KEY") return true;
  if (status === 503) return true;
  const blob = `${data.error ?? ""} ${data.code ?? ""}`;
  if (/not configured/i.test(blob)) return true;
  if (/REPLICATE_API_TOKEN/i.test(blob)) return true;
  return false;
}

/** Strip credential / env-var / REPLICATE_* names from any message shown in the UI. */
export function sanitizeClientError(message: string): string {
  if (isServiceUnavailable(0, { error: message })) return SERVICE_UNAVAILABLE_ZH;
  if (ENV_OR_SECRET.test(message)) {
    return "Something went wrong. Please try again.";
  }
  return message;
}

export function formatLightApiError(
  status: number,
  data: { error?: string; code?: string }
): string {
  if (isServiceUnavailable(status, data)) return SERVICE_UNAVAILABLE_ZH;
  const code = data.code;
  if (code === "PREDICTION_TIMEOUT" || status === 504) {
    return "Removal timed out on the Worker (~30s budget). Try a smaller image.";
  }
  if (code === "PAYLOAD_TOO_LARGE" || status === 413) {
    return "That photo is too large for the Worker. Use a file under ~10 MB.";
  }
  if (code === "REPLICATE_RATE_LIMIT" || status === 429) {
    return "Removal provider is rate-limiting requests. Try again shortly.";
  }
  if (
    code === "REPLICATE_AUTH" ||
    code === "REPLICATE_ERROR" ||
    code === "REPLICATE_NO_POLL_URL" ||
    code === "REPLICATE_POLL_ERROR"
  ) {
    return "Removal failed. Please try again.";
  }
  if (data.error) return sanitizeClientError(data.error);
  return `Failed to process image (HTTP ${status})`;
}
