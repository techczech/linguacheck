import React, { useState, useMemo } from 'react';
import { LANGUAGES, MODELS, SEGMENTATION_OPTIONS, SegmentationType } from '../types';
import { calculateTranslationCost } from '../utils/textHelpers';

interface InputAreaProps {
  inputText: string;
  setInputText: (text: string) => void;
  sourceLang: string;
  setSourceLang: (lang: string) => void;
  targetLang: string;
  setTargetLang: (lang: string) => void;
  
  translationModel: string;
  setTranslationModel: (model: string) => void;
  verificationModel: string;
  setVerificationModel: (model: string) => void;
  segmentationStrategy: SegmentationType;
  setSegmentationStrategy: (strategy: SegmentationType) => void;
  customInstructions: string;
  setCustomInstructions: (text: string) => void;
  
  enableEvaluation: boolean;
  setEnableEvaluation: (enable: boolean) => void;

  onStart: () => void;
  isProcessing: boolean;
  hasCustomKey: boolean;
}

const DEFAULT_TOKEN_LIMIT = 5000;

const InputArea: React.FC<InputAreaProps> = ({
  inputText,
  setInputText,
  sourceLang,
  setSourceLang,
  targetLang,
  setTargetLang,
  translationModel,
  setTranslationModel,
  verificationModel,
  setVerificationModel,
  segmentationStrategy,
  setSegmentationStrategy,
  customInstructions,
  setCustomInstructions,
  enableEvaluation,
  setEnableEvaluation,
  onStart,
  isProcessing,
  hasCustomKey,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  // Helper to determine if the current language matches a preset or is custom
  const getSelectValue = (lang: string) => {
    if (!lang) return '';
    const isPreset = LANGUAGES.some(l => l.code === lang && l.code !== 'custom');
    return isPreset ? lang : 'custom';
  };

  const sourceSelectValue = getSelectValue(sourceLang);
  const targetSelectValue = getSelectValue(targetLang);

  // Calculate costs
  const { standard, contextual, segmentCount } = useMemo(() => {
    return calculateTranslationCost(inputText, segmentationStrategy);
  }, [inputText, segmentationStrategy]);

  // If custom key is provided, the limit is effectively infinite
  const effectiveLimit = hasCustomKey ? Infinity : DEFAULT_TOKEN_LIMIT;
  const isOverLimit = contextual > effectiveLimit;

  const isValid = 
    inputText.trim().length > 0 &&
    sourceLang.trim().length > 0 &&
    sourceLang !== 'custom' &&
    targetLang.trim().length > 0 &&
    targetLang !== 'custom' &&
    !isOverLimit;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col gap-4">
        
        {/* Language Selection Section */}
        <div className="flex flex-col gap-3">
            <div className="flex items-end gap-2">
                {/* Source Language */}
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <label className="text-xs font-semibold text-slate-500 uppercase">From</label>
                  <select
                    value={sourceSelectValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        setSourceLang('');
                      } else {
                        setSourceLang(val);
                      }
                    }}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-1.5 px-3 bg-white border text-ellipsis overflow-hidden"
                    disabled={isProcessing}
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={`source-${lang.code}`} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Arrow Icon */}
                <div className="text-slate-400 pb-2 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                  </svg>
                </div>

                {/* Target Language */}
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <label className="text-xs font-semibold text-slate-500 uppercase">To</label>
                  <select
                    value={targetSelectValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        setTargetLang('');
                      } else {
                        setTargetLang(val);
                      }
                    }}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-1.5 px-3 bg-white border text-ellipsis overflow-hidden"
                    disabled={isProcessing}
                  >
                     <option value="" disabled>Choose target language</option>
                    {LANGUAGES.map((lang) => (
                      <option key={`target-${lang.code}`} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
            </div>
            
            {/* Custom Input Fields */}
            {(sourceSelectValue === 'custom' || targetSelectValue === 'custom') && (
               <div className="flex gap-2">
                 {sourceSelectValue === 'custom' ? (
                   <input
                    type="text"
                    value={sourceLang === 'custom' ? '' : sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    placeholder="Type source language..."
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-1.5 px-3 bg-white border animate-fade-in flex-1"
                    disabled={isProcessing}
                    autoFocus
                  />
                 ) : <div className="flex-1" />}
                 
                 <div className="w-5 flex-shrink-0" /> {/* Spacer for arrow alignment */}

                 {targetSelectValue === 'custom' ? (
                   <input
                    type="text"
                    value={targetLang === 'custom' ? '' : targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    placeholder="Type target language..."
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-1.5 px-3 bg-white border animate-fade-in flex-1"
                    disabled={isProcessing}
                    autoFocus
                  />
                 ) : <div className="flex-1" />}
               </div>
            )}
        </div>

        {/* Segmentation Strategy - Always Visible Now */}
        <div>
          <label className="text-xs font-semibold text-slate-500 flex items-center gap-2 mb-1">
            Segmentation Strategy
            <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 rounded-full" title="Controls how the text is split">Process</span>
          </label>
          <select
            value={segmentationStrategy}
            onChange={(e) => setSegmentationStrategy(e.target.value as SegmentationType)}
            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-1.5 px-3 bg-white border"
            disabled={isProcessing}
          >
            {SEGMENTATION_OPTIONS.map((opt) => (
                <option key={`seg-${opt.value}`} value={opt.value}>
                  {opt.label} - {opt.description}
                </option>
            ))}
          </select>
        </div>

        {/* Evaluation Toggle */}
        <div className="flex items-center gap-3 bg-slate-100 p-2.5 rounded-lg border border-slate-200">
           <div className="flex items-center h-5">
            <input
              id="enable-eval"
              type="checkbox"
              checked={enableEvaluation}
              onChange={(e) => setEnableEvaluation(e.target.checked)}
              disabled={isProcessing}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
            />
          </div>
          <div className="text-sm">
            <label htmlFor="enable-eval" className="font-medium text-slate-700 block">Enable AI Quality Evaluation</label>
            <p className="text-xs text-slate-500">Analyze for unclarities & inconsistencies (uses more tokens)</p>
          </div>
        </div>

        {/* Token Usage & Cost Estimates */}
        {inputText.length > 0 && (
          <div className={`text-xs rounded-lg p-3 border ${isOverLimit ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold flex items-center gap-2">
                Estimated Token Usage
                {hasCustomKey && (
                  <span className="bg-emerald-100 text-emerald-700 px-1.5 rounded text-[10px] uppercase font-bold tracking-wider">
                    Unlimited
                  </span>
                )}
              </span>
              <span className={`font-mono ${isOverLimit ? 'font-bold' : ''}`}>
                {contextual.toLocaleString()} {hasCustomKey ? '' : `/ ${DEFAULT_TOKEN_LIMIT.toLocaleString()}`}
              </span>
            </div>
            
            <div className="w-full bg-white/50 rounded-full h-1.5 mb-2 overflow-hidden">
               <div 
                 className={`h-full rounded-full ${isOverLimit ? 'bg-red-500' : 'bg-blue-500'}`}
                 style={{ width: hasCustomKey ? '100%' : `${Math.min((contextual / DEFAULT_TOKEN_LIMIT) * 100, 100)}%` }}
               />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] opacity-80">
              <div>
                <span className="block uppercase tracking-wider text-[9px] mb-0.5">Standard</span>
                <span className="font-mono">{standard.toLocaleString()} tokens</span>
              </div>
              <div>
                 <span className="block uppercase tracking-wider text-[9px] mb-0.5">Context-Aware</span>
                 <span className="font-mono">{contextual.toLocaleString()} tokens</span>
              </div>
            </div>
            
            {isOverLimit && !hasCustomKey && (
              <div className="mt-2 flex items-start gap-1 text-[10px] text-red-600 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 mt-0.5 flex-shrink-0">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span>
                  Usage exceeds free limit. To process larger texts, please add your own API key in Settings (BYOK).
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="flex items-center gap-3">
           <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors border flex-shrink-0 ${showSettings ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
            title="Advanced Settings (Models & Instructions)"
            disabled={isProcessing}
           >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
           </button>

          <button
            onClick={onStart}
            disabled={isProcessing || !isValid}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 flex-1
              ${isProcessing || !isValid
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
              }
            `}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <span>{!targetLang ? 'Select Target Language' : 'Translate'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Advanced Settings Panel */}
        {showSettings && (
          <div className="bg-slate-100/50 rounded-lg p-4 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm animate-fade-in">
            <div className="col-span-1 flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">Translation Model</label>
              <select
                value={translationModel}
                onChange={(e) => setTranslationModel(e.target.value)}
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-1.5 px-3 bg-white border"
                disabled={isProcessing}
              >
                {MODELS.map((m) => (
                   <option key={`t-model-${m.id}`} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-1 flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">Verification Model</label>
              <select
                value={verificationModel}
                onChange={(e) => setVerificationModel(e.target.value)}
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-1.5 px-3 bg-white border"
                disabled={isProcessing}
              >
                {MODELS.map((m) => (
                   <option key={`v-model-${m.id}`} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-1 sm:col-span-2 flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">Custom Instructions (Optional)</label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="E.g. Use formal business tone, avoid jargon, or translate for a technical audience..."
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 bg-white border resize-y min-h-[60px]"
                disabled={isProcessing}
              />
              <p className="text-[10px] text-slate-400">These instructions will guide the primary translation model.</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 relative">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste your text here to begin contextual translation..."
          className="w-full h-full p-6 resize-none focus:outline-none focus:ring-0 text-slate-700 leading-relaxed text-base"
          disabled={isProcessing}
        />
        <div className="absolute bottom-4 right-4 text-xs text-slate-400 pointer-events-none bg-white/80 px-2 py-1 rounded">
          {inputText.length} chars
        </div>
      </div>
    </div>
  );
};

export default InputArea;