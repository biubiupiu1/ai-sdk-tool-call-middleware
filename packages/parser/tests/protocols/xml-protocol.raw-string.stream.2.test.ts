import type {
  LanguageModelV2FunctionTool,
  LanguageModelV2StreamPart,
} from "@ai-sdk/provider";
import { describe, expect, it } from "vitest";

import { morphXmlProtocol } from "@/protocols/morph-xml-protocol";

async function collect(stream: ReadableStream<LanguageModelV2StreamPart>) {
  const out: LanguageModelV2StreamPart[] = [];
  const reader = stream.getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    out.push(value);
  }
  reader.releaseLock();
  return out;
}

describe("morphXmlProtocol raw string handling in streaming", () => {
  it("captures raw inner XML for string-typed arg during streaming", async () => {
    const CHUNK_SIZE = 7;
    const protocol = morphXmlProtocol();
    const tools: LanguageModelV2FunctionTool[] = [
      {
        type: "function",
        name: "write_file",
        description: "Write a file",
        inputSchema: {
          type: "object",
          properties: {
            file_path: { type: "string" },
            content: { type: "string" },
            encoding: { type: "string" },
          },
          required: ["file_path", "content"],
        },
      },
    ];

    const transformer = protocol.createStreamParser({ tools });
    const html = `<html><body><h1>Hi</h1><p>World</p></body></html>`;
    const rs = new ReadableStream<LanguageModelV2StreamPart>({
      start(ctrl) {
        const parts = [
          `<write_file>`,
          `<file_path>/home/username/myfile.html</file_path>`,
          `<content>`,
          html,
          `</content>`,
          `<encoding>utf-8</encoding>`,
          `</write_file>`,
          `<write_file>`,
          `<file_path>/home/username/myfile.html</file_path>`,
          `<content>`,
          html,
          `</content>`,
          `<encoding>utf-8</encoding>`,
          `</write_file>`,
        ];
        // emit in small chunks to simulate streaming
        for (const p of parts) {
          for (let i = 0; i < p.length; i += CHUNK_SIZE) {
            ctrl.enqueue({
              type: "text-delta",
              id: "t",
              delta: p.slice(i, i + CHUNK_SIZE),
            });
          }
        }
        ctrl.enqueue({
          type: "finish",
          finishReason: "stop",
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        });
        ctrl.close();
      },
    });

    const out = await collect(rs.pipeThrough(transformer));

    const tool = out.find(
      (p): p is Extract<LanguageModelV2StreamPart, { type: "tool-call" }> =>
        p.type === "tool-call"
    );
    expect(tool?.toolName).toBe("write_file");
    if (!tool) throw new Error("Expected tool-call part to be present");
    const args = JSON.parse(tool.input) as {
      file_path: string;
      content: string;
      encoding?: string;
    };
    expect(args.file_path).toBe("/home/username/myfile.html");
    expect(args.content).toBe(html);
    expect(args.encoding).toBe("utf-8");
  });
});

