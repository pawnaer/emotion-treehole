const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400"
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method Not Allowed" }),
        {
          status: 405,
          headers: {
            ...cors,
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    try {
      const body = await request.json();
      const endpoint =
        env.YUANJING_ENDPOINT ||
        "https://www.yjmaas-api.10010.com/openapi/compatible-mode/v1/chat/completions";
      const apiKey = env.YUANJING_API_KEY;

      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "YUANJING_API_KEY is not configured" }),
          {
            status: 500,
            headers: {
              ...cors,
              "Content-Type": "application/json; charset=utf-8"
            }
          }
        );
      }

      let upstreamBody;
      if (endpoint.includes("compatible-mode/v1/chat/completions")) {
        upstreamBody = {
          model:
            body.model ||
            body.agent_id ||
            env.YUANJING_MODEL ||
            "deepseek-v4-flash",
          messages:
            body.messages ||
            (body.input
              ? [{ role: "user", content: body.input }]
              : []),
          stream: false
        };
      } else {
        upstreamBody = {
          agent_id: body.agent_id || env.YUANJING_AGENT_ID,
          input: body.input || "",
          stream: false
        };
        if (body.session_id) {
          upstreamBody.session_id = body.session_id;
        }
      }

      const upstream = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + apiKey
        },
        body: JSON.stringify(upstreamBody)
      });

      const text = await upstream.text();
      return new Response(text, {
        status: upstream.status,
        headers: {
          ...cors,
          "Content-Type":
            upstream.headers.get("Content-Type") ||
            "application/json; charset=utf-8"
        }
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error.name + ": " + error.message
        }),
        {
          status: 500,
          headers: {
            ...cors,
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }
  }
};
