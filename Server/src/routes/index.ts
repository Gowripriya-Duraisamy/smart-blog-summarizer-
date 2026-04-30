import { Router } from "express";
import { healthCheck } from "../controllers/health.controller";
import { getSummary } from "../controllers/summary.controller";
import { upload } from "../middleware/upload";

const router = Router();

router.get("/health", healthCheck);

router.post("/summary", upload.single("file"), getSummary);

export default router;
