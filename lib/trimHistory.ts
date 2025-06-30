import { isWithinTokenLimit } from "gpt-tokenizer/model/gpt-4o";

export async function trimHistory(
  history: Array<{ role: "user" | "assistant"; content: any[] }>,
  query: string,
  attachments: any[],
  MAX_TOKENS: number
): Promise<Array<{ role: "user" | "assistant"; content: any[] }>> {
  const trimmedHistory = [...history];
  return trimmedHistory;
  let testChat = [
    ...trimmedHistory,
    {
      role: "user",
      content: [
        {
          type: "text",
          text: query,
        },

        attachments?.map((item) => {
          switch (item.type) {
            case "image":
              return {
                type: "image",
                source_type: "base64",
                data: item.base64,
                mime_type: item.file.type,
              };
            case "text":
              return {
                type: "text",
                text: item.text,
              };
            default:
              return {
                type: "text",
                text: "Unsupported attachment type",
              };
          }
        }),
      ],
    },
  ];

  while (
    !isWithinTokenLimit(testChat, MAX_TOKENS) &&
    trimmedHistory.length > 0
  ) {
    trimmedHistory.shift();
    testChat = [
      ...trimmedHistory,
      {
        role: "user",
        content: [
          {
            type: "text",
            text: query,
          },
          ...attachments?.map((item) => {
            switch (item.type) {
              case "image":
                return {
                  type: "image",
                  source_type: "base64",
                  data: item.base64,
                  mime_type: item.file.type,
                };
              case "text":
                return {
                  type: "text",
                  text: item.text,
                };
              default:
                return {
                  type: "text",
                  text: "Unsupported attachment type",
                };
            }
          }),
        ],
      },
    ];
  }

  return trimmedHistory;
}