const rawStringSpecCase =
  "我将为整个样式绑定合适的物料。通过分析当前页面结构，我发现这是一个优惠券展示页面，包含标题、优惠金额、使用条件、倒计时和按钮等元素。\n\n我将按照以下计划进行物料绑定：\n1. 将静态标题文本替换为 `$ad.title` 物料\n2. 将优惠金额 \"28\" 替换为 `$ad.generic_benefits[0].credit` 物料（需要转换为元）\n3. 将使用条件 \"满56可用\" 替换为 `$ad.generic_benefits[0].threshold` 物料（需要转换为元）\n4. 将倒计时文本替换为动态时间显示\n5. 将按钮文案 \"立即使用\" 替换为 `$ad.button_text` 物料\n6. 将提示文案 \"优惠券已放入「券红包」中\" 替换为适当物料或保留\n\n现在我开始执行这些更改：\n\n\n<write_sfc_content>\n<template_diff>\n\n// ... existing code ...\n      <view\n        id=\"aQi8azg02u\"\n        title=\"Frame 2082895687\"\n        :style=\"{\n          display: 'flex',\n          width: '100%',\n          height: '37px',\n          marginTop: '20px',\n          position: 'relative',\n          overflow: 'hidden',\n          justifyContent: 'center',\n          alignItems: 'center',\n          maxWidth: '226px',\n        }\"\n      >\n        <image\n          id=\"BdgAAyAza9\"\n          title=\"恭喜获得限时优惠\"\n          :src=\"'https://lf3-static.bytednsdoc.com/obj/eden-cn/lthsm/ljhwZthlaukjlkulzlp/figma-mcp/1758648405273/title_text.png'\"\n          :style=\"{\n            width: '100%',\n            height: '28px',\n            maxWidth: '224px',\n            animations: [\n              {\n                id: 'WoZWo1_0uF',\n                name: '未命名',\n                duration: 1,\n                delay: 0,\n                easing: 'linear',\n                iterations: 1,\n                fill: 'none',\n                direction: 'normal',\n                keyframes: [\n                  {\n                    id: '4zh9rMH-sN',\n                    progress: 0,\n                    transforms: { usedKeys: [] },\n                  },\n                  {\n                    id: 'D8LTet48ms',\n                    progress: 100,\n                    transforms: { usedKeys: [] },\n                  },\n                ],\n              },\n            ],\n          }\"\n        />\n// ... existing code ...\n            <text\n              id=\"-Y1Fk85vbI\"\n              title=\"28\"\n              :text-maxline=\"1\"\n              :style=\"{\n                width: 'auto',\n                height: '62px',\n                color: 'rgba(243, 79, 52, 1)',\n                fontSize: '62px',\n                lineHeight: '62px',\n                flexShrink: '0',\n              }\"\n              >{{ Math.floor($ad.generic_benefits[0].credit / 100) }}</text\n            >\n// ... existing code ...\n            <text\n              id=\"EzxWDyC7fQ\"\n              title=\"满56可用\"\n              :text-maxline=\"0\"\n              :style=\"{\n                width: 'auto',\n                height: '14px',\n                marginTop: '5px',\n                color: 'rgba(243, 79, 52, 1)',\n                fontWeight: '500',\n                fontSize: '14px',\n                lineHeight: '14px',\n              }\"\n              >满{{ Math.floor($ad.generic_benefits[0].threshold / 100) }}可用</text\n            >\n// ... existing code ...\n            <text\n              id=\"6Kvbabj8cT\"\n              title=\"23:23:44\"\n              :text-maxline=\"0\"\n              :style=\"{\n                width: 'auto',\n                height: '12px',\n                color: 'rgba(22, 24, 35, 0.45)',\n                fontSize: '12px',\n                lineHeight: '12px',\n              }\"\n              >{{ $ad.generic_benefits[0].expire_timestamp ? formatTime($ad.generic_benefits[0].expire_timestamp) : '23:23:44' }}</text\n            >\n// ... existing code ...\n              <text\n                id=\"oTv6M2kUel\"\n                title=\"立即使用\"\n                :text-maxline=\"1\"\n                :style=\"{\n                  width: 'auto',\n                  height: '22px',\n                  color: 'rgba(255, 255, 255, 1)',\n                  textAlign: 'center',\n                  fontWeight: '500',\n                  fontSize: '15px',\n                  lineHeight: '22px',\n                }\"\n                >{{ $ad.button_text }}</text\n              >\n// ... existing code ...\n\n</template_diff>\n<template_instructions>I updated the template to bind appropriate material data to various elements including the discount amount, threshold, expiration time, and button text.</template_instructions>\n<script_setup_diff>\n// ... existing code ...\nexport function formatTime(timestamp) {\n  // Convert timestamp to hours:minutes:seconds format\n  const now = Date.now() / 1000;\n  const diff = timestamp - now;\n  \n  if (diff <= 0) {\n    return '00:00:00';\n  }\n  \n  const hours = Math.floor(diff / 3600);\n  const minutes = Math.floor((diff % 3600) / 60);\n  const seconds = Math.floor(diff % 60);\n  \n  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;\n}\n// ... existing code ...\n</script_setup_diff>\n<script_setup_instructions>I added a helper function to format timestamps into countdown time format.</script_setup_instructions>\n</write_sfc_content>";

