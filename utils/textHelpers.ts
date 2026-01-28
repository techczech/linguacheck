import { SegmentationType } from '../types';

export const splitTextIntoChunks = (text: string, strategy: SegmentationType = 'paragraphs'): string[] => {
  const trimmedText = text.trim();
  if (!trimmedText) return [];

  if (strategy === 'none') {
    return [trimmedText];
  }

  switch (strategy) {
    case 'sentences':
      // Split by common sentence terminators (. ! ?) followed by whitespace or end of string
      const sentenceMatches = trimmedText.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g);
      return sentenceMatches ? sentenceMatches.map(s => s.trim()) : [trimmedText];

    case 'lines':
      // Split by single newline
      return trimmedText.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);

    case 'smart':
      // Split into sentences first, then group them into chunks of ~300-500 chars
      const sentences = trimmedText.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g) || [trimmedText];
      const chunks: string[] = [];
      let currentChunk = '';
      
      for (const sentence of sentences) {
        if ((currentChunk + sentence).length < 500) {
          currentChunk += (currentChunk ? ' ' : '') + sentence.trim();
        } else {
          if (currentChunk) chunks.push(currentChunk);
          currentChunk = sentence.trim();
        }
      }
      if (currentChunk) chunks.push(currentChunk);
      return chunks;

    case 'paragraphs':
    default:
      // Split by double newlines to preserve paragraphs
      const rawChunks = trimmedText.split(/\n\s*\n/);
      return rawChunks
        .map(chunk => chunk.trim())
        .filter(chunk => chunk.length > 0);
  }
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Heuristic: ~4 characters per token
export const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4);
};

export const calculateTranslationCost = (text: string, strategy: SegmentationType): { standard: number, contextual: number, segmentCount: number } => {
  const segments = splitTextIntoChunks(text, strategy);
  const fullTextTokens = estimateTokens(text);
  const systemPromptOverhead = 150; // Approx tokens for system instructions per request

  // Standard: Text is sent once (plus overhead)
  const standard = fullTextTokens + systemPromptOverhead;

  const segmentCount = segments.length;

  // If no segmentation is used, we just send the text once. The cost is the same as standard.
  if (strategy === 'none') {
    return { standard, contextual: standard, segmentCount: 1 };
  }
  
  // Contextual Calculation:
  // For each segment i, we send:
  // 1. Full Document Context (fullTextTokens)
  // 2. Translation So Far (Sum of segments 0 to i-1) -> Estimated via source text length of previous segments
  // 3. Current Segment (segment i tokens)
  // 4. Instructions/Overhead
  
  let contextual = 0;
  let tokensSoFar = 0;
  
  for (const segment of segments) {
      const segmentTokens = estimateTokens(segment);
      
      const promptCost = 
        fullTextTokens + // Full context
        tokensSoFar +    // Translation history (estimated using source tokens)
        segmentTokens +  // Current segment
        systemPromptOverhead; // Instructions
        
      contextual += promptCost;
      
      // Update history for next iteration
      tokensSoFar += segmentTokens;
  }

  return { standard, contextual, segmentCount };
};