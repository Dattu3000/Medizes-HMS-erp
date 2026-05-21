'use client';
import { MoreHorizontal } from 'lucide-react';
import { Bid } from '../page';

export default function BiddingLedger({ 
    bids, 
    selectedBid, 
    onSelectBid 
}: { 
    bids: Bid[], 
    selectedBid: Bid | null, 
    onSelectBid: (bid: Bid | null) => void 
}) {
    const getBadgeClass = (status: string) => {
        if (status === 'Safe Pass') return 'badge-safe';
        if (status === 'Overtime Risk') return 'badge-risk';
        return 'badge-block';
    };

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-xl font-bold tracking-tight mb-6">Active Shift Bidding Desk</h2>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="text-xs uppercase bg-slate-800/80 text-slate-400 border-b border-slate-700">
                        <tr>
                            <th className="px-4 py-3 rounded-tl-lg">Shift Details</th>
                            <th className="px-4 py-3">Department</th>
                            <th className="px-4 py-3">Employee Name</th>
                            <th className="px-4 py-3">AI Sanity Check Status</th>
                            <th className="px-4 py-3 rounded-tr-lg">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bids.map(bid => (
                            <tr 
                                key={bid.id} 
                                onClick={() => onSelectBid(bid)}
                                className={`border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-colors ${selectedBid?.id === bid.id ? 'bg-slate-800/70' : ''} ${bid.fadingOut ? 'row-fade-out' : ''}`}
                            >
                                <td className="px-4 py-4 font-medium">{bid.shiftDetails}</td>
                                <td className="px-4 py-4">{bid.department}</td>
                                <td className="px-4 py-4">{bid.employeeName}</td>
                                <td className="px-4 py-4">
                                    <span className={getBadgeClass(bid.status)}>{bid.status}</span>
                                </td>
                                <td className="px-4 py-4 text-slate-400 hover:text-white">
                                    <MoreHorizontal size={18} />
                                </td>
                            </tr>
                        ))}
                        {bids.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-slate-500 italic">No active bids.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
