import React, { useState } from 'react';
import { TranslationSegment } from '../types';

interface TranslationCardProps {
  segment: TranslationSegment;
  sourceLang: string;
  targetLang: string;
}

const TranslationCard: React.FC<TranslationCardProps> = ({ segment, sourceLang, targetLang }) => {
  const [showPrompt, setShowPrompt] = useState(false);

  const isPending = segment.status === 'idle';
  const isTranslating = segment.status === 'translating';
  const isVerifying = segment.status === 'verifying';
  const isEvaluating = segment.status === 'evaluating';
  const isCompleted = segment.status === 'completed';
  const isError = segment.status === 'error';

  return (
    <div className={`
      relative rounded-xl border transition-all duration-500 overflow-hidden flex flex-col
      ${isPending ? 'border-slate-100 bg-slate-50 opacity-60' : 'border-slate-200 bg-white shadow-sm hover:shadow-md'}
      ${(isTranslating || isVerifying || isEvaluating) ? 'ring-2 ring-indigo-100 border-indigo-200' : ''}
    `}>
      {/* Status Bar */}
      {(isTranslating || isVerifying || isEvaluating) && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-50">
          <div 
            className="h-full bg-indigo-500 animate-loading-bar rounded-r-full"
            style={{ width: isTranslating ? '30%' : isVerifying ? '60%' : '90%' }}
          ></div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 flex-1">
        
        {/* Source Text */}
        <div className="p-5 flex flex-col gap-2 relative group">
          <div className="flex items-center justify-between mb-1">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              {sourceLang} (Original)
            </span>
            
            {/* Info/Prompt Toggle Button */}
            {segment.promptUsed && (
               <button 
                onClick={() => setShowPrompt(!showPrompt)}
                className={`p-1 rounded hover:bg-slate-100 transition-colors ${showPrompt ? 'text-indigo-600 bg-indigo-50' : 'text-slate-300 hover:text-indigo-600'}`}
                title="View Contextual Prompt Used"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
               </button>
            )}
          </div>
         
          <p className="text-slate-800 leading-relaxed text-sm whitespace-pre-wrap">
            {segment.original}
          </p>
        </div>

        {/* Translated Text */}
        <div className="p-5 flex flex-col gap-2 bg-indigo-50/10">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-2">
            {targetLang}
            {isTranslating && <span className="text-indigo-600 animate-pulse text-[10px] lowercase bg-indigo-100 px-1.5 py-0.5 rounded-full">translating...</span>}
          </span>
          {segment.translated ? (
            <p className="text-slate-800 leading-relaxed text-sm whitespace-pre-wrap font-medium">
              {segment.translated}
            </p>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-300 text-sm italic min-h-[60px]">
              {isTranslating ? 'Generating translation...' : 'Waiting to start...'}
            </div>
          )}
        </div>

        {/* Back Translation */}
        <div className="p-5 flex flex-col gap-2 bg-slate-50/50">
          <span className="text-xs font-bold text-emerald-600/70 uppercase tracking-wider mb-1 flex items-center gap-2">
            Verification ({sourceLang})
             {isVerifying && <span className="text-emerald-600 animate-pulse text-[10px] lowercase bg-emerald-100 px-1.5 py-0.5 rounded-full">verifying...</span>}
          </span>
          {segment.backTranslated ? (
            <div className="flex flex-col gap-2">
               <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
                {segment.backTranslated}
              </p>
              {isCompleted && !segment.evaluation && (
                 <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-emerald-500">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    Compare this to the original
                 </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-300 text-sm italic min-h-[60px]">
               {isVerifying ? 'Verifying accuracy...' : 'Waiting for translation...'}
            </div>
          )}
        </div>
      </div>

      {/* Evaluation Section */}
      {(segment.evaluation || isEvaluating) && (
        <div className="border-t border-amber-100 bg-amber-50/50 p-4">
           <div className="flex items-center gap-2 mb-2">
             <span className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
               Quality Evaluation
             </span>
             {isEvaluating && <span className="text-amber-600 animate-pulse text-[10px] lowercase bg-amber-100 px-1.5 py-0.5 rounded-full">analyzing...</span>}
           </div>
           
           {segment.evaluation ? (
              <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap pl-5 border-l-2 border-amber-200">
                {segment.evaluation}
              </div>
           ) : (
             <div className="text-amber-400 text-sm italic pl-5">
               Reviewing original, translation, and back-translation for quality issues...
             </div>
           )}
        </div>
      )}
      
      {/* Prompt Debug View (Collapsible) */}
      {showPrompt && segment.promptUsed && (
        <div className="border-t border-slate-200 bg-slate-100 p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
             <h4 className="text-xs font-bold text-slate-500 uppercase">Contextual Prompt Sent to AI</h4>
             <button onClick={() => setShowPrompt(false)} className="text-slate-400 hover:text-slate-600">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
             </button>
          </div>
          <div className="bg-slate-800 text-slate-200 p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-60 scrollbar-thin">
            <pre className="whitespace-pre-wrap">{segment.promptUsed}</pre>
          </div>
          <div className="mt-2 text-[10px] text-slate-500">
            This exact prompt was used to generate the translation for this segment, ensuring the model had the full document context.
          </div>
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border-t border-red-100 p-3 text-red-600 text-xs flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          {segment.error || "An error occurred during processing."}
        </div>
      )}
    </div>
  );
};

export default TranslationCard;