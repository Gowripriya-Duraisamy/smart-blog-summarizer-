import { ChatSession } from "../models/chatSession.model";
import { ChatMessage } from "../types/chat.types";

export async function saveChatMessages(
  sessionId: string | undefined,
  documentIds: string[],
  newMessages: ChatMessage[],
  scope: "selected" | "all" = "selected",
) {
  if (!sessionId) {
    const session = await ChatSession.create({
      documentIds,
      scope,
      messages: newMessages,
    });

    return session;
  }

  const session = await ChatSession.findByIdAndUpdate(
    sessionId,
    {
      $set: {
        documentIds,
        scope,
      },
      $push: {
        messages: { $each: newMessages },
      },
    },
    { new: true },
  );

  if (!session) {
    return ChatSession.create({
      documentIds,
      scope,
      messages: newMessages,
    });
  }

  return session;
}

export async function listChatSessions(
  documentIds: string[],
  scope: "selected" | "all" = "selected",
) {
  const filter =
    scope === "all"
      ? { scope: "all" }
      : {
          scope: "selected",
          documentIds: { $all: documentIds, $size: documentIds.length },
        };

  return ChatSession.find(filter)
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean();
}

export async function getChatSession(sessionId: string) {
  return ChatSession.findById(sessionId).lean();
}
