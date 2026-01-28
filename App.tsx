import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import InputArea from './components/InputArea';
import TranslationCard from './components/TranslationCard';
import SettingsModal from './components/SettingsModal';
import { TranslationSegment, MODELS, SegmentationType } from './types';
import { splitTextIntoChunks, generateId } from './utils/textHelpers';
import { translateSegment, backTranslateSegment, evaluateTranslationSegment } from './services/geminiService';
import { downloadJSON, downloadCSV } from './utils/exportHelpers';

const App: React.FC = () => {
  // --- Persistent State Initialization ---
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');

  const [inputText, setInputText] = useState<string>(() => localStorage.getItem('inputText') || '');
  const [sourceLang, setSourceLang] = useState<string>(() => localStorage.getItem('sourceLang') || 'English');
  const [targetLang, setTargetLang] = useState<string>(() => localStorage.getItem('targetLang') || '');
  
  const [translationModel, setTranslationModel] = useState<string>(() => localStorage.getItem('translationModel') || MODELS[0].id);
  const [verificationModel, setVerificationModel] = useState<string>(() => localStorage.getItem('verificationModel') || MODELS[0].id);
  const [segmentationStrategy, setSegmentationStrategy] = useState<SegmentationType>(() => (localStorage.getItem('segmentationStrategy') as SegmentationType) || 'none');
  const [customInstructions, setCustomInstructions] = useState<string>(() => localStorage.getItem('customInstructions') || '');
  const [enableEvaluation, setEnableEvaluation] = useState<boolean>(() => localStorage.getItem('enableEvaluation') === 'true');

  const [segments, setSegments] = useState<TranslationSegment[]>(() => {
    const saved = localStorage.getItem('segments');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Runtime State ---
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  
  // Refs
  const processingRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // --- Persistence Effects ---
  useEffect(() => localStorage.setItem('gemini_api_key', apiKey), [apiKey]);
  useEffect(() => localStorage.setItem('inputText', inputText), [inputText]);
  useEffect(() => localStorage.setItem('sourceLang', sourceLang), [sourceLang]);
  useEffect(() => localStorage.setItem('targetLang', targetLang), [targetLang]);
  useEffect(() => localStorage.setItem('translationModel', translationModel), [translationModel]);
  useEffect(() => localStorage.setItem('verificationModel', verificationModel), [verificationModel]);
  useEffect(() => localStorage.setItem('segmentationStrategy', segmentationStrategy), [segmentationStrategy]);
  useEffect(() => localStorage.setItem('customInstructions', customInstructions), [customInstructions]);
  useEffect(() => localStorage.setItem('enableEvaluation', String(enableEvaluation)), [enableEvaluation]);
  useEffect(() => localStorage.setItem('segments', JSON.stringify(segments)), [segments]);

  // Scroll to bottom when new segments are added
  useEffect(() => {
    if (isProcessing && bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [segments.length, isProcessing]);


  const startTranslation = async () => {
    if (!inputText.trim()) return;

    // Clear previous if we are starting fresh (optional: could be append mode, but usually people want fresh)
    // For this app, we'll clear segments to start a new run
    setSegments([]);

    setIsProcessing(true);
    processingRef.current = true;
    
    // On mobile, auto-collapse sidebar to show results when starting
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }

    const textChunks = splitTextIntoChunks(inputText, segmentationStrategy);
    
    const initialSegments: TranslationSegment[] = textChunks.map(chunk => ({
      id: generateId(),
      original: chunk,
      translated: null,
      backTranslated: null,
      evaluation: null,
      status: 'idle'
    }));
    
    setSegments(initialSegments);

    let accumulatedTranslation = "";

    for (let i = 0; i < initialSegments.length; i++) {
      if (!processingRef.current) break;

      const segmentId = initialSegments[i].id;

      updateSegmentStatus(segmentId, 'translating');
      
      try {
        // 1. Translate
        const { text: translated, prompt } = await translateSegment(
          initialSegments[i].original,
          inputText,
          accumulatedTranslation,
          sourceLang,
          targetLang,
          translationModel,
          customInstructions,
          apiKey // Pass custom key if present
        );

        accumulatedTranslation += (accumulatedTranslation ? "\n" : "") + translated;

        updateSegment(segmentId, { 
          translated, 
          promptUsed: prompt,
          status: 'verifying' 
        });

        // 2. Back-Translate
        const backTranslated = await backTranslateSegment(
          translated,
          sourceLang,
          targetLang,
          verificationModel,
          apiKey // Pass custom key if present
        );

        updateSegment(segmentId, { backTranslated });

        // 3. Optional Evaluation
        if (enableEvaluation) {
          updateSegmentStatus(segmentId, 'evaluating');
          const evaluation = await evaluateTranslationSegment(
             initialSegments[i].original,
             translated,
             backTranslated,
             sourceLang,
             targetLang,
             inputText, // Full context
             verificationModel, // Use same model as verification for simplicity
             apiKey
          );
          updateSegment(segmentId, { evaluation, status: 'completed' });
        } else {
          updateSegmentStatus(segmentId, 'completed');
        }

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

  const clearHistory = () => {
    if(window.confirm('Are you sure you want to clear all translation results?')) {
        setSegments([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        apiKey={apiKey}
        onSaveKey={setApiKey}
      />

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
               
               enableEvaluation={enableEvaluation}
               setEnableEvaluation={setEnableEvaluation}

               onStart={startTranslation}
               isProcessing={isProcessing}
               hasCustomKey={!!apiKey}
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
            
            <div className="flex items-center gap-2">
                {segments.length > 0 && isProcessing && (
                <span className="text-xs font-medium text-indigo-600 animate-pulse bg-indigo-50 px-3 py-1 rounded-full flex items-center gap-2 mr-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                    Processing
                </span>
                )}
                
                {segments.length > 0 && (
                    <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                        <button 
                            onClick={() => downloadJSON(segments)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded transition-colors"
                            title="Export JSON"
                        >
                            <span className="text-xs font-bold font-mono">JSON</span>
                        </button>
                        <button 
                            onClick={() => downloadCSV(segments)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded transition-colors"
                            title="Export CSV"
                        >
                            <span className="text-xs font-bold font-mono">CSV</span>
                        </button>
                         <button 
                            onClick={clearHistory}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors ml-1"
                            title="Clear History"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
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