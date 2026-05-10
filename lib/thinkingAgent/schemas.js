import { z } from "zod";
import {
  NODE_CONFIDENCE_LEVELS,
  NODE_SOURCE_TYPES,
  NODE_VISIBILITY_STATES,
  REASONING_NODE_TYPES,
  SUGGESTION_LENS_TAGS,
  SUGGESTION_QUESTION_TAGS,
  SUGGESTION_REASONING_TAGS,
} from "@/lib/thinkingMachine/nodeMeta";

export const MeetingOperationValues = ["create", "strengthen", "contradict", "reopen", "link"];

export const CategorySchema = z.enum(REASONING_NODE_TYPES);
export const PhaseSchema = z.enum(["Problem", "Solution"]);
export const SourceTypeSchema = z.enum(NODE_SOURCE_TYPES);
export const VisibilitySchema = z.enum(NODE_VISIBILITY_STATES);
export const ConfidenceSchema = z.enum(NODE_CONFIDENCE_LEVELS);

export const StageSchema = z.enum([
  "research-diverge",
  "research-converge",
  "design-diverge",
  "design-converge",
]);
export const SuggestionReasoningSchema = z.enum(SUGGESTION_REASONING_TAGS);
export const SuggestionLensSchema = z.enum(SUGGESTION_LENS_TAGS);
export const SuggestionQuestionSchema = z.enum(SUGGESTION_QUESTION_TAGS);
export const SuggestionTagsSchema = z.object({
  reasoning: SuggestionReasoningSchema,
  lens: SuggestionLensSchema,
  question: SuggestionQuestionSchema,
});

export const UserNodeSchema = z.object({
  label: z.string(),
  content: z.string(),
  category: CategorySchema,
  phase: PhaseSchema,
  ownerId: z.string(),
  sourceType: SourceTypeSchema,
  visibility: VisibilitySchema,
  confidence: ConfidenceSchema,
});

export const CrossConnectionSchema = z.object({
  existing_node_id: z.string(),
  new_node_index: z.number().int().nonnegative(),
  connection_label: z.string(),
});

export const AIAnalysisResultSchema = z.object({
  user_nodes: z.array(UserNodeSchema).min(1).max(4),
  suggestion_label: z.string(),
  suggestion_content: z.string(),
  suggestion_category: CategorySchema,
  suggestion_phase: PhaseSchema,
  suggestion_tags: SuggestionTagsSchema,
  suggestion_connects_to_index: z.number().int().nonnegative(),
  connection_label: z.string(),
  cross_connections: z.array(CrossConnectionSchema).max(3),
});

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export const ChatNodeResultSchema = z.object({
  user_nodes: z.array(UserNodeSchema).min(1).max(4),
  cross_connections: z.array(CrossConnectionSchema).max(3),
});

export const TeamContextSummarySchema = z.object({
  summary: z.string(),
  likelyIntent: z.string(),
  keyNodeIds: z.array(z.string()).max(6),
  openQuestions: z.array(z.string()).max(4),
  suggestedFocus: z.string(),
});

export const ConflictExplainSummarySchema = z.object({
  summary: z.string(),
  whyDifferent: z.string(),
  assumptionGap: z.string(),
  riskIfIgnored: z.string(),
  suggestedNextStep: z.string(),
});

export const MeetingOperationSchema = z.enum(MeetingOperationValues);
export const MeetingUnitSchema = UserNodeSchema.extend({
  operation: MeetingOperationSchema,
  existing_node_id: z.string().optional(),
  relation_label: z.string().optional(),
  repeated_issue_key: z.string().optional(),
});
export const MeetingWorkingMemorySchema = z.object({
  active_issue_titles: z.array(z.string()).max(6),
  unresolved_questions: z.array(z.string()).max(6),
  decision_candidates: z.array(z.string()).max(4),
  repeated_issue_keys: z.array(z.string()).max(8),
});
export const MeetingExecutiveMemorySchema = z.object({
  current_direction: z.string(),
  unresolved_areas: z.array(z.string()).max(5),
  next_step_implications: z.array(z.string()).max(5),
});
export const MeetingChunkResultSchema = z.object({
  chunk_summary: z.string(),
  units: z.array(MeetingUnitSchema).min(1).max(5),
  working_memory: MeetingWorkingMemorySchema,
  executive_memory: MeetingExecutiveMemorySchema,
});
