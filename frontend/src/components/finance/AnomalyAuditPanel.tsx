import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, Info, Send, Check, MessageSquare } from 'lucide-react';
import { SlideDrawer } from '../ui/SlideDrawer';

interface AuditRow {
  id: string;
  invoiceNo: string;
  vendorName: string;
  prAmount: number;
  gstr2bAmount: number;
  variance: number;
  category: string;
}

const mockAuditData: AuditRow[] = [
  { id: '1', invoiceNo: 'INV-2026-001', vendorName: 'MediEquip Suppliers', prAmount: 50000, gstr2bAmount: 50000, variance: 0, category: 'EXACT_MATCH' },
  { id: '2', invoiceNo: 'PHRM-4421', vendorName: 'Sun Pharma Ltd', prAmount: 120500.50, gstr2bAmount: 120000.00, variance: 500.50, category: 'PARTIAL_MATCH_TAX_MISMATCH' },
  { id: '3', invoiceNo: 'SRV-998', vendorName: 'City Path Labs', prAmount: 32000, gstr2bAmount: 0, variance: 32000, category: 'PR_ONLY_MISSING_IN_2B' },
  { id: '4', invoiceNo: 'INV-2026-089', vendorName: 'CleanCo Services', prAmount: 15000.00, gstr2bAmount: 15000.75, variance: -0.75, category: 'EXACT_MATCH' },
  { id: '5', invoiceNo: 'DOC-5542', vendorName: 'Dr. A. Sharma', prAmount: 0, gstr2bAmount: 28500, variance: -28500, category: 'GSTR2B_ONLY_MISSING_IN_PR' },
];

