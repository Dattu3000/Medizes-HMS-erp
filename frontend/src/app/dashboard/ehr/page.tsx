'use client';
import { API_BASE } from '@/lib/api';
import { useState, useEffect, useCallback } from 'react';
import {
    Stethoscope, RefreshCcw, Bell, ChevronRight, UserCircle, Activity, Save,
    FlaskConical, Pill, FileText, Clock, AlertTriangle, Search, Plus, X, CheckCircle2,
    ArrowRightLeft, Send, Video, MonitorUp, Mic, MicOff, ShieldAlert, Loader2
} from 'lucide-react';

const API = `${API_BASE}/api`;

function getToken() {
    return localStorage.getItem('token') || '';
}

function apiFetch(path: string, opts: RequestInit = {}) {
    return fetch(`${API}${path}`, {
        ...opts,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`,
            ...opts.headers
        }
    });
}

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface Patient {
    id: string; uhid: string; firstName: string; lastName: string;
    age: number; gender: string; bloodGroup?: string; mobile: string;
}
interface LabOrder {
    id: string; testName: string; status: string; priority: string;
    resultText?: string; resultValue?: number; resultsPayload?: any[]; createdAt: string;
}
interface Prescription {
    id: string; medicines: any[]; status: string; createdAt: string;
}
interface Visit {
    id: string; patient: Patient; status: string; tokenNo: string;
    department: string; notes?: string; diagnosis?: string; symptoms?: string;
    labOrders: LabOrder[]; prescriptions: Prescription[]; createdAt: string;
}
interface Notification {
    id: string; type: string; title: string; body: string;
    priority: string; isRead: boolean; createdAt: string;
}
interface CatalogItem {
    id: string; testName: string; department: string; price: number;
}
interface InventoryItem {
    id: string; drugName: string; stockQuantity: number; unitPrice: number;
}

// â”€â”€â”€ Sub-Components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        'WAITING': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
        'WAITING_VIRTUAL': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
        'IN_CONSULTATION': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
        'COMPLETED': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
        'PENDING': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
        'SAMPLE_COLLECTED': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
        'RESULT_ENTERED': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
        'DISPENSED': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
        'STAT': 'bg-red-500/15 text-red-400 border-red-500/20',
        'HIGH': 'bg-orange-500/15 text-orange-400 border-orange-500/20',
        'ROUTINE': 'bg-slate-500/15 text-slate-400 border-slate-500/20',
    };
    return (
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${colors[status] || 'bg-slate-700 text-slate-300 border-slate-600'}`}>
            {status.replace(/_/g, ' ')}
        </span>
    );
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function DoctorEHRPage() {
    const [visits, setVisits] = useState<Visit[]>([]);
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
    const [activeTab, setActiveTab] = useState<'notes' | 'lab' | 'rx' | 'history' | 'referrals'>('notes');
    const [loading, setLoading] = useState(true);

    // Notes state
    const [noteContent, setNoteContent] = useState('');
    const [diagnosisContent, setDiagnosisContent] = useState('');
    const [symptomsContent, setSymptomsContent] = useState('');
    const [savingNote, setSavingNote] = useState(false);
    const [noteSaved, setNoteSaved] = useState(false);

    // Lab ordering state
    const [labCatalog, setLabCatalog] = useState<CatalogItem[]>([]);
    const [labSearch, setLabSearch] = useState('');
    const [orderingLab, setOrderingLab] = useState(false);

    // Prescription state
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [rxSearch, setRxSearch] = useState('');
    const [rxItems, setRxItems] = useState<{ drugName: string; dosage: string; frequency: string; days: string }[]>([]);
    const [submittingRx, setSubmittingRx] = useState(false);
    const [rxErrors, setRxErrors] = useState<string | null>(null);
    const [invalidRxIndices, setInvalidRxIndices] = useState<Set<number>>(new Set());

    // Notifications
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifs, setShowNotifs] = useState(false);

    // Referrals
    const [myReferrals, setMyReferrals] = useState<any[]>([]);
    const [referralForm, setReferralForm] = useState({ toHospital: '', reason: '' });
    const [creatingReferral, setCreatingReferral] = useState(false);

    // Ambient Scribe & AI Safety
    const [scribeStatus, setScribeStatus] = useState<'INACTIVE' | 'RECORDING' | 'PROCESSING' | 'REVIEW_READY'>('INACTIVE');
    const [scribeDraft, setScribeDraft] = useState<any>(null);
    const [scribeConsent, setScribeConsent] = useState(false);
    const [safetyAlert, setSafetyAlert] = useState<any>(null);

    // â”€â”€â”€ Data Fetching â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const loadVisits = useCallback(async () => {
        try {
            setLoading(true);
            const res = await apiFetch('/patient/ehr/visits');
            if (res.ok) {
                const data = await res.json();
                setVisits(data);
                if (data.length > 0 && !selectedVisit) {
                    selectVisit(data[0]);
                }
            }
        } catch (err) { console.error('Failed to load visits', err); }
        finally { setLoading(false); }
    }, []);

    const loadNotifications = useCallback(async () => {
        try {
            const res = await apiFetch('/notifications');
            if (res.ok) setNotifications(await res.json());
        } catch (err) { console.error(err); }
    }, []);

    const loadLabCatalog = useCallback(async () => {
        try {
            const res = await apiFetch('/lab/catalog');
            if (res.ok) setLabCatalog(await res.json());
        } catch (err) { console.error(err); }
    }, []);

    const loadInventory = useCallback(async () => {
        try {
            const res = await apiFetch('/pharmacy/inventory');
            if (res.ok) setInventory(await res.json());
        } catch (err) { console.error(err); }
    }, []);

    const loadReferrals = useCallback(async () => {
        try {
            const res = await apiFetch('/referrals/my-referrals');
            if (res.ok) setMyReferrals(await res.json());
        } catch (err) { console.error(err); }
    }, []);

    useEffect(() => {
        loadVisits();
        loadLabCatalog();
        loadInventory();
        loadNotifications();
        loadReferrals();

        // Poll notifications every 30s
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // â”€â”€â”€ Visit Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const selectVisit = async (v: Visit) => {
        setSelectedVisit(v);
        setNoteContent(v.notes || '');
        setDiagnosisContent(v.diagnosis || '');
        setSymptomsContent(v.symptoms || '');
        setNoteSaved(false);
        setRxItems([]);
        
        // Reset AI states
        setScribeStatus('INACTIVE');
        setScribeDraft(null);
        setScribeConsent(false);
        setSafetyAlert(null);

        // Fetch Safety Check silently in the background
        try {
            const res = await apiFetch(`/ai/safety-check/${v.patient.id}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.riskLevel && data.riskLevel !== 'LOW' && data.riskLevel !== 'UNKNOWN') {
                    setSafetyAlert(data);
                }
            }
        } catch (e) { console.error("Safety check failed", e); }
    };

    const handleStartConsultation = async (v: Visit) => {
        if (v.status !== 'WAITING') return;
        try {
            const res = await apiFetch(`/patient/ehr/visit-status/${v.id}`, {
                method: 'PUT', body: JSON.stringify({ status: 'IN_CONSULTATION' })
            });
            if (res.ok) loadVisits();
        } catch (err) { console.error(err); }
    };

    const handleStartTelemed = async () => {
        if (!selectedVisit) return;
        try {
            const res = await apiFetch('/telemed/session', {
                method: 'POST', body: JSON.stringify({ visitId: selectedVisit.id })
            });
            if (res.ok) {
                const data = await res.json();
                window.open(data.session.meetingLink, '_blank');
                loadVisits();
            } else {
                alert('Failed to start telemedicine session');
            }
        } catch (err) { console.error(err); }
    };

    const handleCompleteVisit = async () => {
        if (!selectedVisit) return;
        try {
            const res = await apiFetch(`/patient/ehr/visit-status/${selectedVisit.id}`, {
                method: 'PUT', body: JSON.stringify({ status: 'COMPLETED' })
            });
            if (res.ok) {
                setSelectedVisit(null);
                loadVisits();
            }
        } catch (err) { console.error(err); }
    };

    // â”€â”€â”€ Notes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleSaveNote = async () => {
        if (!selectedVisit) return;
        setSavingNote(true);
        try {
            const res = await apiFetch(`/patient/ehr/note/${selectedVisit.id}`, {
                method: 'PUT',
                body: JSON.stringify({ notes: noteContent, diagnosis: diagnosisContent, status: selectedVisit.status })
            });
            if (res.ok) { setNoteSaved(true); setTimeout(() => setNoteSaved(false), 3000); }
        } catch (err) { console.error(err); }
        finally { setSavingNote(false); }
    };

    const handleStartAmbientScribe = async () => {
        if (!scribeConsent) {
            alert('Digital Consent to Record must be checked before capturing ambient audio.');
            return;
        }
        setScribeStatus('RECORDING');
        // Simulate recording time and then processing
        setTimeout(async () => {
            setScribeStatus('PROCESSING');
            try {
                const res = await apiFetch('/ehr/ambient-scribe', {
                    method: 'POST',
                    body: JSON.stringify({ visitId: selectedVisit!.id, status: 'PROCESSING', audioStreamUrl: 's3://secure-vault/audio/mock-stream' })
                });
                if (res.ok) {
                    const data = await res.json();
                    setScribeDraft(data.soapNote);
                    setScribeStatus('REVIEW_READY');
                } else {
                    setScribeStatus('INACTIVE');
                }
            } catch (e) {
                setScribeStatus('INACTIVE');
            }
        }, 3000);
    };

    const handleApplyScribeDraft = () => {
        if (!scribeDraft) return;
        // Injecting the SOAP note into the legacy Note format for backwards compatibility
        setSymptomsContent(`Subjective:\n${scribeDraft.Subjective || ''}\n\nObjective:\n${scribeDraft.Objective || ''}`);
        setDiagnosisContent(scribeDraft.Assessment || '');
        setNoteContent(`Plan:\n${scribeDraft.Plan || ''}`);
        
        setScribeDraft(null);
        setScribeStatus('INACTIVE');
    };

    // ─── Lab Ordering ────────────────────────────────────────────────
        const handleUndoLab = async (id: string) => {
        if (!confirm('Are you sure you want to undo this lab order?')) return;
        try {
            const res = await apiFetch(`/patient/ehr/lab-order/${id}`, { method: 'DELETE' });
            if (res.ok) loadVisits();
            else alert('Failed to undo or it is already being processed.');
        } catch (err) { console.error(err); }
    };

    const handleOrderLab = async (testId: string, priority: string = 'ROUTINE') => {
        if (!selectedVisit) return;
        setOrderingLab(true);
        try {
            const res = await apiFetch('/patient/ehr/lab-order', {
                method: 'POST',
                body: JSON.stringify({ visitId: selectedVisit.id, testId, priority })
            });
            if (res.ok) { loadVisits(); setLabSearch(''); }
        } catch (err) { console.error(err); }
        finally { setOrderingLab(false); }
    };

    // ─── Prescription ──────────────────────────────────
    const addRxItem = (drugName: string) => {
        if (rxItems.find(r => r.drugName === drugName)) return;
        setRxItems([...rxItems, { drugName, dosage: '', frequency: '', days: '' }]);
        setRxSearch('');
        setRxErrors(null);
    };

    const updateRxItem = (i: number, field: string, value: string) => {
        const updated = [...rxItems];
        (updated[i] as any)[field] = value;
        setRxItems(updated);
    };

    const clearRxError = (index: number) => {
        if (invalidRxIndices.has(index)) {
            const nextIndices = new Set(invalidRxIndices);
            nextIndices.delete(index);
            setInvalidRxIndices(nextIndices);
            if (nextIndices.size === 0) {
                setRxErrors(null);
            }
        }
    };

    const removeRxItem = (i: number) => {
        setRxItems(rxItems.filter((_, idx) => idx !== i));
        if (invalidRxIndices.has(i)) {
            const nextIndices = new Set<number>();
            invalidRxIndices.forEach(val => {
                if (val > i) nextIndices.add(val - 1);
                else if (val < i) nextIndices.add(val);
            });
            setInvalidRxIndices(nextIndices);
            if (nextIndices.size === 0) {
                setRxErrors(null);
            }
        }
    };

    const handleUndoRx = async (id: string) => {
        if (!confirm('Are you sure you want to undo this prescription?')) return;
        try {
            const res = await apiFetch(`/patient/ehr/prescription/${id}`, { method: 'DELETE' });
            if (res.ok) loadVisits();
            else alert('Failed to undo or it is already dispensed.');
        } catch (err) { console.error(err); }
    };

    const handleSubmitRx = async () => {
        if (!selectedVisit || rxItems.length === 0) return;

        // Client-side validation checks
        const invalidSet = new Set<number>();
        for (let i = 0; i < rxItems.length; i++) {
            const item = rxItems[i];
            const daysNum = Number(item.days);
            if (!item.dosage.trim() || !item.frequency.trim() || isNaN(daysNum) || daysNum <= 0) {
                invalidSet.add(i);
            }
        }

        if (invalidSet.size > 0) {
            setInvalidRxIndices(invalidSet);
            setRxErrors('Please fill in all prescription fields with valid values. Highlighted fields in red are missing or incorrect.');
            return;
        }

        setRxErrors(null);
        setInvalidRxIndices(new Set());
        setSubmittingRx(true);
        try {
            // 1. AI Interaction Check
            const checkRes = await apiFetch('/patient/ehr/prescriptions/check-interactions', {
                method: 'POST',
                body: JSON.stringify({ patientId: selectedVisit.patient.id, newMedicines: rxItems })
            });

            if (checkRes.ok) {
                const aiCheck = await checkRes.json();
                if (aiCheck.hasInteractions && (aiCheck.severity === 'SEVERE' || aiCheck.severity === 'MODERATE')) {
                    const proceed = window.confirm(`\u26A0\uFE0F AI DRUG INTERACTION WARNING (${aiCheck.severity})\n\n${aiCheck.warnings.join('\n')}\n\nDo you want to override and prescribe anyway?`);
                    if (!proceed) {
                        setSubmittingRx(false);
                        return;
                    }
                }
            }

            const res = await apiFetch('/patient/ehr/prescription', {
                method: 'POST',
                body: JSON.stringify({ visitId: selectedVisit.id, medicines: rxItems })
            });
            if (res.ok) { setRxItems([]); loadVisits(); }
            else {
                const data = await res.json();
                alert(data.message || 'Failed to submit prescription');
            }
        } catch (err) { console.error(err); }
        finally { setSubmittingRx(false); }
    };

    // â”€â”€â”€ Notification Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const markNotifRead = async (id: string) => {
        await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
        loadNotifications();
    };

    // â”€â”€â”€ Referrals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleCreateReferral = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVisit) return;
        setCreatingReferral(true);
        try {
            const res = await apiFetch('/referrals', {
                method: 'POST',
                body: JSON.stringify({
                    patientId: selectedVisit.patient.id,
                    toHospital: referralForm.toHospital,
                    reason: referralForm.reason
                })
            });
            if (res.ok) {
                setReferralForm({ toHospital: '', reason: '' });
                loadReferrals();
            } else {
                alert('Failed to create referral');
            }
        } catch (err) { console.error(err); }
        finally { setCreatingReferral(false); }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // â”€â”€â”€ Filtered data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const filteredCatalog = labCatalog.filter(t =>
        t.testName.toLowerCase().includes(labSearch.toLowerCase()) ||
        t.department.toLowerCase().includes(labSearch.toLowerCase())
    );
    const filteredInventory = inventory.filter(m =>
        m.drugName.toLowerCase().includes(rxSearch.toLowerCase())
    );

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // RENDER
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                        <Stethoscope size={20} className="text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-[20px] font-bold text-gray-50 tracking-tight">Doctor's EHR</h1>
                        <p className="text-[12px] text-gray-500">Clinical Workstation · {visits.length} in queue</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={loadVisits} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white transition">
                        <RefreshCcw size={16} />
                    </button>
                    <div className="relative">
                        <button onClick={() => setShowNotifs(!showNotifs)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white transition relative">
                            <Bell size={16} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>
                            )}
                        </button>
                        {showNotifs && (
                            <div className="absolute right-0 top-10 w-[360px] bg-[#111827] border border-slate-700 rounded-xl shadow-2xl z-50 max-h-[400px] overflow-y-auto">
                                <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                                    <span className="text-[13px] font-bold text-gray-200">Notifications</span>
                                    <button onClick={() => setShowNotifs(false)}><X size={14} className="text-gray-500" /></button>
                                </div>
                                {notifications.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500 text-[13px]">No notifications</div>
                                ) : notifications.slice(0, 15).map(n => (
                                    <div key={n.id} onClick={() => markNotifRead(n.id)}
                                        className={`p-3 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800/50 transition ${!n.isRead ? 'bg-blue-500/5' : ''}`}>
                                        <div className="flex items-start gap-2">
                                            {n.priority === 'CRITICAL' ? <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" /> : <Bell size={14} className="text-blue-400 mt-0.5 shrink-0" />}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[12px] font-semibold text-gray-200 truncate">{n.title}</div>
                                                <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.body}</div>
                                            </div>
                                            {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Grid Layout */}
            <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">

                {/* â”€â”€â”€â”€â”€ LEFT: Patient Queue â”€â”€â”€â”€â”€ */}
                <div className="col-span-3 bg-[#111827] rounded-xl border border-slate-800 flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-slate-800">
                        <h3 className="text-[12px] font-bold text-gray-400 tracking-widest uppercase">Patient Queue</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-6 text-center text-gray-500 text-[13px]">Loading...</div>
                        ) : visits.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 text-[13px]">No patients in queue</div>
                        ) : visits.map(v => (
                            <div key={v.id}
                                onClick={() => selectVisit(v)}
                                className={`p-3 border-b border-slate-800/50 cursor-pointer transition-colors group ${selectedVisit?.id === v.id ? 'bg-blue-600/10 border-l-2 border-l-blue-500' : 'hover:bg-slate-800/50 border-l-2 border-l-transparent'}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <UserCircle size={14} className="text-blue-400" />
                                        <span className="text-[13px] font-semibold text-gray-200">{v.patient.firstName} {v.patient.lastName}</span>
                                    </div>
                                    <StatusBadge status={v.status} />
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-gray-500 ml-5">
                                    <span>Token #{v.tokenNo} · {v.patient.age}{v.patient.gender?.[0]}</span>
                                    <span>{new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                {(v.status === 'WAITING' || v.status === 'WAITING_VIRTUAL') && (
                                    <button onClick={(e) => { e.stopPropagation(); handleStartConsultation(v); }}
                                        className="mt-2 ml-5 text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
                                        <ArrowRightLeft size={12} /> Start Consultation
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* â”€â”€â”€â”€â”€ CENTER: Clinical Workspace â”€â”€â”€â”€â”€ */}
                <div className="col-span-6 bg-[#111827] rounded-xl border border-slate-800 flex flex-col overflow-hidden">
                    {/* Workspace Tabs */}
                    <div className="flex items-center gap-0 border-b border-slate-800 px-1 shrink-0 relative">
                        {([
                            { key: 'notes', label: 'Clinical Notes', icon: FileText },
                            { key: 'lab', label: 'Lab Orders', icon: FlaskConical },
                            { key: 'rx', label: 'Prescriptions', icon: Pill },
                            { key: 'history', label: 'Visit History', icon: Clock },
                            { key: 'referrals', label: 'Referrals', icon: Send },
                        ] as const).map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-1.5 px-4 py-3 text-[12px] font-semibold transition border-b-2 relative ${activeTab === tab.key ? 'text-blue-400 border-blue-500' : 'text-gray-500 hover:text-gray-300 border-transparent'} ${tab.key === 'notes' && scribeStatus === 'PROCESSING' ? 'animate-pulse text-indigo-400' : ''}`}>
                                <tab.icon size={14} /> {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {!selectedVisit ? (
                            <div className="h-full flex items-center justify-center text-gray-500 text-[13px]">Select a patient from the queue</div>
                        ) : (
                            <>
                                {/* MULTI-MODAL SAFETY OVERLAY */}
                                {safetyAlert && (
                                    <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-3 animate-in fade-in slide-in-from-top-4">
                                        <ShieldAlert size={24} className="text-red-400 shrink-0 mt-0.5" />
                                        <div>
                                            <h3 className="text-[13px] font-bold text-red-400 uppercase tracking-wide flex items-center gap-2">
                                                Clinical Risk Overlay <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{safetyAlert.riskLevel} RISK</span>
                                            </h3>
                                            <div className="text-[12px] text-red-300 mt-1 space-y-1">
                                                {safetyAlert.findings?.map((f: any, idx: number) => (
                                                    <div key={idx}><strong>{f.source}:</strong> {f.detail}</div>
                                                ))}
                                            </div>
                                            <div className="mt-2 text-[12px] font-semibold text-red-200">
                                                Recommendation: {safetyAlert.recommendation}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* â”€â”€ NOTES TAB â”€â”€ */}
                                {activeTab === 'notes' && (
                                    <div className="space-y-4">
                                        {scribeStatus === 'REVIEW_READY' && scribeDraft && (
                                            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 mb-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="text-[12px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                                        <FileText size={14} /> AI Scribe Draft Ready
                                                    </h4>
                                                    <button onClick={handleApplyScribeDraft} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-[11px] font-bold transition">
                                                        Apply SOAP Draft
                                                    </button>
                                                </div>
                                                <div className="text-[11px] text-indigo-300 grid grid-cols-2 gap-4">
                                                    <div><strong>Subjective:</strong> {scribeDraft.Subjective}</div>
                                                    <div><strong>Objective:</strong> {scribeDraft.Objective}</div>
                                                    <div><strong>Assessment:</strong> {scribeDraft.Assessment}</div>
                                                    <div><strong>Plan:</strong> {scribeDraft.Plan}</div>
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Symptoms / Chief Complaint</label>
                                            <textarea value={symptomsContent} onChange={e => setSymptomsContent(e.target.value)}
                                                className="w-full h-[80px] bg-slate-900 border border-slate-700 rounded-lg p-3 text-[13px] text-gray-200 resize-none focus:outline-none focus:ring-1 focus:ring-blue-600"
                                                placeholder="Enter presenting symptoms..." />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Clinical Notes</label>
                                            <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)}
                                                className="w-full h-[140px] bg-slate-900 border border-slate-700 rounded-lg p-3 text-[13px] text-gray-200 resize-none focus:outline-none focus:ring-1 focus:ring-blue-600"
                                                placeholder="Enter examination findings, observations..." />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Diagnosis</label>
                                            <input type="text" value={diagnosisContent} onChange={e => setDiagnosisContent(e.target.value)}
                                                className="w-full h-[44px] bg-slate-900 border border-slate-700 rounded-lg px-3 text-[13px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                                placeholder="Enter diagnosis..." />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={handleSaveNote} disabled={savingNote}
                                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold transition disabled:opacity-50">
                                                <Save size={14} /> {savingNote ? 'Saving...' : 'Save Notes'}
                                            </button>
                                            {noteSaved && <span className="text-[12px] text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle2 size={14} /> Saved successfully</span>}
                                        </div>
                                    </div>
                                )}

                                {/* â”€â”€ LAB TAB â”€â”€ */}
                                {activeTab === 'lab' && (
                                    <div className="space-y-4">
                                        {/* Search & Order */}
                                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Search size={14} className="text-gray-500" />
                                                <input type="text" value={labSearch} onChange={e => setLabSearch(e.target.value)}
                                                    className="flex-1 bg-transparent text-[13px] text-gray-200 focus:outline-none" placeholder="Search lab catalog..." />
                                            </div>
                                            {labSearch && (
                                                <div className="max-h-[160px] overflow-y-auto">
                                                    {filteredCatalog.slice(0, 8).map(t => (
                                                        <div key={t.id} className="flex items-center justify-between py-1.5 px-2 hover:bg-slate-800 rounded text-[12px] cursor-pointer" onClick={() => handleOrderLab(t.id)}>
                                                            <div>
                                                                <span className="text-gray-200 font-medium">{t.testName}</span>
                                                                <span className="text-gray-500 ml-2">{t.department}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-gray-400">₹{t.price}</span>
                                                                <Plus size={14} className="text-blue-400" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Current Lab Orders */}
                                        <div>
                                            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Active Lab Orders ({selectedVisit.labOrders.length})</h4>
                                            {selectedVisit.labOrders.length === 0 ? (
                                                <div className="text-[12px] text-gray-500 py-4 text-center">No lab orders for this visit</div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {selectedVisit.labOrders.map(lo => (
                                                        <div key={lo.id} className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
                                                            <div>
                                                                <div className="text-[13px] font-medium text-gray-200">{lo.testName}</div>
                                                                <div className="text-[11px] text-gray-500 mt-0.5">
                                                                    {new Date(lo.createdAt).toLocaleString()} · <StatusBadge status={lo.priority} />
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <StatusBadge status={lo.status} />
                                                                {lo.status === 'RESULT_ENTERED' ? (
                                                                    <div className="mt-2 text-right">
                                                                        <a href={`/dashboard/lab/report/${lo.id}`} target="_blank" rel="noopener noreferrer" className="text-[11px] bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 px-3 py-1.5 rounded-full font-bold inline-flex items-center gap-1 transition">
                                                                            <FileText size={12} /> View Report
                                                                        </a>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex justify-end mt-2">
                                                                        <button onClick={() => handleUndoLab(lo.id)} className="text-[11px] bg-red-600/20 text-red-400 hover:bg-red-600/30 px-3 py-1 rounded-full font-bold transition">Undo</button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* â”€â”€ PRESCRIPTION TAB â”€â”€ */}
                                {activeTab === 'rx' && (
                                    <div className="space-y-4">
                                        {/* Search inventory */}
                                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Search size={14} className="text-gray-500" />
                                                <input type="text" value={rxSearch} onChange={e => setRxSearch(e.target.value)}
                                                    className="flex-1 bg-transparent text-[13px] text-gray-200 focus:outline-none" placeholder="Search medicine inventory..." />
                                            </div>
                                            {rxSearch && (
                                                <div className="max-h-[160px] overflow-y-auto">
                                                    {filteredInventory.slice(0, 8).map(m => (
                                                        <div key={m.id} className="flex items-center justify-between py-1.5 px-2 hover:bg-slate-800 rounded text-[12px] cursor-pointer" onClick={() => addRxItem(m.drugName)}>
                                                            <span className="text-gray-200 font-medium">{m.drugName}</span>
                                                            <div className="flex items-center gap-3">
                                                                <span className={`text-[11px] ${m.stockQuantity < 10 ? 'text-red-400' : 'text-gray-500'}`}>Qty: {m.stockQuantity}</span>
                                                                <Plus size={14} className="text-blue-400" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Selected Rx Items */}
                                        {rxItems.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Prescription Items</h4>
                                                
                                                {rxErrors && (
                                                    <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-[12px] font-medium flex items-start gap-2 animate-pulse">
                                                        <ShieldAlert size={14} className="shrink-0 mt-0.5 text-red-400" />
                                                        <span>{rxErrors}</span>
                                                    </div>
                                                )}

                                                {rxItems.map((item, i) => {
                                                    const isInvalid = invalidRxIndices.has(i);
                                                    return (
                                                        <div key={i} className="bg-slate-900/50 border border-slate-700 rounded-lg p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-[13px] font-semibold text-gray-200">{item.drugName}</span>
                                                                <button onClick={() => removeRxItem(i)}><X size={14} className="text-red-400" /></button>
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <input placeholder="Dosage" value={item.dosage} onChange={e => { updateRxItem(i, 'dosage', e.target.value); clearRxError(i); }}
                                                                    className={`bg-slate-800 border rounded px-2 py-1.5 text-[12px] text-gray-200 focus:outline-none focus:ring-1 transition-colors ${isInvalid && !item.dosage.trim() ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-blue-600'}`} />
                                                                <input placeholder="Frequency" value={item.frequency} onChange={e => { updateRxItem(i, 'frequency', e.target.value); clearRxError(i); }}
                                                                    className={`bg-slate-800 border rounded px-2 py-1.5 text-[12px] text-gray-200 focus:outline-none focus:ring-1 transition-colors ${isInvalid && !item.frequency.trim() ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-blue-600'}`} />
                                                                <input placeholder="Days" value={item.days} onChange={e => { updateRxItem(i, 'days', e.target.value); clearRxError(i); }}
                                                                    className={`bg-slate-800 border rounded px-2 py-1.5 text-[12px] text-gray-200 focus:outline-none focus:ring-1 transition-colors ${isInvalid && (isNaN(Number(item.days)) || Number(item.days) <= 0) ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-blue-600'}`} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <button onClick={handleSubmitRx} disabled={submittingRx}
                                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold transition disabled:opacity-50 w-full justify-center">
                                                    <Send size={14} /> {submittingRx ? 'Submitting...' : 'Submit Prescription'}
                                                </button>
                                            </div>
                                        )}

                                        {/* Existing Prescriptions */}
                                        <div>
                                            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Existing Prescriptions ({selectedVisit.prescriptions.length})</h4>
                                            {selectedVisit.prescriptions.length === 0 ? (
                                                <div className="text-[12px] text-gray-500 py-4 text-center">No prescriptions for this visit</div>
                                            ) : selectedVisit.prescriptions.map(rx => (
                                                <div key={rx.id} className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 mb-2">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[12px] text-gray-400">{new Date(rx.createdAt).toLocaleString()}</span>
                                                        <div className="flex items-center gap-2">
                                                            {rx.status === 'PENDING' && (
                                                                <button onClick={() => handleUndoRx(rx.id)} className="text-[10px] bg-red-600/20 text-red-400 hover:bg-red-600/30 px-2 py-0.5 rounded font-bold transition">Undo</button>
                                                            )}
                                                            <StatusBadge status={rx.status} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {(rx.medicines as any[]).map((med: any, j: number) => (
                                                            <div key={j} className="text-[12px] text-gray-300 flex items-center gap-2">
                                                                <Pill size={12} className="text-gray-500" />
                                                                <span className="font-medium">{med.drugName}</span>
                                                                <span className="text-gray-500">· {med.dosage} · {med.frequency} · {med.days} days</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* â”€â”€ HISTORY TAB â”€â”€ */}
                                {activeTab === 'history' && (
                                    <div className="space-y-3">
                                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Visit Timeline</div>
                                        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Clock size={14} className="text-blue-400" />
                                                <span className="text-[13px] font-semibold text-gray-200">Current Visit</span>
                                                <StatusBadge status={selectedVisit.status} />
                                            </div>
                                            <div className="text-[12px] text-gray-400 space-y-1 ml-5">
                                                <div>Token: #{selectedVisit.tokenNo} · Dept: {selectedVisit.department}</div>
                                                <div>Created: {new Date(selectedVisit.createdAt).toLocaleString()}</div>
                                                <div>Lab Orders: {selectedVisit.labOrders.length} · Prescriptions: {selectedVisit.prescriptions.length}</div>
                                                {selectedVisit.diagnosis && <div>Diagnosis: <span className="text-gray-200">{selectedVisit.diagnosis}</span></div>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* â”€â”€ REFERRALS TAB â”€â”€ */}
                                {activeTab === 'referrals' && (
                                    <div className="space-y-4">
                                        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                                            <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-3">Create Outward Referral</h4>
                                            <form onSubmit={handleCreateReferral} className="space-y-3">
                                                <div>
                                                    <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1">Destination Hospital/Clinic</label>
                                                    <input required type="text" value={referralForm.toHospital} onChange={e => setReferralForm({ ...referralForm, toHospital: e.target.value })}
                                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-[13px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                                        placeholder="e.g. City General Hospital" />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-semibold text-gray-500 uppercase block mb-1">Reason for Referral</label>
                                                    <textarea required value={referralForm.reason} onChange={e => setReferralForm({ ...referralForm, reason: e.target.value })}
                                                        className="w-full h-[60px] bg-slate-800 border border-slate-700 rounded-lg p-3 text-[13px] text-gray-200 resize-none focus:outline-none focus:ring-1 focus:ring-blue-600"
                                                        placeholder="e.g. Needs specialized cardiology consult..." />
                                                </div>
                                                <button type="submit" disabled={creatingReferral}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-[12px] font-semibold transition disabled:opacity-50">
                                                    {creatingReferral ? 'Creating...' : 'Generate Referral'}
                                                </button>
                                            </form>
                                        </div>

                                        <div>
                                            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">My Generated Referrals</h4>
                                            {myReferrals.length === 0 ? (
                                                <div className="text-[12px] text-gray-500 py-4 text-center">No referrals generated yet</div>
                                            ) : (
                                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                                    {myReferrals.map(ref => (
                                                        <div key={ref.id} className="bg-slate-900/50 border border-slate-700 rounded-lg p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div>
                                                                    <div className="text-[13px] font-bold text-gray-200">{ref.patient.firstName} {ref.patient.lastName}</div>
                                                                    <div className="text-[11px] text-gray-500">To: {ref.toHospital}</div>
                                                                </div>
                                                                <StatusBadge status={ref.status} />
                                                            </div>
                                                            <div className="text-[12px] text-gray-400 mb-2">{ref.reason}</div>
                                                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800">
                                                                <span className="text-[11px] text-gray-500">Token:</span>
                                                                <span className="text-[11px] font-mono p-1 bg-slate-800 rounded select-all text-blue-400">
                                                                    {ref.referralToken}
                                                                </span>
                                                                <button
                                                                    onClick={() => navigator.clipboard.writeText(ref.referralToken)}
                                                                    className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-gray-300 transition"
                                                                >
                                                                    Copy
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* â”€â”€â”€â”€â”€ RIGHT: Patient Summary â”€â”€â”€â”€â”€ */}
                <div className="col-span-3 flex flex-col gap-4 overflow-y-auto">
                    {selectedVisit ? (
                        <>
                            {/* Patient Card */}
                            <div className="bg-[#111827] rounded-xl border border-slate-800 p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
                                        <UserCircle size={20} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="text-[14px] font-bold text-gray-100">{selectedVisit.patient.firstName} {selectedVisit.patient.lastName}</div>
                                        <div className="text-[11px] text-gray-500">{selectedVisit.patient.uhid}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[12px]">
                                    <div className="bg-slate-900 rounded-lg p-2">
                                        <div className="text-gray-500 text-[10px] uppercase">Age</div>
                                        <div className="text-gray-200 font-semibold">{selectedVisit.patient.age}Y</div>
                                    </div>
                                    <div className="bg-slate-900 rounded-lg p-2">
                                        <div className="text-gray-500 text-[10px] uppercase">Gender</div>
                                        <div className="text-gray-200 font-semibold">{selectedVisit.patient.gender}</div>
                                    </div>
                                    <div className="bg-slate-900 rounded-lg p-2">
                                        <div className="text-gray-500 text-[10px] uppercase">Blood Group</div>
                                        <div className="text-gray-200 font-semibold">{selectedVisit.patient.bloodGroup || '—'}</div>
                                    </div>
                                    <div className="bg-slate-900 rounded-lg p-2">
                                        <div className="text-gray-500 text-[10px] uppercase">Contact</div>
                                        <div className="text-gray-200 font-semibold text-[11px]">{selectedVisit.patient.mobile}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Visit Info */}
                            <div className="bg-[#111827] rounded-xl border border-slate-800 p-4">
                                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Current Visit</h4>
                                <div className="space-y-2 text-[12px]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Status</span>
                                        <StatusBadge status={selectedVisit.status} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Token</span>
                                        <span className="text-gray-200 font-semibold">#{selectedVisit.tokenNo}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Department</span>
                                        <span className="text-gray-200">{selectedVisit.department}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Lab Ordered</span>
                                        <span className="text-gray-200 font-semibold">{selectedVisit.labOrders.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Prescriptions</span>
                                        <span className="text-gray-200 font-semibold">{selectedVisit.prescriptions.length}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-[#111827] rounded-xl border border-slate-800 p-4">
                                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h4>
                                <div className="space-y-2">
                                    <button onClick={() => setActiveTab('lab')} className="w-full flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-gray-300 p-2.5 rounded-lg text-[12px] font-medium transition">
                                        <FlaskConical size={14} className="text-blue-400" /> Order Lab Test
                                    </button>
                                    <button onClick={() => setActiveTab('rx')} className="w-full flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-gray-300 p-2.5 rounded-lg text-[12px] font-medium transition">
                                        <Pill size={14} className="text-emerald-400" /> Write Prescription
                                    </button>
                                    
                                    <a href={`/dashboard/radiology/dicom/${selectedVisit.id}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-gray-300 p-2.5 rounded-lg text-[12px] font-medium transition">
                                        <MonitorUp size={14} className="text-purple-400" /> View DICOM Scans
                                    </a>

                                    {/* Ambient Scribe Quick Action */}
                                    <div className="pt-2 border-t border-slate-800">
                                        <label className="flex items-center gap-2 text-[11px] text-gray-400 mb-2 cursor-pointer">
                                            <input type="checkbox" checked={scribeConsent} onChange={e => setScribeConsent(e.target.checked)} className="rounded border-slate-600 bg-slate-800" />
                                            Patient Consent to Record
                                        </label>
                                        <button onClick={handleStartAmbientScribe} disabled={scribeStatus === 'RECORDING' || scribeStatus === 'PROCESSING' || scribeStatus === 'REVIEW_READY'} 
                                            className={`w-full flex justify-center items-center gap-2 border p-2.5 rounded-lg text-[12px] font-bold transition
                                            ${scribeStatus === 'INACTIVE' ? 'bg-indigo-600/20 text-indigo-400 border-indigo-600/50 hover:bg-indigo-600/30' : ''}
                                            ${scribeStatus === 'RECORDING' ? 'bg-red-600/20 text-red-400 border-red-600/50 animate-pulse' : ''}
                                            ${scribeStatus === 'PROCESSING' ? 'bg-slate-800 text-slate-400 border-slate-700' : ''}
                                            ${scribeStatus === 'REVIEW_READY' ? 'bg-emerald-600/20 text-emerald-400 border-emerald-600/50' : ''}
                                            `}>
                                            {scribeStatus === 'INACTIVE' && <><Mic size={14} /> Start Ambient Scribe</>}
                                            {scribeStatus === 'RECORDING' && <><Mic size={14} /> Recording Active...</>}
                                            {scribeStatus === 'PROCESSING' && <><Loader2 size={14} className="animate-spin" /> Processing NLP...</>}
                                            {scribeStatus === 'REVIEW_READY' && <><CheckCircle2 size={14} /> Scribe Draft Ready</>}
                                        </button>
                                    </div>

                                    {(selectedVisit.status === 'WAITING' || selectedVisit.status === 'WAITING_VIRTUAL' || selectedVisit.status === 'IN_CONSULTATION') && (
                                        <button onClick={handleStartTelemed} className="w-full flex items-center gap-2 bg-indigo-900/40 hover:bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 p-2.5 rounded-lg text-[12px] font-medium transition">
                                            <Video size={14} className="text-indigo-400" /> Start Virtual Room
                                        </button>
                                    )}
                                    {selectedVisit.status === 'IN_CONSULTATION' && (
                                        <button onClick={handleCompleteVisit}
                                            className="w-full flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-lg text-[12px] font-bold transition justify-center">
                                            <CheckCircle2 size={14} /> Complete Visit
                                        </button>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-[#111827] rounded-xl border border-slate-800 p-6 flex flex-col items-center justify-center text-center h-full">
                            <Stethoscope size={32} className="text-slate-600 mb-3" />
                            <div className="text-[13px] text-gray-500">Select a patient from the queue to begin</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
