import { getThinkingAgent } from "@/lib/ai/thinkingAgentFactory";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { agent, error } = getThinkingAgent(req.body?.modelProfile);
  if (error) return res.status(500).json({ error });

  try {
    const summary = await agent.summarizeTeamContext(req.body || {});
    return res.status(200).json(summary);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e?.message ?? e) });
  }
}
