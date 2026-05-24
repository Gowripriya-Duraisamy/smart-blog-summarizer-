import { openai } from "../config/openAI";
import { EMBEDDING_MODEL } from "../config/consts";

export async function createEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });

  return response.data[0].embedding;
}
