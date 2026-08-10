import { getThinkingAgent } from "@/lib/ai/thinkingAgentFactory";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { agent, error } = getThinkingAgent(req.body?.modelProfile);
  if (error) return res.status(500).json({ error });

  try {
    const result = await agent.developConcept(req.body ?? {});
    return res.status(200).json(result);
  } catch (requestError) {
    console.error(requestError);
    const detail = requestError?.name === "ZodError"
      ? requestError.issues
          ?.slice(0, 6)
          .map((issue) => `${(issue.path || []).join(".")}:${issue.message}`)
          .join(" | ")
      : String(requestError?.message ?? requestError);
    return res.status(500).json({ error: "Concept Studio could not create a grounded response.", detail });
  }
}
