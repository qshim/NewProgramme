import { getModelSelectionForProfile, normalizeAiModelProfile } from "@/lib/ai/modelRegistry";
import { getServerEnv } from "@/lib/serverEnv";
import { createThinkingAgent } from "@/lib/thinkingAgent";

const agentByProfile = new Map();

export function getThinkingAgent(modelProfile) {
  const apiKey = getServerEnv("OPENAI_API_KEY");
  if (!apiKey) return { error: "OpenAI API Key is missing on server." };

  const profile = normalizeAiModelProfile(modelProfile);
  if (!agentByProfile.has(profile)) {
    agentByProfile.set(profile, createThinkingAgent({
      apiKey,
      modelSelection: getModelSelectionForProfile(profile),
    }));
  }
  return { agent: agentByProfile.get(profile), profile };
}
