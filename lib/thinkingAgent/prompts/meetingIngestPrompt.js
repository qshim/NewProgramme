export function buildMeetingIngestPrompt({
  mode,
  flow,
  stageId,
  modeProfile,
  chunkType,
  speakerName,
  meetingSessionId,
  projectTitle,
  historyContext,
  memoryContext,
}) {
  const systemPrompt = `
You are a meeting-ingestion engine for an evolving reasoning-memory system.

Your job is not to summarize the whole meeting. Your job is to process one new meeting chunk and decide how it should update the reasoning state.

Current mode:
- Focus: ${mode === "design" ? "Design" : "Research"}
- Flow: ${flow === "converge" ? "Converge" : "Diverge"}
- Reasoning profile: ${modeProfile.label}

Process the latest meeting chunk in sequence.

Rules:
- Break the chunk into 1 to 5 atomic reasoning units.
- Each unit must be one of: Problem, Goal, Insight, Evidence, Assumption, Constraint, Idea, Option, Risk, Conflict, Decision, OpenQuestion.
- For each unit choose one operation:
  - create: new issue or idea not yet represented
  - strengthen: repeats or reinforces an existing node
  - contradict: challenges an existing node
  - reopen: re-activates a previously unresolved issue
  - link: relates to an existing node without fully duplicating it
- If the chunk mostly repeats an existing node, prefer strengthen with existing_node_id instead of creating a duplicate node.
- Use existing_node_id only when one existing node is a clear anchor.
- relation_label must be exactly one of: supports, contradicts, causes, refines, depends_on, proposes, blocks.
- All user-visible text must be English only.
- Keep labels concise and action-oriented.

Meeting input metadata:
- chunkType: ${chunkType || "speaker_turn"}
- speakerName: ${speakerName || "Unknown speaker"}
- meetingSessionId: ${meetingSessionId || "session-current"}
- projectTitle: ${projectTitle || "Untitled Project"}

[Existing Nodes]
${historyContext}

[Current Memory]
${memoryContext}

Current stage id: ${stageId}
`;

  const schemaHint = `{
  "chunk_summary": "string",
  "units": [
    {
      "label": "string",
      "content": "string",
      "category": "Problem|Goal|Insight|Evidence|Assumption|Constraint|Idea|Option|Risk|Conflict|Decision|OpenQuestion",
      "phase": "Problem|Solution",
      "ownerId": "string",
      "sourceType": "user|agent|mixed",
      "visibility": "private|candidate|shared|reviewed|agreed",
      "confidence": "low|medium|high",
      "operation": "create|strengthen|contradict|reopen|link",
      "existing_node_id": "string",
      "relation_label": "supports|contradicts|causes|refines|depends_on|proposes|blocks",
      "repeated_issue_key": "string"
    }
  ],
  "working_memory": {
    "active_issue_titles": ["string"],
    "unresolved_questions": ["string"],
    "decision_candidates": ["string"],
    "repeated_issue_keys": ["string"]
  },
  "executive_memory": {
    "current_direction": "string",
    "unresolved_areas": ["string"],
    "next_step_implications": ["string"]
  }
}`;

  return { systemPrompt, schemaHint };
}
