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
  const projectId = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
  if (!projectId) return res.status(400).json({ error: "Missing project id" });

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { agent, error } = getAgent();
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
