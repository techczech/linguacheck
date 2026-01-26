import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import InputArea from './components/InputArea';
import TranslationCard from './components/TranslationCard';
import { TranslationSegment, MODELS, SegmentationType } from './types';
import { splitTextIntoChunks, generateId } from './utils/textHelpers';
import { translateSegment, backTranslateSegment } from './services/geminiService';

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  
  // Language State
  const [sourceLang, setSourceLang] = useState<string>('English');
  const [targetLang, setTargetLang] = useState<string>('');
  
  // Model State
  const [translationModel, setTranslationModel] = useState<string>(MODELS[0].id); // Default to Flash
  const [verificationModel, setVerificationModel] = useState<string>(MODELS[0].id); // Default to Flash
  const [segmentationStrategy, setSegmentationStrategy] = useState<SegmentationType>('paragraphs');
  const [customInstructions, setCustomInstructions] = useState<string>('');

  const [segments, setSegments] = useState<TranslationSegment[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  
  // Use a ref to control the cancellation or strict sequential flow if needed
  const processingRef = useRef(false);

  // Smooth scroll to new segments or updates
  const bottomRef = useRef<HTMLDivElement>(null);

  const startTranslation = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    processingRef.current = true;
    
    // On mobile, auto-collapse sidebar to show results when starting
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }

    // 1. Chunk the text based on selected strategy
    const textChunks = splitTextIntoChunks(inputText, segmentationStrategy);
    
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
        const { text: translated, prompt } = await translateSegment(
          initialSegments[i].original,
          inputText, // Full context
          sourceLang,
          targetLang,
          translationModel,
          customInstructions
        );

        updateSegment(segmentId, { 
          translated, 
          promptUsed: prompt, // Store the prompt for transparency
          status: 'verifying' 
        });

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
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6 flex flex-col lg:flex-row h-[calc(100vh-64px)] items-start">
        
        {/* Left Panel: Input & Controls (Collapsible) */}
        <div className={`
          flex-col gap-6 h-full transition-all duration-300 ease-in-out flex-shrink-0
          ${isSidebarOpen ? 'flex w-full lg:w-96 xl:w-[28rem] opacity-100' : 'hidden lg:flex lg:w-0 lg:opacity-0 lg:overflow-hidden lg:p-0'}
        `}>
           <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-sm text-indigo-800 lg:min-w-[20rem]">
              <h3 className="font-semibold mb-1 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Contextual Translation
              </h3>
              <p className="opacity-90 leading-relaxed">
                We translate your text in segments while maintaining the full document context.
              </p>
           </div>
           
           <div className="lg:min-w-[20rem] flex-1 min-h-0">
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
               segmentationStrategy={segmentationStrategy}
               setSegmentationStrategy={setSegmentationStrategy}
               customInstructions={customInstructions}
               setCustomInstructions={setCustomInstructions}

               onStart={startTranslation}
               isProcessing={isProcessing}
             />
           </div>
        </div>

        {/* Right Panel: Results Feed */}
        <div className="flex-1 flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-w-0">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                {isSidebarOpen ? (
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
                    </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                )}
              </button>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Results 
                {segments.length > 0 && <span className="text-sm font-normal text-slate-400">({segments.length} segments)</span>}
              </h2>
            </div>

            {segments.length > 0 && isProcessing && (
               <span className="text-xs font-medium text-indigo-600 animate-pulse bg-indigo-50 px-3 py-1 rounded-full flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                 Processing
               </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth">
            {segments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-xl p-12 text-center opacity-60">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                </div>
                <p className="text-slate-500 font-medium">Ready to translate</p>
                <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">Enter text in the sidebar to begin the contextual translation process.</p>
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl mx-auto">
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
        </div>
      </main>
    </div>
  );
};

export default App;