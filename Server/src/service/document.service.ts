// services/document.service.ts

import { FilterQuery } from "mongoose";
import { IRAGDocument, RAGDocumentModel } from "../models/document.model";

export interface ListDocumentsQuery {
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sourceType?: string;
  processingStatus?: string;
  selectedIds?: string[]; // for "Selected for Chat"
}

export class DocumentService {
  async getDocumentSummary(documentId: string, userId: string) {
    const document = await RAGDocumentModel.findOne({
      _id: documentId,
      userId,
    }).lean();

    if (!document) {
      return null;
    }

    return {
      id: document._id,
      fileName: document.originalFileName,
      fileType: document.sourceType.toUpperCase(),
      uploadedAt: document.createdAt,
      summary: {
        summary: document.summary,
        keyInsights: document.keyInsights || [],
        risks: document.risks || [],
        sentiment: document.sentiment || "Neutral",
        takeaways: document.takeaways || [],
        suggestedQuestions: document.suggestedQuestions || [],
      },
    };
  }

  async listDocuments(query: ListDocumentsQuery) {
    const {
      page = 1,
      limit = 20,
      search = "",
      category,
      sourceType,
      processingStatus,
      selectedIds = [],
    } = query;

    const filter: FilterQuery<IRAGDocument> = {
      userId: query.userId,
    };

    // Full text search
    if (search?.trim()) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { originalFileName: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Filters
    if (category) {
      filter.category = category;
    }

    if (sourceType) {
      filter.sourceType = sourceType;
    }

    if (processingStatus) {
      filter.processingStatus = processingStatus as any;
    }

    // If UI wants only selected documents
    if (selectedIds.length > 0) {
      filter._id = { $in: selectedIds };
    }

    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      RAGDocumentModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      RAGDocumentModel.countDocuments(filter),
    ]);

    return {
      data: documents.map((doc) => ({
        id: doc._id,
        title: doc.title,
        originalFileName: doc.originalFileName,
        sourceType: doc.sourceType.toUpperCase(), // PDF, DOCX, TXT
        category: doc.category,
        tags: doc.tags,
        summary: doc.summary,
        processingStatus: doc.processingStatus,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,

        // UI helpers
        displayName: doc.originalFileName,
        uploadedDate: doc.createdAt,
        isSelectedForChat: selectedIds.some(
          (id) => id.toString() === doc._id.toString(),
        ),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
      stats: {
        totalDocuments: total,
        selectedCount: selectedIds.length,
      },
    };
  }
}
