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
  "\n\n\n<write_sfc_content>\n<template_override>\n\n  <page id=\"ipKmp1ihWk\" :x=\"0\" :y=\"0\" :width=\"375\" :height=\"667\" :backgroundColor=\"'rgb(240,240,240)'\">\n    <view :style=\"{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: toPx(20) }\">\n      <!-- 游戏标题 -->\n      <text :text=\"'推箱子游戏'\" :style=\"{ fontSize: toPx(24), fontWeight: 'bold', color: '#333', marginBottom: toPx(20) }\" />\n      \n      <!-- 游戏状态 -->\n      <text :text=\"gameStatus\" :style=\"{ fontSize: toPx(16), color: '#666', marginBottom: toPx(10) }\" />\n      \n      <!-- 游戏地图 -->\n      <view :style=\"{ display: 'flex', flexDirection: 'column', backgroundColor: '#fff', padding: toPx(10), borderRadius: toPx(8), marginBottom: toPx(20) }\">\n        <list :list=\"gameMap\" :style=\"{ display: 'flex', flexDirection: 'column' }\">\n          <view :style=\"{ display: 'flex', flexDirection: 'row' }\">\n            <list :list=\"item\" :style=\"{ display: 'flex', flexDirection: 'row' }\">\n              <view \n                :style=\"{ \n                  display: 'flex', \n                  width: toPx(40), \n                  height: toPx(40), \n                  backgroundColor: getCellColor(cell), \n                  border: '1px solid #ddd',\n                  justifyContent: 'center',\n                  alignItems: 'center',\n                  fontSize: toPx(24)\n                }\"\n              >\n                <text :text=\"getCellEmoji(cell)\" />\n              </view>\n            </list>\n          </view>\n        </list>\n      </view>\n      \n      <!-- 控制按钮区域 -->\n      <view :style=\"{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: toPx(10) }\">\n        <!-- 上按钮 -->\n        <view \n          @tap=\"$isolatedLogics.movePlayer('up')\"\n          :style=\"{ \n            display: 'flex', \n            width: toPx(60), \n            height: toPx(60), \n            backgroundColor: '#4CAF50', \n            borderRadius: toPx(30),\n            justifyContent: 'center',\n            alignItems: 'center'\n          }\"\n        >\n          <text :text=\"'↑'\" :style=\"{ fontSize: toPx(24), color: '#fff' }\" />\n        </view>\n        \n        <!-- 左右按钮 -->\n        <view :style=\"{ display: 'flex', flexDirection: 'row', gap: toPx(20) }\">\n          <view \n            @tap=\"$isolatedLogics.movePlayer('left')\"\n            :style=\"{ \n              display: 'flex', \n              width: toPx(60), \n              height: toPx(60), \n              backgroundColor: '#4CAF50', \n              borderRadius: toPx(30),\n              justifyContent: 'center',\n              alignItems: 'center'\n            }\"\n          >\n            <text :text=\"'←'\" :style=\"{ fontSize: toPx(24), color: '#fff' }\" />\n          </view>\n          \n          <view \n            @tap=\"$isolatedLogics.movePlayer('right')\"\n            :style=\"{ \n              display: 'flex', \n              width: toPx(60), \n              height: toPx(60), \n              backgroundColor: '#4CAF50', \n              borderRadius: toPx(30),\n              justifyContent: 'center',\n              alignItems: 'center'\n            }\"\n          >\n            <text :text=\"'→'\" :style=\"{ fontSize: toPx(24), color: '#fff' }\" />\n          </view>\n        </view>\n        \n        <!-- 下按钮 -->\n        <view \n          @tap=\"$isolatedLogics.movePlayer('down')\"\n          :style=\"{ \n            display: 'flex', \n            width: toPx(60), \n            height: toPx(60), \n            backgroundColor: '#4CAF50', \n            borderRadius: toPx(30),\n            justifyContent: 'center',\n            alignItems: 'center'\n          }\"\n        >\n          <text :text=\"'↓'\" :style=\"{ fontSize: toPx(24), color: '#fff' }\" />\n        </view>\n      </view>\n      \n      <!-- 重新开始按钮 -->\n      <view \n        @tap=\"$isolatedLogics.resetGame()\"\n        :style=\"{ \n          display: 'flex', \n          marginTop: toPx(20),\n          paddingHorizontal: toPx(20),\n          paddingVertical: toPx(10),\n          backgroundColor: '#FF5722', \n          borderRadius: toPx(20),\n          justifyContent: 'center',\n          alignItems: 'center'\n        }\"\n      >\n        <text :text=\"'重新开始'\" :style=\"{ fontSize: toPx(16), color: '#fff' }\" />\n      </view>\n    </view>\n  </page>\n\n</template_override>\n<template_instructions>I created the complete game interface with game board, control buttons and status display.</template_instructions>\n<script_variables_override>\n\nimport { defineProps, defineState, defineCompute, defineValidateSchema } from '@flamejs/builtin/runtime';\n\ndefineProps({});\n\ndefineState({\n  // 游戏地图 8x8网格\n  gameMap: {\n    type: Array,\n    initial: [\n      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],\n      ['wall', 'empty', 'box', 'empty', 'empty', 'wall', 'wall', 'wall'],\n      ['wall', 'empty', 'player', 'empty', 'target', 'wall', 'wall', 'wall'],\n      ['wall', 'empty', 'empty', 'empty', 'empty', 'wall', 'wall', 'wall'],\n      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],\n      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],\n      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],\n      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall']\n    ],\n    sample: [\n      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],\n      ['wall', 'empty', 'box', 'empty', 'empty', 'wall', 'wall', 'wall'],\n      ['wall', 'empty', 'player', 'empty', 'target', 'wall', 'wall', 'wall'],\n      ['wall', 'empty', 'empty', 'empty', 'empty', 'wall', 'wall', 'wall'],\n      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],\n      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],\n      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],\n      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall']\n    ]\n  },\n  // 玩家位置\n  playerPos: {\n    type: Object,\n    initial: { row: 2, col: 2 },\n    sample: { row: 2, col: 2 }\n  },\n  // 箱子位置列表\n  boxPositions: {\n    type: Array,\n    initial: [{ row: 1, col: 2 }],\n    sample: [{ row: 1, col: 2 }]\n  },\n  // 目标位置列表\n  targetPositions: {\n    type: Array,\n    initial: [{ row: 2, col: 4 }],\n    sample: [{ row: 2, col: 4 }]\n  },\n  // 游戏状态\n  gameStatus: {\n    type: String,\n    initial: '游戏进行中',\n    sample: '游戏进行中'\n  }\n});\n\ndefineCompute({\n  // 获取单元格颜色\n  getCellColor: () => $isolatedLogics.getCellColor,\n  // 获取单元格emoji\n  getCellEmoji: () => $isolatedLogics.getCellEmoji\n});\n\ndefineValidateSchema({\n  type: \"object\",\n  properties: {\n    gameMap: { type: \"array\" },\n    playerPos: { type: \"object\" },\n    boxPositions: { type: \"array\" },\n    targetPositions: { type: \"array\" },\n    gameStatus: { type: \"string\" }\n  }\n});\n\n</script_variables_override>\n<script_variables_instructions>I defined game state including map, player position, boxes, targets and game status.</script_variables_instructions>\n<script_setup_override>\n<script setup lang=\"ts\" name=\"isolated:index.ts\">\nimport { useFlame, onMounted } from '@flamejs/builtin/runtime';\nimport { type PropsVariablesTypes, type StateVariablesTypes } from '@variables/types';\n\nconst flame = useFlame<PropsVariablesTypes, StateVariablesTypes>();\n\n// 游戏地图元素类型\ntype CellType = 'empty' | 'wall' | 'player' | 'box' | 'target' | 'boxOnTarget';\n\n// 获取单元格颜色\nexport function getCellColor(cellType: string): string {\n  switch (cellType) {\n    case 'wall': return '#8B4513';\n    case 'empty': return '#F5F5DC';\n    case 'player': return '#87CEEB';\n    case 'box': return '#DEB887';\n    case 'target': return '#90EE90';\n    case 'boxOnTarget': return '#32CD32';\n    default: return '#F5F5DC';\n  }\n}\n\n// 获取单元格emoji\nexport function getCellEmoji(cellType: string): string {\n  switch (cellType) {\n    case 'wall': return '🧱';\n    case 'empty': return '';\n    case 'player': return '🤖';\n    case 'box': return '📦';\n    case 'target': return '⭐';\n    case 'boxOnTarget': return '✅';\n    default: return '';\n  }\n}\n\n// 检查位置是否有效\nfunction isValidPosition(row: number, col: number): boolean {\n  return row >= 0 && row < 8 && col >= 0 && col < 8;\n}\n\n// 检查位置是否为墙\nfunction isWall(row: number, col: number): boolean {\n  if (!isValidPosition(row, col)) return true;\n  return flame.store.gameMap[row][col] === 'wall';\n}\n\n// 检查位置是否有箱子\nfunction hasBox(row: number, col: number): boolean {\n  return flame.store.boxPositions.some(box => box.row === row && box.col === col);\n}\n\n// 检查位置是否有目标点\nfunction hasTarget(row: number, col: number): boolean {\n  return flame.store.targetPositions.some(target => target.row === row && target.col === col);\n}\n\n// 移动玩家\nexport function movePlayer(direction: 'up' | 'down' | 'left' | 'right') {\n  const { playerPos, boxPositions, gameMap } = flame.store;\n  let newRow = playerPos.row;\n  let newCol = playerPos.col;\n  \n  // 计算新位置\n  switch (direction) {\n    case 'up': newRow--; break;\n    case 'down': newRow++; break;\n    case 'left': newCol--; break;\n    case 'right': newCol++; break;\n  }\n  \n  // 检查是否撞墙\n  if (isWall(newRow, newCol)) return;\n  \n  // 检查是否推箱子\n  if (hasBox(newRow, newCol)) {\n    let boxNewRow = newRow;\n    let boxNewCol = newCol;\n    \n    // 计算箱子新位置\n    switch (direction) {\n      case 'up': boxNewRow--; break;\n      case 'down': boxNewRow++; break;\n      case 'left': boxNewCol--; break;\n      case 'right': boxNewCol++; break;\n    }\n    \n    // 检查箱子是否能移动\n    if (isWall(boxNewRow, boxNewCol) || hasBox(boxNewRow, boxNewCol)) return;\n    \n    // 移动箱子\n    const newBoxPositions = boxPositions.map(box => \n      box.row === newRow && box.col === newCol \n        ? { row: boxNewRow, col: boxNewCol }\n        : box\n    );\n    \n    flame.setStore({ boxPositions: newBoxPositions });\n  }\n  \n  // 移动玩家\n  flame.setStore({ playerPos: { row: newRow, col: newCol } });\n  \n  // 更新地图显示\n  updateGameMap();\n  \n  // 检查胜利条件\n  checkWinCondition();\n}\n\n// 更新游戏地图显示\nfunction updateGameMap() {\n  const { playerPos, boxPositions, targetPositions } = flame.store;\n  const newGameMap = Array(8).fill(null).map(() => Array(8).fill('empty'));\n  \n  // 设置墙壁\n  const originalMap = [\n    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],\n    ['wall', 'empty', 'empty', 'empty', 'empty', 'wall', 'wall', 'wall'],\n    ['wall', 'empty', 'empty', 'empty', 'empty', 'wall', 'wall', 'wall'],\n    ['wall', 'empty', 'empty', 'empty', 'empty', 'wall', 'wall', 'wall'],\n    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],\n    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],\n    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],\n    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall']\n  ];\n  \n  for (let i = 0; i < 8; i++) {\n    for (let j = 0; j < 8; j++) {\n      if (originalMap[i][j] === 'wall') {\n        newGameMap[i][j] = 'wall';\n      }\n    }\n  }\n  \n  // 设置目标点\n  targetPositions.forEach(target => {\n    if (newGameMap[target.row][target.col] === 'empty') {\n      newGameMap[target.row][target.col] = 'target';\n    }\n  });\n  \n  // 设置箱子\n  boxPositions.forEach(box => {\n    if (hasTarget(box.row, box.col)) {\n      newGameMap[box.row][box.col] = 'boxOnTarget';\n    } else {\n      newGameMap[box.row][box.col] = 'box';\n    }\n  });\n  \n  // 设置玩家\n  newGameMap[playerPos.row][playerPos.col] = 'player';\n  \n  flame.setStore({ gameMap: newGameMap });\n}\n\n// 检查胜利条件\nfunction checkWinCondition() {\n  const { boxPositions, targetPositions } = flame.store;\n  \n  const allBoxesOnTarget = boxPositions.every(box => \n    targetPositions.some(target => \n      target.row === box.row && target.col === box.col\n    )\n  );\n  \n  if (allBoxesOnTarget) {\n    flame.setStore({ gameStatus: '🎉 恭喜通关！' });\n  }\n}\n\n// 重置游戏\nexport function resetGame() {\n  const initialMap = [\n    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],\n    ['wall', 'empty', 'box', 'empty', 'empty', 'wall', 'wall', 'wall'],\n    ['wall', 'empty', 'player', 'empty', 'target', 'wall', 'wall', 'wall'],\n    ['wall', 'empty', 'empty', 'empty', 'empty', 'wall', 'wall', 'wall'],\n    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],\n    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],\n    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],\n    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall']\n  ];\n  \n  flame.setStore({\n    gameMap: initialMap,\n    playerPos: { row: 2, col: 2 },\n    boxPositions: [{ row: 1, col: 2 }],\n    targetPositions: [{ row: 2, col: 4 }],\n    gameStatus: '游戏进行中'\n  });\n}\n\n// 初始化游戏\nonMounted(() => {\n  updateGameMap();\n});\n</script>\n\n</script_setup_override>\n<script_setup_instructions>I implemented the complete game logic including player movement, box pushing, collision detection and win condition checking.</script_instructions>\n</write_sfc_content>";
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
