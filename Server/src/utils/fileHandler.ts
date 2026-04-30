const pdf = require("pdf-parse");
import mammoth from "mammoth";

export const extractTextFromFile = async (file: any): Promise<string> => {
  const mimeType = file.mimetype;

  if (mimeType === "application/pdf") {
    const data = await pdf(file.buffer);
    return data.text;
  }

  if (mimeType === "text/plain") {
    return file.buffer.toString("utf-8");
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({
      buffer: file.buffer,
    });
    return result.value;
  }

  throw new Error("Only PDF and DOCX files are supported");
};
