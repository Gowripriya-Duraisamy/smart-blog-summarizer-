import dotenv from "dotenv";

dotenv.config();

export const MONGODB_URI = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}/?retryWrites=true&w=majority`;
export const PINECONE_API_KEY = process.env.PINECONE_API_KEY!;
export const PINECONE_INDEX = process.env.PINECONE_INDEX!;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
export const CHATMODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4.1-mini";
export const EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
