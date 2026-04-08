'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Stethoscope, FileText, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';

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
        <div className="space-y-6 max-w-6xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-[24px] font-semibold text-gray-50 tracking-tight">Patient Management</h1>
            </div>

            <div className="flex border-b border-slate-800">
                <button
                    onClick={() => setActiveTab('register')}
                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all border-b-[3px] ${activeTab === 'register' ? 'border-blue-600 text-blue-500' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'}`}
                >
                    <Plus size={16} /> New Registration
                </button>
                <button
                    onClick={() => setActiveTab('opd')}
                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all border-b-[3px] ${activeTab === 'opd' ? 'border-blue-600 text-blue-500' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'}`}
                >
                    <Stethoscope size={16} /> OPD Booking & Billing
                </button>
            </div>

            <div className="pt-2">
                {/* TAB 1: REGISTRATION */}
                {activeTab === 'register' && (
                    <Card padding="lg" className="max-w-[700px]">
                        {regSuccess ? (
                            <div className="text-center py-10 fade-in">
                                <CheckCircle2 className="mx-auto w-16 h-16 text-emerald-500 mb-4" />
                                <h3 className="text-xl font-bold text-gray-50 mb-2">Patient Registered</h3>
                                <p className="text-gray-400 mb-8">
                                    Generated UHID: <span className="ml-2 font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-md">{regSuccess.patient.uhid}</span>
                                </p>
                                <Button variant="outline" onClick={() => setRegSuccess(null)}>Register Another Patient</Button>
                            </div>
                        ) : (
                            <form onSubmit={handleRegister} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Input required label="First Name *" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                                    <Input required label="Last Name *" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                                    <Input required label="Age *" type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
                                    <Select
                                        required
                                        label="Gender *"
                                        value={form.gender}
                                        onChange={e => setForm({ ...form, gender: e.target.value })}
                                        options={[
                                            { label: 'Male', value: 'Male' },
                                            { label: 'Female', value: 'Female' },
                                            { label: 'Other', value: 'Other' }
                                        ]}
                                    />
                                    <Input required label="Mobile No. *" maxLength={10} value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} />
                                    <Input label="Blood Group" placeholder="e.g. O+" value={form.bloodGroup} onChange={e => setForm({ ...form, bloodGroup: e.target.value })} />
                                </div>
                                <div className="pt-2">
                                    <Button type="submit" disabled={loading} fullWidth>
                                        {loading ? 'Processing...' : 'Register Patient'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </Card>
                )}

                {/* TAB 2: OPD BOOKING AND BILLING */}
                {activeTab === 'opd' && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 max-w-5xl">

                        {/* Step 1: Patient Selection */}
                        <div className="col-span-1 md:col-span-7">
                            <Card padding="md" className="h-full">
                                <h3 className="text-sm font-semibold text-gray-50 mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
                                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-gray-300 font-bold">1</span>
                                    Select Patient
                                </h3>

                                <div className="flex gap-2 mb-4">
                                    <Input
                                        placeholder="Search UHID, Mobile, Name..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && executeSearch()}
                                    />
                                    <Button variant="secondary" onClick={executeSearch} className="px-4">
                                        <Search size={18} />
                                    </Button>
                                </div>

                                {searchResults.length > 0 && (
                                    <div className="border border-slate-800 bg-slate-950 rounded-[8px] overflow-hidden flex flex-col max-h-64 overflow-y-auto mb-4 custom-scrollbar">
                                        {searchResults.map((p) => (
                                            <button
                                                key={p.id}
                                                onClick={() => setSelectedPatient(p)}
                                                className={`flex flex-col text-left p-3 border-b border-slate-800 last:border-b-0 transition-colors ${selectedPatient?.id === p.id ? 'bg-slate-800 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent hover:bg-slate-900'}`}
                                            >
                                                <span className="font-semibold text-gray-50 text-sm">{p.firstName} {p.lastName}</span>
                                                <span className="text-[12px] text-gray-400">{p.uhid} • {p.mobile}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {selectedPatient && (
                                    <div className="bg-blue-500/10 rounded-[8px] p-4 border border-blue-500/20 mt-4 rounded-md">
                                        <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-1">Selected Patient</p>
                                        <p className="font-semibold text-gray-50">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                                        <p className="text-sm text-gray-400">{selectedPatient.uhid} • Age: {selectedPatient.age}</p>
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* Step 2: Doctor Selection & Bill Details */}
                        <div className={`col-span-1 md:col-span-5 ${!selectedPatient ? 'opacity-50 pointer-events-none' : ''} transition-opacity duration-300`}>
                            <Card padding="md" className="h-full flex flex-col">
                                <h3 className="text-sm font-semibold text-gray-50 mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
                                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-gray-300 font-bold">2</span>
                                    Book & Invoice
                                </h3>

                                <div className="space-y-4 flex-1">
                                    <Select
                                        label="Assign Doctor"
                                        value={selectedDoctorId}
                                        onChange={e => setSelectedDoctorId(e.target.value)}
                                        options={[
                                            { label: '-- Select Specialist --', value: '' },
                                            ...doctors.map(d => ({ label: `Dr. ${d.firstName} ${d.lastName} (${d.department})`, value: d.id }))
                                        ]}
                                    />

                                    <div className="bg-slate-950 p-4 rounded-[8px] border border-slate-800 space-y-2.5 mt-6">
                                        <div className="flex justify-between text-[13px] text-gray-400">
                                            <span>Consultation Fee</span>
                                            <span className="text-gray-300">₹500.00</span>
                                        </div>
                                        <div className="flex justify-between text-[13px] text-gray-400">
                                            <span>Registration (First Visit)</span>
                                            <span className="text-gray-300">₹100.00</span>
                                        </div>
                                        <div className="flex justify-between text-[13px] text-gray-400 border-b border-slate-800 pb-3">
                                            <span>GST 18% <span className="text-slate-500">(SAC: 999311)</span></span>
                                            <span className="text-gray-300">₹108.00</span>
                                        </div>
                                        <div className="flex justify-between font-semibold text-gray-50 pt-1">
                                            <span>Net Payable</span>
                                            <span className="text-blue-400">₹708.00</span>
                                        </div>
                                    </div>

                                    {opdSuccess && (
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[8px] p-3 text-emerald-400 text-sm flex items-center gap-2">
                                            <CheckCircle2 size={16} /> Token {opdSuccess.visit?.tokenNo} Generated!
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6">
                                    <Button
                                        onClick={handleBookVisit}
                                        disabled={loading || !selectedDoctorId || opdSuccess}
                                        fullWidth
                                    >
                                        <FileText size={16} className="mr-2" /> Generate Token & Bill
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
