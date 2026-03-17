import { Chat, Message } from "./types";

const STORAGE_KEY = "chem-mechanism-chats";

function getChats(): Chat[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveChats(chats: Chat[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

export function getAllChats(): Chat[] {
  return getChats().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getChat(id: string): Chat | undefined {
  return getChats().find((c) => c.id === id);
}

export function createChat(): Chat {
  const chat: Chat = {
    id: crypto.randomUUID(),
    title: "New Mechanism",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const chats = getChats();
  chats.push(chat);
  saveChats(chats);
  return chat;
}

export function updateChat(id: string, updates: Partial<Chat>): Chat | null {
  const chats = getChats();
  const idx = chats.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  chats[idx] = { ...chats[idx], ...updates, updatedAt: Date.now() };
  saveChats(chats);
  return chats[idx];
}

export function addMessage(chatId: string, message: Message): Chat | null {
  const chats = getChats();
  const idx = chats.findIndex((c) => c.id === chatId);
  if (idx === -1) return null;
  chats[idx].messages.push(message);
  chats[idx].updatedAt = Date.now();
  saveChats(chats);
  return chats[idx];
}

export function deleteChat(id: string) {
  const chats = getChats().filter((c) => c.id !== id);
  saveChats(chats);
}

export function generateMessageId(): string {
  return crypto.randomUUID();
}
