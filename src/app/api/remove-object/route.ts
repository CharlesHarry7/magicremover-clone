import { NextResponse } from "next/server";

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const USE_AI = !!REPLICATE_API_TOKEN;

async function callReplicate(imageBase64: string, maskBase64: string) {
  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({
      version: "95b7223104132402a9ae91cc677285bc5eb997834bd2349fa0231c3cb1f685e7",
      input: {
        image: imageBase64,
        mask: maskBase64,
        prompt: "high quality, seamless, realistic",
        negative_prompt: "blurry, distorted, low quality",
        num_inference_steps: 25,
        guidance_scale: 7.5,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Replicate API error: ${response.status} ${text}`);
  }

  const data = await response.json();

  if (data.status === "succeeded") {
    return data.output;
  }

  if (data.status === "processing" || data.status === "starting") {
    const getUrl = data.urls?.get;
    if (!getUrl) throw new Error("No poll URL returned");

    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(getUrl, {
        headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` },
      });
      const pollData = await pollRes.json();
      if (pollData.status === "succeeded") return pollData.output;
      if (pollData.status === "failed") throw new Error(pollData.error || "Prediction failed");
    }
    throw new Error("Prediction timed out");
  }

  throw new Error(`Unexpected status: ${data.status}`);
}

function fallbackInpaint(imageBase64: string): string {
  return imageBase64;
}

export async function POST(request: Request) {
  try {
    const { image, mask } = await request.json();

    if (!image || !mask) {
      return NextResponse.json({ error: "Image and mask are required" }, { status: 400 });
    }

    let result: string;

    if (USE_AI) {
      result = await callReplicate(image, mask);
      if (Array.isArray(result)) {
        result = typeof result[0] === "string" ? result[0] : result[0]?.image || result[0];
      }
    } else {
      result = fallbackInpaint(image);
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Remove object error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process image" },
      { status: 500 }
    );
  }
}