import { isWithinTokenLimit } from "gpt-tokenizer/model/gpt-4o";

export async function trimHistory(
  history: Array<{ role: "user" | "assistant"; content: string }>,
  query: string,
  MAX_TOKENS: number
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  const trimmedHistory = [...history];
  let testChat = [...trimmedHistory, { role: "user", content: query }];

  while (
    !isWithinTokenLimit(testChat as any, MAX_TOKENS) &&
    trimmedHistory.length > 0
  ) {
    trimmedHistory.shift();
    testChat = [...trimmedHistory, { role: "user", content: query }];
  }

  return trimmedHistory;
}
