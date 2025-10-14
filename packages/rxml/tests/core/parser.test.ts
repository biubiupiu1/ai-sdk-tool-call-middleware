import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  filter,
  parse,
  parseNode,
  parseWithoutSchema,
  RXMLDuplicateStringTagError,
  RXMLParseError,
  simplify,
} from "@/index";

import {
  duplicateTagSamples,
  malformedXmlSamples,
  schemaTestCases,
  validXmlSamples,
} from "../fixtures/test-data";

describe("robust-xml parser", () => {
  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;
  describe("parseWithoutSchema", () => {
    it("parses simple XML correctly", () => {
      const result = parseWithoutSchema(validXmlSamples.simple);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        tagName: "root",
        attributes: {},
        children: [
          {
            tagName: "item",
            attributes: {},
            children: ["test"],
          },
        ],
      });
    });

    it("parses XML with attributes", () => {
      const result = parseWithoutSchema(validXmlSamples.withAttributes);
      const root = result[0] as any;
      expect(root.attributes.id).toBe("main");
      expect(root.children[0].attributes.type).toBe("test");
    });

    it("handles CDATA sections", () => {
      const result = parseWithoutSchema(validXmlSamples.withCdata);
      const root = result[0] as any;
      expect(root.children[0].children[0]).toBe("<test>content</test>");
    });

    it("handles comments when keepComments is true", () => {
      const result = parseWithoutSchema(validXmlSamples.withComments, {
        keepComments: true,
      });
      // Comments should be preserved in the structure
      const resultStr = JSON.stringify(result);
      expect(resultStr).toContain("<!-- comment -->");
      expect(resultStr).toContain("<!-- another comment -->");
    });

    it("ignores comments by default", () => {
      const result = parseWithoutSchema(validXmlSamples.withComments);
      const commentNodes = result.filter(
        node => typeof node === "string" && node.includes("<!--")
      );
      expect(commentNodes).toHaveLength(0);
    });

    it("handles processing instructions", () => {
      const result = parseWithoutSchema(
        validXmlSamples.withProcessingInstruction
      );
      expect(result[0]).toMatchObject({
        tagName: "?xml",
        attributes: {
          version: "1.0",
          encoding: "UTF-8",
        },
      });
    });

    it("handles DOCTYPE declarations", () => {
      const result = parseWithoutSchema(validXmlSamples.withDoctype);
      expect(result).toContain("!DOCTYPE root");
    });

    it("handles self-closing tags", () => {
      const result = parseWithoutSchema(validXmlSamples.selfClosing);
      const root = result[0] as any;
      expect(root.children).toHaveLength(2);
      expect(root.children[0].children).toHaveLength(0);
      expect(root.children[1].children).toHaveLength(0);
    });

    it("preserves whitespace when keepWhitespace is true", () => {
      const xml = "<root>  <item>  test  </item>  </root>";
      const result = parseWithoutSchema(xml, { keepWhitespace: true });
      const root = result[0] as any;
      expect(root.children).toContain("  ");
    });

    it("trims whitespace by default", () => {
      const xml = "<root>  <item>  test  </item>  </root>";
      const result = parseWithoutSchema(xml);
      const root = result[0] as any;
      const textNodes = root.children.filter(
        (child: any) => typeof child === "string"
      );
      expect(textNodes).toHaveLength(0);
    });
  });

  describe("parseNode", () => {
    it("parses a single node", () => {
      const result = parseNode('<item attr="value">content</item>');
      expect(result).toMatchObject({
        tagName: "item",
        attributes: { attr: "value" },
        children: ["content"],
      });
    });

    it("handles self-closing single node", () => {
      const result = parseNode('<item attr="value"/>');
      expect(result).toMatchObject({
        tagName: "item",
        attributes: { attr: "value" },
        children: [],
      });
    });
  });

  describe("parse with schema", () => {
    it("parses and coerces string properties", () => {
      const result = parse(
        schemaTestCases.stringProperty.xml,
        schemaTestCases.stringProperty.schema
      );
      expect(result).toEqual(schemaTestCases.stringProperty.expected);
    });

    // it("handles CDATA sections with special characters", () => {
    //   const result = parse(
    //     "<template_diff><![CDATA[\n// ... existing code ...\n      <view\n        id=\"aQi8azg02u\"\n        title=\"Frame 2082895687\"\n        :style=\"{\n          display: 'flex',\n          width: '100%',\n          height: '37px',\n          marginTop: '20px',\n          position: 'relative',\n          overflow: 'hidden',\n          justifyContent: 'center',\n          alignItems: 'center',\n          maxWidth: '226px',\n        }\"\n      >\n        <image\n          id=\"BdgAAyAza9\"\n          title=\"恭喜获得限时优惠\"\n          :src=\"'https://lf3-static.bytednsdoc.com/obj/eden-cn/lthsm/ljhwZthlaukjlkulzlp/figma-mcp/1758648405273/title_text.png'\"\n          :style=\"{\n            width: '100%',\n            height: '28px',\n            maxWidth: '224px',\n            animations: [\n              {\n                id: 'WoZWo1_0uF',\n                name: '未命名',\n                duration: 1,\n                delay: 0,\n                easing: 'linear',\n                iterations: 1,\n                fill: 'none',\n                direction: 'normal',\n                keyframes: [\n                  {\n                    id: '4zh9rMH-sN',\n                    progress: 0,\n                    transforms: { usedKeys: [] },\n                  },\n                  {\n                    id: 'D8LTet48ms',\n                    progress: 100,\n                    transforms: { usedKeys: [] },\n                  },\n                ],\n              },\n            ],\n          }\"\n        />\n// ... existing code ...\n            <text\n              id=\"-Y1Fk85vbI\"\n              title=\"28\"\n              :text-maxline=\"1\"\n              :style=\"{\n                width: 'auto',\n                height: '62px',\n                color: 'rgba(243, 79, 52, 1)',\n                fontSize: '62px',\n                lineHeight: '62px',\n                flexShrink: '0',\n              }\"\n              >{{ Math.floor($ad.generic_benefits[0].credit / 100) }}</text\n            >\n// ... existing code ...\n            <text\n              id=\"EzxWDyC7fQ\"\n              title=\"满56可用\"\n              :text-maxline=\"0\"\n              :style=\"{\n                width: 'auto',\n                height: '14px',\n                marginTop: '5px',\n                color: 'rgba(243, 79, 52, 1)',\n                fontWeight: '500',\n                fontSize: '14px',\n                lineHeight: '14px',\n              }\"\n              >满{{ Math.floor($ad.generic_benefits[0].threshold / 100) }}可用</text\n            >\n// ... existing code ...\n            <text\n              id=\"6Kvbabj8cT\"\n              title=\"23:23:44\"\n              :text-maxline=\"0\"\n              :style=\"{\n                width: 'auto',\n                height: '12px',\n                color: 'rgba(22, 24, 35, 0.45)',\n                fontSize: '12px',\n                lineHeight: '12px',\n              }\"\n              >{{ $ad.generic_benefits[0].expire_timestamp ? formatTime($ad.generic_benefits[0].expire_timestamp) : '23:23:44' }}</text\n            >\n// ... existing code ...\n              <text\n                id=\"oTv6M2kUel\"\n                title=\"立即使用\"\n                :text-maxline=\"1\"\n                :style=\"{\n                  width: 'auto',\n                  height: '22px',\n                  color: 'rgba(255, 255, 255, 1)',\n                  textAlign: 'center',\n                  fontWeight: '500',\n                  fontSize: '15px',\n                  lineHeight: '22px',\n                }\"\n                >{{ $ad.button_text }}</text\n              >\n// ... existing code ...\n]]>\n</template_diff>",
    //     {
    //       type: "object",
    //       properties: {
    //         template_diff: { type: "string" },
    //         template_instructions: { type: "string" },
    //         script_setup_diff: { type: "string" },
    //         script_setup_instructions: { type: "string" },
    //       },
    //       required: ["template_diff"],
    //     }
    //   );
    //   const root = result[0] as any;
    //   expect(root.children[0].children[0]).toBe("<test>content</test>");
    // });

    it("parses and coerces number properties", () => {
      const result = parse(
        schemaTestCases.numberProperty.xml,
        schemaTestCases.numberProperty.schema
      );
      expect(result).toEqual(schemaTestCases.numberProperty.expected);
    });

    it("parses and coerces boolean properties", () => {
      const result = parse(
        schemaTestCases.booleanProperty.xml,
        schemaTestCases.booleanProperty.schema
      );
      expect(result).toEqual(schemaTestCases.booleanProperty.expected);
    });

    it("parses and coerces array properties", () => {
      const result = parse(
        schemaTestCases.arrayProperty.xml,
        schemaTestCases.arrayProperty.schema
      );
      expect(result).toEqual(schemaTestCases.arrayProperty.expected);
    });

    it("parses and coerces object properties", () => {
      const result = parse(
        schemaTestCases.objectProperty.xml,
        schemaTestCases.objectProperty.schema
      );
      expect(result).toEqual(schemaTestCases.objectProperty.expected);
    });

    it("handles custom textNodeName", () => {
      const xml = '<value kind="n"> 10.5 </value>';
      const schema = z.toJSONSchema(
        z.object({
          value: z.number(),
        })
      );
      const result = parse(xml, schema, { textNodeName: "_text" });
      expect(result).toEqual({ value: 10.5 });
    });

    it("parses nested string-typed tags without swallowing inner content", () => {
      const xml = "<outer><inner>inside</inner></outer>";
      const schema = z.toJSONSchema(
        z.object({
          outer: z.string(),
          inner: z.string(),
        })
      );

      const result = parse(xml, schema);
      // outer should contain the full raw inner including <inner>...</inner>
      expect(result.outer).toContain("<inner>inside</inner>");
      // inner should be parsed as its own string value
      expect(result.inner).toBe("inside");
    });

    it("handles angle brackets in string content within nested object schema", () => {
      const xml = `<file_write>\n<path>\ntest.c\n</path>\n<content>\n#include <stdio.h>\n\nint main() {\n  printf("Hello, world!\\n");\n  return 0;\n}\n</content>\n</file_write>`;
      const schema = z.toJSONSchema(
        z.object({
          file_write: z.object({
            path: z.string(),
            content: z.string(),
          }),
        })
      );

      const result = parse(xml, schema);
      expect(result.file_write).toBeDefined();
      expect((result as any).file_write.path).toContain("test.c");
      // Should preserve the raw content including angle brackets without treating <stdio.h> as a tag
      expect((result as any).file_write.content).toContain(
        "#include <stdio.h>"
      );
      expect((result as any).file_write.content).toContain("int main() {");
    });

    it("parses file_write content across multiple languages using zod schema", () => {
      const schema = z.toJSONSchema(
        z.object({
          file_write: z.object({
            path: z.string(),
            content: z.string(),
          }),
        })
      );

      const snippets: Array<{ path: string; content: string[] }> = [
        {
          path: "test.c",
          content: [
            "#include <stdio.h>",
            "int main() {",
            '  printf("Hello, world!\\n");',
            "  return 0;",
            "}",
          ],
        },
        {
          path: "test.py",
          content: [
            "import os",
            "def write_file(path, content):",
            "  with open(path, 'w') as f:",
            "    f.write(content)",
            "  if f.closed:",
            "    return 'success'",
            "  else:",
            "    return 'error'",
            "",
            "write_file('test.py', \"print('Hello, world!')\\nreturn 'success'\")",
            "print('Hello, world!')",
            "",
            "return 'success'",
          ],
        },
        {
          path: "test.js",
          content: [
            "function greet(name) {",
            "  console.log(`Hello, ${name}!`);",
            "}",
            "greet('world');",
          ],
        },
        {
          path: "test.ts",
          content: [
            "type User = { name: string; age: number };",
            "const user: User = { name: 'John', age: 30 };",
            "console.log(user.name.toUpperCase());",
          ],
        },
        {
          path: "test.java",
          content: [
            "public class Main {",
            "  public static void main(String[] args) {",
            '    System.out.println("Hello, world!");',
            "  }",
            "}",
          ],
        },
        {
          path: "test.go",
          content: [
            "package main",
            'import "fmt"',
            "func main() {",
            '  fmt.Println("Hello, world!")',
            "}",
          ],
        },
        {
          path: "test.rs",
          content: ["fn main() {", '    println!("Hello, world!");', "}"],
        },
        {
          path: "test.rb",
          content: [
            "def greet(name)",
            '  puts "Hello, #{name}!"',
            "end",
            "greet('world')",
          ],
        },
        {
          path: "test.php",
          content: ["<?php", "echo 'Hello, world!';", "?>"],
        },
        {
          path: "test.sh",
          content: ["#!/usr/bin/env bash", 'echo "Hello, world!"'],
        },
        {
          path: "test.yaml",
          content: ["name: example", "values:", "  - one", "  - two"],
        },
        {
          path: "test.json",
          content: ["{", '  "name": "example",', '  "value": 1', "}"],
        },
        {
          path: "test.html",
          content: [
            "<!doctype html>",
            "<html>",
            "  <head><title>Hello</title></head>",
            "  <body><h1>Hello</h1></body>",
            "</html>",
          ],
        },
        {
          path: "test.sql",
          content: [
            "CREATE TABLE users (id INT PRIMARY KEY, name TEXT);",
            "INSERT INTO users (id, name) VALUES (1, 'John');",
            "SELECT * FROM users;",
          ],
        },
        {
          path: "test.scala",
          content: [
            "object Main extends App {",
            '  println("Hello, world!")',
            "}",
          ],
        },
        {
          path: "test.kt",
          content: ["fun main() {", '  println("Hello, world!")', "}"],
        },
      ];

      for (const { path, content } of snippets) {
        const xml = [
          "<file_write>",
          `<path>${path}</path>`,
          "<content>",
          content.join("\n"),
          "</content>",
          "</file_write>",
        ].join("\n");

        const result = parse(xml, schema);
        expect(result.file_write).toBeDefined();
        expect((result as any).file_write.path).toBe(path);
        for (const line of content) {
          expect((result as any).file_write.content).toContain(line);
        }
      }
    });
  });

  describe("duplicate tag handling", () => {
    it("throws RXMLDuplicateStringTagError for duplicate string tags by default", () => {
      const schema = {
        type: "object",
        properties: { content: { type: "string" } },
      };
      expect(() => parse(duplicateTagSamples.stringDuplicates, schema)).toThrow(
        RXMLDuplicateStringTagError
      );
    });

    it("handles duplicates gracefully when throwOnDuplicateStringTags is false", () => {
      const schema = {
        type: "object",
        properties: { content: { type: "string" } },
      };
      const result = parse(duplicateTagSamples.stringDuplicates, schema, {
        throwOnDuplicateStringTags: false,
      });
      expect(result.content).toBe("First"); // Should use first occurrence
    });
  });

  describe("error handling", () => {
    it("handles malformed XML gracefully", () => {
      expect(() => parseWithoutSchema(malformedXmlSamples.unclosedTag)).toThrow(
        RXMLParseError
      );
    });

    it("throws RXMLParseError for mismatched tags", () => {
      expect(() =>
        parseWithoutSchema(malformedXmlSamples.mismatchedTags)
      ).toThrow(RXMLParseError);
    });

    it("handles unclosed attributes gracefully", () => {
      // Should not throw, but handle gracefully
      const result = parseWithoutSchema(malformedXmlSamples.unclosedAttribute);
      expect(result).toBeDefined();
    });
  });

  describe("simplify", () => {
    it("simplifies parsed XML structure", () => {
      const parsed = parseWithoutSchema("<test><cc>one</cc><dd></dd></test>");
      const simplified = simplify(parsed);
      expect(simplified).toMatchObject({
        test: {
          cc: "one",
          dd: "",
        },
      });
    });

    it("handles arrays in simplification", () => {
      const parsed = parseWithoutSchema(
        "<test><cc>one</cc><cc>two</cc></test>"
      );
      const simplified = simplify(parsed);
      if (isRecord(simplified) && isRecord(simplified["test"])) {
        const cc = (simplified["test"] as Record<string, unknown>)["cc"];
        expect(cc).toEqual(["one", "two"]);
      } else {
        expect.fail("simplified result was not an object with 'test'");
      }
    });

    it("preserves attributes in simplification", () => {
      const parsed = parseWithoutSchema(
        '<test><cc attr="value">content</cc></test>'
      );
      const simplified = simplify(parsed);
      if (isRecord(simplified) && isRecord(simplified["test"])) {
        const testNode = simplified["test"] as Record<string, unknown>;
        const cc = testNode["cc"] as unknown;
        if (isRecord(cc)) {
          expect(cc["_attributes"]).toEqual({ attr: "value" });
        } else {
          expect.fail("cc was not an object on simplified.test");
        }
      } else {
        expect.fail("simplified result was not an object with 'test'");
      }
    });
  });

  describe("filter", () => {
    it("filters nodes based on predicate", () => {
      const parsed = parseWithoutSchema(
        '<root><item id="1">first</item><item id="2">second</item><other>test</other></root>'
      );
      const filtered = filter(parsed, node => node.tagName === "item");
      expect(filtered).toHaveLength(2);
      expect(filtered[0].tagName).toBe("item");
      expect(filtered[1].tagName).toBe("item");
    });

    it("filters with complex predicates", () => {
      const parsed = parseWithoutSchema(
        '<root><item type="a">first</item><item type="b">second</item></root>'
      );
      const filtered = filter(parsed, node => node.attributes.type === "a");
      expect(filtered).toHaveLength(1);
      expect(filtered[0].attributes.type).toBe("a");
    });
  });

  describe("edge cases", () => {
    it("handles empty XML", () => {
      const result = parseWithoutSchema("");
      expect(result).toEqual([]);
    });

    it("handles XML with only whitespace", () => {
      const result = parseWithoutSchema("   \n  \t  ");
      expect(result).toEqual([]);
    });

    it("handles mixed content correctly", () => {
      const result = parseWithoutSchema(validXmlSamples.mixedContent);
      const root = result[0] as any;
      expect(root.children).toHaveLength(3); // "text before ", item element, " text after"
      expect(root.children[0]).toBe("text before");
      expect(root.children[2]).toBe("text after");
    });

    it("handles nested empty elements", () => {
      const result = parseWithoutSchema(validXmlSamples.emptyElements);
      const root = result[0] as any;
      expect(root.children).toHaveLength(2);
      expect(root.children[0].children).toEqual([]);
      expect(root.children[1].children).toEqual([]);
    });
  });
});
