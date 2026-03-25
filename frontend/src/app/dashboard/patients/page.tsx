'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Stethoscope, FileText, CheckCircle2 } from 'lucide-react';

export default function PatientsPage() {
    const [activeTab, setActiveTab] = useState<'register' | 'opd'>('register');
    const [loading, setLoading] = useState(false);

    // Registration State
    const [form, setForm] = useState({
        firstName: '', lastName: '', age: '', gender: 'Male', mobile: '', email: '',
        bloodGroup: '', city: '', address: ''
    });
    const [regSuccess, setRegSuccess] = useState<any>(null);

    // OPD Booking State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [opdSuccess, setOpdSuccess] = useState<any>(null);

    useEffect(() => {
        if (activeTab === 'opd') {
            fetchDoctors();
        }
    }, [activeTab]);

    const fetchDoctors = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/patient/doctors', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setDoctors(data);
        } catch (err) { console.error(err) }
    };

    const executeSearch = async () => {
        if (!searchQuery) return;
        try {
            const res = await fetch(`http://localhost:5000/api/patient/search?query=${searchQuery}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setSearchResults(data);
        } catch (err) { console.error(err) }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setRegSuccess(null);
        try {
            const res = await fetch('http://localhost:5000/api/patient/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (res.ok) {
                setRegSuccess(data);
                setForm({ firstName: '', lastName: '', age: '', gender: 'Male', mobile: '', email: '', bloodGroup: '', city: '', address: '' });
            } else {
                alert(data.message);
            }
        } catch (err) { console.error(err) }
        setLoading(false);
    };

    const handleBookVisit = async () => {
        if (!selectedPatient || !selectedDoctorId) {
            alert("Please select a patient and a doctor");
            return;
        }
        setLoading(true);
        try {
            const doc = doctors.find(d => d.id === selectedDoctorId);
            const res = await fetch('http://localhost:5000/api/patient/visit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    patientId: selectedPatient.id,
                    doctorId: selectedDoctorId,
                    department: doc?.department || 'General'
                })
            });
            const data = await res.json();
            if (res.ok) {
                setOpdSuccess(data);
                setSelectedPatient(null);
                setSearchQuery('');
                setSearchResults([]);
            } else {
                alert(data.message);
            }
        } catch (err) { console.error(err) }
        setLoading(false);
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-glass-title tracking-tight">Patient Management</h1>
            </div>

            <div className="liquid-glass-card rounded-xl    overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-white/10 bg-black/20">
                    <button
                        onClick={() => setActiveTab('register')}
                        className={`flex-1 py-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'register' ? 'border-blue-600 justify-center text-blue-600 bg-white' : 'border-transparent text-glass-body hover:text-glass-title'}`}
                    >
                        <div className="flex justify-center items-center gap-2"><Plus size={16} /> New Registration</div>
                    </button>
                    <button
                        onClick={() => setActiveTab('opd')}
                        className={`flex-1 py-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'opd' ? 'border-blue-600 justify-center text-blue-600 bg-white' : 'border-transparent text-glass-body hover:text-glass-title'}`}
                    >
                        <div className="flex justify-center items-center gap-2"><Stethoscope size={16} /> OPD Booking & Billing</div>
                    </button>
                </div>

                <div className="p-6">
                    {/* TAB 1: REGISTRATION */}
                    {activeTab === 'register' && (
                        <div>
                            {regSuccess ? (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center mb-6">
                                    <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-emerald-800 mb-2">Registration Successful</h3>
                                    <p className="text-emerald-600">Patient UHID: <strong className="text-lg bg-emerald-100 px-3 py-1 rounded ml-2">{regSuccess.patient.uhid}</strong></p>
                                    <button onClick={() => setRegSuccess(null)} className="mt-6 px-6 py-2 liquid-glass-button text-white border-emerald-500/50 rounded-lg text-sm font-medium transition-colors">
                                        Register Another Patient
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleRegister} className="max-w-3xl mx-auto space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-white mb-1">First Name <span className="text-red-500">*</span></label>
                                            <input required type="text" className="w-full px-4 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-white mb-1">Last Name <span className="text-red-500">*</span></label>
                                            <input required type="text" className="w-full px-4 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-white mb-1">Age <span className="text-red-500">*</span></label>
                                            <input required type="number" className="w-full px-4 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-white mb-1">Gender <span className="text-red-500">*</span></label>
                                            <select required className="w-full px-4 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                                                <option>Male</option><option>Female</option><option>Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-white mb-1">Mobile No. <span className="text-red-500">*</span></label>
                                            <input required type="text" maxLength={10} className="w-full px-4 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-white mb-1">Blood Group</label>
                                            <input type="text" className="w-full px-4 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="O+" value={form.bloodGroup} onChange={e => setForm({ ...form, bloodGroup: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="border-t border-white/5 pt-6"></div>
                                    <div className="flex justify-end pt-4 border-t border-white/10">
                                        <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow flex items-center gap-2">
                                            {loading ? 'Processing...' : 'Generate UHID & Register'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* TAB 2: OPD BOOKING AND BILLING */}
                    {activeTab === 'opd' && (
                        <div className="max-w-4xl mx-auto flex flex-col gap-6">

                            {/* Success Prompt Layer */}
                            {opdSuccess && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2"><FileText size={20} /> OPD Token Generated</h3>
                                            <p className="text-blue-700 mt-2">Token No: <strong className="bg-white px-2 py-1 rounded border border-blue-200 ml-1">{opdSuccess.visit?.tokenNo}</strong></p>
                                            <p className="text-sm text-blue-600 mt-2">A Consultation Bill has been auto-queued at the billing counter.</p>
                                        </div>
                                        <button onClick={() => setOpdSuccess(null)} className="text-sm border border-blue-300 px-4 py-2 rounded bg-white hover:bg-blue-50 font-medium text-blue-700 transition">Book Another Visit</button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Step 1: Patient Selection */}
                                <div>
                                    <h3 className="text-md font-semibold text-glass-title mb-4 border-b border-white/5 pb-2 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-xs text-glass-body font-bold">1</span>
                                        Select Patient
                                    </h3>
                                    <div className="flex gap-2 mb-4">
                                        <input
                                            type="text"
                                            placeholder="Search UHID, Mobile, Name..."
                                            className="flex-1 px-4 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && executeSearch()}
                                        />
                                        <button onClick={executeSearch} className="bg-slate-100 text-white px-4 py-2 rounded-lg hover:bg-slate-200 transition">
                                            <Search size={18} />
                                        </button>
                                    </div>

                                    {searchResults.length > 0 && (
                                        <div className="border border-white/10 rounded-lg overflow-hidden flex flex-col max-h-64 overflow-y-auto bg-white mb-4 shadow-inner">
                                            {searchResults.map((p) => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => setSelectedPatient(p)}
                                                    className={`flex flex-col text-left p-3 border-b border-white/5 last:border-b-0 hover:bg-blue-50 transition-colors ${selectedPatient?.id === p.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}
                                                >
                                                    <span className="font-semibold text-glass-title text-sm">{p.firstName} {p.lastName}</span>
                                                    <span className="text-xs text-glass-body">{p.uhid} • {p.mobile}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {selectedPatient && (
                                        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                                            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Selected Patient</p>
                                            <p className="font-bold text-glass-title">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                                            <p className="text-sm text-glass-muted">{selectedPatient.uhid} • Age: {selectedPatient.age}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Step 2: Doctor Selection & Bill Details */}
                                <div className={`${!selectedPatient ? 'opacity-50 pointer-events-none' : ''} transition-opacity duration-300`}>
                                    <h3 className="text-md font-semibold text-glass-title mb-4 border-b border-white/5 pb-2 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-xs text-glass-body font-bold">2</span>
                                        Book & Invoice
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-white mb-1">Assign Doctor</label>
                                            <select
                                                className="w-full px-4 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                                                value={selectedDoctorId}
                                                onChange={e => setSelectedDoctorId(e.target.value)}
                                            >
                                                <option value="">-- Select Specialist --</option>
                                                {doctors.map(d => (
                                                    <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} ({d.department})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="bg-black/20 p-4 rounded-lg border border-white/10 mt-6 space-y-2">
                                            <div className="flex justify-between text-sm text-glass-muted">
                                                <span>Consultation Fee</span>
                                                <span>₹500.00</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-glass-muted">
                                                <span>Registration (First Visit)</span>
                                                <span>₹100.00</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-glass-muted border-b border-white/10 pb-2">
                                                <span>GST 18% (SAC: 999311)</span>
                                                <span>₹108.00</span>
                                            </div>
                                            <div className="flex justify-between font-bold text-glass-title pt-1">
                                                <span>Net Payable</span>
                                                <span>₹708.00</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleBookVisit}
                                            disabled={loading || !selectedDoctorId}
                                            className="w-full mt-4 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white py-3 rounded-lg text-sm font-bold shadow flex items-center justify-center gap-2 transition"
                                        >
                                            <FileText size={18} /> Generate Token & Bill
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
