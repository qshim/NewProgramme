import { getThinkingAgent } from "@/lib/ai/thinkingAgentFactory";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { agent, error } = getThinkingAgent(req.body?.modelProfile);
  if (error) return res.status(500).json({ error });

  try {
    const { text, history, stage, uiLanguage } = req.body ?? {};
    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Missing required field: text" });
    }

    const result = await agent.processIdea({
      text,
      history: Array.isArray(history) ? history : [],
      stage,
      uiLanguage: ["en", "ko", "ja"].includes(uiLanguage) ? uiLanguage : "en",
    });

    return res.status(200).json(result);
  } catch (e) {
    console.error(e);
    const msg =
      e?.name === "ZodError"
        ? `Invalid AI response format: ${e?.issues ? e.issues.map((i) => `${(i.path || []).join(".")}:${i.message}`).slice(0, 6).join(" | ") : "unknown"}`
        : String(e?.message ?? e);
    return res.status(500).json({ error: msg });
  }
}
