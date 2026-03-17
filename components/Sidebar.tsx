"use client";

import { Chat } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, FlaskConical, MessageSquare } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
}

export default function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
}: SidebarProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <div className="flex items-center gap-2 mb-3">
          <FlaskConical className="h-5 w-5 text-primary" />
          <h1 className="font-semibold text-sm">MechCheck</h1>
        </div>
        <Button onClick={onNewChat} className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          New Mechanism
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {chats.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8 px-2">
              No conversations yet. Start by drawing or uploading a mechanism.
            </p>
          )}
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`group flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer text-sm transition-colors ${
                activeChatId === chat.id
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              }`}
              onClick={() => onSelectChat(chat.id)}
            >
              <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate flex-1">{chat.title}</span>
              <Tooltip>
                <TooltipTrigger
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent>Delete chat</TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
