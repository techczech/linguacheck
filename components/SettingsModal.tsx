import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  rememberKey: boolean;
  storageError: string;
  onSaveKey: (key: string, remember: boolean) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, apiKey, rememberKey, storageError, onSaveKey }) => {
  const [localKey, setLocalKey] = useState(apiKey);
  const [localRemember, setLocalRemember] = useState(rememberKey);
  const [isSaved, setIsSaved] = useState(false);
  useEffect(() => {
    if (isOpen) { setLocalKey(apiKey); setLocalRemember(rememberKey); setIsSaved(false); }
  }, [isOpen, apiKey, rememberKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveKey(localKey, localRemember);
    setIsSaved(true);
    setTimeout(() => {
        setIsSaved(false);
        onClose();
    }, 1000);
  };

  const handleClear = () => {
    setLocalKey('');
    setLocalRemember(false);
    onSaveKey('', false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div role="dialog" aria-modal="true" aria-labelledby="key-settings-title" className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center">
          <h3 id="key-settings-title" className="font-bold text-indigo-900 text-lg">Settings</h3>
          <button aria-label="Close settings" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <label htmlFor="gemini-api-key" className="block text-sm font-semibold text-slate-700 mb-2">
            Gemini API key
          </label>
          <div className="text-xs text-slate-500 mb-4 leading-relaxed">
            Enter your own Gemini API key. Requests go directly to Google and use your API account. The key stays in this tab unless you choose to remember it.
          </div>
          
          <input
            id="gemini-api-key"
            autoComplete="off"
            spellCheck={false}
            type="password"
            value={localKey}
            onChange={(e) => setLocalKey(e.target.value)}
            placeholder="AIzaSy..."
            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50 font-mono mb-4"
          />

          <label className="flex items-center gap-2 text-sm text-slate-700 mb-4">
            <input type="checkbox" checked={localRemember} onChange={(event) => setLocalRemember(event.target.checked)} />
            Remember my key in this browser
          </label>
          {storageError && <p role="status" className="text-sm text-amber-800 mb-4">{storageError}</p>}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear Key
            </button>
            <button
              onClick={handleSave}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-all shadow-sm ${isSaved ? 'bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {isSaved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;