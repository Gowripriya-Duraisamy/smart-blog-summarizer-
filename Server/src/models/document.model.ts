// models/Document.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IRAGDocument extends Document {
  title: string;
  originalFileName: string;
  sourceType: string;
  category: string;
  tags: string[];
  summary: string;
  keyInsights: string[];
  risks: string[];
  sentiment: "Positive" | "Neutral" | "Negative";
  takeaways: string[];
  suggestedQuestions: string[];
  fullText: string;
  createdAt: Date;
  updatedAt: Date;
  processingStatus: "uploaded" | "processing" | "completed" | "failed";
}

/**
 * Main RAG Document Schema
 */
const RAGDocumentSchema = new Schema<IRAGDocument>(
  {
    sourceType: {
      type: String,
      default: "uploaded_file",
      enum: ["txt", "pdf", "docx"],
    },
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    keyInsights: {
      type: [String],
      default: [],
    },
    risks: {
      type: [String],
      default: [],
    },
    sentiment: {
      type: String,
      enum: ["Positive", "Neutral", "Negative"],
      default: "Neutral",
    },
    takeaways: {
      type: [String],
      default: [],
    },
    suggestedQuestions: {
      type: [String],
      default: [],
    },
    fullText: {
      type: String,
      required: true,
    },
    processingStatus: {
      type: String,
      enum: ["uploaded", "processing", "completed", "failed"],
      default: "completed",
      index: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    versionKey: false,
  },
);

/**
 * Useful indexes for RAG retrieval
 */

// Text search across searchable fields
RAGDocumentSchema.index({
  title: "text",
  summary: "text",
  fullText: "text",
  tags: "text",
});

// Optional compound query optimization
RAGDocumentSchema.index({
  category: 1,
  createdAt: -1,
});

// Chunk index uniqueness per document
RAGDocumentSchema.index({
  _id: 1,
  "chunks.chunkIndex": 1,
});

/**
 * Model export
 */
export const RAGDocumentModel: Model<IRAGDocument> =
  mongoose.models.RAGDocument ||
  mongoose.model<IRAGDocument>("RAGDocument", RAGDocumentSchema);

export default RAGDocumentModel;
