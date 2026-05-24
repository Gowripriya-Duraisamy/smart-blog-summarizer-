// src/modules/documents/document.routes.ts

import { Router } from "express";
import {
  getDocumentSummary,
  listDocuments,
} from "../controllers/document.controller";

const router = Router();

// GET /api/documents
router.get("/", listDocuments);

// GET /api/documents/:documentId/summary
router.get("/:documentId/summary", getDocumentSummary);

export default router;
