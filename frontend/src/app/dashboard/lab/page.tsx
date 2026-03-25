'use client';

import { useState, useEffect } from 'react';
import { FilePlus2, Search, Activity, Beaker, CheckCircle2 } from 'lucide-react';

export default function LabPage() {
    const [activeTab, setActiveTab] = useState<'catalog' | 'orders' | 'assets'>('catalog');
    const [loading, setLoading] = useState(false);

    const [catalog, setCatalog] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [patients, setPatients] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);

    // Asset Management State
    const [testForm, setTestForm] = useState({ testName: '', department: 'Pathology', price: '' });

    useEffect(() => {
        fetchCatalog();
        if (activeTab === 'orders') fetchOrders();
    }, [activeTab]);

    const fetchCatalog = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/lab/catalog', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setCatalog(await res.json());
        } catch (err) { console.error(err); }
    };

    const fetchOrders = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/lab/orders', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setOrders(await res.json());
        } catch (err) { console.error(err); }
    };

    const executeSearch = async () => {
        if (!searchQuery) return;
        try {
            const res = await fetch(`http://localhost:5000/api/patient/search?query=${searchQuery}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setPatients(await res.json());
        } catch (err) { console.error(err); }
    };

    const orderTest = async (testId: string) => {
        if (!selectedPatient) return alert("Select a patient to bind the Lab Order to.");

        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/lab/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ patientId: selectedPatient.id, testId })
            });
            const data = await res.json();
            if (res.ok) {
                alert("Lab Test Ordered & Billed Successfully!");
            } else {
                alert("Error: " + data.message);
            }
        } catch (err) { console.error(err) }
        setLoading(false);
    };

    const updateOrderStatus = async (orderId: string, status: string, resultText?: string) => {
        try {
            await fetch(`http://localhost:5000/api/lab/order/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status, resultText })
            });
            fetchOrders();
        } catch (err) { console.error(err) }
    };

    const handleAddTest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/lab/catalog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify(testForm)
            });
            if (res.ok) {
                alert("Lab Test added successfully");
                setTestForm({ testName: '', department: 'Pathology', price: '' });
                fetchCatalog();
            } else {
                alert("Failed to add test");
            }
        } catch (err) { console.error(err) }
        setLoading(false);
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-glass-title tracking-tight flex items-center gap-2">
                    <Beaker className="text-purple-600" /> Lab Diagnostics Control
                </h1>
            </div>

            <div className="liquid-glass-card rounded-xl    overflow-hidden min-h-[500px]">
                {/* Tabs */}
                <div className="flex border-b border-white/10 bg-black/20">
                    <button
                        onClick={() => setActiveTab('catalog')}
                        className={`flex-1 py-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'catalog' ? 'border-purple-600 justify-center text-purple-600 bg-white' : 'border-transparent text-glass-body hover:text-glass-title'}`}
                    >
                        <div className="flex justify-center items-center gap-2"><Activity size={16} /> Catalog & Dispatch</div>
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`flex-1 py-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'orders' ? 'border-purple-600 justify-center text-purple-600 bg-white' : 'border-transparent text-glass-body hover:text-glass-title'}`}
                    >
                        <div className="flex justify-center items-center gap-2"><FilePlus2 size={16} /> Specimen Dashboard</div>
                    </button>
                    <button
                        onClick={() => setActiveTab('assets')}
                        className={`flex-1 py-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'assets' ? 'border-purple-600 justify-center text-purple-600 bg-white' : 'border-transparent text-glass-body hover:text-glass-title'}`}
                    >
                        <div className="flex justify-center items-center gap-2"><Activity size={16} /> Asset Management</div>
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'catalog' && (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                            {/* Patient Binding Terminal */}
                            <div className="md:col-span-4 bg-purple-50 p-6 rounded-xl border border-purple-100 h-fit">
                                <h3 className="font-bold text-purple-900 mb-4">Patient Binding</h3>
                                {selectedPatient ? (
                                    <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm relative">
                                        <button onClick={() => setSelectedPatient(null)} className="absolute top-2 right-2 text-rose-500 text-xs font-bold bg-rose-50 px-2 py-1 rounded">Clear</button>
                                        <p className="text-xs text-purple-600 font-bold uppercase track">Active Selection</p>
                                        <p className="font-bold mt-1 text-glass-title text-lg">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                                        <p className="text-sm text-glass-body">{selectedPatient.uhid} | Age: {selectedPatient.age}</p>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="Search UHID..." className="flex-1 px-4 py-2 border border-white/20 rounded-lg text-sm bg-white" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && executeSearch()} />
                                            <button onClick={executeSearch} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 shadow"><Search size={16} /></button>
                                        </div>
                                        {patients.length > 0 && (
                                            <div className="mt-4 bg-white border border-white/10 rounded-xl overflow-hidden shadow-sm">
                                                {patients.map(p => (
                                                    <div key={p.id} onClick={() => { setSelectedPatient(p); setPatients([]); setSearchQuery(''); }} className="p-3 border-b border-white/5 hover:bg-black/20 cursor-pointer">
                                                        <div className="font-bold text-sm text-glass-title">{p.firstName} {p.lastName}</div>
                                                        <div className="text-xs text-glass-body">{p.uhid}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Test Catalog */}
                            <div className="md:col-span-8 space-y-4">
                                <h3 className="font-bold text-glass-title mb-4 text-lg border-b pb-2">Lab Test Menu</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {catalog.map(test => (
                                        <div key={test.id} className={`border p-4 rounded-xl transition ${selectedPatient ? 'bg-white hover:border-purple-300 hover:shadow-md' : 'bg-black/20 opacity-60 border-white/10'}`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-glass-title">{test.testName}</h4>
                                                    <p className="text-xs font-semibold text-purple-600 bg-purple-50 inline-block px-2 py-1 rounded mt-1">{test.department}</p>
                                                </div>
                                                <div className="font-bold text-glass-title text-lg">₹{test.price}</div>
                                            </div>
                                            <button
                                                onClick={() => orderTest(test.id)}
                                                disabled={!selectedPatient || loading}
                                                className="mt-4 w-full bg-slate-900 text-white font-bold py-2 rounded-lg shadow disabled:opacity-50 hover:bg-purple-600 transition"
                                            >
                                                Order & Dispatch To Lab
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left bg-white text-sm">
                                <thead className="bg-slate-800 text-white font-semibold">
                                    <tr>
                                        <th className="p-4 rounded-tl-xl">Order Tag</th>
                                        <th className="p-4">Patient Info</th>
                                        <th className="p-4">Test Profile</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right rounded-tr-xl">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 border border-white/5">
                                    {orders.map(o => (
                                        <tr key={o.id} className="hover:bg-black/20 leading-relaxed">
                                            <td className="p-4 text-glass-body text-xs font-mono">{o.id.substring(0, 8).toUpperCase()}</td>
                                            <td className="p-4 font-semibold text-glass-title">{o.patient.firstName} {o.patient.lastName}<div className="text-xs text-slate-400 font-normal mt-1">{o.patient.uhid}</div></td>
                                            <td className="p-4 font-bold text-white">{o.testName}</td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${o.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : o.status === 'SAMPLE_COLLECTED' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                    {o.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                {o.status === 'PENDING' && (
                                                    <button onClick={() => updateOrderStatus(o.id, 'SAMPLE_COLLECTED')} className="bg-white border border-sky-300 text-sky-600 hover:bg-sky-50 px-4 py-1.5 rounded-lg font-bold shadow-sm transition">Collect Sample</button>
                                                )}
                                                {o.status === 'SAMPLE_COLLECTED' && (
                                                    <button onClick={() => {
                                                        const result = prompt("Enter Test Result details:");
                                                        if (result) updateOrderStatus(o.id, 'RESULT_ENTERED', result);
                                                    }} className="liquid-glass-button text-white border-emerald-500/50 px-4 py-1.5 rounded-lg font-bold shadow-sm transition">Enter Result</button>
                                                )}
                                                {o.status === 'RESULT_ENTERED' && (
                                                    <div className="text-emerald-600 flex justify-end gap-1 font-bold text-xs bg-emerald-50 w-fit ml-auto px-3 py-1.5 rounded-lg border border-emerald-100">
                                                        <CheckCircle2 size={16} /> Report Finalized
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {orders.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">No laboratory orders tracking.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'assets' && (
                        <div className="max-w-xl mx-auto bg-black/20 border border-white/10 p-6 rounded-xl mt-8">
                            <h3 className="font-bold text-glass-title mb-4 border-b border-white/10 pb-2">Add New Lab Test to Catalog</h3>
                            <form onSubmit={handleAddTest} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-white mb-1">Test Name</label>
                                    <input required type="text" className="w-full text-sm border-white/20 rounded-lg p-2" placeholder="e.g. Complete Blood Count (CBC)" value={testForm.testName} onChange={e => setTestForm({ ...testForm, testName: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white mb-1">Department</label>
                                    <select className="w-full text-sm border-white/20 rounded-lg p-2" value={testForm.department} onChange={e => setTestForm({ ...testForm, department: e.target.value })}>
                                        <option value="Pathology">Pathology</option>
                                        <option value="Biochemistry">Biochemistry</option>
                                        <option value="Microbiology">Microbiology</option>
                                        <option value="Hematology">Hematology</option>
                                        <option value="Radiology">Radiology</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white mb-1">Price (₹)</label>
                                    <input required type="number" min="0" className="w-full text-sm border-white/20 rounded-lg p-2" value={testForm.price} onChange={e => setTestForm({ ...testForm, price: e.target.value })} />
                                </div>
                                <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg transition mt-2">
                                    Add Test to Catalog
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
