export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  question: string;
  documentIds: string[];
  scope?: "selected" | "all";
  chatHistory?: ChatMessage[];
  sessionId?: string;
  topK?: number;
}

export interface SourceReference {
  documentId: string;
  documentName: string;
  chunkId: string;
  score: number;
  page?: number;
  snippet: string;
}

export interface ChatResponse {
  answer: string;
  sources: SourceReference[];
  sessionId: string;
}

export interface ChatSessionSummary {
  id: string;
  title: string;
  documentIds: string[];
  scope: "selected" | "all";
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSessionDetail extends ChatSessionSummary {
  messages: ChatMessage[];
}
