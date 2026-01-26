import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            V
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Lingua<span className="text-indigo-600">Check</span>
          </h1>
        </div>
        <div className="text-sm text-slate-500 hidden sm:block">
          Context-Aware Translation with Verification
        </div>
      </div>
    </header>
  );
};

export default Header;