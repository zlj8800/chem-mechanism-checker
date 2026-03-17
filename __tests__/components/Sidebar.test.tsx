import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "@/components/Sidebar";
import { Chat } from "@/lib/types";

jest.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children, ...props }: React.PropsWithChildren) => (
    <div {...props}>{children}</div>
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => <>{children}</>,
  TooltipTrigger: ({
    children,
    onClick,
    className,
  }: React.PropsWithChildren<{
    onClick?: React.MouseEventHandler;
    className?: string;
  }>) => (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  ),
  TooltipContent: ({ children }: React.PropsWithChildren) => (
    <span>{children}</span>
  ),
}));

jest.mock("lucide-react", () => ({
  Plus: () => <span>+</span>,
  Trash2: () => <span data-testid="trash-icon">🗑</span>,
  FlaskConical: () => <span>🧪</span>,
  MessageSquare: () => <span>💬</span>,
}));

const makeChat = (overrides: Partial<Chat> = {}): Chat => ({
  id: "chat-1",
  title: "SN2 Reaction",
  messages: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

describe("Sidebar", () => {
  it("renders the MechCheck brand", () => {
    render(
      <Sidebar
        chats={[]}
        activeChatId={null}
        onSelectChat={jest.fn()}
        onNewChat={jest.fn()}
        onDeleteChat={jest.fn()}
      />
    );
    expect(screen.getByText("MechCheck")).toBeInTheDocument();
  });

  it("renders 'New Mechanism' button", () => {
    render(
      <Sidebar
        chats={[]}
        activeChatId={null}
        onSelectChat={jest.fn()}
        onNewChat={jest.fn()}
        onDeleteChat={jest.fn()}
      />
    );
    expect(screen.getByText("New Mechanism")).toBeInTheDocument();
  });

  it("calls onNewChat when 'New Mechanism' is clicked", () => {
    const onNewChat = jest.fn();
    render(
      <Sidebar
        chats={[]}
        activeChatId={null}
        onSelectChat={jest.fn()}
        onNewChat={onNewChat}
        onDeleteChat={jest.fn()}
      />
    );
    fireEvent.click(screen.getByText("New Mechanism"));
    expect(onNewChat).toHaveBeenCalled();
  });

  it("shows empty state when no chats exist", () => {
    render(
      <Sidebar
        chats={[]}
        activeChatId={null}
        onSelectChat={jest.fn()}
        onNewChat={jest.fn()}
        onDeleteChat={jest.fn()}
      />
    );
    expect(screen.getByText(/No conversations yet/)).toBeInTheDocument();
  });

  it("renders chat titles", () => {
    const chats = [
      makeChat({ id: "1", title: "SN2 Bromide" }),
      makeChat({ id: "2", title: "E1 Elimination" }),
    ];

    render(
      <Sidebar
        chats={chats}
        activeChatId={null}
        onSelectChat={jest.fn()}
        onNewChat={jest.fn()}
        onDeleteChat={jest.fn()}
      />
    );

    expect(screen.getByText("SN2 Bromide")).toBeInTheDocument();
    expect(screen.getByText("E1 Elimination")).toBeInTheDocument();
  });

  it("calls onSelectChat when a chat is clicked", () => {
    const onSelectChat = jest.fn();
    const chats = [makeChat({ id: "chat-42", title: "Test Chat" })];

    render(
      <Sidebar
        chats={chats}
        activeChatId={null}
        onSelectChat={onSelectChat}
        onNewChat={jest.fn()}
        onDeleteChat={jest.fn()}
      />
    );

    fireEvent.click(screen.getByText("Test Chat"));
    expect(onSelectChat).toHaveBeenCalledWith("chat-42");
  });

  it("calls onDeleteChat when delete button is clicked", () => {
    const onDeleteChat = jest.fn();
    const chats = [makeChat({ id: "chat-99" })];

    render(
      <Sidebar
        chats={chats}
        activeChatId={null}
        onSelectChat={jest.fn()}
        onNewChat={jest.fn()}
        onDeleteChat={onDeleteChat}
      />
    );

    const trashButtons = screen.getAllByTestId("trash-icon");
    const deleteButton = trashButtons[0].closest("button");
    if (deleteButton) {
      fireEvent.click(deleteButton);
      expect(onDeleteChat).toHaveBeenCalledWith("chat-99");
    }
  });

  it("highlights the active chat", () => {
    const chats = [
      makeChat({ id: "1", title: "Active Chat" }),
      makeChat({ id: "2", title: "Inactive Chat" }),
    ];

    render(
      <Sidebar
        chats={chats}
        activeChatId="1"
        onSelectChat={jest.fn()}
        onNewChat={jest.fn()}
        onDeleteChat={jest.fn()}
      />
    );

    const activeEl = screen.getByText("Active Chat").closest("div[class*='cursor-pointer']");
    expect(activeEl?.className).toContain("bg-accent");
  });
});
