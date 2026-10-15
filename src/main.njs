import http from "node:http";
import { readFileSync } from "node:fs";

const HOST = "127.0.0.1";
const PORT = 8787;

function loadConfig() {
    try {
        const raw = readFileSync(new URL("./config.json", import.meta.url), "utf8");
        return JSON.parse(raw);
    } catch (err) {
        console.error("[proxy] Error reading config.json:", err.message);
        return {
            provider_url: "https://openrouter.ai",
            reasoning_effort: "none",
            overwrite_samplers: false,
            sampler_settings: {},
        };
    }
}

let config = loadConfig();

const FORCE_MODEL = null;
const HOP_BY_HOP = new Set([
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "host",
    "content-length",
]);

function extractApiKey(req, payload) {
    // 1. Check HTTP Authorization header (e.g. Bearer <token>)
    const authHeader = req.headers["authorization"];
    if (authHeader && typeof authHeader === "string") {
        const trimmed = authHeader.trim();
        if (trimmed.toLowerCase().startsWith("bearer ")) {
            const token = trimmed.slice(7).trim();
            if (token && token !== "undefined" && token !== "null") {
                return token;
            }
        } else if (
            trimmed &&
            trimmed.toLowerCase() !== "bearer" &&
            trimmed !== "undefined" &&
            trimmed !== "null"
        ) {
            return trimmed;
        }
    }

    // 2. Check x-api-key / api-key headers
    const xApiKey = req.headers["x-api-key"] || req.headers["api-key"];
    if (typeof xApiKey === "string" && xApiKey.trim()) {
        const token = xApiKey.trim();
        if (token && token !== "undefined" && token !== "null") {
            return token;
        }
    }

    // 3. Check JSON body fields (e.g. JanitorAI reverseProxyKey or openAIKey)
    if (payload && typeof payload === "object") {
        const candidate =
            payload.userConfig?.reverseProxyKey ||
            payload.userConfig?.openAIKey ||
            payload.userConfig?.claudeApiKey ||
            payload.reverseProxyKey ||
            payload.openAIKey ||
            payload.apiKey ||
            payload.key;

        if (typeof candidate === "string" && candidate.trim()) {
            const token = candidate.trim();
            if (token && token !== "undefined" && token !== "null") {
                return token;
            }
        }
    }

    // 4. Optional fallback to environment variable if set locally
    if (process.env.COMPOSITE_API_KEY && process.env.COMPOSITE_API_KEY.trim()) {
        return process.env.COMPOSITE_API_KEY.trim();
    }

    return null;
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];

        req.on("data", chunk => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks)));
        req.on("error", reject);
    });
}

function copyHeaders(source, target) {
    for (const [key, value] of source) {
        if (!HOP_BY_HOP.has(key.toLowerCase())) {
            target.setHeader(key, value);
        }
    }
}

function cors(res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Authorization, Content-Type, Accept, X-Requested-With, x-api-key"
    );
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
}

const server = http.createServer(async (req, res) => {
    cors(res);

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    try {
        const currentConfig = loadConfig();
        const reasoningEffort = currentConfig.reasoning_effort ?? "none";
        const upstreamBase = currentConfig.provider_url?.trim() || "https://composite.lucidity.sh";

        const body = await readBody(req);
        let outgoingBody = body;
        let payload = null;

        const contentType = req.headers["content-type"] || "";

        if (
            body.length > 0 &&
            contentType.toLowerCase().includes("application/json")
        ) {
            try {
                payload = JSON.parse(body.toString("utf8"));

                // ---------------------------------------------------------
                // REASONING EFFORT
                // ---------------------------------------------------------

                // Remove any frontend value that could conflict with ours.
                delete payload.reasoning_effort;
                delete payload.reasoning;
                delete payload.enable_thinking;

                // Also stop the frontend asking Composite to expose reasoning.
                delete payload.include_reasoning;

                // Composite explicitly supports both of these fields.
                payload.reasoning_effort = reasoningEffort;
                payload.reasoning = {
                    effort: reasoningEffort,
                };

                // Explicitly disable extended thinking if none.
                payload.enable_thinking = reasoningEffort !== "none";

                // Optional model override.
                if (FORCE_MODEL) {
                    payload.model = FORCE_MODEL;
                }

                // ---------------------------------------------------------
                // SAMPLER SETTINGS (from config.json)
                // ---------------------------------------------------------
                if (
                    currentConfig.sampler_settings &&
                    typeof currentConfig.sampler_settings === "object"
                ) {
                    const shouldOverwrite = Boolean(currentConfig.overwrite_samplers);
                    for (const [key, value] of Object.entries(currentConfig.sampler_settings)) {
                        if (value !== null && value !== undefined) {
                            if (shouldOverwrite || payload[key] === undefined) {
                                payload[key] = value;
                            }
                        }
                    }
                }

                outgoingBody = Buffer.from(JSON.stringify(payload));

                console.log(
                    `[proxy] ${req.method} ${req.url} ` +
                    `model=${payload.model || "unspecified"} ` +
                    `reasoning=${reasoningEffort}`
                );
            } catch (err) {
                console.warn("[proxy] Request body was not valid JSON.");
            }
        } else {
            console.log(`[proxy] ${req.method} ${req.url}`);
        }

        // Extract API key from frontend (headers or body)
        const apiKey = extractApiKey(req, payload);

        if (!apiKey) {
            console.warn(`[proxy] 401 Unauthorized: No API key provided for ${req.method} ${req.url}`);
            res.writeHead(401, {
                "Content-Type": "application/json",
            });
            res.end(
                JSON.stringify({
                    error: {
                        message:
                            "Missing Composite API key. Please configure your API key in your frontend (e.g. Reverse Proxy Key in JanitorAI or API Key in SillyTavern).",
                        type: "authentication_error",
                        code: "missing_api_key",
                    },
                })
            );
            return;
        }

        // Keep the incoming path.
        const upstreamURL = new URL(req.url, upstreamBase);

        const headers = new Headers();

        // Forward credentials provided by frontend
        headers.set(
            "Authorization",
            `Bearer ${apiKey}`
        );

        if (req.headers["content-type"]) {
            headers.set(
                "Content-Type",
                req.headers["content-type"]
            );
        }

        if (req.headers["accept"]) {
            headers.set(
                "Accept",
                req.headers["accept"]
            );
        }

        const upstream = await fetch(upstreamURL, {
            method: req.method,
            headers,
            body:
                req.method === "GET" ||
                req.method === "HEAD" ||
                req.method === "OPTIONS"
                    ? undefined
                    : outgoingBody,
        });

        res.statusCode = upstream.status;
        copyHeaders(upstream.headers, res);

        if (!upstream.body) {
            res.end();
            return;
        }

        // Stream SSE responses straight back to SillyTavern.
        const reader = upstream.body.getReader();

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            res.write(Buffer.from(value));
        }

        res.end();
    } catch (err) {
        console.error("[proxy] ERROR:", err);

        if (!res.headersSent) {
            res.writeHead(502, {
                "Content-Type": "application/json",
            });
        }

        res.end(
            JSON.stringify({
                error: {
                    message: "Proxy error",
                    details: String(err),
                },
            })
        );
    }
});

server.listen(PORT, HOST, () => {
    console.log("");
    console.log(`listening: http://${HOST}:${PORT}`);
    console.log(`provider url: ${config.provider_url || "https://composite.lucidity.sh"}`);
    console.log(`reasoning effort: ${config.reasoning_effort ?? "none"}`);
    console.log("");
});
