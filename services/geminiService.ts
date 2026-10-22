import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Every request uses the visitor key; there is no shared deployment credential.
const getAiClient = (customKey?: string) => {
  const apiKey = customKey?.trim();
  if (!apiKey) {
    throw new Error("Add your Gemini API key in Settings before translating.");
  }
  return new GoogleGenAI({ apiKey, vertexai: false });
};

const requestError = (error: unknown, signal?: AbortSignal): Error => {
  if (signal?.aborted) return new Error('Translation stopped because the key or run changed.');
  const status = (error as {status?: number; code?: number})?.status ?? (error as {code?: number})?.code;
  if (status === 401 || status === 403) return new Error('Check your Gemini API key and its permissions in Settings.');
  if (status === 429) return new Error('Your Gemini quota is exhausted. Wait and try again, or check your API account.');
  if (status === 400 || status === 404) return new Error('Gemini could not process this request. Check your key in Settings and the selected model.');
  return new Error('Gemini could not complete the request. Check your connection and try again.');
};

// Helper function to delay execution
const delay = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
  signal?.throwIfAborted();
  const abort = () => { clearTimeout(timer); reject(new Error('Translation stopped.')); };
  const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, ms);
  signal?.addEventListener('abort', abort, {once: true});
});

// Generic retry wrapper for API calls
const withRetry = async <T>(
  operation: () => Promise<T>,
  signal?: AbortSignal,
  retries = 3,
  backoff = 2000 // Start with 2 seconds
): Promise<T> => {
  try {
    signal?.throwIfAborted();
    return await operation();
  } catch (error: any) {
    signal?.throwIfAborted();
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
      await delay(backoff, signal);
      return withRetry(operation, signal, retries - 1, backoff * 2);
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
  apiKey?: string,
  signal?: AbortSignal
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
      config: {abortSignal: signal},
    }), signal);
    
    return {
        text: response.text?.trim() || "",
        prompt: prompt
    };
  } catch (error) {
    throw requestError(error, signal);
  }
};

export const backTranslateSegment = async (
  translatedText: string,
  sourceLang: string,
  targetLang: string,
  modelId: string,
  apiKey?: string,
  signal?: AbortSignal
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
      config: {abortSignal: signal},
    }), signal);
    
    return response.text?.trim() || "";
  } catch (error) {
    throw requestError(error, signal);
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
  apiKey?: string,
  signal?: AbortSignal
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
      config: {abortSignal: signal},
    }), signal);
    
    return response.text?.trim() || "";
  } catch (error) {
    throw requestError(error, signal);
  }
};