// controllers/document.controller.ts

import { Request, Response } from "express";
import mongoose from "mongoose";
import { DocumentService } from "../service/document.service";

const documentService = new DocumentService();

export const getDocumentSummary = async (req: Request, res: Response) => {
  try {
    res.set("Cache-Control", "no-store");

    const rawDocumentId = req.params.documentId;

    if (Array.isArray(rawDocumentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document id",
      });
    }

    const documentId = rawDocumentId;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document id",
      });
    }

    const result = await documentService.getDocumentSummary(documentId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Document summary fetched successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch document summary",
    });
  }
};

export const listDocuments = async (req: Request, res: Response) => {
  try {
    res.set("Cache-Control", "no-store");

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const selectedIds =
      typeof req.query.selectedIds === "string"
        ? req.query.selectedIds.split(",")
        : [];

    const result = await documentService.listDocuments({
      page,
      limit,
      search: req.query.search as string,
      category: req.query.category as string,
      sourceType: req.query.sourceType as string,
      processingStatus: req.query.processingStatus as string,
      selectedIds,
    });

    res.status(200).json({
      success: true,
      message: "Documents fetched successfully",
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch documents",
    });
  }
};
