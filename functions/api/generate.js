const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

async function callGemini({ apiKey, model, prompt }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.error) {
    const message = payload?.error?.message || `Gemini request failed with status ${response.status}`;
    throw new Error(message);
  }

  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned an empty or malformed response.");
  }

  return text;
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed. Use POST." }, 405);
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonResponse({ error: "Content-Type must include application/json." }, 415);
  }

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: "Server misconfiguration: missing GEMINI_API_KEY." }, 500);
  }

  const body = await request.json().catch(() => null);
  const prompt = body?.prompt;
  const requestedModel = body?.model;

  if (!prompt || typeof prompt !== "string") {
    return jsonResponse({ error: "Invalid request. 'prompt' must be a non-empty string." }, 400);
  }

  if (prompt.length > 25000) {
    return jsonResponse({ error: "Prompt exceeds maximum length of 25000 characters." }, 413);
  }

const fallbackModels = ["gemini-2.5-flash", "gemini-1.5-flash"];
  const modelOrder = requestedModel
    ? [requestedModel, ...fallbackModels.filter((model) => model !== requestedModel)]
    : fallbackModels;

  const failures = [];
  for (const model of modelOrder) {
    try {
      const text = await callGemini({ apiKey, model, prompt });
      return jsonResponse({ text, modelUsed: model });
    } catch (error) {
      failures.push({ model, message: error instanceof Error ? error.message : String(error) });
    }
  }

  return jsonResponse(
    {
      error: "All model attempts failed.",
      details: failures,
    },
    502,
  );
}
