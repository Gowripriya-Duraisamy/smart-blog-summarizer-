export interface SubmitTextRequest {
  message: string;
}

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface SubmitTextResponse {
  success: boolean;
  message: SummaryResponse;
}

export interface SummarizeTextRequest {
  text?: string;
  file: File | null;
  summaryLength: string;
  tone: string;
  format: string;
}

export interface SummaryResponse {
  summary: string | string[];
  keyInsights: string[];
  risks: string[];
  sentiment: string;
  takeaways: string[];
  suggestedQuestions?: string[];
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  question: string;
  documentIds: string[];
  scope?: "selected" | "all";
  chatHistory?: ChatHistoryMessage[];
  sessionId?: string;
}

export interface ChatSourceReference {
  documentId: string;
  documentName: string;
  chunkId: string;
  score: number;
  page?: number;
  snippet: string;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSourceReference[];
  sessionId: string;
}

export interface ChatSessionSummary {
  id: string;
  title: string;
  documentIds: string[];
  scope: "selected" | "all";
  createdAt: string;
  updatedAt: string;
}

export interface ChatSessionDetail extends ChatSessionSummary {
  messages: ChatHistoryMessage[];
}
