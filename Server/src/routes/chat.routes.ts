import { Router } from "express";
import {
  chatController,
  chatSessionController,
  chatSessionsController,
} from "../controllers/chat.controller";

const router = Router();

router.get("/sessions", chatSessionsController);
router.get("/sessions/:sessionId", chatSessionController);
router.post("/", chatController);

export default router;
