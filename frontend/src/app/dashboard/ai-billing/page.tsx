'use client';
import { API_BASE, apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';
import { 
    Sparkles, ShieldCheck, CreditCard, Layers, 
    ArrowRight, Loader2, AlertCircle, FileText, 
    CheckCircle2, Plus, Calendar, RefreshCcw, Info,
    User, Search, AlertTriangle
} from 'lucide-react';

export default function AiBillingDashboard() {
    // Folio state
    const [folios, setFolios] = useState<any[]>([]);
    const [selectedFolioId, setSelectedFolioId] = useState('');
    const [newFolioName, setNewFolioName] = useState('');
    const [newFolioAbha, setNewFolioAbha] = useState('');
    const [creatingFolio, setCreatingFolio] = useState(false);

    // Ingestion state
    const [narrative, setNarrative] = useState('');
    const [parsing, setParsing] = useState(false);
    const [parsedResult, setParsedResult] = useState<any>(null);
    const [posting, setPosting] = useState(false);
    const [postedInfo, setPostedInfo] = useState<any>(null);

    // TPA state
    const [tpaId, setTpaId] = useState('TPA_STAR_HEALTH_09');
    const [grossInvoice, setGrossInvoice] = useState('');
    const [preAuth, setPreAuth] = useState('');
    const [claims, setClaims] = useState<any[]>([]);
    const [splitting, setSplitting] = useState(false);
    const [settlingClaimId, setSettlingClaimId] = useState('');
    const [settleAmount, setSettleAmount] = useState('');
    const [settling, setSettling] = useState(false);
    const [splitResult, setSplitResult] = useState<any>(null);

    // Inventory state
    const [batches, setBatches] = useState<any[]>([]);
    const [newSku, setNewSku] = useState('');
    const [newBatchNo, setNewBatchNo] = useState('');
    const [newExpiry, setNewExpiry] = useState('');
    const [newQty, setNewQty] = useState('');
    const [newCost, setNewCost] = useState('');
    const [creatingBatch, setCreatingBatch] = useState(false);
    const [checkingExpiry, setCheckingExpiry] = useState(false);
    const [expiryResult, setExpiryResult] = useState<any>(null);

    // System Logs / Logs panel
    const [systemLogs, setSystemLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        setSystemLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
    };

    // Load initial data
    const loadAllData = async () => {
        try {
            const [fRes, cRes, bRes] = await Promise.all([
                apiFetch(`${API_BASE}/api/v1/patient/folios`),
                apiFetch(`${API_BASE}/api/v1/tpa/claims`),
                apiFetch(`${API_BASE}/api/v1/pharmacy/inventory/batches`)
            ]);

            if (fRes.ok) setFolios(await fRes.json());
            if (cRes.ok) setClaims(await cRes.json());
            if (bRes.ok) setBatches(await bRes.json());
            
            addLog("System registry data synchronized.");
        } catch (error) {
            console.error("Failed to load data:", error);
            addLog("Error syncing system registries.");
        }
    };

    useEffect(() => {
        loadAllData();
    }, []);

    // Create Folio
    const handleCreateFolio = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolioName) return;
        setCreatingFolio(true);
        try {
            const res = await apiFetch(`${API_BASE}/api/v1/patient/folios`, {
                method: 'POST',
                body: JSON.stringify({ patientName: newFolioName, abhaId: newFolioAbha || undefined })
            });
            if (res.ok) {
                const data = await res.json();
                addLog(`Created patient folio for ${newFolioName}`);
                setNewFolioName('');
                setNewFolioAbha('');
                loadAllData();
                setSelectedFolioId(data.id);
            }
        } catch (error) {
            addLog("Failed to create patient folio.");
        } finally {
            setCreatingFolio(false);
        }
    };

    // Parse Clinical Narrative (ICD-11 Parser)
    const handleParseNarrative = async () => {
        if (!narrative) return;
        setParsing(true);
        setParsedResult(null);
        setPostedInfo(null);
        addLog("Calling AI Clinical-to-Billing Inference...");
        try {
            const res = await apiFetch(`${API_BASE}/api/v1/ai/icd11/parse`, {
                method: 'POST',
                body: JSON.stringify({ rawNarrative: narrative })
            });
            if (res.ok) {
                const data = await res.json();
                setParsedResult(data);
                addLog(`ICD-11 Parsing completed. Mapped code: ${data.icd11Code}`);
            }
        } catch (error) {
            addLog("Inference failed. Mapped to default procedure values.");
        } finally {
            setParsing(false);
        }
    };

    // Commit Billing Item
    const handleCommitBillingItem = async () => {
        if (!selectedFolioId || !parsedResult) return;
        setPosting(true);
        try {
            const eventRefUuid = `cl_evt_${Date.now()}`;
            addLog("Posting billing line item to folio registry...");
            const res = await apiFetch(`${API_BASE}/api/v1/billing/event`, {
                method: 'POST',
                body: JSON.stringify({
                    eventRefUuid,
                    folioId: selectedFolioId,
                    originModule: 'EHR_AI_PARSER',
                    eventCode: 'AI_INGEST',
                    rawNarrative: narrative,
                    timestamp: new Date().toISOString(),
                    // Override fields
                    procedure: parsedResult.procedure,
                    icd11Code: parsedResult.icd11Code,
                    baseAmount: parsedResult.baseAmount,
                    taxAmount: parsedResult.taxAmount
                })
            });
            if (res.ok) {
                const data = await res.json();
                setPostedInfo(data);
                addLog(`Ledger entry validated and written. Billing ID: ${data.billingItemId}`);
                loadAllData();
            }
        } catch (error) {
            addLog("Failed to write ledger entry.");
        } finally {
            setPosting(false);
        }
    };

    // TPA Split
    const handleProcessSplit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFolioId || !grossInvoice || !preAuth) return;
        setSplitting(true);
        setSplitResult(null);
        try {
            const res = await apiFetch(`${API_BASE}/api/v1/tpa/claim/split`, {
                method: 'POST',
                body: JSON.stringify({
                    folioId: selectedFolioId,
                    tpaId,
                    totalFolioGross: parseFloat(grossInvoice),
                    preAuthLimit: parseFloat(preAuth)
                })
            });
            if (res.ok) {
                const data = await res.json();
                setSplitResult(data.allocationSummary);
                addLog(`TPA split allocated: ₹${data.allocationSummary.corporateAccountsReceivableTpa} TPA AR / ₹${data.allocationSummary.patientCoPayLiability} Co-Pay`);
                setGrossInvoice('');
                setPreAuth('');
                loadAllData();
            }
        } catch (error) {
            addLog("TPA split processing failed.");
        } finally {
            setSplitting(false);
        }
    };

    // TPA Settle Claim
    const handleSettleClaim = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settlingClaimId || !settleAmount) return;
        setSettling(true);
        try {
            addLog("Reconciling TPA claim with clearinghouse...");
            const res = await apiFetch(`${API_BASE}/api/v1/tpa/claim/settle`, {
                method: 'POST',
                body: JSON.stringify({
                    claimId: settlingClaimId,
                    settledAmount: parseFloat(settleAmount)
                })
            });
            if (res.ok) {
                const data = await res.json();
                addLog(`Claim settled. Haircut discount: ₹${data.haircutAmount}. Delta routed to Bad Debt CC.`);
                setSettlingClaimId('');
                setSettleAmount('');
                loadAllData();
            }
        } catch (error) {
            addLog("Failed to settle TPA claim.");
        } finally {
            setSettling(false);
        }
    };

    // Add Batch
    const handleAddBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSku || !newBatchNo || !newExpiry || !newQty || !newCost) return;
        setCreatingBatch(true);
        try {
            const res = await apiFetch(`${API_BASE}/api/v1/pharmacy/inventory/batches`, {
                method: 'POST',
                body: JSON.stringify({
                    skuCode: newSku,
                    batchNumber: newBatchNo,
                    expiryDate: newExpiry,
                    quantity: parseInt(newQty),
                    unitCost: parseFloat(newCost)
                })
            });
            if (res.ok) {
                addLog(`Added FEFO inventory batch: ${newBatchNo}`);
                setNewSku('');
                setNewBatchNo('');
                setNewExpiry('');
                setNewQty('');
                setNewCost('');
                loadAllData();
            }
        } catch (error) {
            addLog("Failed to add inventory batch.");
        } finally {
            setCreatingBatch(false);
        }
    };

    // Run Expiry Check
    const handleCheckExpiry = async () => {
        setCheckingExpiry(true);
        setExpiryResult(null);
        try {
            addLog("Scanning FEFO batches for pre-expiry and tax credits...");
            const res = await apiFetch(`${API_BASE}/api/v1/pharmacy/inventory/check-expiry`, {
                method: 'POST'
            });
            if (res.ok) {
                const data = await res.json();
                setExpiryResult(data.summary);
                addLog(`FEFO scan completed. Flagged ${data.summary.flaggedNearExpiry} batches, written off ${data.summary.writtenOffExpired} expired batches with GSTR-1 reversal requests.`);
                loadAllData();
            }
        } catch (error) {
            addLog("FEFO scan failed.");
        } finally {
            setCheckingExpiry(false);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                        <Sparkles className="text-indigo-400" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">AI Billing Autopilot & Statutory Controls</h1>
                        <p className="text-xs text-slate-400 mt-1">v2.0.0-Core • Ingestion, Splits, Expiries & ABDM Interoperability</p>
                    </div>
                </div>
                <button onClick={loadAllData} className="bg-[#1e293b] border border-slate-700 text-sm px-4 py-2 rounded-[8px] text-gray-300 hover:text-white flex items-center gap-2 transition">
                    <RefreshCcw size={16} /> Sync Registry
                </button>
            </div>

            {/* Dashboard Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left side controls: Patient Folio, Ingest, Splits */}
                <div className="lg:col-span-8 space-y-6">

                    {/* ABDM & Patient Folio Linker */}
                    <div className="liquid-glass-card p-6 shadow-xl relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                            <h3 className="font-bold text-gray-100 flex items-center gap-2">
                                <ShieldCheck className="text-blue-400" size={18} />
                                ABDM Patient Registry & Folio Onboarding
                            </h3>
                            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-mono uppercase tracking-wider">PM-JAY Interop</span>
                        </div>

                        <form onSubmit={handleCreateFolio} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Patient Name</label>
                                <input 
                                    required 
                                    type="text" 
                                    placeholder="e.g. John Doe" 
                                    value={newFolioName} 
                                    onChange={e => setNewFolioName(e.target.value)} 
                                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" 
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">ABHA ID (Verified ID Link)</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. 12-3456-7890-1234" 
                                    value={newFolioAbha} 
                                    onChange={e => setNewFolioAbha(e.target.value)} 
                                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" 
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={creatingFolio} 
                                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                {creatingFolio ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} 
                                Link ABHA Folio
                            </button>
                        </form>
                    </div>

                    {/* Epic 1/5: AI Clinical Ingestion Parser */}
                    <div className="liquid-glass-card p-6 shadow-xl relative overflow-hidden group shadow-halo-indigo">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                            <h3 className="font-bold text-gray-100 flex items-center gap-2">
                                <Sparkles className="text-indigo-400" size={18} />
                                AI Ingestion Autopilot (ICD-11 Diagnostic Parser)
                            </h3>
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-mono uppercase tracking-wider">Inference Node</span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Select Patient Folio</label>
                                <select 
                                    value={selectedFolioId} 
                                    onChange={e => setSelectedFolioId(e.target.value)} 
                                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="">-- Choose active patient folio --</option>
                                    {folios.map(f => (
                                        <option key={f.id} value={f.id}>
                                            {f.patientName} {f.abhaId ? `[ABHA: ${f.abhaId}]` : '[No ABHA]'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Clinical Narrative / EHR Record / Doctor's Note</label>
                                <textarea 
                                    rows={3} 
                                    placeholder="Paste diagnostic records or clinical narratives (e.g. Brain MRI with contrast, patient exhibits signs of thyroid node scan...)" 
                                    value={narrative} 
                                    onChange={e => setNarrative(e.target.value)} 
                                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button 
                                    onClick={handleParseNarrative} 
                                    disabled={parsing || !narrative} 
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-6 rounded text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {parsing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                    Analyze & Map ICD-11
                                </button>
                            </div>

                            {/* Side-by-side parsed comparison dashboard */}
                            {parsedResult && (
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border border-indigo-500/20 bg-indigo-950/10 p-4 rounded-lg">
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Original Clinical Input</h4>
                                        <p className="text-sm text-slate-300 italic">"{narrative}"</p>
                                    </div>
                                    <div className="space-y-3 border-t md:border-t-0 md:border-l border-indigo-500/20 pt-3 md:pt-0 md:pl-4">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">AI Suggested Billing Allocation</h4>
                                        <div className="space-y-2 text-sm">
                                            <div>
                                                <span className="text-slate-400 text-xs block">Mapped Procedure / Description</span>
                                                <input 
                                                    type="text" 
                                                    value={parsedResult.procedure} 
                                                    onChange={e => setParsedResult({...parsedResult, procedure: e.target.value})} 
                                                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 mt-0.5 text-xs text-white" 
                                                />
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="col-span-1">
                                                    <span className="text-slate-400 text-xs block">ICD-11 Code</span>
                                                    <input 
                                                        type="text" 
                                                        value={parsedResult.icd11Code} 
                                                        onChange={e => setParsedResult({...parsedResult, icd11Code: e.target.value})} 
                                                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 mt-0.5 text-xs text-white" 
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <span className="text-slate-400 text-xs block">Base Amount (₹)</span>
                                                    <input 
                                                        type="number" 
                                                        value={parsedResult.baseAmount} 
                                                        onChange={e => setParsedResult({...parsedResult, baseAmount: parseFloat(e.target.value)})} 
                                                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 mt-0.5 text-xs text-white" 
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <span className="text-slate-400 text-xs block">GST Tax (₹)</span>
                                                    <input 
                                                        type="number" 
                                                        value={parsedResult.taxAmount} 
                                                        onChange={e => setParsedResult({...parsedResult, taxAmount: parseFloat(e.target.value)})} 
                                                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 mt-0.5 text-xs text-white" 
                                                    />
                                                </div>
                                            </div>
                                            <button 
                                                onClick={handleCommitBillingItem}
                                                disabled={posting || !selectedFolioId}
                                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded text-xs transition-colors flex items-center justify-center gap-2 mt-2"
                                            >
                                                {posting ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                                Approve & Commit to Patient Folio
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {postedInfo && (
                                <div className="mt-2 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded text-sm text-emerald-400 flex items-center gap-2">
                                    <CheckCircle2 size={16} />
                                    <span>Successfully posted! Billing Item ID: <span className="font-mono text-xs">{postedInfo.billingItemId}</span> (Base: ₹{postedInfo.mappedBaseAmount}, GST: ₹{postedInfo.taxComponentGst})</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Epic 2: TPA Splits & Haircuts */}
                    <div className="liquid-glass-card p-6 shadow-xl relative overflow-hidden group shadow-halo-emerald">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                            <h3 className="font-bold text-gray-100 flex items-center gap-2">
                                <CreditCard className="text-emerald-400" size={18} />
                                TPA Insurance Split-Billing Engine
                            </h3>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono uppercase tracking-wider">Split Matrix</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Split Processor Form */}
                            <form onSubmit={handleProcessSplit} className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Process Claims Allocation</h4>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Select Patient Folio</label>
                                    <select 
                                        required
                                        value={selectedFolioId} 
                                        onChange={e => setSelectedFolioId(e.target.value)} 
                                        className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="">-- Choose active patient folio --</option>
                                        {folios.map(f => (
                                            <option key={f.id} value={f.id}>{f.patientName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">TPA Insurance ID</label>
                                        <select 
                                            value={tpaId} 
                                            onChange={e => setTpaId(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                                        >
                                            <option value="TPA_STAR_HEALTH_09">Star Health Insurance</option>
                                            <option value="TPA_HDFC_ERGO_11">HDFC Ergo General</option>
                                            <option value="TPA_LIC_MED_03">LIC Medical</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Total Gross (₹)</label>
                                        <input 
                                            required 
                                            type="number" 
                                            placeholder="0.00" 
                                            value={grossInvoice} 
                                            onChange={e => setGrossInvoice(e.target.value)} 
                                            className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" 
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Pre-Authorization Limit (₹)</label>
                                    <input 
                                        required 
                                        type="number" 
                                        placeholder="Max approved coverage" 
                                        value={preAuth} 
                                        onChange={e => setPreAuth(e.target.value)} 
                                        className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" 
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={splitting}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    {splitting ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                                    Calculate Claim Allocation Split
                                </button>
                            </form>

                            {/* Split results displays */}
                            <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-lg flex flex-col justify-between">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Live Split Breakdown</h4>
                                    {splitResult ? (
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between border-b border-white/5 pb-2">
                                                <span className="text-slate-400">Patient Co-Pay Obligation:</span>
                                                <span className="font-bold text-white">₹{splitResult.patientCoPayLiability.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-white/5 pb-2">
                                                <span className="text-slate-400">TPA Approved Coverage AR:</span>
                                                <span className="font-bold text-emerald-400">₹{splitResult.corporateAccountsReceivableTpa.toLocaleString()}</span>
                                            </div>
                                            <div className="pt-2 flex items-center gap-2 text-xs text-emerald-400/80">
                                                <CheckCircle2 size={14} />
                                                <span>Accounts Receivable queued and tagged.</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-500 italic mt-6 text-center">Process split allocation to view split breakdowns.</p>
                                    )}
                                </div>
                                <div className="mt-4 p-3 bg-white/5 border border-white/5 rounded text-xs text-slate-400">
                                    <strong>Formula:</strong> Gross Invoice = Patient Co-Pay + TPA Coverage + Rejections.
                                </div>
                            </div>
                        </div>

                        {/* Claims ledger & Haircut settling interface */}
                        <div className="mt-6">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Active Claims Ledger Queue</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-slate-300">
                                    <thead className="text-[10px] uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
                                        <tr>
                                            <th className="p-3">Claim ID / Folio</th>
                                            <th className="p-3">TPA Partner</th>
                                            <th className="p-3 text-right">Pre-Auth Approved (₹)</th>
                                            <th className="p-3 text-right">Settled (₹)</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {claims.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="p-4 text-center text-slate-500">No active claims queued in database.</td>
                                            </tr>
                                        ) : claims.map(c => (
                                            <tr key={c.id} className="hover:bg-white/[0.01]">
                                                <td className="p-3">
                                                    <div className="font-bold">{c.id.substring(0,8)}</div>
                                                    <div className="text-[10px] text-slate-500">{c.folio?.patientName || 'Unknown Patient'}</div>
                                                </td>
                                                <td className="p-3 font-mono">{c.tpaName}</td>
                                                <td className="p-3 text-right font-semibold">₹{Number(c.preAuthApprovedAmt).toLocaleString()}</td>
                                                <td className="p-3 text-right font-semibold text-emerald-400">₹{Number(c.settledAmount).toLocaleString()}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                                        c.status === 'PRE_AUTH' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                        c.status === 'CLAIM_SUBMITTED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                        c.status === 'RECON_HAIRCUT' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                                                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    }`}>
                                                        {c.status}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    {c.status === 'PRE_AUTH' && (
                                                        <button 
                                                            onClick={() => { setSettlingClaimId(c.id); setSettleAmount(c.preAuthApprovedAmt); }}
                                                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1 px-3 rounded text-[10px] transition-colors"
                                                        >
                                                            Settle Claim
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Settle Modal overlay form */}
                        {settlingClaimId && (
                            <div className="absolute inset-0 bg-slate-950/95 flex flex-col justify-center items-center p-6 z-20">
                                <div className="w-full max-w-sm space-y-4">
                                    <div>
                                        <h3 className="font-bold text-white text-base">Settle Claim: {settlingClaimId.substring(0,8)}</h3>
                                        <p className="text-xs text-slate-400 mt-1">Provide the final approved clearinghouse settlement payout.</p>
                                    </div>
                                    <form onSubmit={handleSettleClaim} className="space-y-3">
                                        <div>
                                            <label className="text-xs text-slate-400 block mb-1">Settled Amount (₹)</label>
                                            <input 
                                                required 
                                                type="number" 
                                                value={settleAmount} 
                                                onChange={e => setSettleAmount(e.target.value)} 
                                                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                type="submit" 
                                                disabled={settling}
                                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded text-xs transition-colors flex items-center justify-center gap-1"
                                            >
                                                {settling ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                                Confirm Settlement
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => setSettlingClaimId('')}
                                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded text-xs transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded text-[10px] text-rose-400">
                                        <strong>Haircut Rule:</strong> If settled amount is less than pre-auth amount, the deficit delta will be written off as Bad Debt CC loss and trigger audit alerts.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right side controls: System Logs & FEFO Inventory Batch updates */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Epic 4: FEFO Inventory & Pre-Expiry controls */}
                    <div className="liquid-glass-card p-6 shadow-xl relative overflow-hidden group shadow-halo-amber">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                            <h3 className="font-bold text-gray-100 flex items-center gap-2">
                                <Layers className="text-amber-400" size={18} />
                                FEFO Inventory & Expiry tax credit Notes
                            </h3>
                            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-mono uppercase tracking-wider">CGST Sec 17</span>
                        </div>

                        <div className="space-y-4">
                            {/* Run scan controls */}
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleCheckExpiry}
                                    disabled={checkingExpiry}
                                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded text-xs transition-colors flex items-center justify-center gap-1.5"
                                >
                                    {checkingExpiry ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                                    Run FEFO & Expiry Scan
                                </button>
                            </div>

                            {/* Scan result summary alert */}
                            {expiryResult && (
                                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded text-xs text-amber-400 space-y-1">
                                    <div className="font-bold flex items-center gap-1"><AlertTriangle size={14} /> Scan Completed!</div>
                                    <div>• Flagged <span className="font-bold">{expiryResult.flaggedNearExpiry}</span> batches as NEAR_EXPIRY (90d window).</div>
                                    <div>• Written off <span className="font-bold">{expiryResult.writtenOffExpired}</span> EXPIRED batches. GSTR-1 Credit Note reversals generated.</div>
                                </div>
                            )}

                            {/* Batch list */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Inventory Batches (FEFO Order)</h4>
                                <div className="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                                    {batches.length === 0 ? (
                                        <p className="text-xs text-slate-500 text-center py-4">No inventory batches tracked.</p>
                                    ) : batches.map(b => (
                                        <div key={b.id} className="bg-slate-950/60 border border-slate-800/80 p-2 rounded text-xs flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-slate-200">{b.batchNumber}</div>
                                                <div className="text-[10px] text-slate-500">SKU: {b.skuCode} • Qty: {b.quantity} • Cost: ₹{Number(b.unitCost)}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] text-slate-400">Exp: {new Date(b.expiryDate).toLocaleDateString()}</div>
                                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono mt-1 inline-block ${
                                                    b.status === 'ACTIVE' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' :
                                                    b.status === 'NEAR_EXPIRY' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20 animate-pulse' :
                                                    'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                                }`}>
                                                    {b.status} {b.itcReversed && '• ITC REVERSED'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Create batch form */}
                            <form onSubmit={handleAddBatch} className="border-t border-white/5 pt-4 space-y-2.5">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Onboard New SKU Batch</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <input 
                                        required 
                                        type="text" 
                                        placeholder="SKU Code" 
                                        value={newSku} 
                                        onChange={e => setNewSku(e.target.value)} 
                                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none" 
                                    />
                                    <input 
                                        required 
                                        type="text" 
                                        placeholder="Batch Number" 
                                        value={newBatchNo} 
                                        onChange={e => setNewBatchNo(e.target.value)} 
                                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none" 
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-1">
                                        <input 
                                            required 
                                            type="number" 
                                            placeholder="Qty" 
                                            value={newQty} 
                                            onChange={e => setNewQty(e.target.value)} 
                                            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none" 
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <input 
                                            required 
                                            type="number" 
                                            placeholder="Cost" 
                                            value={newCost} 
                                            onChange={e => setNewCost(e.target.value)} 
                                            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none" 
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <input 
                                            required 
                                            type="date" 
                                            value={newExpiry} 
                                            onChange={e => setNewExpiry(e.target.value)} 
                                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none" 
                                        />
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={creatingBatch}
                                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-1.5 rounded text-xs transition-colors flex items-center justify-center gap-1"
                                >
                                    {creatingBatch ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                    Onboard Batch
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* System audit log terminal */}
                    <div className="liquid-glass-card p-5 shadow-xl relative overflow-hidden group">
                        <h3 className="font-bold text-gray-100 flex items-center gap-2 mb-3 text-xs uppercase tracking-wider border-b border-white/5 pb-2">
                            <FileText className="text-slate-400" size={14} />
                            System Event Log Console
                        </h3>
                        <div className="bg-black/40 border border-slate-850 p-3 rounded font-mono text-[10px] text-emerald-400 space-y-1.5 min-h-[150px] max-h-[220px] overflow-y-auto custom-scrollbar">
                            {systemLogs.length === 0 ? (
                                <p className="text-slate-500 italic">No events logged yet.</p>
                            ) : systemLogs.map((log, i) => (
                                <div key={i} className="leading-relaxed border-b border-slate-900/50 pb-1 last:border-0">{log}</div>
                            ))}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
