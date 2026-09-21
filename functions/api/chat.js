const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const endpoint = env.YUANJING_ENDPOINT;
    const apiKey = env.YUANJING_API_KEY;

    let upstreamBody;

    if (endpoint.includes("compatible-mode/v1/chat/completions")) {
      upstreamBody = {
        model: body.model || body.agent_id || env.YUANJING_MODEL,
        messages: body.messages || [
          { role: "user", content: body.input || "" }
        ],
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

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify(upstreamBody)
    });

    return new Response(await response.text(), {
      status: response.status,
      headers: {
        ...cors,
        "Content-Type": response.headers.get("Content-Type") || "application/json"
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.name + ": " + error.message }),
      {
        status: 500,
        headers: {
          ...cors,
          "Content-Type": "application/json"
        }
      }
    );
  }
}
