import { pineconeIndex } from "../config/pinecone";
import { ChatMessage } from "../types/chat.types";

export interface RetrievedChunk {
  id: string;
  score: number;
  text: string;
  metadata: {
    documentId: string;
    documentName: string;
    page?: number;
    chunkIndex?: number;
  };
}

export async function searchRelevantChunks(
  embedding: number[],
  userId: string,
  documentIds: string[] = [],
  topK = 5,
): Promise<RetrievedChunk[]> {
  const filter: Record<string, any> = {
    userId,
  };

  if (documentIds.length > 0) {
    filter.fileId = { $in: documentIds };
  }

  const results = await pineconeIndex.query({
    vector: embedding,
    topK,
    includeMetadata: true,
    filter,
  });

  return (results.matches || []).map((match) => ({
    id: match.id,
    score: match.score || 0,
    text: (match.metadata?.text as string) || "",
    metadata: {
      documentId: match.metadata?.fileId as string,
      documentName:
        (match.metadata?.documentName as string) ||
        (match.metadata?.originalFileName as string) ||
        (match.metadata?.title as string) ||
        "Selected document",
      page: match.metadata?.page as number,
      chunkIndex: match.metadata?.chunkIndex as number,
    },
  }));
}

export function buildPrompt(
  question: string,
  chunks: RetrievedChunk[],
  history: ChatMessage[] = [],
): string {
  const historyText = history
    .slice(-6)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const context = chunks
    .map(
      (chunk, index) =>
        `[Source ${index + 1}] ${chunk.metadata.documentName}` +
        `${chunk.metadata.page ? ` (page ${chunk.metadata.page})` : ""}\n` +
        chunk.text,
    )
    .join("\n\n");

  return `
You are a helpful AI assistant.

Answer ONLY using the provided context.
If the answer is not available in the context, say:
"I couldn't find that information in the selected documents."

Conversation History:
${historyText}

Context:
${context}

Question:
${question}

Answer:
`;
}
