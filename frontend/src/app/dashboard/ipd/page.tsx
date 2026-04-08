'use client';

import { useState, useEffect } from 'react';
import { BedDouble, Users, IndianRupee, FileText, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';

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
                    depositAmount: 5000
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
                loadFullAdmissionDetails(selectedAdmission.id);
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
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-[24px] font-semibold text-gray-50 tracking-tight">IPD Wards & Billing</h1>
            </div>

            <div className="flex border-b border-slate-800">
                <button
                    onClick={() => setActiveTab('wards')}
                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all border-b-[3px] ${activeTab === 'wards' ? 'border-blue-600 text-blue-500' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'}`}
                >
                    <BedDouble size={16} /> Wards & Bed Management
                </button>
                <button
                    onClick={() => setActiveTab('billing')}
                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all border-b-[3px] ${activeTab === 'billing' ? 'border-blue-600 text-blue-500' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'}`}
                >
                    <IndianRupee size={16} /> Daily Billing & Discharge
                </button>
                <button
                    onClick={() => setActiveTab('assets')}
                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all border-b-[3px] ${activeTab === 'assets' ? 'border-blue-600 text-blue-500' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'}`}
                >
                    <FileText size={16} /> Asset Management
                </button>
            </div>

            <div className="pt-2">
                {/* TAB 1: WARDS */}
                {activeTab === 'wards' && (
                    <div className="space-y-8">
                        {wards.map((ward) => (
                            <Card key={ward.id} padding="none" className="overflow-hidden">
                                <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-gray-50 text-lg">{ward.name}</h3>
                                        <p className="text-sm text-gray-400">Type: {ward.type} | Total Capacity: {ward.capacity}</p>
                                    </div>
                                    <Badge variant="neutral">{ward.beds.length} Beds Documented</Badge>
                                </div>
                                <div className="p-6 flex flex-wrap gap-4">
                                    {ward.beds.map((bed: any) => (
                                        <div
                                            key={bed.id}
                                            className={`w-[120px] h-[100px] p-2 rounded-[10px] border flex flex-col justify-center items-center cursor-pointer transition-all hover:-translate-y-1 ${bed.status === 'AVAILABLE' ? 'bg-emerald-500/10 border-emerald-500/30' :
                                                    bed.status === 'MAINTENANCE' ? 'bg-amber-500/10 border-amber-500/30' :
                                                        'bg-red-500/10 border-red-500/30 opacity-80 cursor-not-allowed'
                                                } ${selectedBed?.id === bed.id ? 'ring-2 ring-blue-500 shadow-md scale-105' : ''}`}
                                            onClick={() => bed.status === 'AVAILABLE' && setSelectedBed({ ...bed, wardName: ward.name })}
                                        >
                                            <BedDouble size={28} className={`mb-1 ${bed.status === 'AVAILABLE' ? 'text-emerald-500' :
                                                    bed.status === 'MAINTENANCE' ? 'text-amber-500' : 'text-red-500'
                                                }`} />
                                            <div className="font-bold text-gray-50 text-[14px]">{bed.bedNumber}</div>
                                            <div className={`text-[10px] uppercase font-bold mt-0.5 ${bed.status === 'AVAILABLE' ? 'text-emerald-400' :
                                                    bed.status === 'MAINTENANCE' ? 'text-amber-400' : 'text-red-400'
                                                }`}>
                                                {bed.status}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ))}

                        {/* ADMISSION PROMPT IF BED SELECTED */}
                        {selectedBed && (
                            <Card padding="lg" className="mt-8 relative animate-in fade-in slide-in-from-bottom-4 shadow-xl border-blue-500/30 ring-1 ring-blue-500/10">
                                <button onClick={() => setSelectedBed(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
                                <h3 className="text-xl font-bold text-gray-50 mb-1">Initiate Admission</h3>
                                <p className="text-sm text-gray-400 mb-6">Assigning Bed <strong className="text-blue-400">{selectedBed.bedNumber}</strong> in <strong>{selectedBed.wardName}</strong></p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="block text-sm font-medium text-gray-300 mb-3">Search Patient to Admit</h4>
                                        <div className="flex gap-2 mb-4">
                                            <Input
                                                placeholder="UHID or Mobile..."
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && executePatientSearch()}
                                            />
                                            <Button variant="secondary" onClick={executePatientSearch} className="px-4">Search</Button>
                                        </div>
                                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                            {patientResults.map((p) => (
                                                <div key={p.id} onClick={() => setSelectedPatientForAdmission(p)} className={`p-3 border rounded-[8px] text-[13px] cursor-pointer transition-colors ${selectedPatientForAdmission?.id === p.id ? 'bg-slate-800 border-blue-500 ring-1 ring-blue-500/50 text-white' : 'bg-slate-950 border-slate-800 hover:bg-slate-900 text-gray-300'}`}>
                                                    <strong className="text-gray-50">{p.firstName} {p.lastName}</strong> • {p.uhid}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={`${!selectedPatientForAdmission ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <div className="mb-6">
                                            <Select
                                                label="Select Primary Doctor"
                                                value={selectedDoctorId}
                                                onChange={e => setSelectedDoctorId(e.target.value)}
                                                options={[
                                                    { label: '-- Select Specialist --', value: '' },
                                                    ...doctors.map(d => ({ label: `Dr. ${d.firstName} ${d.lastName}`, value: d.id }))
                                                ]}
                                            />
                                        </div>

                                        <div className="bg-slate-950 border border-slate-800 p-4 rounded-[8px] text-sm text-gray-300 mb-6 flex justify-between items-center">
                                            <span>Security Deposit Required</span>
                                            <span className="font-bold text-gray-50 text-base">₹5000</span>
                                        </div>

                                        <Button onClick={handleAdmit} disabled={loading || !selectedDoctorId} fullWidth size="lg">
                                            Admit Patient to IPD
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                {/* TAB 2: BILLING & DISCHARGE */}
                {activeTab === 'billing' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Active Admissions Sidebar */}
                        <div className="lg:col-span-4">
                            <Card padding="none" className="h-[600px] flex flex-col">
                                <div className="p-4 bg-slate-950 border-b border-slate-800">
                                    <h3 className="font-semibold text-gray-50">Active IPD Admissions</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    {admissions.map(adm => (
                                        <div
                                            key={adm.id}
                                            onClick={() => loadFullAdmissionDetails(adm.id)}
                                            className={`p-4 cursor-pointer hover:bg-slate-800 transition-colors border-b border-slate-800 last:border-b-0 border-l-[3px] ${selectedAdmission?.id === adm.id ? 'border-l-blue-600 bg-slate-800 text-white' : 'border-l-transparent text-gray-300'}`}
                                        >
                                            <div className="font-semibold text-gray-50 text-sm">{adm.patient.firstName} {adm.patient.lastName}</div>
                                            <div className="text-[12px] text-gray-400 mt-1">{adm.patient.uhid} • Bed: {adm.bed.bedNumber}</div>
                                            <div className="text-[12px] text-gray-400 mt-0.5">Primary: Dr. {adm.doctor.lastName}</div>
                                        </div>
                                    ))}
                                    {admissions.length === 0 && <div className="p-6 text-center text-sm text-gray-500">No active admissions</div>}
                                </div>
                            </Card>
                        </div>

                        {/* Patient IPD Billing Terminal */}
                        <div className="lg:col-span-8">
                            {selectedAdmission ? (
                                <Card padding="none" className="min-h-[600px] flex flex-col">
                                    <div className="bg-slate-950 border-b border-slate-800 p-6 flex justify-between items-start shrink-0">
                                        <div>
                                            <h2 className="text-[20px] font-bold text-white">{selectedAdmission.patient.firstName} {selectedAdmission.patient.lastName}</h2>
                                            <div className="text-gray-400 text-sm mt-1">{selectedAdmission.patient.uhid} • Age: {selectedAdmission.patient.age}</div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="default" className="text-sm px-3 py-1 mb-2">BED: {selectedAdmission.bed.bedNumber}</Badge>
                                            <div className="text-[12px] text-gray-400">Dr. {selectedAdmission.doctor.lastName}</div>
                                        </div>
                                    </div>

                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                                        {/* Form to append charges */}
                                        <div>
                                            <h3 className="font-medium text-gray-50 text-sm mb-4 border-b border-slate-800 pb-2">Record Daily Charge</h3>
                                            <form onSubmit={handleChargeSubmit} className="space-y-4">
                                                <Select
                                                    label="Charge Type / Category"
                                                    value={chargeForm.chargeType}
                                                    onChange={e => setChargeForm({ ...chargeForm, chargeType: e.target.value })}
                                                    options={[
                                                        { label: 'Room Rent', value: 'ROOM_RENT' },
                                                        { label: 'Nursing', value: 'NURSING' },
                                                        { label: 'Doctor Visit', value: 'DOCTOR_VISIT' },
                                                        { label: 'OT / Surgery', value: 'SURGERY_OT' },
                                                        { label: 'Ward Pharmacy', value: 'PHARMACY' },
                                                        { label: 'Diet Charges', value: 'DIET' },
                                                    ]}
                                                />
                                                <Input required label="Description" placeholder="e.g. ICU Night Rent" value={chargeForm.description} onChange={e => setChargeForm({ ...chargeForm, description: e.target.value })} />
                                                <Input required label="Amount (₹)" type="number" placeholder="0.00" value={chargeForm.amount} onChange={e => setChargeForm({ ...chargeForm, amount: e.target.value })} />

                                                <div className="pt-2">
                                                    <Button type="submit" variant="secondary" disabled={loading} fullWidth>Apply Charge to Bill</Button>
                                                </div>
                                            </form>
                                        </div>

                                        {/* Running Bill Ledger */}
                                        <div className="bg-slate-950 border border-slate-800 rounded-[8px] p-4 flex flex-col h-full min-h-[350px]">
                                            <h3 className="font-medium text-gray-50 text-sm mb-4 text-center">IPD Running Ledger</h3>

                                            <div className="flex-1 overflow-y-auto pr-2 space-y-2 mb-4 custom-scrollbar">
                                                {selectedAdmission.ipdCharges?.map((ch: any) => (
                                                    <div key={ch.id} className="bg-slate-900 border border-slate-800 p-2.5 rounded-[6px] text-[13px] flex justify-between items-center">
                                                        <div>
                                                            <div className="font-medium text-gray-200">{ch.chargeType}</div>
                                                            <div className="text-gray-500 truncate max-w-[140px] text-[11px] mt-0.5">{ch.description}</div>
                                                        </div>
                                                        <div className="font-semibold text-gray-50">₹{ch.amount}</div>
                                                    </div>
                                                ))}
                                                {!selectedAdmission.ipdCharges?.length && <p className="text-[12px] text-center text-gray-600 mt-6">No charges posted yet.</p>}
                                            </div>

                                            <div className="border-t border-slate-800 pt-4 shrink-0">
                                                <div className="flex justify-between text-[13px] text-gray-400 mb-1">
                                                    <span>Gross Charges</span>
                                                    <span>₹{(selectedAdmission.ipdCharges?.reduce((sum: number, c: any) => sum + c.amount, 0) || 0).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-[13px] text-gray-400 mb-3">
                                                    <span>Security Deposit</span>
                                                    <span className="text-emerald-400">-₹{selectedAdmission.depositAmount}</span>
                                                </div>
                                                <div className="pt-4 flex justify-between justify-end border-t border-slate-800/50">
                                                    <Button onClick={handleDischarge} variant="danger" disabled={loading} className="px-8 shadow-sm">
                                                        Execute Discharge & Final Bill
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ) : (
                                <Card padding="lg" className="h-[600px] flex items-center justify-center flex-col shadow-none">
                                    <FileText size={48} className="mb-4 text-slate-800" />
                                    <p className="text-gray-500 font-medium text-sm">Select an admitted patient to manage IPD Billing.</p>
                                </Card>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 3: ASSET MANAGEMENT */}
                {activeTab === 'assets' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
                        {/* Create Ward Form */}
                        <Card padding="lg">
                            <h3 className="font-semibold text-gray-50 text-md mb-6 border-b border-slate-800 pb-2">Add New Ward</h3>
                            <form onSubmit={handleCreateWard} className="space-y-4">
                                <Input required label="Ward Name" placeholder="e.g. ICU, General Ward" value={wardForm.name} onChange={e => setWardForm({ ...wardForm, name: e.target.value })} />
                                <Select
                                    label="Ward Type"
                                    value={wardForm.type}
                                    onChange={e => setWardForm({ ...wardForm, type: e.target.value })}
                                    options={[
                                        { label: 'General', value: 'GENERAL' },
                                        { label: 'Semi-Private', value: 'SEMI_PRIVATE' },
                                        { label: 'Private', value: 'PRIVATE' },
                                        { label: 'ICU', value: 'ICU' },
                                        { label: 'NICU', value: 'NICU' }
                                    ]}
                                />
                                <Input required label="Total Capacity" type="number" min="1" value={wardForm.capacity} onChange={e => setWardForm({ ...wardForm, capacity: e.target.value })} />

                                <div className="pt-4">
                                    <Button type="submit" disabled={loading} fullWidth>Create Ward</Button>
                                </div>
                            </form>
                        </Card>

                        {/* Create Bed Form */}
                        <Card padding="lg">
                            <h3 className="font-semibold text-gray-50 text-md mb-6 border-b border-slate-800 pb-2">Add Bed to Ward</h3>
                            <form onSubmit={handleCreateBed} className="space-y-4">
                                <Select
                                    required
                                    label="Select Target Ward"
                                    value={bedForm.wardId}
                                    onChange={e => setBedForm({ ...bedForm, wardId: e.target.value })}
                                    options={[
                                        { label: '-- Select Ward --', value: '' },
                                        ...wards.map(w => ({ label: `${w.name} (Type: ${w.type})`, value: w.id }))
                                    ]}
                                />
                                <Input required label="Bed Number / ID" placeholder="e.g. ICU-01, GW-Male-12" value={bedForm.bedNumber} onChange={e => setBedForm({ ...bedForm, bedNumber: e.target.value })} />
                                <Input required label="Daily Rent (₹)" type="number" min="0" value={bedForm.dailyRent} onChange={e => setBedForm({ ...bedForm, dailyRent: e.target.value })} />

                                <div className="pt-4">
                                    <Button type="submit" variant="secondary" disabled={loading} fullWidth>Add Bed</Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
