import OpenAI from "openai";
import { OPENAI_API_KEY } from "../config/consts";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY!,
});

export async function createEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}
