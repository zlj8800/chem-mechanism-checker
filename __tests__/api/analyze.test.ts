/**
 * @jest-environment node
 */

import { POST } from "@/app/api/analyze/route";
import { NextRequest } from "next/server";

jest.mock("@/lib/gemini", () => ({
  getGeminiModel: jest.fn(() => ({
    startChat: jest.fn(() => ({
      sendMessage: jest.fn().mockResolvedValue({
        response: {
          text: () =>
            "**Mechanism Type**: SN2 - Bromide Displacement\n**Verdict**: Correct ✓\nGreat work!",
        },
      }),
    })),
  })),
}));

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/analyze", () => {
  it("returns 400 when messages is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Messages array is required");
  });

  it("returns 400 when messages is not an array", async () => {
    const res = await POST(makeRequest({ messages: "not-array" }));
    expect(res.status).toBe(400);
  });

  it("returns analysis with content and suggestedTitle", async () => {
    const res = await POST(
      makeRequest({
        messages: [
          {
            role: "user",
            content: "Analyze this mechanism",
          },
        ],
        imageData: "data:image/png;base64,iVBOR",
      })
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.content).toContain("SN2");
    expect(data.suggestedTitle).toBe("SN2 - Bromide Displacement");
  });

  it("works with text-only messages (no image)", async () => {
    const res = await POST(
      makeRequest({
        messages: [
          {
            role: "user",
            content: "What is an SN2 reaction?",
          },
        ],
      })
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.content).toBeTruthy();
  });

  it("handles conversation history correctly", async () => {
    const { getGeminiModel } = require("@/lib/gemini");
    const mockStartChat = jest.fn(() => ({
      sendMessage: jest.fn().mockResolvedValue({
        response: {
          text: () => "Follow-up response",
        },
      }),
    }));
    getGeminiModel.mockReturnValue({ startChat: mockStartChat });

    const res = await POST(
      makeRequest({
        messages: [
          { role: "user", content: "First message" },
          { role: "assistant", content: "First response" },
          { role: "user", content: "Follow-up question" },
        ],
      })
    );

    expect(res.status).toBe(200);

    const startChatCall = mockStartChat.mock.calls[0][0];
    expect(startChatCall.history).toHaveLength(2);
    expect(startChatCall.history[0].role).toBe("user");
    expect(startChatCall.history[1].role).toBe("model");
  });

  it("handles image data in conversation history", async () => {
    const { getGeminiModel } = require("@/lib/gemini");
    const mockStartChat = jest.fn(() => ({
      sendMessage: jest.fn().mockResolvedValue({
        response: { text: () => "Analysis result" },
      }),
    }));
    getGeminiModel.mockReturnValue({ startChat: mockStartChat });

    const res = await POST(
      makeRequest({
        messages: [
          {
            role: "user",
            content: "Analyze",
            imageData: "data:image/png;base64,previousImage",
          },
          { role: "assistant", content: "Previous analysis" },
          { role: "user", content: "Follow-up" },
        ],
      })
    );

    expect(res.status).toBe(200);

    const history = mockStartChat.mock.calls[0][0].history;
    const userParts = history[0].parts;
    expect(userParts).toHaveLength(2);
    expect(userParts[0]).toHaveProperty("inlineData");
    expect(userParts[0].inlineData.data).toBe("previousImage");
  });

  it("returns 500 on API error", async () => {
    const { getGeminiModel } = require("@/lib/gemini");
    getGeminiModel.mockReturnValue({
      startChat: () => ({
        sendMessage: jest
          .fn()
          .mockRejectedValue(new Error("API quota exceeded")),
      }),
    });

    const res = await POST(
      makeRequest({
        messages: [{ role: "user", content: "test" }],
      })
    );

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("API quota exceeded");
  });

  it("extracts suggestedTitle from mechanism type line", async () => {
    const { getGeminiModel } = require("@/lib/gemini");
    getGeminiModel.mockReturnValue({
      startChat: () => ({
        sendMessage: jest.fn().mockResolvedValue({
          response: {
            text: () =>
              "**Mechanism Type**: E2 Elimination of 2-Bromobutane\n**Verdict**: Incorrect ✗",
          },
        }),
      }),
    });

    const res = await POST(
      makeRequest({
        messages: [{ role: "user", content: "Check this" }],
        imageData: "data:image/png;base64,test",
      })
    );

    const data = await res.json();
    expect(data.suggestedTitle).toBe("E2 Elimination of 2-Bromobutane");
  });

  it("returns null suggestedTitle when no mechanism type found", async () => {
    const { getGeminiModel } = require("@/lib/gemini");
    getGeminiModel.mockReturnValue({
      startChat: () => ({
        sendMessage: jest.fn().mockResolvedValue({
          response: {
            text: () =>
              "I cannot determine the mechanism from this image.",
          },
        }),
      }),
    });

    const res = await POST(
      makeRequest({
        messages: [{ role: "user", content: "Check" }],
      })
    );

    const data = await res.json();
    expect(data.suggestedTitle).toBeNull();
  });
});
