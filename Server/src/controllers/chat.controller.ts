import { Request, Response } from "express";
import {
  askQuestion,
  getSessionById,
  getSessionsForScope,
} from "../service/chat.service";
import { AuthenticatedRequest } from "../middleware/auth";

export async function chatController(req: Request, res: Response) {
  try {
    const result = await askQuestion({
      ...req.body,
      userId: (req as AuthenticatedRequest).user.userId,
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message || "Failed to process chat request",
    });
  }
}

export async function chatSessionsController(req: Request, res: Response) {
  try {
    const scope = req.query.scope === "all" ? "all" : "selected";
    const documentIdsParam = req.query.documentIds;
    const documentIds =
      typeof documentIdsParam === "string" && documentIdsParam.trim()
        ? documentIdsParam.split(",").filter(Boolean)
        : [];

    if (scope === "selected" && documentIds.length === 0) {
      return res.json([]);
    }

    const sessions = await getSessionsForScope(
      (req as AuthenticatedRequest).user.userId,
      documentIds,
      scope,
    );
    res.json(sessions);
  } catch (error: any) {
    res.status(400).json({
      message: error.message || "Failed to fetch chat sessions",
    });
  }
}

export async function chatSessionController(req: Request, res: Response) {
  try {
    const rawSessionId = req.params.sessionId;

    if (!rawSessionId || Array.isArray(rawSessionId)) {
      return res.status(400).json({
        message: "Invalid session id",
      });
    }

    const session = await getSessionById(
      rawSessionId,
      (req as AuthenticatedRequest).user.userId,
    );

    if (!session) {
      return res.status(404).json({
        message: "Chat session not found",
      });
    }

    res.json(session);
  } catch (error: any) {
    res.status(400).json({
      message: error.message || "Failed to fetch chat session",
    });
  }
}
