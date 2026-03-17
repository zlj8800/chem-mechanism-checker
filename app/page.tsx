"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Chat, Message } from "@/lib/types";
import {
  getAllChats,
  getChat,
  createChat,
  updateChat,
  addMessage,
  deleteChat as deleteChatStorage,
  generateMessageId,
} from "@/lib/storage";
import Sidebar from "@/components/Sidebar";
import DrawingCanvas, { DrawingCanvasHandle } from "@/components/DrawingCanvas";
import ImageUpload from "@/components/ImageUpload";
import ChatPanel from "@/components/ChatPanel";
import StatusLog from "@/components/StatusLog";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Send,
  Loader2,
  Pencil,
  Upload,
  Menu,
  FlaskConical,
  Sun,
  Moon,
} from "lucide-react";

type InputMode = "draw" | "upload";

export default function HomePage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("draw");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const canvasRef = useRef<DrawingCanvasHandle>(null);

  useEffect(() => {
    setChats(getAllChats());
    const saved = localStorage.getItem("chem-dark-mode");
    if (saved === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("chem-dark-mode", String(next));
      return next;
    });
  }, []);

  const refreshChats = useCallback(() => {
    setChats(getAllChats());
  }, []);

  const loadChat = useCallback((id: string) => {
    const chat = getChat(id);
    if (chat) {
      setActiveChatId(id);
      setActiveChat(chat);
    }
  }, []);

  const handleNewChat = useCallback(() => {
    setActiveChatId(null);
    setActiveChat(null);
    setUploadedImage(null);
    canvasRef.current?.clearCanvas();
    setSidebarOpen(false);
  }, []);

  const handleSelectChat = useCallback(
    (id: string) => {
      loadChat(id);
      setSidebarOpen(false);
    },
    [loadChat]
  );

  const handleDeleteChat = useCallback(
    (id: string) => {
      deleteChatStorage(id);
      if (activeChatId === id) {
        setActiveChatId(null);
        setActiveChat(null);
      }
      refreshChats();
    },
    [activeChatId, refreshChats]
  );

  const pushStatus = useCallback((msg: string, level: "info" | "warn" | "error" | "success" = "info") => {
    const ts = new Date().toLocaleTimeString();
    const prefix = level === "error" ? "!! " : level === "warn" ? "?  " : level === "success" ? "+  " : "   ";
    setStatusLog((prev) => [...prev, `${ts}${prefix}${msg}`]);
    console.log(`[client] [${level.toUpperCase()}] ${msg}`);
  }, []);

  const sendToApi = useCallback(
    async (
      chatId: string,
      messages: Message[],
      imageData?: string
    ) => {
      const apiMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
        imageData: m.imageData,
      }));

      const payloadSize = JSON.stringify({ messages: apiMessages, imageData }).length;
      pushStatus(`Request payload: ${Math.round(payloadSize / 1024)} KB`);
      pushStatus("Sending POST /api/analyze...");

      const t0 = performance.now();
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, imageData }),
      });
      const elapsed = Math.round(performance.now() - t0);

      pushStatus(`Server responded: HTTP ${res.status} in ${elapsed}ms`);

      if (!res.ok) {
        const err = await res.json();
        pushStatus(`Server error: ${err.error || "Unknown"}`, "error");
        throw new Error(err.error || "Failed to analyze");
      }

      pushStatus("Parsing response...", "success");
      return res.json();
    },
    [pushStatus]
  );

  const handleSubmitDrawing = useCallback(
    async (userText?: string) => {
      let imageData: string | undefined;

      if (inputMode === "draw") {
        const exported = await canvasRef.current?.exportImage();
        if (exported) imageData = exported;
      } else if (uploadedImage) {
        imageData = uploadedImage;
      }

      if (!imageData && !userText) {
        console.log("[client] [WARN] submit blocked: no image and no text");
        return;
      }

      setIsLoading(true);
      setStatusLog([]);
      const submitStart = performance.now();
      pushStatus("Starting submission pipeline...");

      try {
        let chatId = activeChatId;
        let currentMessages: Message[] = [];

        if (!chatId) {
          pushStatus("No active chat — creating new session");
          const newChat = createChat();
          chatId = newChat.id;
          setActiveChatId(chatId);
          pushStatus(`Chat created: ${chatId.slice(0, 8)}...`, "success");
        } else {
          pushStatus(`Resuming chat: ${chatId.slice(0, 8)}...`);
          const existing = getChat(chatId);
          currentMessages = existing?.messages || [];
          pushStatus(`Loaded ${currentMessages.length} prior message(s)`);
        }

        if (imageData) {
          const sizeKb = Math.round((imageData.length * 3) / 4 / 1024);
          const format = imageData.match(/^data:image\/(\w+);/)?.[1] || "unknown";
          pushStatus(`Image ready: ${sizeKb} KB (${format})`, "success");
        } else {
          pushStatus("Text-only submission (no image)");
        }

        const promptText = userText || "Please analyze this mechanism drawing.";
        pushStatus(`Prompt: "${promptText.slice(0, 50)}${promptText.length > 50 ? "..." : ""}"`);

        const userMessage: Message = {
          id: generateMessageId(),
          role: "user",
          content: promptText,
          imageData,
          timestamp: Date.now(),
        };

        addMessage(chatId, userMessage);
        currentMessages = [...currentMessages, userMessage];
        pushStatus("User message saved to chat history");

        const updatedChat = getChat(chatId);
        setActiveChat(updatedChat || null);
        refreshChats();

        pushStatus("Calling Gemini API...");
        const data = await sendToApi(chatId, currentMessages, imageData);

        const responseLen = data.content?.length || 0;
        pushStatus(`Response: ${responseLen} chars`, "success");

        const assistantMessage: Message = {
          id: generateMessageId(),
          role: "assistant",
          content: data.content,
          timestamp: Date.now(),
        };

        addMessage(chatId, assistantMessage);
        pushStatus("Assistant response saved to chat");

        if (data.suggestedTitle && currentMessages.length <= 1) {
          updateChat(chatId, { title: data.suggestedTitle });
          pushStatus(`Mechanism identified: ${data.suggestedTitle}`, "success");
        }

        const totalMs = Math.round(performance.now() - submitStart);
        pushStatus(`Complete! (${totalMs}ms total)`, "success");

        const final = getChat(chatId);
        setActiveChat(final || null);
        refreshChats();

        if (inputMode === "draw") {
          canvasRef.current?.clearCanvas();
        } else {
          setUploadedImage(null);
        }
      } catch (err) {
        const totalMs = Math.round(performance.now() - submitStart);
        const errMsg = err instanceof Error ? err.message : "Something went wrong";
        pushStatus(`FAILED after ${totalMs}ms: ${errMsg}`, "error");

        if (err instanceof Error && err.stack) {
          console.error("[client] [ERROR] Full stack trace:", err.stack);
        }

        if (errMsg.includes("API key") || errMsg.includes("API_KEY")) {
          pushStatus("Hint: Check your GEMINI_API_KEY in .env.local", "warn");
        }
        if (errMsg.includes("quota") || errMsg.includes("429")) {
          pushStatus("Hint: You may have hit the free tier rate limit. Wait a minute.", "warn");
        }
        if (errMsg.includes("fetch") || errMsg.includes("network") || errMsg.includes("Failed to fetch")) {
          pushStatus("Hint: Check that the dev server is running (npm run dev)", "warn");
        }

        const errorMessage: Message = {
          id: generateMessageId(),
          role: "assistant",
          content: `**Error**: ${errMsg}. Please check your API key and try again.`,
          timestamp: Date.now(),
        };

        if (activeChatId) {
          addMessage(activeChatId, errorMessage);
          const final = getChat(activeChatId);
          setActiveChat(final || null);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [inputMode, uploadedImage, activeChatId, refreshChats, sendToApi, pushStatus]
  );

  const handleFollowUp = useCallback(
    async (text: string) => {
      if (!activeChatId) return;

      setIsLoading(true);
      setStatusLog([]);
      const followUpStart = performance.now();
      pushStatus(`Follow-up: "${text.slice(0, 50)}${text.length > 50 ? "..." : ""}"`);

      try {
        const userMessage: Message = {
          id: generateMessageId(),
          role: "user",
          content: text,
          timestamp: Date.now(),
        };

        addMessage(activeChatId, userMessage);
        const current = getChat(activeChatId);
        setActiveChat(current || null);
        pushStatus(`Conversation now has ${current?.messages.length || 0} message(s)`);

        pushStatus("Calling Gemini API...");
        const data = await sendToApi(
          activeChatId,
          current?.messages || [],
          undefined
        );

        const responseLen = data.content?.length || 0;
        pushStatus(`Response: ${responseLen} chars`, "success");

        const assistantMessage: Message = {
          id: generateMessageId(),
          role: "assistant",
          content: data.content,
          timestamp: Date.now(),
        };

        addMessage(activeChatId, assistantMessage);
        const final = getChat(activeChatId);
        setActiveChat(final || null);
        refreshChats();

        const totalMs = Math.round(performance.now() - followUpStart);
        pushStatus(`Complete! (${totalMs}ms)`, "success");
      } catch (err) {
        const totalMs = Math.round(performance.now() - followUpStart);
        const errMsg = err instanceof Error ? err.message : "Something went wrong";
        pushStatus(`FAILED after ${totalMs}ms: ${errMsg}`, "error");

        if (err instanceof Error && err.stack) {
          console.error("[client] [ERROR] Follow-up stack trace:", err.stack);
        }

        const errorMessage: Message = {
          id: generateMessageId(),
          role: "assistant",
          content: `**Error**: ${errMsg}`,
          timestamp: Date.now(),
        };
        addMessage(activeChatId, errorMessage);
        const final = getChat(activeChatId);
        setActiveChat(final || null);
      } finally {
        setIsLoading(false);
      }
    },
    [activeChatId, refreshChats, sendToApi, pushStatus]
  );

  const messages = activeChat?.messages || [];
  const hasMessages = messages.length > 0;

  const sidebarContent = (
    <Sidebar
      chats={chats}
      activeChatId={activeChatId}
      onSelectChat={handleSelectChat}
      onNewChat={handleNewChat}
      onDeleteChat={handleDeleteChat}
    />
  );

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:flex w-64 border-r bg-card shrink-0">
          {sidebarContent}
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-12 border-b flex items-center px-3 gap-2 shrink-0">
            <div className="md:hidden">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger
                  render={
                    <Button variant="ghost" size="icon" className="h-8 w-8" />
                  }
                >
                  <Menu className="h-5 w-5" />
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  {sidebarContent}
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <FlaskConical className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">MechCheck</span>
            </div>

            <div className="flex-1" />

            <span className="text-xs text-muted-foreground hidden sm:block">
              {activeChat
                ? activeChat.title
                : "Draw or upload a mechanism to get started"}
            </span>

            <div className="flex-1" />

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleDarkMode}
            >
              {darkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </header>

          {/* Content area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!hasMessages ? (
              /* Welcome / input view */
              <div className="flex-1 overflow-auto">
                <div className="max-w-2xl mx-auto p-4 space-y-4">
                  <div className="text-center py-6">
                    <FlaskConical className="h-12 w-12 mx-auto text-primary mb-3" />
                    <h2 className="text-xl font-semibold mb-1">
                      Mechanism Checker
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Draw or upload your organic chemistry mechanism and get
                      instant AI feedback on correctness, errors, and the
                      correct solution.
                    </p>
                  </div>

                  {/* Mode toggle */}
                  <div className="flex justify-center gap-1 p-1 bg-muted rounded-lg w-fit mx-auto">
                    <Button
                      variant={inputMode === "draw" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setInputMode("draw")}
                      className="gap-1.5"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Draw
                    </Button>
                    <Button
                      variant={inputMode === "upload" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setInputMode("upload")}
                      className="gap-1.5"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload
                    </Button>
                  </div>

                  {/* Input area */}
                  {inputMode === "draw" ? (
                    <DrawingCanvas ref={canvasRef} />
                  ) : (
                    <ImageUpload
                      onImageSelect={setUploadedImage}
                      currentImage={uploadedImage}
                      onClear={() => setUploadedImage(null)}
                    />
                  )}

                  {/* Submit */}
                  <div className="flex flex-col items-center gap-3">
                    <Button
                      onClick={() => handleSubmitDrawing()}
                      disabled={isLoading}
                      size="lg"
                      className="gap-2 px-8"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Analyze Mechanism
                        </>
                      )}
                    </Button>

                    {isLoading && statusLog.length > 0 && (
                      <div className="w-full max-w-sm bg-muted/50 border rounded-lg p-3">
                        <StatusLog entries={statusLog} />
                      </div>
                    )}
                  </div>

                  {/* Quick tips */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                    {[
                      {
                        title: "Arrow Pushing",
                        desc: "Draw curved arrows showing electron flow in your mechanism",
                      },
                      {
                        title: "Structure ID",
                        desc: "Upload spectral data problems for structure determination help",
                      },
                      {
                        title: "Learn & Fix",
                        desc: "Get detailed explanations and the correct mechanism",
                      },
                    ].map((tip) => (
                      <div
                        key={tip.title}
                        className="border rounded-lg p-3 text-center"
                      >
                        <p className="text-sm font-medium mb-0.5">
                          {tip.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tip.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Conversation view */
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Collapsible drawing section at top */}
                <details className="border-b">
                  <summary className="px-4 py-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors select-none flex items-center gap-2">
                    <Pencil className="h-3.5 w-3.5" />
                    Submit another drawing
                  </summary>
                  <div className="px-4 pb-3 space-y-3">
                    <div className="flex justify-center gap-1 p-1 bg-muted rounded-lg w-fit mx-auto">
                      <Button
                        variant={inputMode === "draw" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setInputMode("draw")}
                        className="gap-1.5"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Draw
                      </Button>
                      <Button
                        variant={inputMode === "upload" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setInputMode("upload")}
                        className="gap-1.5"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Upload
                      </Button>
                    </div>

                    <div className="max-w-2xl mx-auto">
                      {inputMode === "draw" ? (
                        <DrawingCanvas ref={canvasRef} />
                      ) : (
                        <ImageUpload
                          onImageSelect={setUploadedImage}
                          currentImage={uploadedImage}
                          onClear={() => setUploadedImage(null)}
                        />
                      )}
                    </div>

                    <div className="flex justify-center">
                      <Button
                        onClick={() => handleSubmitDrawing()}
                        disabled={isLoading}
                        className="gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Analyze
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </details>

                {/* Chat messages */}
                <div className="flex-1 overflow-hidden">
                  <ChatPanel
                    messages={messages}
                    isLoading={isLoading}
                    statusLog={statusLog}
                    onSendFollowUp={handleFollowUp}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
