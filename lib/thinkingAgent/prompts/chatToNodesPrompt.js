export function buildChatToNodesPrompt({
  mode,
  flow,
  stageId,
  modeProfile,
  suggestion_category,
  suggestion_phase,
  suggestion_title,
  suggestion_content,
  conversationText,
  attachedContext,
  historyContext,
}) {
  const systemPrompt = `
You are an agent that structures a conversation into reasoning nodes.

Analyze the conversation below and extract 1 to 4 core idea nodes.
Each node must include:
- label (short action-oriented title)
- content (one sentence)
- category (Problem|Goal|Insight|Evidence|Assumption|Constraint|Idea|Option|Risk|Conflict|Decision|OpenQuestion)
- phase (Problem/Solution)
- ownerId (string)
- sourceType (user|agent|mixed)
- visibility (private|candidate|shared|reviewed|agreed)
- confidence (low|medium|high)
- Respond in English only for all user-visible text fields (label, content, connection_label).
- All relation labels must be exactly one of: supports, contradicts, causes, refines, depends_on, proposes, blocks.

Current high-level mode:
- Focus: ${mode === "design" ? "Design" : "Research"}
- Flow: ${flow === "converge" ? "Converge (summarize, prioritize, decide)" : "Diverge (explore, branch, generate options)"}
- Reasoning profile: ${modeProfile.label}

Stage behavior:
- If flow is Diverge: it is acceptable to create up to 4 distinct nodes capturing different directions or questions raised in the conversation.
- If flow is Converge: prefer fewer nodes (1–3) that consolidate the conversation into clearer problem statements (research) or concrete solution decisions/plans (ideation). Avoid duplicating ideas that are already represented by existing nodes; instead, connect to them.
- Favor these node types in this mode when supported by the conversation: ${modeProfile.nodeBias.join(", ")}
- If Focus is Research: prioritize problem understanding, evidence, assumptions, and conflict.
- If Focus is Design: prioritize ideas, options, decisions, goals, and risks.
- If Flow is Converge: summarize, compare, reduce, and prefer the strongest nodes over breadth.

[Original Suggestion Card]
${suggestion_category}/${suggestion_phase}: ${suggestion_title} - ${suggestion_content}

[Conversation]
${conversationText}

${attachedContext ? `[Attached Nodes]\n${attachedContext}\n\nUse these as additional grounding context.\n\n` : ""}## Existing nodes (for cross_connections)
${historyContext}
Current stage id: ${stageId}
`;

  const schemaHint = `{
  "user_nodes": [{"label": "string", "content": "string", "category": "Problem|Goal|Insight|Evidence|Assumption|Constraint|Idea|Option|Risk|Conflict|Decision|OpenQuestion", "phase": "Problem|Solution", "ownerId": "string", "sourceType": "user|agent|mixed", "visibility": "private|candidate|shared|reviewed|agreed", "confidence": "low|medium|high"}],
  "cross_connections": [{"existing_node_id":"string","new_node_index":0,"connection_label":"supports|contradicts|causes|refines|depends_on|proposes|blocks"}]
}`;

  return {
    schemaHint,
    strictPrompt: `${systemPrompt}

Return JSON only, strictly matching this schema:
${schemaHint}
`,
  };
}
