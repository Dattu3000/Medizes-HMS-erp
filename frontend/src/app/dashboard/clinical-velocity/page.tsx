'use client';
import { API_BASE, apiFetch } from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import {
    Sparkles, ShieldCheck, Activity, Clock, Plus, Search,
    Send, AlertTriangle, AlertCircle, RefreshCcw, Layers,
    TrendingUp, ShieldAlert, CheckCircle2, ChevronRight, Loader2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ClinicalVelocityPage() {
    // General / Sync state
    const [folios, setFolios] = useState<any[]>([]);
    const [selectedFolioId, setSelectedFolioId] = useState('');
    const [selectedDoctorId, setSelectedDoctorId] = useState('doc_ananya_rao');
    const [logs, setLogs] = useState<string[]>([]);

    // Epic 1.A: OP Queue wait time matrix
    const [queue, setQueue] = useState<any[]>([]);
    const [triageScore, setTriageScore] = useState(1);
    const [addingToQueue, setAddingToQueue] = useState(false);

    // Epic 1.B: Stock-aware e-prescription lookup
    const [drugSearch, setDrugSearch] = useState('');
    const [autocompleteRes, setAutocompleteRes] = useState<any>(null);
    const [selectedDrug, setSelectedDrug] = useState<any>(null);
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('');
    const [days, setDays] = useState('5');
    const [prescribedItems, setPrescribedItems] = useState<any[]>([]);

    // Epic 1.C: Point-of-Care Billing webhook
    const [signingOff, setSigningOff] = useState(false);
    const [checkoutSummary, setCheckoutSummary] = useState<any>(null);

    // Epic 2.A: Biomarker multi-turn delta engine
    const [biomarkerCode, setBiomarkerCode] = useState('K_SERUM');
    const [biomarkerData, setBiomarkerData] = useState<any>(null);
    const [fetchingVelocity, setFetchingVelocity] = useState(false);

    // Epic 2.B: Critical Panic overrides
    const [analyzerVal, setAnalyzerVal] = useState('');
    const [analyzerCode, setAnalyzerCode] = useState('K_SERUM');
    const [releasingResult, setReleasingResult] = useState(false);
    const [panicAlert, setPanicAlert] = useState<any>(null);
    const [countdown, setCountdown] = useState(180);
    const [clinicalAction, setClinicalAction] = useState('');
    const [acknowledging, setAcknowledging] = useState(false);

    const sseRef = useRef<EventSource | null>(null);

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 8));
    };

    // Load base data
    const loadBaseData = async () => {
        try {
            const fRes = await apiFetch(`${API_BASE}/api/v1/patient/folios`);
            if (fRes.ok) {
                const data = await fRes.json();
                setFolios(data);
                if (data.length > 0 && !selectedFolioId) {
                    setSelectedFolioId(data[0].id);
                }
            }
            addLog("System registries synchronized.");
        } catch (e) {
            addLog("Error loading base registries.");
        }
    };

    // Load OP Queue
    const loadQueue = async () => {
        try {
            const res = await apiFetch(`${API_BASE}/api/v1/clinical/op-queue?doctorId=${selectedDoctorId}`);
            if (res.ok) {
                setQueue(await res.json());
            }
        } catch (e) {
            addLog("Failed to sync OP queue.");
        }
    };

    useEffect(() => {
        loadBaseData();
    }, []);

    useEffect(() => {
        loadQueue();
    }, [selectedDoctorId]);

    // Handle patient lookup autocomplete prescription ranking
    useEffect(() => {
        const fetchAutocomplete = async () => {
            if (!drugSearch.trim()) {
                setAutocompleteRes(null);
                return;
            }
            try {
                const res = await apiFetch(`${API_BASE}/api/v1/pharmacy/drugs/autocomplete?query=${drugSearch}`);
                if (res.ok) {
                    setAutocompleteRes(await res.json());
                }
            } catch (e) {
                console.error(e);
            }
        };

        const timeout = setTimeout(fetchAutocomplete, 300);
        return () => clearTimeout(timeout);
    }, [drugSearch]);

    // Epic 2.A: Load Biomarker velocity graph
    const loadBiomarkerVelocity = async () => {
        if (!selectedFolioId || !biomarkerCode) return;
        setFetchingVelocity(true);
        try {
            const res = await apiFetch(`${API_BASE}/api/v1/diagnostics/biomarker/velocity?patientFolioId=${selectedFolioId}&testCode=${biomarkerCode}&lookbackMonths=24`);
            if (res.ok) {
                setBiomarkerData(await res.json());
                addLog(`Loaded metabolic delta velocity profile for ${biomarkerCode}`);
            }
        } catch (e) {
            addLog("Failed to fetch biomarker history.");
        } finally {
            setFetchingVelocity(false);
        }
    };

    useEffect(() => {
        loadBiomarkerVelocity();
    }, [selectedFolioId, biomarkerCode]);

    // SSE Stream for real-time panic override
    useEffect(() => {
        if (!selectedDoctorId) return;

        // Close existing
        if (sseRef.current) {
            sseRef.current.close();
        }

        addLog(`Listening for real-time critical lab broadcasts for ${selectedDoctorId}...`);
        const sse = new EventSource(`${API_BASE}/api/v1/clinical/panic/stream?doctorId=${selectedDoctorId}`);
        sseRef.current = sse;

        sse.onmessage = (event) => {
            if (event.data && event.data !== 'null') {
                const alert = JSON.parse(event.data);
                if (alert.alertStatus === 'FIRED') {
                    setPanicAlert(alert);
                    addLog(`CRITICAL VALUE BROADCAST INGESTED! SLA TIMER COMMITTED.`);
                }
            } else {
                setPanicAlert(null);
            }
        };

        sse.onerror = () => {
            sse.close();
        };

        return () => {
            if (sseRef.current) sseRef.current.close();
        };
    }, [selectedDoctorId]);

    // Timer logic for 180s SLA countdown
    useEffect(() => {
        if (!panicAlert) {
            setCountdown(180);
            return;
        }

        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    addLog("SLA countdown breached. Alert escalated to CMS.");
                    // refresh alerts
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [panicAlert]);

    // OP Queue simulation
    const handleAddToQueue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFolioId) return;
        setAddingToQueue(true);
        try {
            const res = await apiFetch(`${API_BASE}/api/v1/clinical/op-queue`, {
                method: 'POST',
                body: JSON.stringify({ doctorId: selectedDoctorId, patientFolioId: selectedFolioId, triageScore })
            });
            if (res.ok) {
                addLog(`Patient folio queued for consultation.`);
                loadQueue();
            }
        } catch (e) {
            addLog("Failed to queue patient.");
        } finally {
            setAddingToQueue(false);
        }
    };

    // Prescription compilation
    const handleAddDrugToRx = () => {
        if (!selectedDrug || !dosage || !frequency) return;
        const newItem = {
            drugName: selectedDrug.drugName,
            dosage,
            frequency,
            days,
            amount: 450.00 // simulated cost per drug line
        };
        setPrescribedItems([...prescribedItems, newItem]);
        setSelectedDrug(null);
        setDosage('');
        setFrequency('');
        addLog(`Added ${newItem.drugName} to checkout list.`);
    };

    // Point of care billing & signoff
    const handleSignoffCheckout = async () => {
        if (queue.length === 0 || !selectedFolioId) return;
        setSigningOff(true);
        try {
            const items = [
                { description: "OPD Consultation Fee", amount: 800.00 },
                ...prescribedItems.map(p => ({ description: `Rx: ${p.drugName}`, amount: p.amount }))
            ];
            const activeQueueId = queue[0].id; // checkout the first in queue
            const res = await apiFetch(`${API_BASE}/api/v1/clinical/op-signoff`, {
                method: 'POST',
                body: JSON.stringify({ opQueueId: activeQueueId, folioId: selectedFolioId, items })
            });

            if (res.ok) {
                const data = await res.json();
                setCheckoutSummary(data);
                setPrescribedItems([]);
                addLog("OP Consultation signed off. Micro-billing payment link dispatched.");
                loadQueue();
            }
        } catch (e) {
            addLog("Signoff checkout failed.");
        } finally {
            setSigningOff(false);
        }
    };

    // Simulate Analyzer Test release
    const handleReleaseAnalyzerResult = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!analyzerVal || !selectedFolioId) return;
        setReleasingResult(true);

        let biomarkerName = "Serum Potassium";
        let unit = "mmol/L";
        if (analyzerCode === 'HB_BLOOD') {
            biomarkerName = "Hemoglobin";
            unit = "g/dL";
        } else if (analyzerCode === 'TROP_I') {
            biomarkerName = "Troponin-I";
            unit = "ng/mL";
        }

        try {
            const res = await apiFetch(`${API_BASE}/api/v1/clinical/lab/results`, {
                method: 'POST',
                body: JSON.stringify({
                    patientFolioId: selectedFolioId,
                    testCode: analyzerCode,
                    biomarkerName,
                    value: parseFloat(analyzerVal),
                    unit,
                    doctorId: selectedDoctorId
                })
            });

            if (res.ok) {
                const data = await res.json();
                addLog(`Lab analyzer result uploaded. Posted GL Costing Cost: ₹${data.consumablesMarkdown.postedCostToGL}`);
                setAnalyzerVal('');
                loadBiomarkerVelocity();
            }
        } catch (e) {
            addLog("Failed to release analyzer results.");
        } finally {
            setReleasingResult(false);
        }
    };

    // Confirm / Acknowledge Panic Alerts
    const handleAcknowledgeAlert = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!panicAlert || !clinicalAction) return;
        setAcknowledging(true);
        try {
            const res = await apiFetch(`${API_BASE}/api/v1/clinical/panic/acknowledge`, {
                method: 'POST',
                body: JSON.stringify({
                    panicAlertId: panicAlert.id,
                    reviewerDoctorId: selectedDoctorId,
                    clinicalActionTaken: clinicalAction
                })
            });

            if (res.ok) {
                const data = await res.json();
                addLog(`Panic alert closed. Latency: ${data.latencySeconds}s. Compliance state: ${data.complianceState}`);
                setPanicAlert(null);
                setClinicalAction('');
            }
        } catch (e) {
            addLog("Acknowledge override failed.");
        } finally {
            setAcknowledging(false);
        }
    };

    // Color mapper for wait times
    const getWaitTimeColor = (state: string) => {
        if (state === 'CRITICAL_DELAY') return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
        if (state === 'LAGGING') return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Critical Panic Override Full-Screen Visual Lockout Modal */}
            {panicAlert && (
                <div className="fixed inset-0 z-50 bg-[#020617]/95 backdrop-blur-md flex flex-col justify-center items-center p-6 border-4 border-rose-500/30 animate-pulse-slow">
                    <div className="w-full max-w-lg bg-[#0f172a] border border-rose-500/40 p-8 rounded-2xl shadow-2xl relative space-y-6">
                        {/* Alarm header */}
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto animate-bounce">
                                <AlertTriangle className="text-rose-500" size={36} />
                            </div>
                            <h2 className="text-2xl font-black text-rose-500 uppercase tracking-wider">
                                CRITICAL PANIC OVERRIDE LOCK
                            </h2>
                            <p className="text-xs text-slate-400">
                                Global clinical console input interface disabled under malpractice liability protection parameters.
                            </p>
                        </div>

                        {/* Panic Alert Details */}
                        <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-lg space-y-2 text-sm text-slate-300">
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-slate-400">Biomarker:</span>
                                <span className="font-bold text-white">{panicAlert.labPanelResult?.biomarkerName}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-slate-400">Detected Value:</span>
                                <span className="font-bold text-rose-500">{Number(panicAlert.labPanelResult?.quantitativeValue).toFixed(2)} {panicAlert.labPanelResult?.unitOfMeasure}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Fired Timestamp:</span>
                                <span className="font-mono text-xs">{new Date(panicAlert.alertFiredAt).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* SLA Countdown Timer */}
                        <div className="text-center p-3 bg-slate-950 rounded-lg border border-slate-800">
                            <div className="text-xs text-slate-500 uppercase font-mono">SLA Gate Countdown</div>
                            <div className={`text-3xl font-black mt-1 font-mono ${countdown <= 30 ? 'text-red-500 animate-pulse' : 'text-amber-500'}`}>
                                {countdown}s
                            </div>
                            {countdown === 0 && (
                                <div className="text-[10px] text-red-400 mt-1 uppercase font-bold animate-pulse">
                                    Breach Escalated to Superintendent
                                </div>
                            )}
                        </div>

                        {/* Response Form */}
                        <form onSubmit={handleAcknowledgeAlert} className="space-y-3">
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Mandatory Clinical Actions Taken</label>
                                <textarea
                                    required
                                    rows={2}
                                    placeholder="Describe clinical actions taken immediately (e.g. ordered IV drip, nurse notified)..."
                                    value={clinicalAction}
                                    onChange={e => setClinicalAction(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-rose-500"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={acknowledging}
                                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                            >
                                {acknowledging ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                Acknowledge Panic Alert & Notify Ward Nurse
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Dashboard Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center">
                        <Activity className="text-rose-400" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Clinical Velocity & Biomarker Panic Hub</h1>
                        <p className="text-xs text-slate-400 mt-1">v3.0.0-Core • OP Wait-Times, Auto-Prescribing & Critical SLA Overrides</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div>
                        <select
                            value={selectedDoctorId}
                            onChange={e => setSelectedDoctorId(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none"
                        >
                            <option value="doc_ananya_rao">Dr. Ananya Rao (OPD Cardiology)</option>
                            <option value="doc_arvind_kumar">Dr. Arvind Kumar (IPD Internal Med)</option>
                        </select>
                    </div>
                    <button onClick={loadBaseData} className="bg-[#1e293b] border border-slate-700 text-sm px-4 py-2 rounded-[8px] text-gray-300 hover:text-white flex items-center gap-2 transition">
                        <RefreshCcw size={16} /> Sync Console
                    </button>
                </div>
            </div>

            {/* Main Interactive Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Side Column - Queue Matrix and Prescription Pad */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Epic 1.A: OP wait-time matrix */}
                    <div className="liquid-glass-card p-6 shadow-xl relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                            <h3 className="font-bold text-gray-100 flex items-center gap-2">
                                <Clock className="text-blue-400" size={18} />
                                OP Fluid Waiting-Time Queue Matrix
                            </h3>
                            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-mono uppercase">Predictive Delay</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Queue List */}
                            <div className="md:col-span-2 space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Physician Active Queue Projections</h4>
                                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                    {queue.length === 0 ? (
                                        <p className="text-xs text-slate-500 italic text-center py-8">No patients currently queued for this physician.</p>
                                    ) : queue.map((item, idx) => (
                                        <div key={item.id} className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-lg flex justify-between items-center text-xs">
                                            <div>
                                                <div className="font-bold text-slate-200">Patient #{item.patientFolioId.substring(0,8)}</div>
                                                <div className="text-[10px] text-slate-500 mt-0.5">Token: {item.tokenNumber} · Triage Score: {item.triageScore}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-white">{item.projectedWaitMin} mins wait</div>
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold mt-1 inline-block border ${getWaitTimeColor(item.velocityState)}`}>
                                                    {item.velocityState}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Queue simulation form */}
                            <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-lg space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Onboard Patient to Queue</h4>
                                <form onSubmit={handleAddToQueue} className="space-y-3">
                                    <div>
                                        <label className="text-[10px] text-slate-400 block mb-1">Select Patient Folio</label>
                                        <select
                                            value={selectedFolioId}
                                            onChange={e => setSelectedFolioId(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                                        >
                                            {folios.map(f => (
                                                <option key={f.id} value={f.id}>{f.patientName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 block mb-1">Triage Severity Level</label>
                                        <select
                                            value={triageScore}
                                            onChange={e => setTriageScore(parseInt(e.target.value))}
                                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                                        >
                                            <option value="1">Routine Low complexity (1.0x)</option>
                                            <option value="4">Urgent/Critical (1.8x scaling)</option>
                                        </select>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={addingToQueue}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded text-xs transition-colors flex items-center justify-center gap-1"
                                    >
                                        {addingToQueue ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                        Queue Patient
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Epic 1.B & 1.C: Stock-aware e-prescription lookup & checkout */}
                    <div className="liquid-glass-card p-6 shadow-xl relative overflow-hidden group shadow-halo-amber">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                            <h3 className="font-bold text-gray-100 flex items-center gap-2">
                                <Sparkles className="text-amber-400" size={18} />
                                Stock-Aware Prescription Pad & POC Checkout
                            </h3>
                            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-mono uppercase">FEFO Linked</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Autocomplete prescribing pad */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Search Generic Molecule</h4>
                                <div className="relative">
                                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs">
                                        <Search size={14} className="text-gray-500" />
                                        <input
                                            type="text"
                                            placeholder="Type molecule (e.g. Amoxicillin, Metformin)..."
                                            value={drugSearch}
                                            onChange={e => setDrugSearch(e.target.value)}
                                            className="flex-1 bg-transparent focus:outline-none text-white"
                                        />
                                    </div>

                                    {/* Auto-complete results dropdown */}
                                    {autocompleteRes && (
                                        <div className="absolute left-0 right-0 top-10 bg-[#0f172a] border border-slate-800 rounded-lg shadow-2xl z-20 max-h-[180px] overflow-y-auto divide-y divide-white/5">
                                            {autocompleteRes.outOfStock ? (
                                                <div className="p-3">
                                                    <div className="text-red-400 font-bold text-[11px] mb-1">OUT OF STOCK Across All Branches!</div>
                                                    <div className="text-[10px] text-slate-400 mb-1">Locking prescribing pad. Suggested Alternatives:</div>
                                                    <div className="space-y-1">
                                                        {autocompleteRes.alternatives.map((alt: string, i: number) => (
                                                            <button
                                                                type="button"
                                                                key={i}
                                                                onClick={() => { setDrugSearch(alt); setAutocompleteRes(null); }}
                                                                className="w-full text-left bg-slate-950 hover:bg-slate-900 p-1.5 rounded text-[11px] text-amber-400 font-mono transition"
                                                            >
                                                                {alt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                autocompleteRes.batches.map((batch: any) => (
                                                    <div
                                                        key={batch.id}
                                                        onClick={() => {
                                                            setSelectedDrug({ drugName: autocompleteRes.drugName, batch });
                                                            setAutocompleteRes(null);
                                                            setDrugSearch('');
                                                        }}
                                                        className={`p-2.5 hover:bg-slate-900 cursor-pointer flex justify-between items-center text-[11px] transition ${
                                                            batch.isNearExpiry ? 'border-l-2 border-amber-500' : ''
                                                        }`}
                                                    >
                                                        <div>
                                                            <div className="font-bold text-slate-200">{autocompleteRes.drugName} ({batch.batchNumber})</div>
                                                            <div className="text-[9px] text-slate-500 mt-0.5">Qty: {batch.quantity} · Cost: ₹{batch.unitCost}</div>
                                                        </div>
                                                        {batch.isNearExpiry && (
                                                            <span className="bg-amber-500/20 text-amber-400 text-[8px] font-bold px-1.5 py-0.5 rounded">
                                                                NEAR EXPIRY
                                                            </span>
                                                        )}
                                                        {batch.isDeadweight && !batch.isNearExpiry && (
                                                            <span className="bg-indigo-500/20 text-indigo-400 text-[8px] font-bold px-1.5 py-0.5 rounded">
                                                                DEADWEIGHT
                                                            </span>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>

                                {selectedDrug && (
                                    <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg space-y-3">
                                        <div className="text-xs font-bold text-white">
                                            Prescribing: <span className="text-amber-400 font-mono">{selectedDrug.drugName}</span>
                                            {selectedDrug.batch.isNearExpiry && <span className="text-[9px] bg-amber-500/20 text-amber-400 ml-2 px-1.5 py-0.5 rounded">Expiring Boost</span>}
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <input placeholder="Dosage" value={dosage} onChange={e => setDosage(e.target.value)} className="bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none" />
                                            <input placeholder="Freq" value={frequency} onChange={e => setFrequency(e.target.value)} className="bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none" />
                                            <input placeholder="Days" value={days} onChange={e => setDays(e.target.value)} className="bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none" />
                                        </div>
                                        <button
                                            onClick={handleAddDrugToRx}
                                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded text-xs transition-colors"
                                        >
                                            Add to Checkout Matrix
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Point of care checkout panel */}
                            <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-lg flex flex-col justify-between">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Patient Prescribed Cart</h4>
                                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                                        {prescribedItems.length === 0 ? (
                                            <p className="text-xs text-slate-500 italic py-4">No medication prescribed in active cart.</p>
                                        ) : prescribedItems.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-[11px] bg-slate-900 p-1.5 rounded">
                                                <span className="text-slate-300 font-medium">{item.drugName}</span>
                                                <span className="text-slate-500 font-mono">₹{item.amount.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-white/5 space-y-3">
                                    <button
                                        onClick={handleSignoffCheckout}
                                        disabled={signingOff || queue.length === 0}
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                        {signingOff ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                        Signoff Consult & Trigger Webhook Billing
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Checkout details output */}
                        {checkoutSummary && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border border-emerald-500/20 bg-emerald-950/5 p-4 rounded-lg text-xs">
                                <div className="space-y-1.5 text-slate-300">
                                    <h5 className="font-bold text-emerald-400 uppercase tracking-wider">Checkout Billing Totals</h5>
                                    <div>Base Consult/Med Cost: <span className="font-bold">₹{checkoutSummary.billingSummary.baseAmount.toFixed(2)}</span></div>
                                    <div>GST Tax (5%): <span className="font-bold">₹{checkoutSummary.billingSummary.taxAmount.toFixed(2)}</span></div>
                                    <div className="border-t border-white/5 pt-1 font-bold text-white">Gross Invoice Liability: ₹{checkoutSummary.billingSummary.grossAmount.toFixed(2)}</div>
                                    <div className="mt-2 text-[10px] text-slate-400">Short Link: <a href={checkoutSummary.paymentShortLink} className="underline text-emerald-400" target="_blank" rel="noreferrer">{checkoutSummary.paymentShortLink}</a></div>
                                </div>
                                <div className="space-y-2 border-t md:border-t-0 md:border-l border-emerald-500/20 pt-2 md:pt-0 md:pl-4 font-mono text-[10px] text-emerald-500/80">
                                    <div className="font-bold text-white uppercase tracking-wider">Short-Link Webhook Dispatches</div>
                                    <div>[SMS]: {checkoutSummary.webhookLogs.smsDispatch}</div>
                                    <div>[WhatsApp]: {checkoutSummary.webhookLogs.whatsappDispatch}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side Column - Lab Analyzer, Biomarker Graphs & GL Costs */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Epic 2.A: Biomarker Delta Graph */}
                    <div className="liquid-glass-card p-6 shadow-xl relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                            <h3 className="font-bold text-gray-100 flex items-center gap-2">
                                <TrendingUp className="text-blue-400" size={18} />
                                Biomarker Metabolic Delta Engine
                            </h3>
                            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-mono uppercase">24m Velocity</span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <select
                                    value={biomarkerCode}
                                    onChange={e => setBiomarkerCode(e.target.value)}
                                    className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                >
                                    <option value="K_SERUM">Serum Potassium (K_SERUM)</option>
                                    <option value="HB_BLOOD">Hemoglobin (HB_BLOOD)</option>
                                    <option value="TROP_I">Troponin-I (TROP_I)</option>
                                </select>
                            </div>

                            {/* Chart representation */}
                            {biomarkerData && biomarkerData.datapoints.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="h-[120px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={biomarkerData.datapoints}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                                <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleDateString([], {month: 'short'})} tick={{fill: '#64748b', fontSize: 9}} />
                                                <YAxis tick={{fill: '#64748b', fontSize: 9}} />
                                                <Tooltip labelFormatter={(t) => new Date(t).toLocaleString()} contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', fontSize: 10}} />
                                                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{fill: '#3b82f6', r: 3}} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Calculated Velocity Rate (ΔV):</span>
                                            <span className="font-bold text-white font-mono">{biomarkerData.calculatedDeltaVelocity.toFixed(4)} / day</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Dynamic Velocity Trend:</span>
                                            <span className={`font-bold font-mono ${
                                                biomarkerData.velocityTrend === 'ACCELERATING_UPWARD' ? 'text-rose-400' :
                                                biomarkerData.velocityTrend === 'ACCELERATING_DOWNWARD' ? 'text-blue-400' :
                                                'text-emerald-400'
                                            }`}>{biomarkerData.velocityTrend}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 italic py-8 text-center border border-dashed border-slate-800 rounded">No historical biomarkers logged in window.</p>
                            )}
                        </div>
                    </div>

                    {/* Epic 2.B & 2.C: Lab Analyzer Simulator */}
                    <div className="liquid-glass-card p-6 shadow-xl relative overflow-hidden group shadow-halo-emerald">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                            <h3 className="font-bold text-gray-100 flex items-center gap-2">
                                <Layers className="text-emerald-400" size={18} />
                                Lab Analyzer Panel Result Ingest
                            </h3>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono uppercase">Analyzer Run</span>
                        </div>

                        <form onSubmit={handleReleaseAnalyzerResult} className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] text-slate-400 block mb-1">Tracked Parameter</label>
                                    <select
                                        value={analyzerCode}
                                        onChange={e => setAnalyzerCode(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                                    >
                                        <option value="K_SERUM">Potassium</option>
                                        <option value="HB_BLOOD">Hemoglobin</option>
                                        <option value="TROP_I">Troponin-I</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 block mb-1">Measured Value</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.0001"
                                        placeholder="e.g. 6.80"
                                        value={analyzerVal}
                                        onChange={e => setAnalyzerVal(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={releasingResult}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded text-xs transition-colors flex items-center justify-center gap-1"
                            >
                                {releasingResult ? <Loader2 size={12} className="animate-spin" /> : <Activity size={12} />}
                                Release Result to Folio
                            </button>
                        </form>

                        <div className="mt-4 p-2 bg-rose-500/10 border border-rose-500/20 rounded text-[9px] text-rose-400 space-y-0.5">
                            <strong>Panic Bounds Rules:</strong>
                            <div>• Serum Potassium &ge; 6.5 mmol/L</div>
                            <div>• Hemoglobin &le; 5.0 g/dL</div>
                            <div>• Troponin-I &ge; 0.5 ng/mL</div>
                        </div>
                    </div>

                    {/* System Console Logs Terminal */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[10px] space-y-2">
                        <div className="flex justify-between items-center text-slate-400 border-b border-white/5 pb-2">
                            <span>SYSTEM INTEGRITY LOGS</span>
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                        </div>
                        <div className="space-y-1 text-slate-400 min-h-[90px] max-h-[140px] overflow-y-auto">
                            {logs.length === 0 ? (
                                <div className="text-slate-600 italic">Logs terminal standing by...</div>
                            ) : logs.map((log, i) => (
                                <div key={i}>{log}</div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
