import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Search, XCircle } from 'lucide-react';

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
  { id: '4', invoiceNo: 'INV-2026-089', vendorName: 'CleanCo Services', prAmount: 15000.00, gstr2bAmount: 15000.75, variance: -0.75, category: 'EXACT_MATCH' }, // Variance < 1.00 is fine
  { id: '5', invoiceNo: 'DOC-5542', vendorName: 'Dr. A. Sharma', prAmount: 0, gstr2bAmount: 28500, variance: -28500, category: 'GSTR2B_ONLY_MISSING_IN_PR' },
];

export const AnomalyAuditPanel: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'ANOMALIES'>('ANOMALIES');

  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
  };

  const filteredData = mockAuditData.filter(row => {
    if (filter === 'ALL') return true;
    return Math.abs(row.variance) > 1.00;
  });

  return (
    <div className="w-full mx-auto p-6 bg-slate-900 text-slate-100 rounded-xl shadow-2xl border border-slate-800">
      <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-5">
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

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-950 text-slate-400">
            <tr>
              <th className="p-4 text-left font-semibold">Invoice No.</th>
              <th className="p-4 text-left font-semibold">Vendor</th>
              <th className="p-4 text-right font-semibold">PR Amount</th>
              <th className="p-4 text-right font-semibold">GSTR-2B Amount</th>
              <th className="p-4 text-right font-semibold">Variance</th>
              <th className="p-4 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900">
            {filteredData.map(row => {
              const isCritical = Math.abs(row.variance) > 1.00;
              return (
                <tr key={row.id} className={`hover:bg-slate-800/50 transition ${isCritical ? 'bg-rose-950/10' : ''}`}>
                  <td className="p-4 font-mono text-slate-300">{row.invoiceNo}</td>
                  <td className="p-4 text-slate-300 font-medium">{row.vendorName}</td>
                  <td className="p-4 text-right text-slate-300">{formatINR(row.prAmount)}</td>
                  <td className="p-4 text-right text-slate-300">{formatINR(row.gstr2bAmount)}</td>
                  <td className={`p-4 text-right font-mono font-bold ${isCritical ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {formatINR(row.variance)}
                  </td>
                  <td className="p-4">
                    {isCritical ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
                        <XCircle size={14} /> {row.category.replace(/_/g, ' ')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 size={14} /> MATCHED
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
    </div>
  );
};
