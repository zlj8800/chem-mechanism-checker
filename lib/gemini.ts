import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPT } from "./prompts";
import { createLogger } from "./logger";

const log = createLogger("gemini");

export function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    log.error("INIT", new Error("GEMINI_API_KEY environment variable is not set"));
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  log.debug("INIT", `API key loaded (${apiKey.slice(0, 6)}...${apiKey.slice(-4)})`);

  const genAI = new GoogleGenerativeAI(apiKey);
  log.debug("INIT", "GoogleGenerativeAI client created");

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: {
      role: "user",
      parts: [{ text: SYSTEM_PROMPT }],
    },
  });
  log.info("INIT", `model ready: gemini-2.5-flash (system prompt: ${SYSTEM_PROMPT.length} chars)`);
  return model;
}
