import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export async function chunkText(text: string) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000, // characters per chunk
    chunkOverlap: 200, // overlap between chunks
  });

  const chunks = await splitter.createDocuments([text]);

  return chunks;
}
