import OpenAI from "openai";
import { createJsonCompletion, repairToSchema } from "@/lib/thinkingAgent/openaiJson";

function collectWebSources(response) {
  const sourcesByUrl = new Map();

  const addSource = (source = {}) => {
    const url = typeof source?.url === "string" ? source.url.trim() : "";
    if (!url || sourcesByUrl.has(url)) return;
    sourcesByUrl.set(url, {
      title: typeof source?.title === "string" && source.title.trim() ? source.title.trim() : url,
      url,
    });
  };

  for (const item of Array.isArray(response?.output) ? response.output : []) {
    if (item?.type === "message") {
      for (const part of Array.isArray(item.content) ? item.content : []) {
        for (const annotation of Array.isArray(part?.annotations) ? part.annotations : []) {
          if (annotation?.type === "url_citation") addSource(annotation);
        }
      }
    }
    if (item?.type === "web_search_call") {
      for (const source of Array.isArray(item?.action?.sources) ? item.action.sources : []) {
        addSource(source);
      }
    }
  }

  return Array.from(sourcesByUrl.values()).slice(0, 8);
}

export function createOpenAiAdapter({ apiKey }) {
  if (!apiKey) throw new Error("OpenAI API Key is missing on server.");
  const client = new OpenAI({ apiKey });

  return {
    async completeJson({ model, systemPrompt, userPrompt }) {
      return createJsonCompletion({ client, model, systemPrompt, userPrompt });
    },

    async completeChat({ model, messages }) {
      const response = await client.chat.completions.create({ model, messages });
      return response.choices?.[0]?.message?.content ?? "";
    },

    async completeWebSearch({ model, messages, searchContextSize = "medium" }) {
      const instructions = (Array.isArray(messages) ? messages : [])
        .filter((message) => ["system", "developer"].includes(message?.role))
        .map((message) => message.content)
        .filter(Boolean)
        .join("\n\n");
      const input = (Array.isArray(messages) ? messages : [])
        .filter((message) => !["system", "developer"].includes(message?.role))
        .map((message) => ({
          role: message?.role === "assistant" ? "assistant" : "user",
          content: String(message?.content || ""),
        }));
      const response = await client.responses.create({
        model,
        instructions,
        input,
        tools: [{
          type: "web_search",
          search_context_size: searchContextSize,
          user_location: {
            type: "approximate",
            country: "KR",
            timezone: "Asia/Seoul",
          },
        }],
        tool_choice: "required",
        max_tool_calls: 3,
        max_output_tokens: 1600,
        include: ["web_search_call.action.sources"],
        text: { verbosity: "low" },
        store: false,
      });
      return {
        text: String(response.output_text || "").trim(),
        sources: collectWebSources(response),
        webSearchUsed: (Array.isArray(response.output) ? response.output : []).some(
          (item) => item?.type === "web_search_call"
        ),
      };
    },

    async repairJson({ model, schemaName, schemaHint, badJsonText }) {
      return repairToSchema({ client, model, schemaName, schemaHint, badJsonText });
    },
  };
}
