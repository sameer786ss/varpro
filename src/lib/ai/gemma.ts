import { GoogleGenAI } from "@google/genai";

import { env, requireServerSecret } from "@/lib/env";

const SYSTEM_PROMPT = `You are an academic support tutor inside a digital learning platform.
- Explain concepts with clarity and practical examples.
- Keep answers concise but complete.
- Offer a suggested next step for practice.
- If uncertain, say what context is missing.`;

let cachedClient: GoogleGenAI | null = null;

function getAiClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = requireServerSecret(env.GOOGLE_GENAI_API_KEY, "GOOGLE_GENAI_API_KEY");
  cachedClient = new GoogleGenAI({ apiKey });
  return cachedClient;
}

export async function generateTutorResponse(input: {
  prompt: string;
  learnerName?: string | null;
  courseTitle?: string | null;
}) {
  const client = getAiClient();

  const contextPrefix = [
    input.learnerName ? `Learner: ${input.learnerName}` : null,
    input.courseTitle ? `Course: ${input.courseTitle}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await client.models.generateContent({
    model: env.GEMMA_MODEL,
    contents: `${SYSTEM_PROMPT}\n\n${contextPrefix}\n\nQuestion: ${input.prompt}`,
  });

  return response.text ?? "I could not generate a response right now.";
}
