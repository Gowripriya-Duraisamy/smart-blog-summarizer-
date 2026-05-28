import { createEmbedding } from "../service/embed.service";
import {
  searchRelevantChunks,
  buildPrompt,
} from "../service/vectorSearch.service";
import { generateAnswer } from "../service/llm.service";
import {
  getChatSession,
  listChatSessions,
  saveChatMessages,
} from "../infra/chat.dao";
import { ChatRequest, ChatResponse } from "../types/chat.types";
import { RAGDocumentModel } from "../models/document.model";

export async function askQuestion(payload: ChatRequest): Promise<ChatResponse> {
  const {
    question,
    documentIds = [],
    scope = "selected",
    chatHistory = [],
    sessionId,
    topK = 5,
  } = payload;
  const { userId } = payload;

  if (!question?.trim()) {
    throw new Error("Question is required");
  }

  if (!userId) {
    throw new Error("Authentication is required");
  }

  if (scope === "selected" && !documentIds?.length) {
    throw new Error("At least one document ID is required");
  }

  if (scope === "selected") {
    const ownedDocumentCount = await RAGDocumentModel.countDocuments({
      _id: { $in: documentIds },
      userId,
    });

    if (ownedDocumentCount !== documentIds.length) {
      throw new Error("One or more selected documents are not available");
    }
  }

  const embedding = await createEmbedding(question);

  const chunks = await searchRelevantChunks(
    embedding,
    userId,
    scope === "all" ? [] : documentIds,
    topK,
  );

  if (!chunks.length || chunks[0].score < 0.5) {
    const answer =
      scope === "all"
        ? "I couldn't find relevant information in your uploaded documents."
        : "I couldn't find relevant information in the selected documents.";
    const session = await saveChatMessages(
      userId,
      sessionId,
      documentIds,
      [
        { role: "user", content: question },
        { role: "assistant", content: answer },
      ],
      scope,
    );

    return {
      answer,
      sources: [],
      sessionId: String(session!._id),
    };
  }

  const prompt = buildPrompt(question, chunks, chatHistory);

  const answer = await generateAnswer(prompt);

  const session = await saveChatMessages(
    userId,
    sessionId,
    documentIds,
    [
      { role: "user", content: question },
      { role: "assistant", content: answer },
    ],
    scope,
  );

  const sources = chunks.map((chunk) => ({
    documentId: chunk.metadata.documentId,
    documentName: chunk.metadata.documentName,
    chunkId: chunk.id,
    score: chunk.score,
    page: chunk.metadata.page,
    snippet: chunk.text.slice(0, 200),
  }));

  return {
    answer,
    sources,
    sessionId: String(session!._id),
  };
}

export async function getSessionsForScope(
  userId: string,
  documentIds: string[],
  scope: "selected" | "all" = "selected",
) {
  const sessions = await listChatSessions(userId, documentIds, scope);

  return sessions.map((session: any) => {
    const firstUserMessage = session.messages?.find(
      (message: any) => message.role === "user",
    );

    return {
      id: String(session._id),
      title: firstUserMessage?.content || "Untitled chat",
      documentIds: session.documentIds || [],
      scope: session.scope || "selected",
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  });
}

export async function getSessionById(sessionId: string, userId: string) {
  const session = await getChatSession(sessionId, userId);

  if (!session) {
    return null;
  }

  const firstUserMessage = session.messages?.find(
    (message: any) => message.role === "user",
  );

  return {
    id: String(session._id),
    title: firstUserMessage?.content || "Untitled chat",
    documentIds: session.documentIds || [],
    scope: session.scope || "selected",
    messages: session.messages || [],
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}
