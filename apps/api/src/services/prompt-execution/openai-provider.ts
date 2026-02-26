import OpenAI from "openai";
import { env } from "../../config/env";
import type { PromptExecutionContext, PromptExecutionProvider, PromptExecutionResult } from "./types";

export class OpenAIPromptExecutionProvider implements PromptExecutionProvider {
  #client: OpenAI;
  #model: string;

  constructor() {
    if (!env.OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY");
    }
    this.#client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    this.#model = env.OPENAI_MODEL ?? "gpt-4.1-mini";
  }

  async execute(context: PromptExecutionContext): Promise<PromptExecutionResult> {
    const prompt = this.buildPrompt(context);

    const response = await this.#client.responses.create({
      model: this.#model,
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "prompt_execution_result",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["overview", "intent", "proposedChanges", "risks", "nextSteps"],
            properties: {
              overview: { type: "string" },
              intent: { type: "string" },
              proposedChanges: {
                type: "array",
                items: {
                  type: "object",
                  required: ["area", "description"],
                  properties: {
                    area: { type: "string" },
                    description: { type: "string" },
                  },
                },
              },
              risks: { type: "array", items: { type: "string" } },
              nextSteps: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
      input: [
        {
          role: "system",
          content:
            "You are Felix, a senior engineer translating business prompts into actionable engineering plans. Respond with JSON only.",
        },
        { role: "user", content: prompt },
      ],
    });

    const content = response.output?.[0]?.content?.[0];
    if (!content || content.type !== "output_text") {
      throw new Error("Malformed OpenAI response");
    }

    let parsed: ReturnType<OpenAIPromptExecutionProvider["defaultSummary"]>;
    try {
      parsed = JSON.parse(content.text) as typeof parsed;
    } catch (error) {
      parsed = this.defaultSummary(context, `Failed to parse JSON: ${(error as Error).message}`);
    }

    return {
      provider: "openai",
      summary: {
        overview: parsed.overview,
        intent: parsed.intent,
        proposedChanges: parsed.proposedChanges,
        risks: parsed.risks,
        nextSteps: parsed.nextSteps,
      },
      metadata: {
        raw: parsed,
        prompt: context.prompt.promptText,
      },
      tokensUsed: response.usage?.total_tokens,
    };
  }

  private buildPrompt(context: PromptExecutionContext) {
    const lines = [
      `Prompt text: ${context.prompt.promptText}`,
      context.prompt.category ? `Category: ${context.prompt.category}` : "",
      context.project ? `Project: ${context.project.name} (${context.project.slug})` : "",
      context.project?.repositoryUrl ? `Repository: ${context.project.repositoryUrl}` : "",
      context.connector
        ? `Connector: ${context.connector.repoOwner}/${context.connector.repoName} (${context.connector.defaultBranch ?? "branch unknown"})`
        : "",
      "Deliver a JSON response describing the intent, proposed changes split by areas (frontend, backend, data, ops, etc.), key risks, and next steps.",
      "Do NOT include code. This is a planning-only step.",
    ].filter(Boolean);

    return lines.join("\n");
  }

  private defaultSummary(context: PromptExecutionContext, reason: string) {
    return {
      overview: `Unable to parse model output for prompt ${context.prompt.id}. Reason: ${reason}`,
      intent: "",
      proposedChanges: [],
      risks: ["Model parsing failed"],
      nextSteps: ["Retry prompt execution"],
    };
  }
}
