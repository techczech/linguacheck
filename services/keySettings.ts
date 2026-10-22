type KeyStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function readKeySettings(storage: KeyStorage): {key: string; remember: boolean} {
  try {
    return {key: storage.getItem('gemini_api_key') || '', remember: storage.getItem('remember_gemini_api_key') === 'true'};
  } catch { return {key: '', remember: false}; }
}

export function saveKeySettings(storage: KeyStorage, key: string, remember: boolean): boolean {
  try {
    if (remember && key.trim()) {
      storage.setItem('gemini_api_key', key.trim());
      storage.setItem('remember_gemini_api_key', 'true');
    } else {
      storage.removeItem('gemini_api_key');
      storage.removeItem('remember_gemini_api_key');
    }
    return true;
  } catch { return false; }
}
