import dotenv from "dotenv";

dotenv.config();

export const MONGODB_URI = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}/?retryWrites=true&w=majority`;
export const PINECONE_API_KEY = process.env.PINECONE_API_KEY!;
export const PINECONE_INDEX = process.env.PINECONE_INDEX!;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
