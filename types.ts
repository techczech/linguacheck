export interface TranslationSegment {
  id: string;
  original: string;
  translated: string | null;
  backTranslated: string | null;
  status: 'idle' | 'translating' | 'verifying' | 'completed' | 'error';
  error?: string;
  promptUsed?: string; // To store the full context prompt for user inspection
}

export interface LanguageOption {
  code: string;
  name: string;
}

export interface ModelOption {
  id: string;
  name: string;
}

export type SegmentationType = 'paragraphs' | 'sentences' | 'lines' | 'smart';

export const SEGMENTATION_OPTIONS: { value: SegmentationType; label: string; description: string }[] = [
  { value: 'paragraphs', label: 'Paragraphs', description: 'Best for articles and essays. Preserves flow.' },
  { value: 'sentences', label: 'Sentences', description: 'Granular precision. Good for complex syntax.' },
  { value: 'lines', label: 'Line Breaks', description: 'Best for poetry, lyrics, or lists.' },
  { value: 'smart', label: 'Smart Grouping', description: 'Groups sentences (~500 chars) to balance context and speed.' },
];

export const LANGUAGES: LanguageOption[] = [
  { code: 'English', name: 'English' },
  { code: 'Spanish', name: 'Spanish' },
  { code: 'French', name: 'French' },
  { code: 'German', name: 'German' },
  { code: 'Italian', name: 'Italian' },
  { code: 'Portuguese', name: 'Portuguese' },
  { code: 'Chinese (Simplified)', name: 'Chinese (Simplified)' },
  { code: 'Japanese', name: 'Japanese' },
  { code: 'Korean', name: 'Korean' },
  { code: 'Russian', name: 'Russian' },
  { code: 'Arabic', name: 'Arabic' },
  { code: 'Hindi', name: 'Hindi' },
  { code: 'Czech', name: 'Czech' },
  { code: 'Polish', name: 'Polish' },
  { code: 'custom', name: 'Other / Custom' },
];

export const MODELS: ModelOption[] = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Fast)' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (High Quality)' },
];