import { createThinkingAgent } from "@/lib/thinkingAgent";
import { getServerEnv } from "@/lib/serverEnv";

let cachedAgent = null;

function getAgent() {
  const apiKey = getServerEnv("OPENAI_API_KEY");
  if (!apiKey) return { error: "OpenAI API Key is missing on server." };
  if (!cachedAgent) cachedAgent = createThinkingAgent({ apiKey });
  return { agent: cachedAgent };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { agent, error } = getAgent();
  if (error) return res.status(500).json({ error });

  try {
    const summary = await agent.summarizeTeamContext(req.body || {});
    return res.status(200).json(summary);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e?.message ?? e) });
  }
}
