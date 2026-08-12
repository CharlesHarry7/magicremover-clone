import { NextResponse } from "next/server";

/**
 * Object removal via Replicate (LaMa-based image-object-removal).
 * Requires REPLICATE_API_TOKEN in the Worker env / .dev.vars.
 */
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_MODEL = "dpakkk/image-object-removal";

function missingKeyResponse() {
  return NextResponse.json(
    {
      error:
        "Object removal is not configured. Set the REPLICATE_API_TOKEN environment variable (Cloudflare Worker secret or .dev.vars) and redeploy.",
      code: "MISSING_API_KEY",
    },
    { status: 503 }
  );
}

async function callReplicate(imageBase64: string, maskBase64: string): Promise<string> {
  const createRes = await fetch(
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
    }
  );

  if (!createRes.ok) {
    const text = await createRes.text();
    if (createRes.status === 401 || createRes.status === 403) {
      throw new Error(
        "Replicate rejected the API token. Check that REPLICATE_API_TOKEN is valid."
      );
    }
    throw new Error(`Replicate API error: ${createRes.status} ${text.slice(0, 300)}`);
  }

  let data = await createRes.json();

  if (data.status === "succeeded") {
    return normalizeOutput(data.output);
  }

  if (data.status === "failed" || data.status === "canceled") {
    throw new Error(data.error || `Prediction ${data.status}`);
  }

  const getUrl = data.urls?.get as string | undefined;
  if (!getUrl) {
    throw new Error("Replicate did not return a result or poll URL");
  }

  for (let i = 0; i < 45; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
    });
    if (!pollRes.ok) {
      throw new Error(`Failed to poll prediction: ${pollRes.status}`);
    }
    data = await pollRes.json();
    if (data.status === "succeeded") return normalizeOutput(data.output);
    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(data.error || `Prediction ${data.status}`);
    }
  }

  throw new Error("Prediction timed out. Try a smaller image or try again.");
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

async function toDataUrl(result: string): Promise<string> {
  if (result.startsWith("data:image/")) return result;

  const res = await fetch(result);
  if (!res.ok) {
    // Fall back to the remote URL if fetch fails; client may still display it.
    return result;
  }
  const contentType = res.headers.get("content-type") || "image/png";
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${contentType};base64,${base64}`;
}

export async function POST(request: Request) {
  if (!REPLICATE_API_TOKEN) {
    return missingKeyResponse();
  }

  try {
    const body = await request.json();
    const image = body?.image;
    const mask = body?.mask;

    if (typeof image !== "string" || typeof mask !== "string") {
      return NextResponse.json(
        { error: "Image and mask are required as base64 data URLs" },
        { status: 400 }
      );
    }

    if (!image.startsWith("data:image/") || !mask.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Image and mask must be data URLs (data:image/...)" },
        { status: 400 }
      );
    }

    const resultUrl = await callReplicate(image, mask);
    // Fetch server-side so the client can download without CORS issues.
    const result = await toDataUrl(resultUrl);
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Remove object error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process image" },
      { status: 500 }
    );
  }
}
