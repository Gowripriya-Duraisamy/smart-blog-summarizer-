import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  CircularProgress,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  SmartToyOutlined,
  PersonOutlined,
  SendRounded,
  AddCommentOutlined,
} from "@mui/icons-material";
import {
  askChatQuestion,
  getChatSession,
  getChatSessions,
} from "../services/api";
import { ChatSessionSummary } from "../types/api";

export interface SourceReference {
  name: string;
  page?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: SourceReference[];
}

interface AIChatAssistantProps {
  selectedDocumentIds: string[];
  chatScope: "selected" | "all";
}

const getCurrentTime = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

//
// Main Component
//
export default function AIChatAssistant({
  selectedDocumentIds,
  chatScope,
}: AIChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! Upload documents and ask me questions. I'll answer using the selected files.",
      timestamp: getCurrentTime(),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [error, setError] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const animationIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (animationIntervalRef.current) {
        window.clearInterval(animationIntervalRef.current);
      }
    };
  }, []);

  //
  // Auto scroll to latest message
  //
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    setSessionId(undefined);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hi! Upload documents and ask me questions. I'll answer using the selected files.",
        timestamp: getCurrentTime(),
      },
    ]);
  }, [selectedDocumentIds, chatScope]);

  useEffect(() => {
    let cancelled = false;

    const loadSessions = async () => {
      if (chatScope === "selected" && selectedDocumentIds.length === 0) {
        setSessions([]);
        return;
      }

      try {
        setHistoryLoading(true);
        const data = await getChatSessions(selectedDocumentIds, chatScope);

        if (!cancelled) {
          setSessions(data);
        }
      } catch (error) {
        if (!cancelled) {
          setSessions([]);
        }
        console.error(error);
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    };

    loadSessions();

    return () => {
      cancelled = true;
    };
  }, [selectedDocumentIds, chatScope, sessionId]);

  const handleNewChat = () => {
    setSessionId(undefined);
    setError("");
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hi! Upload documents and ask me questions. I'll answer using the selected files.",
        timestamp: getCurrentTime(),
      },
    ]);
  };

  const handleLoadSession = async (selectedSessionId: string) => {
    if (!selectedSessionId) {
      handleNewChat();
      return;
    }

    try {
      setHistoryLoading(true);
      setError("");

      const session = await getChatSession(selectedSessionId);
      setSessionId(session.id);
      setMessages(
        session.messages.map((message, index) => ({
          id: `${session.id}-${index}`,
          role: message.role,
          content: message.content,
          timestamp: getCurrentTime(),
        })),
      );
    } catch (error) {
      setError("Unable to load the selected chat.");
      console.error(error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const animateAssistantMessage = (
    messageId: string,
    content: string,
    sources?: SourceReference[],
  ) => {
    if (animationIntervalRef.current) {
      window.clearInterval(animationIntervalRef.current);
    }

    const words = content.split(/\s+/).filter(Boolean);
    let wordIndex = 0;

    if (words.length === 0) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId ? { ...message, content, sources } : message,
        ),
      );
      return;
    }

    animationIntervalRef.current = window.setInterval(() => {
      if (wordIndex >= words.length) {
        if (animationIntervalRef.current) {
          window.clearInterval(animationIntervalRef.current);
          animationIntervalRef.current = null;
        }
        return;
      }

      const nextContent = words.slice(0, wordIndex + 1).join(" ");

      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId
            ? {
                ...message,
                content: nextContent,
                sources: wordIndex === words.length - 1 ? sources : undefined,
              }
            : message,
        ),
      );

      wordIndex++;
    }, 45);
  };

  const fetchAIResponse = async (
    question: string,
  ): Promise<{
    answer: string;
    sources?: SourceReference[];
  }> => {
    const chatHistory = messages
      .filter((message) => message.id !== "welcome")
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));

    const response = await askChatQuestion({
      question,
      documentIds: chatScope === "selected" ? selectedDocumentIds : [],
      scope: chatScope,
      chatHistory,
      sessionId,
    });

    setSessionId(response.sessionId);

    return {
      answer: response.answer,
      sources: response.sources?.map((source) => ({
        name: source.documentName || source.documentId,
        page: source.page,
      })),
    };
  };

  //
  // Send message
  //
  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;

    if (chatScope === "selected" && selectedDocumentIds.length === 0) {
      setError("Choose at least one document for chat.");
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
      timestamp: getCurrentTime(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      // Call backend API
      const result = await fetchAIResponse(question);

      // Add assistant message
      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: getCurrentTime(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      animateAssistantMessage(
        assistantMessageId,
        result.answer,
        result.sources,
      );
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, something went wrong while generating the response.",
        timestamp: getCurrentTime(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  //
  // Render message
  //
  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === "user";

    return (
      <Box
        key={message.id}
        sx={{
          mb: 2,
          display: "flex",
          spacing: 1,
          justifyContent: isUser ? "flex-end" : "flex-start",
        }}
      >
        <Stack
          sx={{
            maxWidth: "85%",
            flexDirection: isUser ? "row-reverse" : "row",
            direction: "row",
            spacing: 1,
            alignItems: "flex-start",
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: isUser ? "#ede9fe" : "#f3f4f6",
              color: isUser ? "#7c3aed" : "#4b5563",
            }}
          >
            {isUser ? (
              <PersonOutlined fontSize="small" />
            ) : (
              <SmartToyOutlined fontSize="small" />
            )}
          </Avatar>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: isUser ? "#f5f3ff" : "#ffffff",
              border: "1px solid #e5e7eb",
            }}
          >
            <Typography sx={{ variant: "body2", whiteSpace: "pre-wrap" }}>
              {message.content}
            </Typography>

            {message.sources && message.sources.length > 0 && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  Sources:
                </Typography>

                {message.sources.map((source, index) => (
                  <Typography
                    key={index}
                    sx={{
                      variant: "caption",
                      display: "block",
                      color: "text.secondary",
                    }}
                  >
                    • {source.name}
                    {source.page ? ` (p. ${source.page})` : ""}
                  </Typography>
                ))}
              </>
            )}

            <Typography
              sx={{
                variant: "caption",
                display: "block",
                color: "text.secondary",
                mt: 1,
              }}
            >
              {message.timestamp}
            </Typography>
          </Paper>
        </Stack>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        height: { xs: 560, md: "100%" },
        width: "100%",
        minHeight: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#fafafa",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 1.5,
          borderBottom: "1px solid #e5e7eb",
          bgcolor: "#ffffff",
          flexShrink: 0,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          AI Chat Assistant
        </Typography>
        <Box sx={{ mt: 0.75 }}>
          <Chip
            size="small"
            color={
              chatScope === "all" || selectedDocumentIds.length
                ? "success"
                : "default"
            }
            label={
              chatScope === "all"
                ? "Searching entire DB"
                : selectedDocumentIds.length
                ? `Using ${selectedDocumentIds.length} document${
                    selectedDocumentIds.length > 1 ? "s" : ""
                  }`
                : "No documents selected"
            }
          />
        </Box>
        <Stack direction="row" spacing={1} sx={{ mt: 0.75 }}>
          <Select
            size="small"
            displayEmpty
            value={sessionId || ""}
            onChange={(event) => handleLoadSession(event.target.value)}
            disabled={historyLoading || sessions.length === 0}
            sx={{ flex: 1, borderRadius: 2, bgcolor: "#ffffff" }}
          >
            <MenuItem value="">
              {historyLoading ? "Loading chats..." : "Previous chats"}
            </MenuItem>
            {sessions.map((session) => (
              <MenuItem key={session.id} value={session.id}>
                {session.title.length > 36
                  ? `${session.title.slice(0, 36)}...`
                  : session.title}
              </MenuItem>
            ))}
          </Select>
          <IconButton
            aria-label="New chat"
            onClick={handleNewChat}
            size="small"
            sx={{
              border: "1px solid #e5e7eb",
              borderRadius: 2,
            }}
          >
            <AddCommentOutlined fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          p: 1.5,
        }}
      >
        {messages.map(renderMessage)}

        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 2 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: "#f3f4f6",
              }}
            >
              <SmartToyOutlined fontSize="small" />
            </Avatar>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                border: "1px solid #e5e7eb",
              }}
            >
              <CircularProgress size={18} />
            </Paper>
          </Box>
        )}

        <div ref={bottomRef} />
      </Box>

      {/* Input */}
      <Box
        sx={{
          p: 1.5,
          borderTop: "1px solid #e5e7eb",
          bgcolor: "#ffffff",
          flexShrink: 0,
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Ask a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleSend}
                    disabled={
                      !input.trim() ||
                      loading ||
                      (chatScope === "selected" &&
                        selectedDocumentIds.length === 0)
                    }
                    sx={{
                      bgcolor: "#7c3aed",
                      color: "#fff",
                      "&:hover": {
                        bgcolor: "#6d28d9",
                      },
                      "&.Mui-disabled": {
                        bgcolor: "#e5e7eb",
                        color: "#9ca3af",
                      },
                    }}
                  >
                    <SendRounded />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
            },
          }}
        />
      </Box>
    </Box>
  );
}
