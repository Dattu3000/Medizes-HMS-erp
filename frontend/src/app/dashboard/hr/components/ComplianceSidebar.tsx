'use client';
import { useState } from 'react';
import { Bid } from '../page';
import { API_BASE } from '@/lib/api';

export default function ComplianceSidebar({ selectedBid, onAction }: { selectedBid: Bid | null, onAction: (bidId: string, url: string, payload: any) => void }) {
    const [justification, setJustification] = useState('');
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    if (!selectedBid) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <p>Select a bid to view compliance details.</p>
            </div>
        );
    }

    const handleActionClick = (e: React.MouseEvent) => {
        if (selectedBid.status === 'Overtime Risk') {
            setIsPopoverOpen(true);
        } else if (selectedBid.status === 'Safe Pass') {
            onAction(selectedBid.id, `${API_BASE}/api/hr/shifts/swap-request`, { shiftSlotId: 'dummy-slot', biddingStaffId: selectedBid.employeeId });
        }
    };

    const submitOverride = () => {
        if (!justification) return;
        onAction(selectedBid.id, `${API_BASE}/api/hr/shifts/approve-override`, {
            bidId: selectedBid.id,
            action: 'OVERRULED',
            justification
        });
        setIsPopoverOpen(false);
        setJustification('');
    };

    return (
        <div className="flex flex-col h-full relative">
            <h2 className="text-xl font-bold tracking-tight mb-6">Safety Guard</h2>

            <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-5 mb-6">
                <h3 className="text-sm uppercase text-slate-400 font-bold mb-2">Selected Request</h3>
                <p className="text-lg font-semibold text-white mb-1">{selectedBid.employeeName}</p>
                <p className="text-sm text-slate-300">{selectedBid.department} • {selectedBid.shiftDetails}</p>
                
                <div className="mt-4 pt-4 border-t border-slate-700">
                    <h3 className="text-sm uppercase text-slate-400 font-bold mb-2">Compliance Status</h3>
                    {selectedBid.status === 'Safe Pass' && <p className="text-emerald-400 text-sm">✓ All Fair Workweek rules passed.</p>}
                    {selectedBid.status === 'Overtime Risk' && <p className="text-amber-400 text-sm">⚠ Projects &gt;48 hours/week.</p>}
                    {selectedBid.status === 'Hard Block' && <p className="text-red-400 text-sm">✕ Minimum 11-hour rest violation.</p>}
                </div>
            </div>

            <div className="mt-auto pb-4 relative">
                {selectedBid.status === 'Safe Pass' && (
                    <button 
                        onClick={handleActionClick}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-semibold transition"
                    >
                        Approve Standard Assignment
                    </button>
                )}
                
                {selectedBid.status === 'Hard Block' && (
                    <button 
                        disabled
                        className="w-full bg-slate-700 text-slate-400 py-3 rounded-lg font-semibold cursor-not-allowed"
                    >
                        Disabled / Compliance Violation
                    </button>
                )}

                {selectedBid.status === 'Overtime Risk' && (
                    <button 
                        onClick={handleActionClick}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-semibold transition"
                    >
                        Review Overtime Override
                    </button>
                )}

                {/* Inline Justification Popover */}
                {isPopoverOpen && selectedBid.status === 'Overtime Risk' && (
                    <div className="absolute bottom-full left-0 w-full mb-2 bg-slate-800 border border-slate-600 p-4 rounded-xl shadow-2xl z-10 animate-in fade-in slide-in-from-bottom-2">
                        <h4 className="text-sm font-bold text-white mb-2">Override Justification</h4>
                        <textarea 
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white mb-3 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            placeholder="Mandatory justification (e.g., Severe seasonal volume spike...)"
                            rows={3}
                            value={justification}
                            onChange={e => setJustification(e.target.value)}
                        />
                        <div className="flex gap-2 justify-end">
                            <button 
                                onClick={() => setIsPopoverOpen(false)}
                                className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded text-white transition"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={submitOverride}
                                disabled={!justification}
                                className="px-3 py-1.5 text-sm bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white transition"
                            >
                                Force Approve
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
