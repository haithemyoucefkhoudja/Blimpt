import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const loadGeminiChatModels = async (
  geminiApiKey: string,
  model: string
) => {
  try {
    if (!geminiApiKey) return {};
    return new ChatGoogleGenerativeAI({
      model,
      temperature: 0.7,
      apiKey: geminiApiKey,
      metadata: {
        isMultimodal: true,
      },
    });
  } catch (err) {
    console.error(`Error loading Gemini models: ${err}`);
    return {};
  }
};
