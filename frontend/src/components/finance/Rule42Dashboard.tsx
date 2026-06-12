import React, { useState } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

// Strict typing for our financial ledger datasets
interface MonthlyRule42Data {
  month: string;
  totalITC_T: number;        // T: Total Input Tax Credit received
  exemptRevenue_E: number;   // E: Value of exempt healthcare services
  totalTurnover_F: number;   // F: Total turnover of the hospital unit
  commonCredit_C2: number;   // C2: Common credit pool (shared assets/ops)
  reversedCredit_D1: number; // D1: Ineligible credit calculated: (E/F) * C2
}

// Realistic 2026 financial records for a multi-specialty hospital unit (Amounts in INR)
const mockFinancialData: MonthlyRule42Data[] = [
  { month: 'Jan 2026', totalITC_T: 450000, exemptRevenue_E: 3200000, totalTurnover_F: 4800000, commonCredit_C2: 120000, reversedCredit_D1: 80000 },
  { month: 'Feb 2026', totalITC_T: 480000, exemptRevenue_E: 3500000, totalTurnover_F: 5000000, commonCredit_C2: 130000, reversedCredit_D1: 91000 },
  { month: 'Mar 2026', totalITC_T: 620000, exemptRevenue_E: 4100000, totalTurnover_F: 5200000, commonCredit_C2: 180000, reversedCredit_D1: 141923 },
  { month: 'Apr 2026', totalITC_T: 410000, exemptRevenue_E: 2900000, totalTurnover_F: 4600000, commonCredit_C2: 110000, reversedCredit_D1: 69347 },
  { month: 'May 2026', totalITC_T: 530000, exemptRevenue_E: 3800000, totalTurnover_F: 5800000, commonCredit_C2: 140000, reversedCredit_D1: 91724 },
];

