import { resolveAiModel } from "@/lib/ai/modelRegistry";
import { createOpenAiAdapter } from "@/lib/ai/providers/openaiAdapter";

export function createAiRuntime({ credentials = {}, modelSelection = {} } = {}) {
  const adapters = {
    openai: createOpenAiAdapter({ apiKey: credentials.openai?.apiKey }),
  };

  const resolve = (task) => {
    const target = resolveAiModel(task, modelSelection);
    const adapter = adapters[target.provider];
    if (!adapter) throw new Error(`AI provider is not configured: ${target.provider}`);
    return { adapter, target };
  };

  return {
    async completeJson({ task, systemPrompt, userPrompt }) {
      const { adapter, target } = resolve(task);
      return adapter.completeJson({
        model: target.model,
        systemPrompt,
        userPrompt,
      });
    },

    async completeChat({ task, messages }) {
      const { adapter, target } = resolve(task);
      return adapter.completeChat({ model: target.model, messages });
    },

    async completeWebSearch({ task, messages, searchContextSize }) {
      const { adapter, target } = resolve(task);
      return adapter.completeWebSearch({
        model: target.model,
        messages,
        searchContextSize,
      });
    },

    async repairJson({ task, schemaName, schemaHint, badJsonText }) {
      const { adapter, target } = resolve(task);
      return adapter.repairJson({
        model: target.model,
        schemaName,
        schemaHint,
        badJsonText,
      });
    },

    describeTask(task) {
      return { ...resolve(task).target };
    },
  };
}
