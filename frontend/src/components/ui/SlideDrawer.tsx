import React, { useEffect } from 'react';

interface SlideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const SlideDrawer: React.FC<SlideDrawerProps> = ({ isOpen, onClose, title, children }) => {
  // Escape key closer hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Dimmed backdrop blur overlay */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* The Animated Drawer Surface */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-out p-6 text-slate-100 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Drawer Header Panel */}
        <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scalable Container Body */}
        <div className="h-[calc(100%-5rem)] overflow-y-auto pr-2 custom-scrollbar">
          {children}
        </div>
      </div>
    </>
  );
};
