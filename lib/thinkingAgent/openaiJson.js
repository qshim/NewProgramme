export async function createJsonCompletion({ client, model, systemPrompt, userPrompt }) {
  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: `${systemPrompt}\n\nOutput JSON only. No prose, markdown, or code fences.`,
      },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });
  return response.choices?.[0]?.message?.content ?? "";
}

export async function repairToSchema({ client, model, schemaName, schemaHint, badJsonText }) {
  const systemPrompt = `You are a JSON transformer. Convert the input JSON so it strictly matches the schema below.
Keep schema key names exactly as specified and fill missing fields with reasonable values.
For any user-visible text field (for example: label/content/suggestion_*), output English only.
Output only one JSON object.

[Schema Name]
${schemaName}

[Required Schema]
${schemaHint}
`;
  return createJsonCompletion({
    client,
    model,
    systemPrompt,
    userPrompt: `Input JSON:\n${badJsonText}`,
  });
}
