import { Request, Response } from "express";
import { getSummaryFromAI } from "../business/summary";
import { extractTextFromFile } from "../utils/fileHandler";

export const getSummary = async (req: Request, res: Response) => {
  try {
    console.log("Received request for summary generation");
    const textInput = req.body.text;
    const file = req.file;

    let finalText = "";

    if (file) {
      finalText = await extractTextFromFile(file);
    } else if (textInput && typeof textInput === "string") {
      finalText = textInput;
    } else {
      return res.status(400).json({
        message:
          "No valid input provided. Please upload a file or provide text.",
      });
    }

    if (!finalText || finalText.trim().length === 0) {
      return res.status(400).json({
        message: "No valid content to summarize",
      });
    }
    const inputData = {
      text: finalText,
      length: req.body.length || "medium",
      tone: req.body.tone || "neutral",
      format: req.body.format || "paragraph",
    };
    const summary = await getSummaryFromAI(inputData);
    res.status(200).json({
      status: "OK",
      message: summary,
    });
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: "Failed to generate summary",
    });
  }
};
