import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Compass, Zap, User, UserCheck, Stethoscope, Briefcase, FileText } from 'lucide-react';

interface CommandItem {
  id: string;
  category: string;
  title: string;
  shortcut?: string;
  icon: any;
  action: (router: any) => void;
}

const COMMAND_ITEMS: CommandItem[] = [
  // Navigation
  { id: '1', category: 'Navigation', title: 'Go to Overview', shortcut: 'G O', icon: Compass, action: (router) => router.push('/dashboard') },
  { id: '2', category: 'Navigation', title: 'Go to Patient & OPD', shortcut: 'G P', icon: User, action: (router) => router.push('/dashboard/patients') },
  { id: '3', category: 'Navigation', title: "Go to Doctor's EHR", shortcut: 'G E', icon: Stethoscope, action: (router) => router.push('/dashboard/ehr') },
  { id: '4', category: 'Navigation', title: 'Go to Billing Desk', shortcut: 'G B', icon: Briefcase, action: (router) => router.push('/dashboard/billing') },
  { id: '5', category: 'Navigation', title: 'Go to Accounts & Ledger', shortcut: 'G L', icon: Briefcase, action: (router) => router.push('/dashboard/accounts') },
  { id: '6', category: 'Navigation', title: 'Go to Reports & Analytics', shortcut: 'G R', icon: FileText, action: (router) => router.push('/dashboard/reports') },

  // Actions
  { id: '7', category: 'Quick Actions', title: 'Record New Expense Voucher', shortcut: 'N E', icon: Zap, action: (router) => router.push('/dashboard/accounts') },
  { id: '8', category: 'Quick Actions', title: 'Run AI Financial Analysis', shortcut: 'F A', icon: Zap, action: (router) => router.push('/dashboard/accounts') },
  { id: '9', category: 'Quick Actions', title: 'View Vendor TDS Compliance', shortcut: 'V T', icon: Zap, action: (router) => router.push('/dashboard/accounts') },

  // Records Lookups
  { id: '10', category: 'Records Lookups', title: 'Dr. A. Sharma (Cardiology) - PAN: APDPA4291K', shortcut: 'L D', icon: UserCheck, action: (router) => router.push('/dashboard/hr') },
  { id: '11', category: 'Records Lookups', title: 'Sun Pharma Ltd (Vendor) - GSTIN: 27AADCS5542J', shortcut: 'L V', icon: UserCheck, action: (router) => router.push('/dashboard/accounts') },
  { id: '12', category: 'Records Lookups', title: 'Rahul Verma (Patient) - ID: PAT-1002', shortcut: 'L R', icon: User, action: (router) => router.push('/dashboard/patients') },
  { id: '13', category: 'Records Lookups', title: 'Priya Nair (Patient) - ID: PAT-1094', shortcut: 'L P', icon: User, action: (router) => router.push('/dashboard/patients') },
];

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter commands in real time based on user search string
  const filteredItems = COMMAND_ITEMS.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Global event listener to capture Cmd+K / Ctrl+K keyboard patterns
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); // Block native browser search behaviors
        setIsOpen(prev => !prev);
        setSearchQuery('');
        setSelectedIndex(0);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Set keyboard focus directly on the input field when the layout opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen]);

  // Handle accessible modal navigation via keyboard keys
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems.length > 0 && filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action(router);
        setIsOpen(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-xs">
      {/* Click-away backdrop dismiss container */}
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

      {/* Main Palette Modal Window Container */}
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-xl shadow-2xl relative overflow-hidden text-slate-100 max-h-[450px] flex flex-col z-[9999]">
        
        {/* Search Header Input Module */}
        <div className="flex items-center px-4 border-b border-slate-800 bg-slate-950/40">
          <Search className="w-5 h-5 text-slate-500 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or cross-module shortcut..."
            className="w-full bg-transparent border-0 py-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-0"
          />
          <kbd className="hidden sm:inline-block bg-slate-800 text-slate-400 text-[10px] px-1.5 py-0.5 rounded font-mono border border-slate-700 uppercase tracking-wider shadow-sm shrink-0">
            ESC
          </kbd>
        </div>

        {/* Dynamic Items Output Container */}
        <div className="overflow-y-auto flex-1 custom-scrollbar p-2">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500">
              No matching command shortcuts discovered.
            </div>
          ) : (
            Object.entries(
              filteredItems.reduce((acc, item) => {
                if (!acc[item.category]) acc[item.category] = [];
                acc[item.category].push(item);
                return acc;
              }, {} as Record<string, CommandItem[]>)
            ).map(([category, items]) => (
              <div key={category} className="mb-2">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-1.5">
                  {category}
                </h4>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const trueIndex = filteredItems.findIndex(f => f.id === item.id);
                    const isSelected = trueIndex === selectedIndex;
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.id}
                        onClick={() => { item.action(router); setIsOpen(false); }}
                        onMouseEnter={() => setSelectedIndex(trueIndex)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-indigo-600 text-white font-medium shadow-halo-indigo' 
                            : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 text-sm">
                          <Icon size={16} className={isSelected ? 'text-white' : 'text-slate-400'} />
                          <span>{item.title}</span>
                        </div>
                        {item.shortcut && (
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            isSelected ? 'bg-indigo-700 text-indigo-200' : 'bg-slate-950 text-slate-500 border border-slate-800'
                          }`}>
                            {item.shortcut}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="bg-slate-950 border-t border-slate-800/80 px-4 py-2 flex justify-between items-center text-[10px] text-slate-500 font-mono">
          <span>Use <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-400 font-mono">↑↓</kbd> to navigate, <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-400 font-mono">Enter</kbd> to execute</span>
          <span>Press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-400 font-mono">Ctrl+K</kbd> to toggle</span>
        </div>

      </div>
    </div>
  );
};
