import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

// Initialize outside to allow reuse, but ensure key is present
const getAiClient = () => {
  if (!API_KEY) {
    throw new Error("API Key is missing. Please check your environment variables.");
  }
  return new GoogleGenAI({ apiKey: API_KEY });
};

export const translateSegment = async (
  segment: string,
  fullContext: string,
  sourceLang: string,
  targetLang: string,
  modelId: string,
  customInstructions?: string
): Promise<string> => {
  const ai = getAiClient();
  
  // Clean up instructions if provided
  const instructionsPart = customInstructions 
    ? `\n    ADDITIONAL STYLE/TONE INSTRUCTIONS:\n    ${customInstructions}\n` 
    : "";

  const prompt = `
    You are an expert translator specializing in maintaining context, tone, and nuance.
    
    Task: Translate the specific text segment below from ${sourceLang} to ${targetLang}.
    ${instructionsPart}
    Instructions:
    1. Use the "Full Document Context" provided to understand the overall meaning, terminology, and tone.
    2. Only translate the "Segment to Translate".
    3. Do not add any conversational filler, notes, or explanations. Output ONLY the translated text.
    
    Full Document Context:
    """
    ${fullContext}
    """
    
    Segment to Translate:
    """
    ${segment}
    """
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error("Failed to translate segment.");
  }
};

export const backTranslateSegment = async (
  translatedText: string,
  sourceLang: string,
  targetLang: string,
  modelId: string
): Promise<string> => {
  const ai = getAiClient();

  const prompt = `
    You are an impartial verification assistant.
    
    Task: Translate the following text from ${targetLang} back to ${sourceLang} literally and accurately.
    
    Purpose: This back-translation will be used to verify if the original meaning was preserved.
    
    Instructions:
    1. Translate strictly what is written.
    2. Do not improve or polish the text if the input is awkward; reflect the input accuracy.
    3. Output ONLY the back-translated text.
    
    Text to Back-Translate:
    """
    ${translatedText}
    """
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Back-translation error:", error);
    throw new Error("Failed to back-translate segment.");
  }
};