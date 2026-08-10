import { getThinkingAgent } from "@/lib/ai/thinkingAgentFactory";

export default async function handler(req, res) {
  const projectId = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
  if (!projectId) return res.status(400).json({ error: "Missing project id" });

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { agent, error } = getThinkingAgent(req.body?.modelProfile);
  if (error) return res.status(500).json({ error });

  try {
    const result = await agent.ingestMeetingChunk({
      projectTitle: req.body?.projectTitle,
      chunkText: req.body?.chunkText,
      chunkType: req.body?.chunkType,
      speakerName: req.body?.speakerName,
      meetingSessionId: req.body?.meetingSessionId,
      existing_nodes: req.body?.existing_nodes,
      meeting_memory: req.body?.meeting_memory,
      stage: req.body?.stage,
      uiLanguage: ["en", "ko", "ja"].includes(req.body?.uiLanguage) ? req.body.uiLanguage : "en",
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
