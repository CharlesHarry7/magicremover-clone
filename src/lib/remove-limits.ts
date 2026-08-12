/** Shared demo + remove-API limits (client + Worker-friendly server). */

/** Session demo edits before the UI blocks further removes (refresh resets). */
export const FREE_EDITS = 2;

/** Canonical quota story — keep every visible string in sync with FREE_EDITS. */
export const FREE_EDITS_STORY = `${FREE_EDITS} demo edits per browser session (refresh resets)`;

/** Max upload size accepted by the editor. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Longest canvas edge after client resize. */
export const MAX_IMAGE_DIM = 1536;

/** ~10MB decoded image ceiling as data-URL character length. */
export const MAX_DATA_URL_CHARS = 14_000_000;

/** Overall `/api/remove-object` budget for Worker-friendly responses. */
export const OVERALL_BUDGET_MS = 28_000;

/** Client abort slightly above the Worker budget so HTTP 504 can win first. */
export const CLIENT_ABORT_MS = 35_000;

export const CREATE_TIMEOUT_MS = 20_000;
export const POLL_INTERVAL_MS = 1_500;
export const MAX_POLLS = 6;
export const RESULT_FETCH_TIMEOUT_MS = 8_000;
