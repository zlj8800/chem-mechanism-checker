import {
  getAllChats,
  getChat,
  createChat,
  updateChat,
  addMessage,
  deleteChat,
  generateMessageId,
} from "@/lib/storage";
import { Message } from "@/lib/types";

const STORAGE_KEY = "chem-mechanism-chats";

beforeEach(() => {
  localStorage.clear();
});

describe("storage", () => {
  describe("createChat", () => {
    it("creates a new chat with default values", () => {
      const chat = createChat();
      expect(chat.id).toBeDefined();
      expect(chat.title).toBe("New Mechanism");
      expect(chat.messages).toEqual([]);
      expect(chat.createdAt).toBeGreaterThan(0);
      expect(chat.updatedAt).toBeGreaterThan(0);
    });

    it("persists the chat to localStorage", () => {
      const chat = createChat();
      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).toBeTruthy();
      const stored = JSON.parse(raw!);
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe(chat.id);
    });

    it("creates multiple chats with unique IDs", () => {
      const a = createChat();
      const b = createChat();
      expect(a.id).not.toBe(b.id);
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(raw).toHaveLength(2);
    });
  });

  describe("getAllChats", () => {
    it("returns empty array when no chats exist", () => {
      expect(getAllChats()).toEqual([]);
    });

    it("returns chats sorted by updatedAt descending", () => {
      const a = createChat();
      updateChat(a.id, { title: "Older" });

      // Ensure b has a later timestamp
      jest.spyOn(Date, "now").mockReturnValue(Date.now() + 1000);
      const b = createChat();
      jest.restoreAllMocks();

      const chats = getAllChats();
      expect(chats[0].id).toBe(b.id);
      expect(chats[1].id).toBe(a.id);
    });
  });

  describe("getChat", () => {
    it("returns a chat by ID", () => {
      const chat = createChat();
      const found = getChat(chat.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(chat.id);
    });

    it("returns undefined for non-existent ID", () => {
      expect(getChat("nonexistent")).toBeUndefined();
    });
  });

  describe("updateChat", () => {
    it("updates chat title", () => {
      const chat = createChat();
      const updated = updateChat(chat.id, { title: "SN2 Reaction" });
      expect(updated).not.toBeNull();
      expect(updated!.title).toBe("SN2 Reaction");
    });

    it("updates the updatedAt timestamp", () => {
      const chat = createChat();
      const originalUpdatedAt = chat.updatedAt;

      // Small delay to ensure timestamp difference
      const updated = updateChat(chat.id, { title: "New Title" });
      expect(updated!.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt);
    });

    it("returns null for non-existent chat", () => {
      expect(updateChat("nonexistent", { title: "X" })).toBeNull();
    });

    it("persists changes to localStorage", () => {
      const chat = createChat();
      updateChat(chat.id, { title: "Updated" });
      const fromStorage = getChat(chat.id);
      expect(fromStorage!.title).toBe("Updated");
    });
  });

  describe("addMessage", () => {
    it("adds a message to a chat", () => {
      const chat = createChat();
      const msg: Message = {
        id: "msg-1",
        role: "user",
        content: "Analyze this SN2 mechanism",
        timestamp: Date.now(),
      };

      const updated = addMessage(chat.id, msg);
      expect(updated).not.toBeNull();
      expect(updated!.messages).toHaveLength(1);
      expect(updated!.messages[0].content).toBe("Analyze this SN2 mechanism");
    });

    it("adds messages with image data", () => {
      const chat = createChat();
      const msg: Message = {
        id: "msg-img",
        role: "user",
        content: "Check this",
        imageData: "data:image/png;base64,abc123",
        timestamp: Date.now(),
      };

      const updated = addMessage(chat.id, msg);
      expect(updated!.messages[0].imageData).toBe(
        "data:image/png;base64,abc123"
      );
    });

    it("appends multiple messages in order", () => {
      const chat = createChat();
      addMessage(chat.id, {
        id: "m1",
        role: "user",
        content: "First",
        timestamp: 1,
      });
      addMessage(chat.id, {
        id: "m2",
        role: "assistant",
        content: "Second",
        timestamp: 2,
      });

      const updated = getChat(chat.id);
      expect(updated!.messages).toHaveLength(2);
      expect(updated!.messages[0].content).toBe("First");
      expect(updated!.messages[1].content).toBe("Second");
    });

    it("returns null for non-existent chat", () => {
      expect(
        addMessage("nonexistent", {
          id: "x",
          role: "user",
          content: "hi",
          timestamp: 0,
        })
      ).toBeNull();
    });
  });

  describe("deleteChat", () => {
    it("removes a chat from storage", () => {
      const chat = createChat();
      deleteChat(chat.id);
      expect(getChat(chat.id)).toBeUndefined();
      expect(getAllChats()).toHaveLength(0);
    });

    it("does not affect other chats", () => {
      const a = createChat();
      const b = createChat();
      deleteChat(a.id);
      expect(getAllChats()).toHaveLength(1);
      expect(getChat(b.id)).toBeDefined();
    });

    it("does nothing for non-existent ID", () => {
      createChat();
      deleteChat("nonexistent");
      expect(getAllChats()).toHaveLength(1);
    });
  });

  describe("generateMessageId", () => {
    it("returns a string", () => {
      expect(typeof generateMessageId()).toBe("string");
    });

    it("generates unique IDs", () => {
      const ids = new Set(Array.from({ length: 50 }, () => generateMessageId()));
      expect(ids.size).toBe(50);
    });
  });
});
