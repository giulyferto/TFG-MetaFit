import { defineSecret } from "firebase-functions/params";

// Define the OpenAI API key as a secret
export const openaiApiKey = defineSecret("OPENAI_API_KEY");
