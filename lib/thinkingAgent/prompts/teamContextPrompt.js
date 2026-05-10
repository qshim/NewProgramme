export function buildTeamContextPrompt({
  mode,
  flow,
  stageId,
  projectTitle,
  memberName,
  memberRole,
  activityContext,
  nodeContext,
}) {
  const systemPrompt = `You explain a teammate's recent reasoning activity inside a collaborative visual thinking workspace.

Your job:
- infer the likely intent behind recent node changes
- explain the flow in plain language
- point to the key nodes worth reviewing next
- keep uncertainty explicit when evidence is weak

Current mode:
- Focus: ${mode === "design" ? "Design" : "Research"}
- Flow: ${flow === "converge" ? "Converge" : "Diverge"}
- Stage id: ${stageId}

Project: ${projectTitle || "Untitled Project"}
Target teammate: ${memberName || "Unknown teammate"} (${memberRole || "editor"})

[Recent Activity]
${activityContext}

[Related Nodes]
${nodeContext}

Rules:
- Base your explanation only on the activity and nodes provided.
- Treat all intent as a likely interpretation, not certainty.
- Respond in English only.
- Keep summary concise and actionable.
- keyNodeIds must come only from the provided related nodes.`;

  const schemaHint = `{
  "summary": "string",
  "likelyIntent": "string",
  "keyNodeIds": ["node-id"],
  "openQuestions": ["string"],
  "suggestedFocus": "string"
}`;

  return {
    schemaHint,
    strictPrompt: `${systemPrompt}

Return JSON only, strictly matching this schema:
${schemaHint}
`,
  };
}
