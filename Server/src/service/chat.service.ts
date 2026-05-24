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

export async function askQuestion(payload: ChatRequest): Promise<ChatResponse> {
  const {
    question,
    documentIds = [],
    scope = "selected",
    chatHistory = [],
    sessionId,
    topK = 5,
  } = payload;

  if (!question?.trim()) {
    throw new Error("Question is required");
  }

  if (scope === "selected" && !documentIds?.length) {
    throw new Error("At least one document ID is required");
  }

  const embedding = await createEmbedding(question);

  const chunks = await searchRelevantChunks(
    embedding,
    scope === "all" ? [] : documentIds,
    topK,
  );

  if (!chunks.length || chunks[0].score < 0.5) {
    const answer =
      scope === "all"
        ? "I couldn't find relevant information in the document database."
        : "I couldn't find relevant information in the selected documents.";
    const session = await saveChatMessages(
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
  documentIds: string[],
  scope: "selected" | "all" = "selected",
) {
  const sessions = await listChatSessions(documentIds, scope);

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

export async function getSessionById(sessionId: string) {
  const session = await getChatSession(sessionId);

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
