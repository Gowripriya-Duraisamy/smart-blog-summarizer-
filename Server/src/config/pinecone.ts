import { Pinecone } from "@pinecone-database/pinecone";
import { PINECONE_API_KEY, PINECONE_INDEX } from "./consts";

export const pinecone = new Pinecone({
  apiKey: PINECONE_API_KEY,
});

export const pineconeIndex = pinecone.index(PINECONE_INDEX);
