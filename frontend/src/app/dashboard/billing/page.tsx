'use client';

import { useState, useEffect } from 'react';
import { IndianRupee, Search, User, CheckCircle2, Receipt, AlertCircle, CreditCard, Wallet } from 'lucide-react';

export default function BillingPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [patients, setPatients] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [bills, setBills] = useState<any[]>([]);

    // Payment form state
    const [selectedBillIds, setSelectedBillIds] = useState<string[]>([]);
    const [discount, setDiscount] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const executeSearch = async () => {
        if (!searchQuery) return;
        try {
            const res = await fetch(`http://localhost:5000/api/patient/search?query=${searchQuery}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setPatients(await res.json());
        } catch (err) { console.error(err); }
    };

    const fetchPendingBills = async (uhid: string) => {
        try {
            const res = await fetch(`http://localhost:5000/api/billing/${uhid}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBills(data.bills);
                // auto-select all found bills
                setSelectedBillIds(data.bills.map((b: any) => b.id));
            } else {
                setBills([]);
                setSelectedBillIds([]);
            }
        } catch (err) { console.error(err); }
    };

    const handleSelectPatient = (p: any) => {
        setSelectedPatient(p);
        setPatients([]);
        setSearchQuery('');
        setSuccessMsg('');
        fetchPendingBills(p.uhid);
    };

    const clearPatient = () => {
        setSelectedPatient(null);
        setBills([]);
        setSelectedBillIds([]);
        setDiscount(0);
        setSuccessMsg('');
    };

    const toggleBillSelection = (id: string) => {
        if (selectedBillIds.includes(id)) {
            setSelectedBillIds(selectedBillIds.filter(bId => bId !== id));
        } else {
            setSelectedBillIds([...selectedBillIds, id]);
        }
    };

    const handlePayment = async () => {
        if (!selectedPatient || selectedBillIds.length === 0) return;
        setLoading(true);
        setSuccessMsg('');
        try {
            const res = await fetch('http://localhost:5000/api/billing/pay', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    patientId: selectedPatient.id,
                    billIds: selectedBillIds,
                    paymentMode: 'CASH', // Locked to Cash for now as requested
                    discount: discount
                })
            });

            const data = await res.json();
            if (res.ok) {
                setSuccessMsg(`Payment of ₹${data.amountPaid.toLocaleString()} processed successfully!`);
                // Refresh bills
                fetchPendingBills(selectedPatient.uhid);
                setDiscount(0);
            } else {
                alert(data.message || "Failed to process payment");
            }
        } catch (err) {
            console.error(err);
            alert("Error processing payment");
        }
        setLoading(false);
    };

    // Derived values
    const selectedBillsObj = bills.filter(b => selectedBillIds.includes(b.id));
    const rawTotal = selectedBillsObj.reduce((sum, b) => sum + b.subTotal + b.gstAmount, 0);
    const netPayable = Math.max(rawTotal - discount, 0);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Wallet className="text-indigo-600" /> Central Billing & Checkout Desk
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Patient Search */}
                <div className="md:col-span-4 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
                            <h2 className="font-bold flex items-center gap-2"><User size={18} /> Patient Selection</h2>
                        </div>
                        <div className="p-6">
                            {selectedPatient ? (
                                <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 relative">
                                    <button onClick={clearPatient} className="absolute top-2 right-2 text-rose-500 hover:text-rose-700 text-xs font-bold px-2 py-1 bg-white rounded shadow-sm">
                                        Change
                                    </button>
                                    <div className="font-bold text-sky-900 text-lg mb-1">{selectedPatient.firstName} {selectedPatient.lastName}</div>
                                    <div className="text-sm text-sky-700 font-mono mb-2">UHID: {selectedPatient.uhid}</div>
                                    <div className="text-xs text-sky-600 flex items-center gap-1"><User size={12} /> {selectedPatient.age} Yrs • {selectedPatient.gender}</div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Search Patient</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Enter UHID, Name, or Mobile..."
                                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm transition-shadow focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && executeSearch()}
                                        />
                                        <button onClick={executeSearch} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-lg transition-colors border border-indigo-200">
                                            <Search size={18} />
                                        </button>
                                    </div>

                                    {patients.length > 0 && (
                                        <div className="mt-4 border rounded-lg overflow-hidden border-slate-200 shadow-sm max-h-60 overflow-y-auto">
                                            {patients.map(p => (
                                                <div key={p.id} onClick={() => handleSelectPatient(p)} className="p-3 border-b last:border-0 hover:bg-slate-50 cursor-pointer transition-colors">
                                                    <div className="font-bold text-slate-800">{p.firstName} {p.lastName}</div>
                                                    <div className="text-xs text-slate-500 flex justify-between mt-1">
                                                        <span>{p.uhid}</span>
                                                        <span>{p.mobile}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedPatient && (
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100 shadow-sm">
                            <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2"><AlertCircle size={16} /> Billing Policy</h3>
                            <p className="text-sm text-indigo-700 leading-relaxed">
                                Please ensure all final OP/IP consultations and pharmacy dispatches are completed before settling the final bill.
                                Accepted payment mode is currently locked to <b>CASH</b> for counter settlements.
                            </p>
                        </div>
                    )}
                </div>

                {/* Billing Workspace */}
                <div className="md:col-span-8">
                    {!selectedPatient ? (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl h-full flex flex-col items-center justify-center p-12 text-slate-400">
                            <Receipt size={64} className="mb-4 opacity-50" />
                            <h3 className="text-xl font-bold text-slate-500 mb-2">No Patient Selected</h3>
                            <p className="text-center">Search and select a patient to view their pending bills and process checkout.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[500px]">
                            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center rounded-t-xl">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><IndianRupee size={18} /> Unpaid Bills Summary</h3>
                                <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                    {bills.length} Pending
                                </span>
                            </div>

                            <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
                                {successMsg && (
                                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 font-medium shadow-sm">
                                        <CheckCircle2 className="text-emerald-500" size={24} />
                                        {successMsg}
                                    </div>
                                )}

                                {bills.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <CheckCircle2 size={48} className="mx-auto mb-3 text-slate-300" />
                                        <p className="text-lg font-medium text-slate-500">All Clear!</p>
                                        <p className="text-sm">There are no pending bills for this patient.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {bills.map((bill: any) => {
                                            const isSelected = selectedBillIds.includes(bill.id);
                                            return (
                                                <div
                                                    key={bill.id}
                                                    onClick={() => toggleBillSelection(bill.id)}
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50/30 shadow-sm' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex gap-4 items-center">
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'}`}>
                                                                {isSelected && <CheckCircle2 size={12} className="text-white" />}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-800">{bill.billNo}</div>
                                                                <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded inline-block mt-1">TYPE: {bill.type}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-lg font-black text-slate-900">₹{(bill.subTotal + bill.gstAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                                            <div className="text-xs text-slate-500 mt-1">{new Date(bill.createdAt).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Checkout Footer Action Box */}
                            <div className="p-6 bg-white border-t border-slate-200 rounded-b-xl shadow-[0_-4px_15px_rgba(0,0,0,0.02)]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Apply Discount (₹)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full border border-slate-300 p-2.5 rounded-lg text-sm bg-slate-50 focus:bg-white transition-colors"
                                                value={discount || ''}
                                                onChange={e => setDiscount(Number(e.target.value))}
                                                placeholder="Enter flat discount amount..."
                                                disabled={bills.length === 0}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-slate-600 px-2">
                                            <span>Subtotal Selected</span>
                                            <span className="font-mono">₹{rawTotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-rose-500 px-2 font-medium">
                                            <span>Discount Applied</span>
                                            <span className="font-mono">- ₹{(discount || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-2xl font-black text-slate-900 border-t-2 border-slate-800 pt-3 px-2">
                                            <span>Net Payable</span>
                                            <span>₹{netPayable.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePayment}
                                    disabled={loading || selectedBillIds.length === 0 || netPayable < 0}
                                    className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-black py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <CreditCard size={24} />
                                    {loading ? 'Processing...' : 'Settle Cash Payment & Checkout'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
