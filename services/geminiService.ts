import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Initialize with an optional key, falling back to env var
const getAiClient = (customKey?: string) => {
  const apiKey = customKey || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please provide a Custom API Key in settings or check environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper function to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Generic retry wrapper for API calls
const withRetry = async <T>(
  operation: () => Promise<T>,
  retries = 3,
  backoff = 2000 // Start with 2 seconds
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    const isRateLimit =
      error?.status === 429 ||
      error?.code === 429 ||
      error?.status === "RESOURCE_EXHAUSTED" ||
      (typeof error?.message === 'string' && (
        error.message.includes('429') || 
        error.message.includes('quota') || 
        error.message.includes('RESOURCE_EXHAUSTED')
      ));

    if (isRateLimit && retries > 0) {
      console.warn(`Rate limit hit (429). Retrying in ${backoff}ms... (${retries} attempts left)`);
      await delay(backoff);
      return withRetry(operation, retries - 1, backoff * 2);
    }
    
    throw error;
  }
};

export const translateSegment = async (
  segment: string,
  fullContext: string,
  translationSoFar: string,
  sourceLang: string,
  targetLang: string,
  modelId: string,
  customInstructions?: string,
  apiKey?: string
): Promise<{ text: string; prompt: string }> => {
  const ai = getAiClient(apiKey);
  
  const instructionsPart = customInstructions 
    ? `\n    ADDITIONAL STYLE/TONE INSTRUCTIONS:\n    ${customInstructions}\n` 
    : "";

  const previousTranslationContext = translationSoFar 
    ? `\n    Translation Generated So Far (for consistency):\n    """\n    ${translationSoFar}\n    """\n`
    : "";

  const isFullText = segment.trim().length === fullContext.trim().length;

  let prompt = '';

  if (isFullText) {
     prompt = `
    You are an expert translator specializing in maintaining context, tone, and nuance.
    
    Task: Translate the text below from ${sourceLang} to ${targetLang}.
    ${instructionsPart}
    Instructions:
    1. Do not add any conversational filler, notes, or explanations. Output ONLY the translated text.
    
    Text to Translate:
    """
    ${segment}
    """
  `;
  } else {
     prompt = `
    You are an expert translator specializing in maintaining context, tone, and nuance.
    
    Task: Translate the specific text segment below from ${sourceLang} to ${targetLang}.
    ${instructionsPart}
    Instructions:
    1. Use the "Full Document Context" provided to understand the overall meaning, terminology, and tone.
    2. Review the "Translation Generated So Far" to ensure consistency in terminology and style with previous segments.
    3. Only translate the "Segment to Translate".
    4. Do not add any conversational filler, notes, or explanations. Output ONLY the translated text.
    
    Full Document Context:
    """
    ${fullContext}
    """
    ${previousTranslationContext}
    Segment to Translate:
    """
    ${segment}
    """
  `;
  }

  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: modelId,
      contents: prompt,
    }));
    
    return {
        text: response.text?.trim() || "",
        prompt: prompt
    };
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error("Failed to translate segment after retries.");
  }
};

export const backTranslateSegment = async (
  translatedText: string,
  sourceLang: string,
  targetLang: string,
  modelId: string,
  apiKey?: string
): Promise<string> => {
  const ai = getAiClient(apiKey);

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
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: modelId,
      contents: prompt,
    }));
    
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Back-translation error:", error);
    throw new Error("Failed to back-translate segment after retries.");
  }
};

export const evaluateTranslationSegment = async (
  original: string,
  translated: string,
  backTranslated: string,
  sourceLang: string,
  targetLang: string,
  fullContext: string,
  modelId: string,
  apiKey?: string
): Promise<string> => {
  const ai = getAiClient(apiKey);

  const prompt = `
    You are a linguistics expert and translation quality auditor.
    
    Task: Evaluate the quality of the translation below based on the Original, Translation, and Back-Translation.
    
    Languages: ${sourceLang} -> ${targetLang}
    
    Input Data:
    1. Original Text: "${original}"
    2. Translated Text: "${translated}"
    3. Back-Translation (Literal): "${backTranslated}"
    
    Full Document Context (for reference):
    """
    ${fullContext}
    """

    Instructions:
    Identify any issues in the following categories:
    - Unclarities or ambiguities.
    - Inconsistencies with the original meaning.
    - Poor vocabulary choices or awkward phrasing.
    - Potential confusion for the reader.
    
    Output Format:
    - Provide a concise list of observations.
    - If the translation is excellent, state that it is accurate and natural.
    - Be specific (quote words if necessary).
    - Do NOT re-translate, just evaluate.
  `;

  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: modelId,
      contents: prompt,
    }));
    
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Evaluation error:", error);
    return "Failed to generate evaluation report.";
  }
};