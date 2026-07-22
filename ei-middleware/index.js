/**
 * Emotional Infrastructure Middleware — Cloudflare Worker
 *
 * Thin API entry point that handles auth, input validation, and forwards
 * requests to the EIOS Gateway for SPEC-101 safety enforcement.
 *
 * Environment variables (set via wrangler.toml [vars] or Secrets):
 *   EIOS_GATEWAY_URL  URL of the EIOS Python gateway (e.g. http://eios-gateway:8080)
 *   EI_ENABLED        "true" | "false" — set to "false" to bypass EI enforcement
 *   AUTH_MODE         "key" | "jwt" | "both" | "none"
 *   API_KEY           (Secret) Bearer token for key-based auth
 *   MAX_INPUT_CHARS   Maximum allowed length of user_message (default 4000)
 */

const CRISIS_MESSAGE =
  "If you are in crisis, call or text 988, or visit findahelpline.com.";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/healthz" && request.method === "GET") {
      return json({ status: "ok", ei_enabled: env.EI_ENABLED !== "false" });
    }

    if (url.pathname !== "/v1/turn" || request.method !== "POST") {
      return json({ error: "Not found" }, 404);
    }

    // Auth
    const authErr = checkAuth(request, env);
    if (authErr) return authErr;

    // Parse body
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const { session_id, user_message } = body;
    if (!session_id || !user_message) {
      return json({ error: "session_id and user_message are required" }, 400);
    }

    const maxChars = parseInt(env.MAX_INPUT_CHARS || "4000", 10);
    if (user_message.length > maxChars) {
      return json({ error: `user_message exceeds ${maxChars} characters` }, 400);
    }

    // EI bypass mode — return a pass-through response without contacting the gateway
    if (env.EI_ENABLED === "false") {
      return json({
        session_id,
        route: "NORMAL",
        response: user_message,
        depth_policy: "full",
        ei_enabled: false,
      });
    }

    // Forward to EIOS Gateway
    const gatewayUrl = (env.EIOS_GATEWAY_URL || "http://localhost:8080").replace(/\/$/, "");
    const gatewayPayload = {
      user_id: session_id,
      session_id,
      text: user_message,
      emotion_intensity: clamp(body.emotion_intensity ?? 5.0, 0, 10),
      negative_valence: Boolean(body.negative_valence ?? false),
      suicidality: Boolean(body.suicidality ?? false),
      trauma_markers: Boolean(body.trauma_markers ?? false),
      consent_level: validateConsentLevel(body.consent_level),
      tier: body.tier ?? 2,
    };

    let gatewayResult;
    try {
      const resp = await fetch(`${gatewayUrl}/process`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(gatewayPayload),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        return json({ error: "Gateway error", detail: errText }, 502);
      }
      gatewayResult = await resp.json();
    } catch (err) {
      return json({ error: "Gateway unreachable", detail: String(err) }, 502);
    }

    return json({
      session_id,
      route: gatewayResult.route,
      response: gatewayResult.model_response,
      depth_policy: gatewayResult.depth_policy,
      metrics: gatewayResult.metrics,
      ei_enabled: true,
    });
  },
};

function checkAuth(request, env) {
  const mode = env.AUTH_MODE || "key";
  if (mode === "none") return null;

  const authHeader = request.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ error: "Authorization header required (Bearer token)" }, 401);
  }

  if (mode === "key" || mode === "both") {
    const token = authHeader.slice(7);
    if (env.API_KEY && token !== env.API_KEY) {
      return json({ error: "Invalid API key" }, 401);
    }
  }

  return null;
}

function validateConsentLevel(value) {
  return ["surface", "reflective", "trauma"].includes(value) ? value : "surface";
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, Number(v) || 0));
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
