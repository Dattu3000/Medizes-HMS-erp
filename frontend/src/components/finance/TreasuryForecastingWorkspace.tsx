import React, { useState } from 'react';

interface ForecastMetrics {
  month: string;
  baseOutputGst: number;
  grossIitcPool: number;
  fixedTurnover_F: number;
}

export const TreasuryForecastingWorkspace: React.FC = () => {
  // Constant structural baselines for June 2026
  const metadata: ForecastMetrics = {
    month: 'June 2026',
    baseOutputGst: 1420000,
    grossIitcPool: 850000,
    fixedTurnover_F: 12500000, // Total expected revenue
  };

  // Interactive State for Simulator: Represents Exempt Healthcare Revenue (E)
  const [exemptRevenue_E, setExemptRevenue_E] = useState<number>(7800000);
  const [isAllocating, setIsAllocating] = useState<boolean>(false);
  const [allocationSuccess, setAllocationSuccess] = useState<boolean>(false);

  // Dynamic Math Formulations (Rule 42 Projections)
  const totalTurnover_F = metadata.fixedTurnover_F;
  const currentRatio = exemptRevenue_E / totalTurnover_F;
  
  // Assume common pool credit represents a fixed 30% of gross incoming ITC
  const commonCredit_C2 = metadata.grossIitcPool * 0.30; 
  const projectedReversal_D1 = commonCredit_C2 * currentRatio;
  
  // Net Eligible Credit = Gross Pool - Reversal
  const netEligibleItc = metadata.grossIitcPool - projectedReversal_D1;
  const netFinalTaxPayable = Math.max(0, metadata.baseOutputGst - netEligibleItc);

  // Formatting Helper
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleLiquidityAllocation = () => {
    setIsAllocating(true);
    setTimeout(() => {
      setIsAllocating(false);
      setAllocationSuccess(true);
      setTimeout(() => setAllocationSuccess(false), 4000);
    }, 1500);
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      
      {/* Workspace Sub-Header Navigation */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 pb-6 border-b border-slate-900 gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-md border border-indigo-500/20 tracking-wider uppercase font-semibold">
              Treasury Optimization Unit
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-500 font-mono">Simulating Live Ledger State</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mt-2">
            Predictive Cash Flow & Tax Planner
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Proactive liquidity configuration modeling for closing period: <span className="text-slate-200 font-medium">{metadata.month}</span>.
          </p>
        </div>

        {/* Global Control Desk */}
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-sm font-medium border border-slate-800 transition-all">
            Download Audit Model
          </button>
          <button 
            onClick={handleLiquidityAllocation}
            disabled={isAllocating || allocationSuccess}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg ${
              allocationSuccess 
                ? 'bg-emerald-600 text-white shadow-emerald-950/20' 
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-950/40 hover:shadow-indigo-500/10'
            }`}
          >
            {isAllocating ? 'Authorizing Nodes...' : allocationSuccess ? 'Liquidity Escrowed ✓' : 'Authorize Provision Reserve'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT & CENTER SECTIONS: Visual KPIs & Live Simulator Panel */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Main Financial Impact Row Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-900 p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Estimated Gross Output Liability</span>
              <span className="text-2xl font-bold font-mono text-white block mt-2">{formatINR(metadata.baseOutputGst)}</span>
              <span className="text-[10px] font-mono text-slate-500 block mt-3">From Taxable Pharmacy & Op Operations</span>
            </div>

            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-900 p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Projected Credit Clawback (D₁)</span>
              <span className="text-2xl font-bold font-mono text-amber-500 block mt-2">{formatINR(projectedReversal_D1)}</span>
              <span className="text-[10px] font-mono text-amber-500/60 block mt-3">Rule 42 Reverse Liability Target</span>
            </div>

            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-900 p-6 rounded-2xl border-indigo-500/20 relative overflow-hidden shadow-xl shadow-indigo-950/20">
              <div className="absolute inset-0 bg-indigo-600/[0.02] backdrop-blur-3xl" />
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block">Net Capital Call Required</span>
              <span className="text-3xl font-extrabold font-mono text-white block mt-2 tracking-tight">{formatINR(netFinalTaxPayable)}</span>
              <span className="text-[10px] font-mono text-indigo-400/80 block mt-3 font-medium">Net Electronic Cash Flow Balance</span>
            </div>

          </div>

          {/* Dynamic Scenario Simulator Control Panel */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-8 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Live Variable Sensitivity Simulator</h3>
                <p className="text-xs text-slate-400 mt-0.5">Slide to dynamically test variations in exempt clinical billing portfolios.</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 uppercase font-medium block">Simulated Exempt Income (E)</span>
                <span className="text-lg font-bold font-mono text-indigo-400">{formatINR(exemptRevenue_E)}</span>
              </div>
            </div>

            {/* Slider Track UI component */}
            <div className="space-y-4 my-8">
              <input 
                type="range" 
                min={3000000} 
                max={11000000} 
                step={50000}
                value={exemptRevenue_E} 
                onChange={(e) => setExemptRevenue_E(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-hidden"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-600">
                <span>MIN BOUND: ₹30L</span>
                <span className="text-indigo-500 font-semibold">CURRENT ASSUMPTION</span>
                <span>MAX BOUND: ₹1.1CR</span>
              </div>
            </div>

            {/* Micro Statistics Dashboard */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-900">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Turnover Ceiling (F)</span>
                <span className="text-sm font-semibold text-slate-300 font-mono">{formatINR(totalTurnover_F)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Exempt Ratio (E/F)</span>
                <span className="text-sm font-semibold text-white font-mono">{(currentRatio * 100).toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Common Pool (C₂)</span>
                <span className="text-sm font-semibold text-slate-300 font-mono">{formatINR(commonCredit_C2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Net Retained ITC</span>
                <span className="text-sm font-semibold text-emerald-400 font-mono">{formatINR(netEligibleItc)}</span>
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT SECTION: Premium Treasury Liquidity Gauge & Allocation Metrics */}
        <div className="space-y-6">
          
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between h-full">
            <div>
              <h3 className="text-base font-bold text-white mb-1">Liquidity Allocation Runway</h3>
              <p className="text-xs text-slate-500 mb-6">Cross-checking cash requirements against treasury account limits.</p>
              
              {/* Custom High-Fidelity Burn Bar Meter */}
              <div className="space-y-3 mb-8">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Escrow Commitment Level</span>
                  <span className="text-indigo-400 font-bold">76% Allocated</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-900 p-0.5">
                  <div 
                    className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-2 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all duration-300"
                    style={{ width: '76%' }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Current Cash: {formatINR(netFinalTaxPayable)}</span>
                  <span>Target Safe Buffer: {formatINR(netFinalTaxPayable * 1.15)}</span>
                </div>
              </div>

              {/* Functional Treasury Checkbox Rows */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-900 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-slate-300">GST Electronic Ledger Cache</span>
                  </div>
                  <span className="font-mono text-slate-400">Sync Verified</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-900 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-slate-300">Rule 42 Base Reserve Target</span>
                  </div>
                  <span className="font-mono text-slate-400">Lock Ready</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-900 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-slate-300">Section 194J Doctor TDS Buffer</span>
                  </div>
                  <span className="font-mono text-amber-500 font-medium">Pending Close</span>
                </div>
              </div>
            </div>

            {/* Strategic Advice Callout */}
            <div className="mt-8 p-4 bg-indigo-950/20 rounded-2xl border border-indigo-500/10 text-xs text-indigo-300 leading-relaxed">
              <span className="font-bold text-white block mb-1">CFO Optimization Insight</span>
              As your simulated $E/F$ ratio changes, observe how every 1% reduction in exempt healthcare income saves approximately <span className="font-mono font-semibold text-white">{formatINR(commonCredit_C2 * 0.01)}</span> in unclaimable Input Tax Credit reversals.
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default TreasuryForecastingWorkspace;