export const Rule42Dashboard: React.FC = () => {
  // Setup active interactive state tracking back to the chart clicks
  const [activeIndex, setActiveIndex] = useState<number>(4); // Default to latest month (May)
  const activeData = mockFinancialData[activeIndex];

  // Helper formatting for clean Indian Currency representations
  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const exemptRatio = ((activeData.exemptRevenue_E / activeData.totalTurnover_F) * 100).toFixed(1);

  return (
    <div className="w-full mx-auto p-6 bg-slate-900 text-slate-100 rounded-xl shadow-2xl border border-slate-800">
      
      {/* Header Layout */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-800 pb-5 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Rule 42 ITC Apportionment Engine
            <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20">
              CGST Compliance Live
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time visualization of proportional credit reversals for hybrid corporate healthcare structures.
          </p>
        </div>
        <div className="text-right bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700/60">
          <span className="text-xs text-slate-400 block uppercase font-medium tracking-wider">Active Reconciliation Audit</span>
          <span className="text-lg font-bold text-indigo-400">{activeData.month}</span>
        </div>
      </div>

      {/* Interactive Metric Summary Cards Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        
        {/* Total ITC Card (T) */}
        <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all duration-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-400">Total Input Tax Credit (T)</span>
            <span className="text-xs font-mono bg-slate-700 px-2 py-0.5 rounded text-slate-300">GSTR-2B</span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatINR(activeData.totalITC_T)}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Aggregate pool of all monthly incoming vendor tax streams captured.
          </p>
        </div>

        {/* Common Pool Credit Card (C2) */}
        <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all duration-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-400">Common Pool Credit (C₂)</span>
            <span className="text-xs font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">Shared Ops</span>
          </div>
          <div className="text-2xl font-bold text-indigo-400 tracking-tight">
            {formatINR(activeData.commonCredit_C2)}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Tax paid on shared corporate inputs (e.g., Centralized Tech Infrastructure, Admin Utilities).
          </p>
        </div>

        {/* Reversal Liability Card (D1) */}
        <div className="bg-amber-950/20 p-5 rounded-xl border border-amber-500/20 shadow-lg shadow-amber-950/10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-amber-400">Ineligible Reversal (D₁)</span>
            <span className="text-xs font-semibold bg-amber-500 text-amber-950 px-2 py-0.5 rounded">To Reverse</span>
          </div>
          <div className="text-2xl font-bold text-amber-500 tracking-tight">
            {formatINR(activeData.reversedCredit_D1)}
          </div>
          <div className="text-xs text-amber-400/70 mt-2 flex justify-between items-center">
            <span>Formula Liability: (E/F) × C₂</span>
            <span className="font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded">{exemptRatio}% Ratio</span>
          </div>
        </div>

      </div>

      {/* Main Interactive Recharts Interface Container */}
      <div className="bg-slate-800/20 p-5 rounded-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
          <div>
            <h3 className="text-lg font-semibold text-white">Monthly Performance & Ratio Trends</h3>
            <p className="text-xs text-slate-400">Click a specific month column below to update target calculations above.</p>
          </div>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-slate-700 rounded-sm" /> <span className="text-slate-400">Total Turnover (F)</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-indigo-500 rounded-sm" /> <span className="text-slate-400">Exempt Revenue (E)</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3.5 h-0.5 bg-amber-500" /> <span className="text-slate-400">D₁ Reversal</span></div>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={mockFinancialData}
              onClick={(state: any) => {
                if (state && state.activeTooltipIndex !== undefined && state.activeTooltipIndex !== null) {
                  setActiveIndex(Number(state.activeTooltipIndex));
                }
              }}
              margin={{ top: 10, right: -5, left: -10, bottom: 0 }}
            >
              <CartesianGrid stroke="#1e293b" strokeDasharray="4 4" vertical={false} />
              <XAxis 
                dataKey="month" 
                stroke="#64748b" 
                tickLine={false}
                dy={10}
                style={{ fontSize: '12px', fontFamily: 'monospace' }}
              />
              <YAxis 
                yAxisId="left"
                stroke="#64748b" 
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 100000).toFixed(1)}L`}
                style={{ fontSize: '11px' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#d97706" 
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                style={{ fontSize: '11px' }}
              />
              <Tooltip 
                cursor={{ fill: '#334155', opacity: 0.15 }}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                itemStyle={{ fontSize: '13px' }}
                formatter={(value: any, name: any) => [formatINR(Number(value)), String(name).replace(/_/g, ' ')]}
              />
              
              {/* Primary Bar: Total Revenue Allocation (F) */}
              <Bar yAxisId="left" dataKey="totalTurnover_F" fill="#334155" radius={[4, 4, 0, 0]} maxBarSize={45}>
                {mockFinancialData.map((entry, index) => (
                  <Cell 
                    key={`cell-f-${index}`} 
                    fill={index === activeIndex ? '#475569' : '#1e293b'} 
                    className="transition-all duration-200 cursor-pointer"
                  />
                ))}
              </Bar>

              {/* Stacked/Overlapping Bar: Exempt Medical Fees (E) */}
              <Bar yAxisId="left" dataKey="exemptRevenue_E" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={30}>
                {mockFinancialData.map((entry, index) => (
                  <Cell 
                    key={`cell-e-${index}`} 
                    fill={index === activeIndex ? '#6366f1' : '#312e81'} 
                    className="transition-all duration-200 cursor-pointer"
                  />
                ))}
              </Bar>

              {/* Dynamic Overlay Line Tracking the Resulting D1 Output */}
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="reversedCredit_D1" 
                stroke="#f59e0b" 
                strokeWidth={3}
                dot={{ fill: '#f59e0b', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#0f172a' }}
                className="cursor-pointer"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Compliance Advisory Note */}
      <div className="mt-6 flex gap-3 p-4 bg-slate-800/30 rounded-lg border border-slate-800">
        <div className="text-amber-500 mt-0.5">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-200 block mb-0.5">Auditor Compliance Check:</strong>
          Any modifications to final monthly turnover counts ($F$) will auto-recalculate reversals instantly. Ensure finalized trial balance locks are executed before confirming automatic returns processing via GSTR-3B payload hooks.
        </p>
      </div>

    </div>
  );
};
