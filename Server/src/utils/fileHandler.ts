const pdf = require("pdf-parse");
import mammoth from "mammoth";
import { ExtractedResponse } from "../types/summary.types";

export const extractTextFromFile = async (
  file: any,
): Promise<ExtractedResponse> => {
  const mimeType = file.mimetype;

  if (mimeType === "application/pdf") {
    const data = await pdf(file.buffer);
    return { text: data.text, type: "pdf" };
  }

  if (mimeType === "text/plain") {
    return { text: file.buffer.toString("utf-8"), type: "txt" };
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({
      buffer: file.buffer,
    });
    return { text: result.value, type: "docx" };
  }

  throw new Error("Only PDF and DOCX files are supported");
};
