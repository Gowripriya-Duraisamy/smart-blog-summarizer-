import { openai } from "../config/openAI";
import { CHATMODEL } from "../config/consts";

export async function generateAnswer(prompt: string): Promise<string> {
  const response = await openai.responses.create({
    model: CHATMODEL,
    input: prompt,
  });

  return response.output_text;
}
