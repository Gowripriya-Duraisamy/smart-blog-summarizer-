import axios from "axios";
import {
  AuthSession,
  ChatRequest,
  ChatResponse,
  ChatSessionDetail,
  ChatSessionSummary,
  SubmitTextRequest,
  SummaryResponse,
} from "../types/api";
import { getAuthToken } from "./auth";

const apiClient = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL || ""}`.trim(),
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const signInWithGoogle = async (
  credential: string,
): Promise<AuthSession> => {
  const response = await apiClient.post("/api/auth/google", { credential });
  return response.data;
};

export const submitText = async (
  payload: SubmitTextRequest | FormData,
): Promise<SummaryResponse> => {
  const response = await apiClient.post("/api/summary", payload);
  return response.data.message.message;
};

export const getDocumentSummary = async (
  documentId: string,
): Promise<SummaryResponse> => {
  const response = await apiClient.get(`/api/documents/${documentId}/summary`, {
    headers: {
      "Cache-Control": "no-cache",
    },
  });

  return response.data.data.summary;
};

export const askChatQuestion = async (
  payload: ChatRequest,
): Promise<ChatResponse> => {
  const response = await apiClient.post("/api/chat", payload);
  return response.data;
};

export const getChatSessions = async (
  documentIds: string[],
  scope: "selected" | "all",
): Promise<ChatSessionSummary[]> => {
  const params = new URLSearchParams({
    scope,
  });

  if (documentIds.length > 0) {
    params.set("documentIds", documentIds.join(","));
  }

  const response = await apiClient.get(`/api/chat/sessions?${params}`);
  return response.data;
};

export const getChatSession = async (
  sessionId: string,
): Promise<ChatSessionDetail> => {
  const response = await apiClient.get(`/api/chat/sessions/${sessionId}`);
  return response.data;
};
