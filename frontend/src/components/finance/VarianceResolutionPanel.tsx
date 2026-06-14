import React, { useState } from 'react';

// Define the matching types from our reconciliation research schema
interface MismatchRecord {
  id: string;
  invoice_number: string;
  supplier_name: string;
  supplier_gstin: string;
  internal_total_gst: number;
  gstr2b_total_gst: number;
  variance_total_gst: number; // Positive or negative value
}

interface PanelProps {
  mismatch: MismatchRecord;
  onResolutionSuccess: (updatedRecord: any) => void;
}

export const VarianceResolutionPanel: React.FC<PanelProps> = ({ mismatch, onResolutionSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [disputeNotes, setDisputeNotes] = useState('');
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const STATUTORY_TOLERANCE_LIMIT = 10.00;
  const absoluteVariance = Math.abs(mismatch.variance_total_gst);
  const isWithinTolerance = absoluteVariance <= STATUTORY_TOLERANCE_LIMIT;

  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(value);
  };

  // PATHWAY A: Triggers immediate low-value rounding write-off
  const handleSystemWriteOff = async () => {
    if (!isWithinTolerance) return;
    
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/v1/recon/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: mismatch.id,
          action: 'WRITE_OFF'
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Write-off execution failed.');

      onResolutionSuccess(result.data);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // PATHWAY B: Escalates to Open Dispute with Vendor
  const handleVendorDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeNotes.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/v1/recon/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: mismatch.id,
          action: 'MARK_DISPUTED',
          notes: disputeNotes
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Dispute marking failed.');

      setShowDisputeModal(false);
      setDisputeNotes('');
      onResolutionSuccess(result.data);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 text-slate-100 p-6 rounded-xl shadow-lg max-w-3xl mx-auto">
      
      {/* Target Invoice Context Header */}
      <div className="border-b border-slate-800 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
              Audit Target: {mismatch.invoice_number}
            </span>
            <h3 className="text-lg font-bold text-white mt-2">{mismatch.supplier_name}</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">GSTIN: {mismatch.supplier_gstin}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block uppercase tracking-wider font-medium">Recon Variance</span>
            <span className={`text-xl font-mono font-bold ${isWithinTolerance ? 'text-emerald-400' : 'text-rose-400'}`}>
              {mismatch.variance_total_gst > 0 ? '+' : ''}{formatINR(mismatch.variance_total_gst)}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Comparison Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Internal Ledger GST</span>
          <span className="text-lg font-semibold text-white font-mono">{formatINR(mismatch.internal_total_gst)}</span>
        </div>
        <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">GSTR-2B Portal GST</span>
          <span className="text-lg font-semibold text-white font-mono">{formatINR(mismatch.gstr2b_total_gst)}</span>
        </div>
      </div>

      {/* Dynamic Resolution Routing Alert State */}
      {isWithinTolerance ? (
        <div className="bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 p-4 rounded-lg text-xs mb-6 flex gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <span className="font-semibold block text-slate-200 mb-0.5">Statutory Tolerance Check Passed</span>
            This discrepancy is within the approved {formatINR(STATUTORY_TOLERANCE_LIMIT)} threshold. You can clear this immediately using an automated balancing write-off.
          </div>
        </div>
      ) : (
        <div className="bg-amber-950/20 border border-amber-500/20 text-amber-400 p-4 rounded-lg text-xs mb-6 flex gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <span className="font-semibold block text-slate-200 mb-0.5">High Variance Detected</span>
            This discrepancy exceeds the auto-write-off limit. System-level balancing entries are locked. You must tag this as disputed or perform a manual correction ledger booking.
          </div>
        </div>
      )}

      {/* Global Action Engine Banner */}
      {errorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-xs mb-4">
          {errorMessage}
        </div>
      )}

      <div className="flex gap-4 justify-end">
        <button
          onClick={() => setShowDisputeModal(true)}
          className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-700 hover:text-white transition-all border border-slate-700/60"
        >
          Flag Vendor Dispute
        </button>

        <button
          onClick={handleSystemWriteOff}
          disabled={!isWithinTolerance || isSubmitting}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            isWithinTolerance
              ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-950/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800/50'
          }`}
        >
          {isSubmitting ? 'Processing...' : 'One-Click Auto Write-Off'}
        </button>
      </div>

      {/* VENDOR DISPUTE MODAL BLOCK */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl text-slate-100">
            <h4 className="text-lg font-bold text-white mb-2">Escalate Dispute Context</h4>
            <p className="text-xs text-slate-400 mb-4">
              Flagging this row locks out active tax claims and queues the entry for automated vendor audit notifications.
            </p>

            <form onSubmit={handleVendorDisputeSubmit}>
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                  Internal Auditor Comments & Context
                </label>
                <textarea
                  required
                  rows={4}
                  value={disputeNotes}
                  onChange={(e) => setDisputeNotes(e.target.value)}
                  placeholder="e.g., Vendor missed filing matching GSTR-1 credit note for batch returns..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-hidden focus:border-indigo-500 placeholder:text-slate-600 font-sans resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowDisputeModal(false); setErrorMessage(null); }}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-800 text-slate-300 rounded-md hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Locking...' : 'Confirm Escalation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
