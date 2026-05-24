import OpenAI from "openai";
import { SummaryFormat } from "../types/summary.types";
import { chunkText } from "../utils/chunkText";
import { createEmbedding } from "../service/embed.service";
import { pineconeIndex } from "../config/pinecone";
import { RAGDocumentModel } from "../models/document.model";
import { v4 as uuid } from "uuid";
import { OPENAI_API_KEY } from "../config/consts";

const client = new OpenAI({
  apiKey: OPENAI_API_KEY!,
});

export const getSummaryFromAI = async (inputData: SummaryFormat) => {
  let documentId: string | null = null;

  try {
    // =====================================================
    // STEP 1: Generate Summary using OpenAI
    // =====================================================

    const summaryPrompt = `
Analyze the provided content and return ONLY valid JSON.

USER PREFERENCES:
- Format: ${inputData.format}
- Summary Length: ${inputData.length}
- Tone: ${inputData.tone}

STRICT RULES:
- Return ONLY parseable JSON
- No markdown
- No headings
- No extra text outside JSON
- If format is "bullet points", summary must be an ARRAY of strings
- If format is "paragraph", summary must be a STRING
- keyInsights, risks, takeaways, tags, suggestedQuestions must ALWAYS be arrays
- sentiment must be exactly one of:
  "Positive", "Neutral", "Negative"
- category must be a single short string
- tags must contain 3 to 8 concise keywords
- suggestedQuestions must contain 4 to 6 specific user questions grounded in the document topic

REQUIRED JSON:
{
  "summary": "string OR array depending on format",
  "keyInsights": ["..."],
  "risks": ["..."],
  "sentiment": "Neutral",
  "takeaways": ["..."],
  "category": "General",
  "tags": ["tag1", "tag2", "tag3"],
  "suggestedQuestions": ["..."]
}

CATEGORY GUIDELINES:
Choose the most suitable category such as:
- Finance
- Legal
- Insurance
- Healthcare
- Technology
- Human Resources
- Education
- General

CONTENT:
"""
${inputData.text}
"""
`;

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a summarization assistant that ONLY returns strict valid JSON.",
        },
        {
          role: "user",
          content: summaryPrompt,
        },
      ],
    });

    const rawContent = response.choices[0].message.content || "{}";
    const parsedResponse = JSON.parse(rawContent);

    // Normalize summary to string for MongoDB storage
    const summaryText = Array.isArray(parsedResponse.summary)
      ? parsedResponse.summary.join("\n")
      : parsedResponse.summary;
    const sentiment = ["Positive", "Neutral", "Negative"].includes(
      parsedResponse.sentiment,
    )
      ? parsedResponse.sentiment
      : "Neutral";

    // =====================================================
    // STEP 2: Insert Metadata into MongoDB
    // =====================================================

    const ragDocument = await RAGDocumentModel.create({
      title: inputData.fileName,
      originalFileName: inputData.fileName,
      sourceType: inputData.type, // pdf/docx/txt
      category: parsedResponse.category || "general",
      tags: parsedResponse.tags || [],
      summary: summaryText,
      keyInsights: parsedResponse.keyInsights || [],
      risks: parsedResponse.risks || [],
      sentiment,
      takeaways: parsedResponse.takeaways || [],
      suggestedQuestions: parsedResponse.suggestedQuestions || [],
      fullText: inputData.text,
      processingStatus: "processing",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    documentId = ragDocument._id.toString();

    // =====================================================
    // STEP 3: Chunk the Full Text
    // =====================================================

    const chunks = await chunkText(inputData.text);

    // =====================================================
    // STEP 4: Create Embeddings
    // =====================================================

    const vectors = await Promise.all(
      chunks.map(async (chunk, index) => {
        const embedding = await createEmbedding(chunk.pageContent);

        return {
          id: uuid(),
          values: embedding,
          metadata: {
            fileId: documentId!,
            title: ragDocument.title,
            documentName: ragDocument.originalFileName,
            originalFileName: ragDocument.originalFileName,
            sourceType: ragDocument.sourceType,
            category: ragDocument.category,
            chunkIndex: index,
            text: chunk.pageContent,
          },
        };
      }),
    );

    // =====================================================
    // STEP 5: Upsert into Pinecone
    // =====================================================

    const batchSize = 100;

    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await pineconeIndex.upsert(batch);
    }

    // =====================================================
    // STEP 6: Update MongoDB Status
    // =====================================================

    await RAGDocumentModel.findByIdAndUpdate(documentId, {
      processingStatus: "completed",
      updatedAt: new Date(),
    });

    // =====================================================
    // STEP 7: Return Response
    // =====================================================

    return {
      status: "OK",
      fileId: documentId,
      message: parsedResponse,
    };
  } catch (error) {
    console.error("Summary generation failed:", error);

    // Mark failed if Mongo document was created
    if (documentId) {
      await RAGDocumentModel.findByIdAndUpdate(documentId, {
        processingStatus: "failed",
        updatedAt: new Date(),
      });
    }

    return {
      status: "ERROR",
      message: {
        summary: "Failed to generate summary.",
        keyInsights: [],
        risks: [],
        sentiment: "Neutral",
        takeaways: [],
        suggestedQuestions: [],
      },
    };
  }
};
