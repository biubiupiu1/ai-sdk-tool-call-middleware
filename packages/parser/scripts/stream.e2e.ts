import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { LanguageModel, stepCountIs, streamText, wrapLanguageModel } from "ai";
import { z } from "zod";

import { morphXmlToolMiddleware } from "@/index";

const openrouter = createOpenAICompatible({
  name: "openrouter",
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  fetch: (...args) => {
    return fetch(...args);
  },
});

const friendli = createOpenAICompatible({
  name: "friendli",
  apiKey: process.env.FRIENDLI_TOKEN,
  baseURL: "https://api.friendli.ai/serverless/v1",
});

const testModels = {
  xml: wrapLanguageModel({
    model: openrouter("z-ai/glm-4.6"),
    middleware: morphXmlToolMiddleware,
  }),
};

async function main() {
  for (const model of Object.values(testModels)) {
    console.log(`\n\nTesting ${model.modelId}...`);
    await streamE2E(model);
  }
}

async function streamE2E(model: LanguageModel) {
  const result = streamText({
    model: model,
    temperature: 0.0,
    system: "You are a helpful assistant.",
    prompt:
      "NOTE: 我在进行调试错误处理，请错误地调用 write_file 工具，比如 content close tag 少一个字母",
    stopWhen: stepCountIs(4),
    onError: event => console.warn("out onError", event),
    tools: {
      write_file: {
        description: "write a file to disk",
        inputSchema: z.object({ path: z.string(), content: z.string() }),
        execute: async ({ path, content }) => {
          return { path, content };
        },
      },
    },
  });

  for await (const part of result.fullStream) {
    if (part.type === "text-delta") {
      process.stdout.write(part.text);
    } else if (part.type === "reasoning-delta") {
      // Print reasoning text in a different color (e.g., yellow)
      process.stdout.write(`\x1b[33m${part.text}\x1b[0m`);
    } else if (part.type === "tool-result") {
      console.log({
        name: part.toolName,
        input: part.input,
        output: part.output,
      });
    } else if (part.type === "tool-input-start") {
      console.log({
        type: part.type,
        id: part.id,
        toolName: part.toolName,
      });
    } else if (part.type === "tool-input-end") {
      console.log({
        type: part.type,
        id: part.id,
      });
    }
  }

  console.log("\n\n<Complete>");
}

main().catch(console.error);
