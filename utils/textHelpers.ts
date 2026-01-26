import { SegmentationType } from '../types';

export const splitTextIntoChunks = (text: string, strategy: SegmentationType = 'paragraphs'): string[] => {
  const trimmedText = text.trim();
  if (!trimmedText) return [];

  switch (strategy) {
    case 'sentences':
      // Split by common sentence terminators (. ! ?) followed by whitespace or end of string
      // This regex keeps the delimiter attached to the previous sentence usually, but for simplicity in JS split:
      // We use a lookbehind approximation or match approach. 
      // Match non-terminators followed by terminators.
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