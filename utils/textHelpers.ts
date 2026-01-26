export const splitTextIntoChunks = (text: string): string[] => {
  // Split by double newlines to preserve paragraphs, but also handle common list formats or single line breaks if paragraphs are massive.
  // For this app, preserving logical paragraphs is key for context.
  
  const rawChunks = text.split(/\n\s*\n/);
  
  // Filter out empty chunks and trim
  return rawChunks
    .map(chunk => chunk.trim())
    .filter(chunk => chunk.length > 0);
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};