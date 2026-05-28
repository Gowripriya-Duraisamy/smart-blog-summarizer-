import { ChatSession } from "../models/chatSession.model";
import { ChatMessage } from "../types/chat.types";

export async function saveChatMessages(
  userId: string,
  sessionId: string | undefined,
  documentIds: string[],
  newMessages: ChatMessage[],
  scope: "selected" | "all" = "selected",
) {
  if (!sessionId) {
    const session = await ChatSession.create({
      userId,
      documentIds,
      scope,
      messages: newMessages,
    });

    return session;
  }

  const session = await ChatSession.findOneAndUpdate(
    { _id: sessionId, userId },
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
      userId,
      documentIds,
      scope,
      messages: newMessages,
    });
  }

  return session;
}

export async function listChatSessions(
  userId: string,
  documentIds: string[],
  scope: "selected" | "all" = "selected",
) {
  const filter =
    scope === "all"
      ? { userId, scope: "all" }
      : {
          userId,
          scope: "selected",
          documentIds: { $all: documentIds, $size: documentIds.length },
        };

  return ChatSession.find(filter)
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean();
}

export async function getChatSession(sessionId: string, userId: string) {
  return ChatSession.findOne({ _id: sessionId, userId }).lean();
}
