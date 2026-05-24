import { pineconeIndex } from "./config/pinecone";

async function test() {
  const stats = await pineconeIndex.describeIndexStats();

  console.log(stats);
}

test();
