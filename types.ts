export interface TranslationSegment {
  id: string;
  original: string;
  translated: string | null;
  backTranslated: string | null;
  status: 'idle' | 'translating' | 'verifying' | 'completed' | 'error';
  error?: string;
}

export interface LanguageOption {
  code: string;
  name: string;
}

export interface ModelOption {
  id: string;
  name: string;
}

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