import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import InputArea from './components/InputArea';
import TranslationCard from './components/TranslationCard';
import { TranslationSegment, MODELS } from './types';
import { splitTextIntoChunks, generateId } from './utils/textHelpers';
import { translateSegment, backTranslateSegment } from './services/geminiService';

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  
  // Language State
  const [sourceLang, setSourceLang] = useState<string>('English');
  const [targetLang, setTargetLang] = useState<string>('Spanish');
  
  // Model State
  const [translationModel, setTranslationModel] = useState<string>(MODELS[0].id); // Default to Flash
  const [verificationModel, setVerificationModel] = useState<string>(MODELS[0].id); // Default to Flash
  const [customInstructions, setCustomInstructions] = useState<string>('');

  const [segments, setSegments] = useState<TranslationSegment[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Use a ref to control the cancellation or strict sequential flow if needed
  const processingRef = useRef(false);

  // Smooth scroll to new segments or updates
  const bottomRef = useRef<HTMLDivElement>(null);

  const startTranslation = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    processingRef.current = true;

    // 1. Chunk the text
    const textChunks = splitTextIntoChunks(inputText);
    
    // 2. Initialize segments
    const initialSegments: TranslationSegment[] = textChunks.map(chunk => ({
      id: generateId(),
      original: chunk,
      translated: null,
      backTranslated: null,
      status: 'idle'
    }));
    
    setSegments(initialSegments);

    // 3. Process sequentially
    for (let i = 0; i < initialSegments.length; i++) {
      if (!processingRef.current) break;

      const segmentId = initialSegments[i].id;

      // --- Start Translation ---
      updateSegmentStatus(segmentId, 'translating');
      
      try {
        const translated = await translateSegment(
          initialSegments[i].original,
          inputText, // Full context
          sourceLang,
          targetLang,
          translationModel,
          customInstructions
        );

        updateSegment(segmentId, { translated, status: 'verifying' });

        // --- Start Back-Translation ---
        const backTranslated = await backTranslateSegment(
          translated,
          sourceLang, // Back translate to source
          targetLang,  // From target
          verificationModel
        );

        updateSegment(segmentId, { backTranslated, status: 'completed' });

      } catch (error) {
        updateSegment(segmentId, { status: 'error', error: 'Failed to process segment.' });
      }
    }

    setIsProcessing(false);
    processingRef.current = false;
  };

  const updateSegmentStatus = (id: string, status: TranslationSegment['status']) => {
    setSegments(prev => prev.map(seg => seg.id === id ? { ...seg, status } : seg));
  };

  const updateSegment = (id: string, updates: Partial<TranslationSegment>) => {
    setSegments(prev => prev.map(seg => seg.id === id ? { ...seg, ...updates } : seg));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-8 grid grid-cols-1 lg:grid-cols-12 h-[calc(100vh-64px)]">
        
        {/* Left Panel: Input & Controls */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full max-h-[calc(100vh-128px)] lg:sticky lg:top-24">
           <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-sm text-indigo-800">
              <h3 className="font-semibold mb-1 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Contextual Translation
              </h3>
              <p className="opacity-90 leading-relaxed">
                We translate your text in segments while maintaining the full document context. You can now select specific models and provide style instructions.
              </p>
           </div>
           
           <InputArea 
             inputText={inputText}
             setInputText={setInputText}
             sourceLang={sourceLang}
             setSourceLang={setSourceLang}
             targetLang={targetLang}
             setTargetLang={setTargetLang}
             
             translationModel={translationModel}
             setTranslationModel={setTranslationModel}
             verificationModel={verificationModel}
             setVerificationModel={setVerificationModel}
             customInstructions={customInstructions}
             setCustomInstructions={setCustomInstructions}

             onStart={startTranslation}
             isProcessing={isProcessing}
           />
        </div>

        {/* Right Panel: Results Feed */}
        <div className="lg:col-span-8 flex flex-col gap-6 overflow-y-auto pb-20">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">
              Results 
              {segments.length > 0 && <span className="ml-2 text-sm font-normal text-slate-400">({segments.length} segments)</span>}
            </h2>
            {segments.length > 0 && isProcessing && (
               <span className="text-xs font-medium text-indigo-600 animate-pulse bg-indigo-50 px-3 py-1 rounded-full">
                 Processing...
               </span>
            )}
          </div>

          {segments.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center h-64 lg:h-auto opacity-50">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
              </div>
              <p className="text-slate-500 font-medium">Ready to translate</p>
              <p className="text-slate-400 text-sm mt-1">Translations will appear here sequentially</p>
            </div>
          ) : (
            <div className="space-y-4">
              {segments.map((segment) => (
                <TranslationCard 
                  key={segment.id} 
                  segment={segment}
                  sourceLang={sourceLang}
                  targetLang={targetLang}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;