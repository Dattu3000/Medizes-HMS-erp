import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Compass, Zap, User, UserCheck, Stethoscope, Briefcase, FileText } from 'lucide-react';

interface CommandItem {
  id: string;
  name: string;
  category: string;
  icon: any;
  action: (router: any) => void;
}

const COMMANDS: CommandItem[] = [
  // Navigation
  { id: 'nav-overview', name: 'Go to Overview', category: 'Navigation', icon: Compass, action: (router) => router.push('/dashboard') },
  { id: 'nav-patients', name: 'Go to Patient & OPD', category: 'Navigation', icon: User, action: (router) => router.push('/dashboard/patients') },
  { id: 'nav-ehr', name: 'Go to Doctor\'s EHR', category: 'Navigation', icon: Stethoscope, action: (router) => router.push('/dashboard/ehr') },
  { id: 'nav-billing', name: 'Go to Billing Desk', category: 'Navigation', icon: Briefcase, action: (router) => router.push('/dashboard/billing') },
  { id: 'nav-accounts', name: 'Go to Accounts & Ledger', category: 'Navigation', icon: Briefcase, action: (router) => router.push('/dashboard/accounts') },
  { id: 'nav-reports', name: 'Go to Reports & Analytics', category: 'Navigation', icon: FileText, action: (router) => router.push('/dashboard/reports') },
  
  // Actions
  { id: 'action-expense', name: 'Record New Expense Voucher', category: 'Quick Actions', icon: Zap, action: (router) => router.push('/dashboard/accounts') },
  { id: 'action-ai', name: 'Run AI Financial Analysis', category: 'Quick Actions', icon: Zap, action: (router) => router.push('/dashboard/accounts') },
  { id: 'action-tds', name: 'View Vendor TDS Compliance', category: 'Quick Actions', icon: Zap, action: (router) => router.push('/dashboard/accounts') },
  
  // Mock records Lookups
  { id: 'search-dr-sharma', name: 'Dr. A. Sharma (Cardiology) - PAN: APDPA4291K', category: 'Records Lookups', icon: UserCheck, action: (router) => router.push('/dashboard/hr') },
  { id: 'search-sun-pharma', name: 'Sun Pharma Ltd (Vendor) - GSTIN: 27AADCS5542J', category: 'Records Lookups', icon: UserCheck, action: (router) => router.push('/dashboard/accounts') },
  { id: 'search-rahul-verma', name: 'Rahul Verma (Patient) - ID: PAT-1002', category: 'Records Lookups', icon: User, action: (router) => router.push('/dashboard/patients') },
  { id: 'search-priya-nair', name: 'Priya Nair (Patient) - ID: PAT-1094', category: 'Records Lookups', icon: User, action: (router) => router.push('/dashboard/patients') },
];

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle Command Palette on Ctrl + K or Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((open) => !open);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredCommands = COMMANDS.filter((cmd) =>
    cmd.name.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  // Handle Keyboard Arrow Navigation & Selection
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action(router);
        setIsOpen(false);
      }
    }
  };

  if (!isOpen) return null;

  // Group commands by category for display
  const categories = Array.from(new Set(filteredCommands.map((c) => c.category)));

  return (
    <>
      {/* Dimmed backdrop blur */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] transition-opacity duration-200"
        onClick={() => setIsOpen(false)}
      />

      {/* Command Palette dialog */}
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-[9999] overflow-hidden text-slate-100 flex flex-col max-h-[450px]">
        {/* Search Input bar */}
        <div className="flex items-center px-4 border-b border-slate-800 bg-slate-950/40">
          <Search size={18} className="text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or lookup record... (Esc to close)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-0 py-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-0"
          />
        </div>

        {/* Commands Results list */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No matches found. Try searching pages or codes.</div>
          ) : (
            categories.map((cat) => {
              const catCmds = filteredCommands.filter((c) => c.category === cat);
              return (
                <div key={cat} className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-3 py-1.5">{cat}</div>
                  {catCmds.map((cmd) => {
                    const globalIdx = filteredCommands.indexOf(cmd);
                    const isSelected = globalIdx === selectedIndex;
                    const Icon = cmd.icon;
                    return (
                      <div
                        key={cmd.id}
                        onClick={() => {
                          cmd.action(router);
                          setIsOpen(false);
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition ${
                          isSelected ? 'bg-indigo-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={16} className={isSelected ? 'text-white' : 'text-slate-400'} />
                          <span className="text-xs">{cmd.name}</span>
                        </div>
                        {isSelected && <span className="text-[10px] font-bold bg-indigo-500 px-2 py-0.5 rounded uppercase tracking-wider">Run</span>}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Palette Footer help */}
        <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between items-center shrink-0">
          <span>Use <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-400 font-mono">↑↓</kbd> to navigate, <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-400 font-mono">Enter</kbd> to select</span>
          <span>Press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-400 font-mono">Ctrl+K</kbd> to toggle</span>
        </div>
      </div>
    </>
  );
};
