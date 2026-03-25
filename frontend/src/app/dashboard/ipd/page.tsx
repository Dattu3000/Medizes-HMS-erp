'use client';

import { useState, useEffect } from 'react';
import { BedDouble, Users, IndianRupee, FileText, CheckCircle2 } from 'lucide-react';

export default function IPDPage() {
    const [activeTab, setActiveTab] = useState<'wards' | 'billing' | 'assets'>('wards');
    const [loading, setLoading] = useState(false);

    const [wards, setWards] = useState<any[]>([]);
    const [admissions, setAdmissions] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);

    // Modals / Specific UI state
    const [selectedBed, setSelectedBed] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [patientResults, setPatientResults] = useState<any[]>([]);
    const [selectedPatientForAdmission, setSelectedPatientForAdmission] = useState<any>(null);
    const [selectedDoctorId, setSelectedDoctorId] = useState('');

    // Billing selection
    const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
    const [chargeForm, setChargeForm] = useState({ chargeType: 'DAILY_RENT', description: '', amount: '' });

    // Asset Management State
    const [wardForm, setWardForm] = useState({ name: '', type: 'GENERAL', capacity: '' });
    const [bedForm, setBedForm] = useState({ bedNumber: '', wardId: '', dailyRent: '' });

    useEffect(() => {
        fetchWards();
        fetchAdmissions();
        fetchDoctors();
    }, []);

    const fetchWards = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/ipd/wards', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) setWards(await res.json());
            else setWards([]);
        } catch (err) { console.error(err); setWards([]); }
    };

    const fetchAdmissions = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/ipd/admissions', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) setAdmissions(await res.json());
            else setAdmissions([]);
        } catch (err) { console.error(err); setAdmissions([]); }
    };

    const fetchDoctors = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/patient/doctors', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) setDoctors(await res.json());
            else setDoctors([]);
        } catch (err) { console.error(err); setDoctors([]); }
    };

    const executePatientSearch = async () => {
        if (!searchQuery) return;
        try {
            const res = await fetch(`http://localhost:5000/api/patient/search?query=${searchQuery}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) setPatientResults(await res.json());
            else setPatientResults([]);
        } catch (err) { console.error(err); setPatientResults([]); }
    };

    const handleAdmit = async () => {
        if (!selectedPatientForAdmission || !selectedDoctorId || !selectedBed) return;
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/ipd/admit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    patientId: selectedPatientForAdmission.id,
                    doctorId: selectedDoctorId,
                    bedId: selectedBed.id,
                    depositAmount: 5000 // assuming base initial deposit
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert("Patient Admitted Successfully!");
                setSelectedBed(null);
                setSelectedPatientForAdmission(null);
                fetchWards();
                fetchAdmissions();
            } else {
                alert(data.message);
            }
        } catch (err) { console.error(err) }
        setLoading(false);
    };

    const handleChargeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAdmission) return;
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/ipd/charge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    admissionId: selectedAdmission.id,
                    ...chargeForm
                })
            });
            if (res.ok) {
                setChargeForm({ chargeType: 'DAILY_RENT', description: '', amount: '' });
                loadFullAdmissionDetails(selectedAdmission.id); // reload the view
                alert("Charge appended to IPD Bill");
            }
        } catch (err) { console.error(err) }
        setLoading(false);
    };

    const loadFullAdmissionDetails = async (id: string) => {
        try {
            const res = await fetch(`http://localhost:5000/api/ipd/admissions/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) setSelectedAdmission(await res.json());
            else setSelectedAdmission(null);
        } catch (err) { console.error(err); setSelectedAdmission(null); }
    };

    const handleDischarge = async () => {
        if (!selectedAdmission) return;
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/ipd/discharge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ admissionId: selectedAdmission.id, paymentMode: 'CASH' })
            });
            const data = await res.json();
            if (res.ok) {
                alert(`Discharge Successful! Bill No: ${data.bill.billNo}`);
                setSelectedAdmission(null);
                fetchWards();
                fetchAdmissions();
            }
        } catch (err) { console.error(err) }
        setLoading(false);
    };

    const handleCreateWard = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/ipd/wards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify(wardForm)
            });
            if (res.ok) {
                alert("Ward created successfully");
                setWardForm({ name: '', type: 'GENERAL', capacity: '' });
                fetchWards();
            } else {
                alert("Failed to create ward");
            }
        } catch (err) { console.error(err) }
        setLoading(false);
    };

    const handleCreateBed = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/ipd/beds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify(bedForm)
            });
            if (res.ok) {
                alert("Bed added successfully");
                setBedForm({ bedNumber: '', wardId: '', dailyRent: '' });
                fetchWards();
            } else {
                alert("Failed to create bed");
            }
        } catch (err) { console.error(err) }
        setLoading(false);
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-glass-title tracking-tight">IPD Wards & Billing</h1>
            </div>

            <div className="liquid-glass-card rounded-xl    overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-white/10 bg-black/20">
                    <button
                        onClick={() => setActiveTab('wards')}
                        className={`flex-1 py-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'wards' ? 'border-sky-600 justify-center text-sky-600 bg-white' : 'border-transparent text-glass-body hover:text-glass-title'}`}
                    >
                        <div className="flex justify-center items-center gap-2"><BedDouble size={16} /> Wards & Bed Management</div>
                    </button>
                    <button
                        onClick={() => setActiveTab('billing')}
                        className={`flex-1 py-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'billing' ? 'border-sky-600 justify-center text-sky-600 bg-white' : 'border-transparent text-glass-body hover:text-glass-title'}`}
                    >
                        <div className="flex justify-center items-center gap-2"><IndianRupee size={16} /> Daily Billing & Discharge</div>
                    </button>
                    <button
                        onClick={() => setActiveTab('assets')}
                        className={`flex-1 py-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'assets' ? 'border-sky-600 justify-center text-sky-600 bg-white' : 'border-transparent text-glass-body hover:text-glass-title'}`}
                    >
                        <div className="flex justify-center items-center gap-2"><FileText size={16} /> Asset Management</div>
                    </button>
                </div>

                <div className="p-6">
                    {/* TAB 1: WARDS */}
                    {activeTab === 'wards' && (
                        <div className="space-y-8">
                            {wards.map((ward) => (
                                <div key={ward.id} className="border border-white/10 rounded-lg overflow-hidden">
                                    <div className="bg-black/20 px-4 py-3 border-b border-white/10">
                                        <h3 className="font-bold text-glass-title text-lg">{ward.name}</h3>
                                        <p className="text-sm text-glass-body">Type: {ward.type} | Total Capacity: {ward.capacity}</p>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
                                        {ward.beds.map((bed: any) => (
                                            <div
                                                key={bed.id}
                                                className={`p-4 rounded-xl border text-center transition-all ${bed.status === 'AVAILABLE'
                                                    ? 'bg-emerald-50 border-emerald-200 cursor-pointer hover:shadow-md'
                                                    : 'bg-rose-50 border-rose-200 opacity-80'
                                                    } ${selectedBed?.id === bed.id ? 'ring-2 ring-emerald-500 scale-105' : ''}`}
                                                onClick={() => bed.status === 'AVAILABLE' && setSelectedBed({ ...bed, wardName: ward.name })}
                                            >
                                                <BedDouble size={28} className={`mx-auto mb-2 ${bed.status === 'AVAILABLE' ? 'text-emerald-500' : 'text-rose-500'}`} />
                                                <div className="font-bold text-glass-title">{bed.bedNumber}</div>
                                                <div className={`text-xs mt-1 font-semibold ${bed.status === 'AVAILABLE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {bed.status}
                                                </div>
                                                <div className="text-xs text-glass-body mt-1">₹{bed.dailyRent}/day</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* ADMISSION PROMPT IF BED SELECTED */}
                            {selectedBed && (
                                <div className="mt-8 bg-white border border-white/20 rounded-xl p-6 shadow-xl relative animate-in fade-in slide-in-from-bottom-4">
                                    <button onClick={() => setSelectedBed(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
                                    <h3 className="text-xl font-bold text-glass-title mb-2">Initiate Admission</h3>
                                    <p className="text-sm text-glass-body mb-6">Assigning Bed <strong>{selectedBed.bedNumber}</strong> in <strong>{selectedBed.wardName}</strong></p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-sm font-medium text-white mb-2">Search Patient to Admit</label>
                                            <div className="flex gap-2 mb-4">
                                                <input type="text" placeholder="UHID or Mobile..." className="flex-1 px-4 py-2 border border-white/20 rounded-lg text-sm"
                                                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && executePatientSearch()} />
                                                <button onClick={executePatientSearch} className="bg-slate-100 text-white px-4 py-2 rounded-lg hover:bg-slate-200">Search</button>
                                            </div>
                                            {patientResults.map((p) => (
                                                <div key={p.id} onClick={() => setSelectedPatientForAdmission(p)} className={`p-3 border rounded text-sm mb-2 cursor-pointer ${selectedPatientForAdmission?.id === p.id ? 'bg-sky-50 border-sky-400' : 'hover:bg-black/20'}`}>
                                                    <strong>{p.firstName} {p.lastName}</strong> ({p.uhid})
                                                </div>
                                            ))}
                                        </div>

                                        <div className={`${!selectedPatientForAdmission ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <label className="block text-sm font-medium text-white mb-2">Select Primary Doctor</label>
                                            <select className="w-full px-4 py-2 border border-white/20 rounded-lg mb-6 text-sm bg-white"
                                                value={selectedDoctorId} onChange={e => setSelectedDoctorId(e.target.value)}>
                                                <option value="">-- Select Specialist --</option>
                                                {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>)}
                                            </select>

                                            <div className="bg-sky-50 p-4 rounded-lg text-sm text-sky-800 mb-6">
                                                Security Deposit Required: <strong>₹5000</strong>
                                            </div>

                                            <button onClick={handleAdmit} disabled={loading || !selectedDoctorId} className="w-full liquid-glass-button text-white border-emerald-500/50 font-bold py-3 rounded-lg flex justify-center items-center gap-2">
                                                Admit Patient to IPD
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: BILLING & DISCHARGE */}
                    {activeTab === 'billing' && (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                            {/* Active Admissions Sidebar */}
                            <div className="md:col-span-4 border border-white/10 rounded-xl bg-black/20 overflow-hidden h-fit">
                                <div className="p-4 bg-white border-b border-white/10 font-bold text-glass-title">
                                    Active IPD Admissions
                                </div>
                                <div className="divide-y divide-slate-200 max-h-[600px] overflow-y-auto">
                                    {admissions.map(adm => (
                                        <div
                                            key={adm.id}
                                            onClick={() => loadFullAdmissionDetails(adm.id)}
                                            className={`p-4 cursor-pointer hover:bg-sky-50 transition border-l-4 ${selectedAdmission?.id === adm.id ? 'border-l-sky-500 bg-sky-50' : 'border-l-transparent'}`}
                                        >
                                            <div className="font-bold text-glass-title text-sm">{adm.patient.firstName} {adm.patient.lastName}</div>
                                            <div className="text-xs text-glass-body mt-1">{adm.patient.uhid} • Bed: {adm.bed.bedNumber}</div>
                                            <div className="text-xs text-glass-body mt-1">Dr. {adm.doctor.lastName}</div>
                                        </div>
                                    ))}
                                    {admissions.length === 0 && <div className="p-6 text-center text-sm text-glass-body">No active admissions</div>}
                                </div>
                            </div>

                            {/* Patient IPD Billing Terminal */}
                            <div className="md:col-span-8">
                                {selectedAdmission ? (
                                    <div className="border border-white/10 rounded-xl overflow-hidden bg-white shadow-sm">
                                        <div className="bg-sky-900 text-white p-6">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h2 className="text-2xl font-bold">{selectedAdmission.patient.firstName} {selectedAdmission.patient.lastName}</h2>
                                                    <p className="text-sky-200 mt-1">{selectedAdmission.patient.uhid} | Age: {selectedAdmission.patient.age}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="bg-sky-800 px-3 py-1 rounded-lg inline-block text-sm font-bold border border-sky-700">
                                                        BED: {selectedAdmission.bed.bedNumber}
                                                    </div>
                                                    <p className="text-xs text-sky-200 mt-2">Dr. {selectedAdmission.doctor.lastName}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Form to append charges */}
                                            <div>
                                                <h3 className="font-bold text-glass-title mb-4 border-b border-white/5 pb-2">Record Daily Charge</h3>
                                                <form onSubmit={handleChargeSubmit} className="space-y-4">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-glass-body mb-1">Charge Type</label>
                                                        <select className="w-full text-sm border-white/20 rounded-lg p-2" value={chargeForm.chargeType} onChange={e => setChargeForm({ ...chargeForm, chargeType: e.target.value })}>
                                                            <option value="ROOM_RENT">Room Rent</option>
                                                            <option value="NURSING">Nursing</option>
                                                            <option value="DOCTOR_VISIT">Doctor Visit</option>
                                                            <option value="SURGERY_OT">OT / Surgery</option>
                                                            <option value="PHARMACY">Ward Pharmacy</option>
                                                            <option value="DIET">Diet Charges</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-glass-body mb-1">Description</label>
                                                        <input required type="text" className="w-full text-sm border-white/20 rounded-lg p-2" placeholder="e.g. ICU Night Rent" value={chargeForm.description} onChange={e => setChargeForm({ ...chargeForm, description: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-glass-body mb-1">Amount (₹)</label>
                                                        <input required type="number" className="w-full text-sm border-white/20 rounded-lg p-2" placeholder="0.00" value={chargeForm.amount} onChange={e => setChargeForm({ ...chargeForm, amount: e.target.value })} />
                                                    </div>
                                                    <button type="submit" disabled={loading} className="w-full bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold py-2 rounded-lg transition">Apply Charge</button>
                                                </form>
                                            </div>

                                            {/* Running Bill Ledger */}
                                            <div className="bg-black/20 border border-white/10 rounded-xl p-4 flex flex-col h-[400px]">
                                                <h3 className="font-bold text-glass-title mb-4 text-center">IPD Running Bill</h3>

                                                <div className="flex-1 overflow-y-auto pr-2 space-y-2 mb-4">
                                                    {selectedAdmission.ipdCharges?.map((ch: any) => (
                                                        <div key={ch.id} className="bg-white border border-white/10 p-2 text-xs rounded shadow-sm flex justify-between items-center">
                                                            <div>
                                                                <div className="font-bold text-white">{ch.chargeType}</div>
                                                                <div className="text-glass-body truncate max-w-[120px]">{ch.description}</div>
                                                            </div>
                                                            <div className="font-bold text-glass-title">₹{ch.amount}</div>
                                                        </div>
                                                    ))}
                                                    {!selectedAdmission.ipdCharges?.length && <p className="text-xs text-center text-slate-400 mt-4">No charges posted yet.</p>}
                                                </div>

                                                <div className="border-t border-white/20 pt-4">
                                                    <div className="flex justify-between text-sm text-glass-muted mb-1">
                                                        <span>Total Charges</span>
                                                        <span>₹{(selectedAdmission.ipdCharges?.reduce((sum: number, c: any) => sum + c.amount, 0) || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm text-glass-muted mb-1">
                                                        <span>Security Deposit</span>
                                                        <span>-₹{selectedAdmission.depositAmount}</span>
                                                    </div>
                                                    <div className="mt-4 pt-2 flex justify-between justify-end">
                                                        <button onClick={handleDischarge} disabled={loading} className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-2 font-bold rounded shadow transition">Execute Discharge & Generate Final Bill</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center flex-col text-slate-400">
                                        <FileText size={48} className="mb-4 opacity-50" />
                                        <p>Select an admitted patient to manage IPD Billing.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: ASSET MANAGEMENT */}
                    {activeTab === 'assets' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Create Ward Form */}
                            <div className="bg-black/20 border border-white/10 p-6 rounded-xl">
                                <h3 className="font-bold text-glass-title mb-4 border-b border-white/10 pb-2">Add New Ward</h3>
                                <form onSubmit={handleCreateWard} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-1">Ward Name</label>
                                        <input required type="text" className="w-full text-sm border-white/20 rounded-lg p-2" placeholder="e.g. ICU, General Ward" value={wardForm.name} onChange={e => setWardForm({ ...wardForm, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-1">Ward Type</label>
                                        <select className="w-full text-sm border-white/20 rounded-lg p-2" value={wardForm.type} onChange={e => setWardForm({ ...wardForm, type: e.target.value })}>
                                            <option value="GENERAL">General</option>
                                            <option value="SEMI_PRIVATE">Semi-Private</option>
                                            <option value="PRIVATE">Private</option>
                                            <option value="ICU">ICU</option>
                                            <option value="NICU">NICU</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-1">Total Capacity</label>
                                        <input required type="number" min="1" className="w-full text-sm border-white/20 rounded-lg p-2" value={wardForm.capacity} onChange={e => setWardForm({ ...wardForm, capacity: e.target.value })} />
                                    </div>
                                    <button type="submit" disabled={loading} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 rounded-lg transition mt-2">
                                        Create Ward
                                    </button>
                                </form>
                            </div>

                            {/* Create Bed Form */}
                            <div className="bg-black/20 border border-white/10 p-6 rounded-xl">
                                <h3 className="font-bold text-glass-title mb-4 border-b border-white/10 pb-2">Add Bed to Ward</h3>
                                <form onSubmit={handleCreateBed} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-1">Select Target Ward</label>
                                        <select required className="w-full text-sm border-white/20 rounded-lg p-2 bg-white" value={bedForm.wardId} onChange={e => setBedForm({ ...bedForm, wardId: e.target.value })}>
                                            <option value="">-- Select Ward --</option>
                                            {wards.map(w => <option key={w.id} value={w.id}>{w.name} (Type: {w.type})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-1">Bed Number / ID</label>
                                        <input required type="text" className="w-full text-sm border-white/20 rounded-lg p-2" placeholder="e.g. ICU-01, GW-Male-12" value={bedForm.bedNumber} onChange={e => setBedForm({ ...bedForm, bedNumber: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-1">Daily Rent (₹)</label>
                                        <input required type="number" min="0" className="w-full text-sm border-white/20 rounded-lg p-2" value={bedForm.dailyRent} onChange={e => setBedForm({ ...bedForm, dailyRent: e.target.value })} />
                                    </div>
                                    <button type="submit" disabled={loading} className="w-full liquid-glass-button text-white border-emerald-500/50 font-bold py-2 rounded-lg transition mt-2">
                                        Add Bed
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
