import OpenAI from "openai";
import dotenv from "dotenv";
import { SummaryFormat } from "../types/summary";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const getSummaryFromAI = async (inputData: SummaryFormat) => {
  try {
    console.log("inside get Summary");
    console.log(
      `Summarize this in ${inputData.length} sentences in a ${inputData.tone} tone as ${inputData.format}:`,
    );
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content: `Summarize this in ${inputData.length} sentences in a ${inputData.tone} tone as ${inputData.format}:\n${inputData.text}`,
        },
      ],
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("An error occurred", error);
    throw new Error("Failed to generate summary");
  }
};