describe("morphXmlProtocol raw string spec case", () => {
  it("should be able to handle the raw string spec case", async () => {
    const CHUNK_SIZE = 15;
    const protocol = morphXmlProtocol();
    const tools: LanguageModelV2FunctionTool[] = [
      {
        type: "function",
        name: "write_sfc_content",
        description: "Write a file",
        inputSchema: {
          type: "object",
          properties: {
            template_diff: { type: "string" },
            template_instructions: { type: "string" },
            script_setup_diff: { type: "string" },
            script_setup_instructions: { type: "string" },
          },
          required: ["template_diff"],
        },
      },
    ];

    const transformer = protocol.createStreamParser({ tools });
    const rs = new ReadableStream<LanguageModelV2StreamPart>({
      start(ctrl) {
        const parts = [rawStringSpecCase];
        // emit in small chunks to simulate streaming
        for (const p of parts) {
          for (let i = 0; i < p.length; i += CHUNK_SIZE) {
            ctrl.enqueue({
              type: "text-delta",
              id: "t",
              delta: p.slice(i, i + CHUNK_SIZE),
            });
          }
        }
        ctrl.enqueue({
          type: "finish",
          finishReason: "stop",
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        });
        ctrl.close();
      },
    });

    const out = await collect(rs.pipeThrough(transformer));

    const tool = out.find(
      (p): p is Extract<LanguageModelV2StreamPart, { type: "tool-call" }> =>
        p.type === "tool-call"
    );
    expect(tool?.toolName).toBe("write_sfc_content");
    if (!tool) throw new Error("Expected tool-call part to be present");
    const args = JSON.parse(tool.input) as {
      template_diff: string;
      template_instructions: string;
      script_setup_diff: string;
      script_setup_instructions: string;
    };
    expect(args.template_diff).toBeDefined();
    expect(args.template_instructions).toBeDefined();
    expect(args.script_setup_diff).toBeDefined();
    expect(args.script_setup_instructions).toBeDefined();
  });
});

const rawStringSpecCase2 =
  '<write_sfc_content>\n<template_diff>\n<![CDATA[\n// ... existing code ...\n<view class="test">\n  <text>测试内容</text>\n</view>\n]]>\n<template_instructions>I added a test view with text content.</template_instructions>\n</write_sfc_content>';
describe("morphXmlProtocol raw string spec case 2", () => {
  it("should be able to handle the raw string spec case 2", async () => {
    const CHUNK_SIZE = 15;
    const protocol = morphXmlProtocol();
    const tools: LanguageModelV2FunctionTool[] = [
      {
        type: "function",
        name: "write_sfc_content",
        description: "Write a file",
        inputSchema: {
          type: "object",
          properties: {
            template_override: { type: "string" },
            template_diff: { type: "string" },
            template_instructions: { type: "string" },
            script_setup_override: { type: "string" },
            script_setup_diff: { type: "string" },
            script_setup_instructions: { type: "string" },
            variables_setup_override: { type: "string" },
            variables_setup_diff: { type: "string" },
            variables_setup_instructions: { type: "string" },
          },
          required: ["template_diff"],
        },
      },
    ];

    const transformer = protocol.createStreamParser({ tools });
    const rs = new ReadableStream<LanguageModelV2StreamPart>({
      start(ctrl) {
        const parts = [rawStringSpecCase2];
        // emit in small chunks to simulate streaming
        for (const p of parts) {
          for (let i = 0; i < p.length; i += CHUNK_SIZE) {
            ctrl.enqueue({
              type: "text-delta",
              id: "t",
              delta: p.slice(i, i + CHUNK_SIZE),
            });
          }
        }
        ctrl.enqueue({
          type: "finish",
          finishReason: "stop",
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        });
        ctrl.close();
      },
    });

    const out = await collect(rs.pipeThrough(transformer));

    const tool = out.find(
      (p): p is Extract<LanguageModelV2StreamPart, { type: "tool-call" }> =>
        p.type === "tool-call"
    );
    expect(tool?.toolName).toBe("write_sfc_content");
  });
});
