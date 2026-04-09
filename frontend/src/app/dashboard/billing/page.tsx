'use client';

import { useState, useEffect } from 'react';
import { IndianRupee, Search, User, CheckCircle2, Receipt, AlertCircle, CreditCard, Wallet } from 'lucide-react';

export default function BillingPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [patients, setPatients] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [bills, setBills] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'checkout' | 'invoice'>('checkout');

    // Visit Invoice State
    const [visitInvoiceId, setVisitInvoiceId] = useState('');
    const [invoiceData, setInvoiceData] = useState<any>(null);
    const [searchingInvoice, setSearchingInvoice] = useState(false);

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

    const handleSearchInvoice = async () => {
        if (!visitInvoiceId) return;
        setSearchingInvoice(true);
        try {
            const res = await fetch(`http://localhost:5000/api/billing/visit/${visitInvoiceId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                setInvoiceData(await res.json());
            } else {
                setInvoiceData(null);
                alert("Visit not found");
            }
        } catch (err) { console.error(err); }
        setSearchingInvoice(false);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-glass-title tracking-tight flex items-center gap-2">
                    <Wallet className="text-indigo-600" /> Central Billing Desk
                </h1>
                <div className="flex bg-slate-800 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('checkout')} className={`px-5 py-2 rounded-md text-sm font-semibold transition ${activeTab === 'checkout' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Pending Checkouts</button>
                    <button onClick={() => setActiveTab('invoice')} className={`px-5 py-2 rounded-md text-sm font-semibold transition ${activeTab === 'invoice' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Visit Invoices</button>
                </div>
            </div>

            {activeTab === 'checkout' ? (

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Patient Search */}
                    <div className="md:col-span-4 space-y-6">
                        <div className="liquid-glass-card rounded-xl    overflow-hidden">
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
                                        <label className="block text-xs font-semibold text-glass-body mb-2 uppercase tracking-wide">Search Patient</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Enter UHID, Name, or Mobile..."
                                                className="flex-1 px-4 py-2 border border-white/20 rounded-lg text-sm transition-shadow focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && executeSearch()}
                                            />
                                            <button onClick={executeSearch} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-lg transition-colors border border-indigo-200">
                                                <Search size={18} />
                                            </button>
                                        </div>

                                        {patients.length > 0 && (
                                            <div className="mt-4 border rounded-lg overflow-hidden border-white/10 shadow-sm max-h-60 overflow-y-auto">
                                                {patients.map(p => (
                                                    <div key={p.id} onClick={() => handleSelectPatient(p)} className="p-3 border-b last:border-0 hover:bg-black/20 cursor-pointer transition-colors">
                                                        <div className="font-bold text-glass-title">{p.firstName} {p.lastName}</div>
                                                        <div className="text-xs text-glass-body flex justify-between mt-1">
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
                            <div className="bg-black/20 border-2 border-dashed border-white/10 rounded-xl h-full flex flex-col items-center justify-center p-12 text-slate-400">
                                <Receipt size={64} className="mb-4 opacity-50" />
                                <h3 className="text-xl font-bold text-glass-body mb-2">No Patient Selected</h3>
                                <p className="text-center">Search and select a patient to view their pending bills and process checkout.</p>
                            </div>
                        ) : (
                            <div className="liquid-glass-card rounded-xl    flex flex-col min-h-[500px]">
                                <div className="p-4 bg-black/20 border-b border-white/10 flex justify-between items-center rounded-t-xl">
                                    <h3 className="font-bold text-glass-title flex items-center gap-2"><IndianRupee size={18} /> Unpaid Bills Summary</h3>
                                    <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                        {bills.length} Pending
                                    </span>
                                </div>

                                <div className="flex-1 p-6 overflow-y-auto bg-black/20/50">
                                    {successMsg && (
                                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 font-medium shadow-sm">
                                            <CheckCircle2 className="text-emerald-500" size={24} />
                                            {successMsg}
                                        </div>
                                    )}

                                    {bills.length === 0 ? (
                                        <div className="text-center py-12 text-slate-400">
                                            <CheckCircle2 size={48} className="mx-auto mb-3 text-slate-300" />
                                            <p className="text-lg font-medium text-glass-body">All Clear!</p>
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
                                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50/30 shadow-sm' : 'border-white/10 bg-white hover:border-indigo-300'}`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex gap-4 items-center">
                                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-white/20'}`}>
                                                                    {isSelected && <CheckCircle2 size={12} className="text-white" />}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-glass-title">{bill.billNo}</div>
                                                                    <div className="text-xs font-semibold text-glass-body bg-slate-100 px-2 py-0.5 rounded inline-block mt-1">TYPE: {bill.type}</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-lg font-black text-glass-title">₹{(bill.subTotal + bill.gstAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                                                <div className="text-xs text-glass-body mt-1">{new Date(bill.createdAt).toLocaleDateString()}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Checkout Footer Action Box */}
                                <div className="p-6 bg-white border-t border-white/10 rounded-b-xl shadow-[0_-4px_15px_rgba(0,0,0,0.02)]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-glass-body uppercase tracking-widest mb-1">Apply Discount (₹)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full border border-white/20 p-2.5 rounded-lg text-sm bg-black/20 focus:bg-white transition-colors"
                                                    value={discount || ''}
                                                    onChange={e => setDiscount(Number(e.target.value))}
                                                    placeholder="Enter flat discount amount..."
                                                    disabled={bills.length === 0}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-glass-muted px-2">
                                                <span>Subtotal Selected</span>
                                                <span className="font-mono">₹{rawTotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-rose-500 px-2 font-medium">
                                                <span>Discount Applied</span>
                                                <span className="font-mono">- ₹{(discount || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-2xl font-black text-glass-title border-t-2 border-slate-800 pt-3 px-2">
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
            ) : (
                <div className="bg-slate-900 rounded-xl p-8 border border-slate-800 flex flex-col items-center">
                    <div className="w-full max-w-2xl mb-8">
                        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Lookup Visit Invoice by ID</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter Visit ID..."
                                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                                value={visitInvoiceId}
                                onChange={e => setVisitInvoiceId(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearchInvoice()}
                            />
                            <button onClick={handleSearchInvoice} disabled={searchingInvoice} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl transition-colors font-bold disabled:opacity-50">
                                {searchingInvoice ? 'Searching...' : 'Retrieve Invoice'}
                            </button>
                        </div>
                    </div>

                    {invoiceData && (
                        <div className="w-full bg-white text-slate-900 rounded-xl p-8 shadow-2xl flex flex-col max-w-4xl">
                            <div className="flex justify-between items-start border-b-2 border-slate-200 pb-6 mb-6">
                                <div>
                                    <h2 className="text-3xl font-black text-indigo-900 mb-1">VISIT INVOICE</h2>
                                    <div className="text-slate-500 font-mono text-sm">ID: {invoiceData.visit.id}</div>
                                    <div className="text-slate-500 text-sm mt-1">Date: {new Date(invoiceData.visit.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-slate-800">{invoiceData.visit.patient.firstName} {invoiceData.visit.patient.lastName}</div>
                                    <div className="text-sm font-mono text-slate-500">UHID: {invoiceData.visit.patient.uhid}</div>
                                    <div className="text-sm text-slate-600 mt-2">Consulting Dept: {invoiceData.visit.department}</div>
                                </div>
                            </div>

                            <table className="w-full text-left mb-6 text-sm">
                                <thead>
                                    <tr className="border-b-2 border-slate-200 text-slate-500 uppercase tracking-wider text-xs">
                                        <th className="py-3 px-2">Type / Description</th>
                                        <th className="py-3 px-2 text-right">Subtotal</th>
                                        <th className="py-3 px-2 text-right">GST</th>
                                        <th className="py-3 px-2 text-right">Discount</th>
                                        <th className="py-3 px-2 text-right font-bold text-slate-800">Net Payable</th>
                                        <th className="py-3 px-2 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {invoiceData.bills.map((bill: any) => (
                                        <tr key={bill.id}>
                                            <td className="py-4 px-2">
                                                <div className="font-bold text-slate-800">{bill.type}</div>
                                                <div className="text-xs text-slate-500 mt-0.5 font-mono">{bill.billNo}</div>
                                            </td>
                                            <td className="py-4 px-2 text-right">₹{bill.subTotal.toFixed(2)}</td>
                                            <td className="py-4 px-2 text-right">₹{bill.gstAmount.toFixed(2)}</td>
                                            <td className="py-4 px-2 text-right text-rose-500">{bill.discount > 0 ? `-₹${bill.discount.toFixed(2)}` : '—'}</td>
                                            <td className="py-4 px-2 text-right font-bold text-slate-800">₹{bill.netPayable.toFixed(2)}</td>
                                            <td className="py-4 px-2 text-center">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${bill.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                    {bill.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {invoiceData.bills.length === 0 && (
                                        <tr><td colSpan={6} className="py-8 text-center text-slate-400">No bills recorded for this visit.</td></tr>
                                    )}
                                </tbody>
                            </table>

                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mt-auto ml-auto min-w-[300px]">
                                <div className="space-y-2 text-sm text-slate-600 mb-4 border-b border-slate-200 pb-4">
                                    <div className="flex justify-between"><span>Total Subtotal:</span> <span>₹{invoiceData.totalSubTotal.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span>Total GST:</span> <span>₹{invoiceData.totalGst.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-rose-500"><span>Total Discount:</span> <span>- ₹{invoiceData.totalDiscount.toFixed(2)}</span></div>
                                </div>
                                <div className="space-y-2 font-bold mb-4">
                                    <div className="flex justify-between text-slate-800"><span>Total Bill:</span> <span>₹{invoiceData.netPayable.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-emerald-600"><span>Total Paid:</span> <span>₹{invoiceData.paidAmount.toFixed(2)}</span></div>
                                </div>
                                <div className="flex justify-between items-center text-rose-600 text-xl font-black border-t-2 border-slate-200 pt-4">
                                    <span>PENDING DUE:</span>
                                    <span>₹{invoiceData.pendingAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
