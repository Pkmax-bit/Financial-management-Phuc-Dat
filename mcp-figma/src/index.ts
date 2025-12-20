import fetch from "node-fetch";
import {
  StdioServerTransport,
  Server,
  Tool,
  ToolCall,
} from "@modelcontextprotocol/sdk/server";

type GetFigmaFileArgs = {
  fileKey: string;
};

const FIGMA_API_BASE = "https://api.figma.com/v1";

async function main() {
  const server = new Server(
    {
      name: "mcp-figma",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const getFigmaFileTool: Tool = {
    name: "get_figma_file",
    description:
      "Lấy JSON chi tiết 1 file Figma qua Figma REST API. Cần Figma Personal Access Token trong biến môi trường FIGMA_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        fileKey: {
          type: "string",
          description:
            "File key của Figma (ví dụ: từ URL https://www.figma.com/file/<fileKey>/...)",
        },
      },
      required: ["fileKey"],
    },
    async call(args: ToolCall<GetFigmaFileArgs>) {
      const token = process.env.FIGMA_TOKEN;
      if (!token) {
        return {
          content: [
            {
              type: "text",
              text: "Thiếu FIGMA_TOKEN trong biến môi trường. Vui lòng tạo Personal Access Token trong Figma và set FIGMA_TOKEN trước khi chạy server.",
            },
          ],
        };
      }

      const { fileKey } = args.params;

      const res = await fetch(`${FIGMA_API_BASE}/files/${fileKey}`, {
        headers: {
          "X-Figma-Token": token,
        },
      });

      if (!res.ok) {
        const body = await res.text();
        return {
          content: [
            {
              type: "text",
              text: `Gọi Figma API thất bại. status=${res.status}, body=${body}`,
            },
          ],
        };
      }

      const json = await res.json();

      return {
        content: [
          {
            type: "json",
            json,
          },
        ],
      };
    },
  };

  server.addTool(getFigmaFileTool);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("mcp-figma server error:", err);
  process.exit(1);
});