export const AnomalyAuditPanel: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'ANOMALIES'>('ANOMALIES');
  const [density, setDensity] = useState<'COMPACT' | 'SPACIOUS'>('SPACIOUS');
  
  // Slide Drawer states
  const [selectedRow, setSelectedRow] = useState<AuditRow | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState<string | null>(null);

  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
  };

  const filteredData = mockAuditData.filter(row => {
    if (filter === 'ALL') return true;
    return Math.abs(row.variance) > 1.00;
  });

  const handleRowClick = (row: AuditRow) => {
    setSelectedRow(row);
    setNotes('');
    setResolutionStatus(null);
    setIsDrawerOpen(true);
  };

  const handleResolve = () => {
    setResolutionStatus('RECONCILED');
  };

  const handleEscalate = () => {
    setResolutionStatus('ESCALATED');
  };

  // Density padding classes
  const headerPadding = density === 'COMPACT' ? 'p-2 text-xs' : 'p-4 text-sm';
  const rowPadding = density === 'COMPACT' ? 'py-1.5 px-3 text-xs' : 'py-3.5 px-4 text-sm';

  return (
    <div className="w-full mx-auto p-6 bg-slate-900 text-slate-100 rounded-xl shadow-2xl border border-slate-800">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Automated Anomaly Audit
            <span className="text-xs font-semibold bg-rose-500/10 text-rose-400 px-2.5 py-1 rounded-full border border-rose-500/20">
              Last Scan: 01:00 AM
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Reconciliation between internal Purchase Register (PR) and government GSTR-2B.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Density Selector */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-1 flex">
            <button 
              onClick={() => setDensity('COMPACT')}
              className={`px-3 py-1 rounded text-[10px] font-black tracking-wide uppercase transition ${density === 'COMPACT' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Compact
            </button>
            <button 
              onClick={() => setDensity('SPACIOUS')}
              className={`px-3 py-1 rounded text-[10px] font-black tracking-wide uppercase transition ${density === 'SPACIOUS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Spacious
            </button>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setFilter('ALL')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${filter === 'ALL' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              All Records
            </button>
            <button 
              onClick={() => setFilter('ANOMALIES')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${filter === 'ANOMALIES' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-rose-400 hover:bg-rose-900/30'}`}
            >
              <AlertTriangle size={14} /> Critical Variances
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className={`${headerPadding} text-left font-semibold`}>Invoice No.</th>
              <th className={`${headerPadding} text-left font-semibold`}>Vendor</th>
              <th className={`${headerPadding} text-right font-semibold`}>PR Amount</th>
              <th className={`${headerPadding} text-right font-semibold`}>GSTR-2B Amount</th>
              <th className={`${headerPadding} text-right font-semibold`}>Variance</th>
              <th className={`${headerPadding} text-left font-semibold`}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900">
            {filteredData.map(row => {
              const isCritical = Math.abs(row.variance) > 1.00;
              return (
                <tr 
                  key={row.id} 
                  onClick={() => handleRowClick(row)}
                  className={`hover:bg-slate-800/80 transition cursor-pointer select-none ${isCritical ? 'bg-rose-950/10' : ''}`}
                >
                  <td className={`${rowPadding} font-mono text-slate-300`}>{row.invoiceNo}</td>
                  <td className={`${rowPadding} text-slate-300 font-medium`}>{row.vendorName}</td>
                  <td className={`${rowPadding} text-right text-slate-300`}>{formatINR(row.prAmount)}</td>
                  <td className={`${rowPadding} text-right text-slate-300`}>{formatINR(row.gstr2bAmount)}</td>
                  <td className={`${rowPadding} text-right font-mono font-bold ${isCritical ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {formatINR(row.variance)}
                  </td>
                  <td className={rowPadding}>
                    {isCritical ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
                        <XCircle size={13} /> {row.category.replace(/_/g, ' ')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 size={13} /> MATCHED
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No records found matching the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Slide Drawer for Anomaly Resolution */}
      {selectedRow && (
        <SlideDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title={`Audit Invoice: ${selectedRow.invoiceNo}`}
        >
          <div className="space-y-6">
            {/* Context Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Vendor Account</div>
                  <div className="text-sm font-bold text-white mt-0.5">{selectedRow.vendorName}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  Math.abs(selectedRow.variance) > 1.00 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {selectedRow.category.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Purchase Register (PR)</span>
                  <div className="text-base font-black text-white mt-1">{formatINR(selectedRow.prAmount)}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">GSTR-2B Statement</span>
                  <div className="text-base font-black text-white mt-1">{formatINR(selectedRow.gstr2bAmount)}</div>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-4 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5"><AlertTriangle size={14} className="text-amber-400" /> Current Discrepancy</span>
                <span className="text-lg font-black text-rose-400 font-mono">{formatINR(selectedRow.variance)}</span>
              </div>
            </div>

            {/* Resolution Form */}
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5 space-y-4">
              <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-2"><MessageSquare size={13} className="text-indigo-400" /> Reconciliation Audit Trail</h4>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-500">Auditor Notes</label>
                <textarea 
                  rows={4} 
                  placeholder="Enter invoice dispute details, communications with vendor, or verification reference..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-700 focus:ring-0"
                />
              </div>

              {/* Status display */}
              {resolutionStatus && (
                <div className={`p-4 rounded-lg flex items-center gap-2 text-xs font-bold ${
                  resolutionStatus === 'RECONCILED' ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-600/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {resolutionStatus === 'RECONCILED' ? <Check size={16} /> : <Send size={16} />}
                  {resolutionStatus === 'RECONCILED' ? 'Variance Resolved & Verified' : 'GST Dispute Escalated to Vendor'}
                </div>
              )}

              {/* Actions Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleResolve}
                  disabled={!!resolutionStatus}
                  className="bg-emerald-600 text-white font-bold rounded-lg px-4 py-2.5 text-xs hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check size={14} /> Accept & Resolve
                </button>
                <button
                  onClick={handleEscalate}
                  disabled={!!resolutionStatus}
                  className="bg-indigo-600 text-white font-bold rounded-lg px-4 py-2.5 text-xs hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send size={14} /> Escalate Mismatch
                </button>
              </div>
            </div>

            {/* Informational Guidance */}
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex gap-3 items-start">
              <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
              <div className="text-[10px] text-slate-400 leading-relaxed">
                Accepting and resolving writes the variance as a recognized direct tax adjustment in GSTR-3B filings. Escalations compose an automated query alert directly inside the vendor's MEDISYS vendor dashboard system.
              </div>
            </div>
          </div>
        </SlideDrawer>
      )}
    </div>
  );
};
