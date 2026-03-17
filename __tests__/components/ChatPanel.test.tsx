import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatPanel from "@/components/ChatPanel";
import { Message } from "@/lib/types";

jest.mock("@/components/MechanismFeedback", () => {
  return {
    __esModule: true,
    default: function MockMechanismFeedback({ content }: { content: string }) {
      return <div data-testid="mechanism-feedback">{content}</div>;
    },
  };
});

const makeMessage = (overrides: Partial<Message> = {}): Message => ({
  id: "msg-1",
  role: "user",
  content: "Test message",
  timestamp: Date.now(),
  ...overrides,
});

describe("ChatPanel", () => {
  it("returns null when there are no messages", () => {
    const { container } = render(
      <ChatPanel messages={[]} isLoading={false} statusLog={[]} onSendFollowUp={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders user messages", () => {
    const messages = [makeMessage({ content: "Check my SN2 mechanism" })];
    render(
      <ChatPanel
        messages={messages}
        isLoading={false}
        statusLog={[]}
        onSendFollowUp={jest.fn()}
      />
    );
    expect(screen.getByText("Check my SN2 mechanism")).toBeInTheDocument();
  });

  it("renders assistant messages with MechanismFeedback", () => {
    const messages = [
      makeMessage({
        id: "a1",
        role: "assistant",
        content: "This is an SN2 reaction",
      }),
    ];
    render(
      <ChatPanel
        messages={messages}
        isLoading={false}
        statusLog={[]}
        onSendFollowUp={jest.fn()}
      />
    );
    expect(screen.getByTestId("mechanism-feedback")).toHaveTextContent(
      "This is an SN2 reaction"
    );
  });

  it("renders images when message has imageData", () => {
    const messages = [
      makeMessage({ imageData: "data:image/png;base64,abc" }),
    ];
    render(
      <ChatPanel
        messages={messages}
        isLoading={false}
        statusLog={[]}
        onSendFollowUp={jest.fn()}
      />
    );
    const img = screen.getByAltText("Mechanism drawing");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "data:image/png;base64,abc");
  });

  it("shows loading indicator when isLoading is true", () => {
    const messages = [makeMessage()];
    render(
      <ChatPanel
        messages={messages}
        isLoading={true}
        statusLog={[]}
        onSendFollowUp={jest.fn()}
      />
    );
    expect(screen.getByText("Analyzing your mechanism...")).toBeInTheDocument();
  });

  it("does not show loading when isLoading is false", () => {
    const messages = [makeMessage()];
    render(
      <ChatPanel
        messages={messages}
        isLoading={false}
        statusLog={[]}
        onSendFollowUp={jest.fn()}
      />
    );
    expect(
      screen.queryByText("Analyzing your mechanism...")
    ).not.toBeInTheDocument();
  });

  it("calls onSendFollowUp when form is submitted", async () => {
    const onSendFollowUp = jest.fn();
    const user = userEvent.setup();
    const messages = [makeMessage()];

    render(
      <ChatPanel
        messages={messages}
        isLoading={false}
        statusLog={[]}
        onSendFollowUp={onSendFollowUp}
      />
    );

    const textarea = screen.getByPlaceholderText("Ask a follow-up question...");
    await user.type(textarea, "Why is backside attack required?");
    await user.keyboard("{Enter}");

    expect(onSendFollowUp).toHaveBeenCalledWith(
      "Why is backside attack required?"
    );
  });

  it("clears input after submit", async () => {
    const user = userEvent.setup();
    const messages = [makeMessage()];

    render(
      <ChatPanel
        messages={messages}
        isLoading={false}
        statusLog={[]}
        onSendFollowUp={jest.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText(
      "Ask a follow-up question..."
    ) as HTMLTextAreaElement;
    await user.type(textarea, "Question");
    await user.keyboard("{Enter}");

    expect(textarea.value).toBe("");
  });

  it("does not submit empty input", async () => {
    const onSendFollowUp = jest.fn();
    const user = userEvent.setup();
    const messages = [makeMessage()];

    render(
      <ChatPanel
        messages={messages}
        isLoading={false}
        statusLog={[]}
        onSendFollowUp={onSendFollowUp}
      />
    );

    const textarea = screen.getByPlaceholderText("Ask a follow-up question...");
    await user.click(textarea);
    await user.keyboard("{Enter}");

    expect(onSendFollowUp).not.toHaveBeenCalled();
  });

  it("disables submit button when loading", () => {
    const messages = [makeMessage()];

    render(
      <ChatPanel
        messages={messages}
        isLoading={true}
        statusLog={[]}
        onSendFollowUp={jest.fn()}
      />
    );

    const buttons = screen.getAllByRole("button");
    const submitButton = buttons.find(
      (b) => b.getAttribute("type") === "submit"
    );
    expect(submitButton).toBeDisabled();
  });

  it("renders multiple messages in order", () => {
    const messages = [
      makeMessage({ id: "1", role: "user", content: "First question" }),
      makeMessage({
        id: "2",
        role: "assistant",
        content: "First answer",
      }),
      makeMessage({ id: "3", role: "user", content: "Second question" }),
    ];

    render(
      <ChatPanel
        messages={messages}
        isLoading={false}
        statusLog={[]}
        onSendFollowUp={jest.fn()}
      />
    );

    expect(screen.getByText("First question")).toBeInTheDocument();
    expect(screen.getByTestId("mechanism-feedback")).toHaveTextContent(
      "First answer"
    );
    expect(screen.getByText("Second question")).toBeInTheDocument();
  });
});
