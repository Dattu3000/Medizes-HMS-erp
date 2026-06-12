import React from 'react';
import { AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

interface VendorTds {
  id: string;
  vendorName: string;
  panNumber: string;
  cumulativePayout: number;
  tdsDeducted: number;
}

const mockVendors: VendorTds[] = [
  { id: '1', vendorName: 'Dr. A. Sharma (Visiting Surgeon)', panNumber: 'ABCDE1234F', cumulativePayout: 28500, tdsDeducted: 0 },
  { id: '2', vendorName: 'MediEquip Suppliers', panNumber: 'XYZAB9876C', cumulativePayout: 145000, tdsDeducted: 14500 },
  { id: '3', vendorName: 'Dr. R. Gupta (Anesthesiologist)', panNumber: 'PQRST5678H', cumulativePayout: 12000, tdsDeducted: 0 },
  { id: '4', vendorName: 'City Path Labs', panNumber: 'LMNOP2345K', cumulativePayout: 32000, tdsDeducted: 3200 },
];

export const TdsTrackBoard: React.FC = () => {
  const THRESHOLD = 30000;

  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="w-full mx-auto p-6 bg-slate-900 text-slate-100 rounded-xl shadow-2xl border border-slate-800">
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Section 194J TDS Threshold Monitor
            <span className="text-xs font-semibold bg-violet-500/10 text-violet-400 px-2.5 py-1 rounded-full border border-violet-500/20">
              Live Tracker
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Accounts Payable dashboard tracking cumulative fiscal year payouts to independent contractors and visiting consultants.
          </p>
        </div>
        <div className="text-right bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700/60">
          <span className="text-xs text-slate-400 block uppercase font-medium tracking-wider">Statutory Limit</span>
          <span className="text-lg font-bold text-rose-400">{formatINR(THRESHOLD)}</span>
        </div>
      </div>

      <div className="space-y-6">
        {mockVendors.map((vendor) => {
          const progress = Math.min((vendor.cumulativePayout / THRESHOLD) * 100, 100);
          const isWarning = progress >= 90 && progress < 100;
          const isExceeded = vendor.cumulativePayout >= THRESHOLD;
          
          let progressColor = 'bg-emerald-500';
          if (isExceeded) progressColor = 'bg-rose-500';
          else if (isWarning) progressColor = 'bg-amber-500';

          return (
            <div key={vendor.id} className="bg-slate-800/30 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <h3 className="font-bold text-white text-lg">{vendor.vendorName}</h3>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">PAN: {vendor.panNumber}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black tracking-tight text-white">{formatINR(vendor.cumulativePayout)}</div>
                  <div className="text-xs text-slate-400 mt-0.5">YTD Payout</div>
                </div>
              </div>

              <div className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden mb-2 border border-slate-800">
                <div 
                  className={`h-full ${progressColor} transition-all duration-500`} 
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs">
                {isExceeded ? (
                  <span className="text-rose-400 font-bold flex items-center gap-1.5"><AlertTriangle size={14} /> Limit Exceeded — 10% TDS Active</span>
                ) : isWarning ? (
                  <span className="text-amber-400 font-bold flex items-center gap-1.5"><TrendingUp size={14} /> Approaching Limit — Deductions imminent</span>
                ) : (
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5"><CheckCircle2 size={14} /> Safe — Below Threshold</span>
                )}
                
                {vendor.tdsDeducted > 0 && (
                  <span className="text-slate-300 font-medium bg-slate-800 px-2 py-1 rounded">
                    TDS Deducted: <span className="text-rose-400 font-bold">{formatINR(vendor.tdsDeducted)}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
