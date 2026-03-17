import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { createLogger } from "@/lib/logger";
import { Content } from "@google/generative-ai";

const log = createLogger("api/analyze");

export async function POST(req: NextRequest) {
  const t0 = performance.now();
  const reqId = Math.random().toString(36).slice(2, 8);
  log.info("REQUEST", `[${reqId}] POST /api/analyze from ${req.headers.get("user-agent")?.slice(0, 60)}`);

  try {
    // --- Parse body ---
    log.debug(`[${reqId}] PARSE`, "reading request body");
    const body = await req.json();
    const { messages, imageData } = body;
    log.info(`[${reqId}] PARSE`, `messages: ${messages?.length ?? "null"}, hasImage: ${!!imageData}, bodyKeys: [${Object.keys(body).join(", ")}]`);

    if (!messages || !Array.isArray(messages)) {
      log.warn(`[${reqId}] VALIDATE`, `rejected: messages is ${typeof messages} (expected array)`);
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // --- Log each message in the conversation ---
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      const hasImg = !!m.imageData;
      const contentPreview = (m.content || "").slice(0, 60);
      log.debug(`[${reqId}] MSG[${i}]`, `role=${m.role} hasImage=${hasImg} content="${contentPreview}${(m.content || "").length > 60 ? "..." : ""}"`);
    }

    // --- Load model ---
    log.info(`[${reqId}] MODEL`, "loading Gemini model");
    const modelStart = performance.now();
    const model = getGeminiModel();
    log.info(`[${reqId}] MODEL`, `ready in ${Math.round(performance.now() - modelStart)}ms`);

    // --- Build conversation history ---
    const history: Content[] = [];
    const conversationMessages = messages.slice(0, -1);
    log.debug(`[${reqId}] HISTORY`, `building from ${conversationMessages.length} prior message(s)`);

    for (let i = 0; i < conversationMessages.length; i++) {
      const msg = conversationMessages[i];
      const parts: Content["parts"] = [];

      if (msg.imageData) {
        const base64Data = msg.imageData.replace(
          /^data:image\/\w+;base64,/,
          ""
        );
        const sizeKb = Math.round((base64Data.length * 3) / 4 / 1024);
        log.debug(`[${reqId}] HISTORY[${i}]`, `image attachment: ${sizeKb} KB`);
        parts.push({
          inlineData: {
            mimeType: "image/png",
            data: base64Data,
          },
        });
      }

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      if (parts.length > 0) {
        const role = msg.role === "assistant" ? "model" : "user";
        history.push({ role, parts });
        log.debug(`[${reqId}] HISTORY[${i}]`, `added as ${role} with ${parts.length} part(s)`);
      }
    }

    log.info(`[${reqId}] HISTORY`, `${history.length} turn(s) assembled`);

    // --- Start chat session ---
    log.info(`[${reqId}] CHAT`, "starting Gemini chat session");
    const chat = model.startChat({ history });
    log.debug(`[${reqId}] CHAT`, "session created");

    // --- Build final message ---
    const lastMessage = messages[messages.length - 1];
    const lastParts: Content["parts"] = [];

    if (imageData) {
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
      const sizeKb = Math.round((base64Data.length * 3) / 4 / 1024);
      log.info(`[${reqId}] IMAGE`, `attaching current image: ${sizeKb} KB (${base64Data.length} base64 chars)`);
      lastParts.push({
        inlineData: {
          mimeType: "image/png",
          data: base64Data,
        },
      });
    } else {
      log.debug(`[${reqId}] IMAGE`, "no image attached to this message");
    }

    const promptText =
      lastMessage.content || "Please analyze this mechanism drawing.";
    log.info(`[${reqId}] PROMPT`, `"${promptText.slice(0, 100)}${promptText.length > 100 ? "..." : ""}" (${promptText.length} chars)`);
    lastParts.push({ text: promptText });

    log.info(`[${reqId}] GEMINI`, `sending ${lastParts.length} part(s) to Gemini API...`);

    // --- Send to Gemini ---
    const geminiStart = performance.now();
    const result = await chat.sendMessage(lastParts);
    const geminiMs = Math.round(performance.now() - geminiStart);
    log.info(`[${reqId}] GEMINI`, `response received in ${geminiMs}ms`);

    // --- Parse response ---
    const response = result.response;
    const text = response.text();
    const lines = text.split("\n").filter(Boolean).length;
    log.info(`[${reqId}] RESPONSE`, `${text.length} chars, ${lines} lines`);
    log.debug(`[${reqId}] RESPONSE:PREVIEW`, `"${text.slice(0, 200).replace(/\n/g, "\\n")}"`);

    // --- Extract title ---
    const titleMatch = text.match(/\*\*Mechanism Type\*\*:\s*(.+)/);
    const suggestedTitle = titleMatch
      ? titleMatch[1].trim().slice(0, 50)
      : null;

    // --- Extract verdict ---
    const verdictMatch = text.match(/\*\*Verdict\*\*:\s*(.+)/);
    const verdict = verdictMatch ? verdictMatch[1].trim() : "(not found)";

    // --- Count errors found ---
    const errorsSection = text.match(/\*\*Errors Found\*\*[^]*?(?=\*\*|$)/);
    const errorCount = errorsSection
      ? (errorsSection[0].match(/^\d+\./gm) || []).length
      : 0;

    const typeLabel = suggestedTitle || "(unknown)";
    log.info(`[${reqId}] ANALYSIS`, "type=\"" + typeLabel + "\" verdict=\"" + verdict + "\" errors=" + errorCount);

    const totalMs = Math.round(performance.now() - t0);
    log.info(`[${reqId}] DONE`, `total ${totalMs}ms (gemini: ${geminiMs}ms, overhead: ${totalMs - geminiMs}ms)`);

    return NextResponse.json({
      content: text,
      suggestedTitle,
    });
  } catch (error) {
    const totalMs = Math.round(performance.now() - t0);
    log.error(`[${reqId}] FAILED`, error);

    if (error instanceof Error) {
      log.error(`[${reqId}] STACK`, new Error(`Full trace:\n${error.stack}`));

      if (error.message.includes("API key")) {
        log.warn(`[${reqId}] HINT`, "Check that GEMINI_API_KEY in .env.local is valid and not expired");
      }
      if (error.message.includes("quota")) {
        log.warn(`[${reqId}] HINT`, "You may have exceeded the Gemini free tier (15 req/min, 1500 req/day)");
      }
      if (error.message.includes("safety")) {
        log.warn(`[${reqId}] HINT`, "The image or prompt may have triggered Gemini's safety filters");
      }
      if (error.message.includes("Could not process") || error.message.includes("INVALID_ARGUMENT")) {
        log.warn(`[${reqId}] HINT`, "The image may be corrupted, too large, or in an unsupported format");
      }
    }

    log.info(`[${reqId}] TIMING`, `failed after ${totalMs}ms`);

    const message =
      error instanceof Error ? error.message : "Failed to analyze mechanism";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
