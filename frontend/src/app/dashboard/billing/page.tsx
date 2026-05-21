'use client';
import { API_BASE } from '@/lib/api';
import { useState, useEffect, useCallback } from 'react';
import { IndianRupee, Search, User, CheckCircle2, Receipt, AlertCircle, CreditCard, Wallet, Clock, ArrowRight, X, UserSearch } from 'lucide-react';

export default function BillingPage() {
    const [activeTab, setActiveTab] = useState<'checkout' | 'invoice'>('checkout');

    // Queue State
    const [pendingQueue, setPendingQueue] = useState<any[]>([]);
    const [queueLoading, setQueueLoading] = useState(true);

    // Search State (Fallback)
    const [searchMode, setSearchMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // Workspace State
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [bills, setBills] = useState<any[]>([]);
    const [selectedBillIds, setSelectedBillIds] = useState<string[]>([]);
    
    // Payment State
    const [discount, setDiscount] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Visit Invoice State
    const [visitInvoiceId, setVisitInvoiceId] = useState('');
    const [invoiceData, setInvoiceData] = useState<any>(null);
    const [searchingInvoice, setSearchingInvoice] = useState(false);

    const fetchQueue = useCallback(async () => {
        setQueueLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/billing/pending/all`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                setPendingQueue(await res.json());
            }
        } catch (err) { console.error(err); }
        setQueueLoading(false);
    }, []);

    useEffect(() => {
        fetchQueue();
        const interval = setInterval(fetchQueue, 30000); // refresh queue every 30s
        return () => clearInterval(interval);
    }, [fetchQueue]);

    const executeSearch = async () => {
        if (!searchQuery) return;
        try {
            const res = await fetch(`${API_BASE}/api/patient/search?query=${searchQuery}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) setSearchResults(await res.json());
        } catch (err) { console.error(err); }
    };

    const fetchPendingBills = async (uhid: string) => {
        try {
            const res = await fetch(`${API_BASE}/api/billing/${uhid}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBills(data.bills);
                setSelectedBillIds(data.bills.map((b: any) => b.id)); // auto-select all
            } else {
                setBills([]);
                setSelectedBillIds([]);
            }
        } catch (err) { console.error(err); }
    };

    const handleSelectPatient = (p: any) => {
        setSelectedPatient(p);
        setSearchMode(false);
        setSearchQuery('');
        setSearchResults([]);
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
            const res = await fetch(`${API_BASE}/api/billing/pay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    patientId: selectedPatient.id,
                    billIds: selectedBillIds,
                    paymentMode: 'CASH',
                    discount: discount
                })
            });

            const data = await res.json();
            if (res.ok) {
                setSuccessMsg(`Payment of ₹${data.amountPaid.toLocaleString()} processed successfully!`);
                fetchPendingBills(selectedPatient.uhid);
                fetchQueue(); // Refresh queue to remove patient if zero balance
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

    const handleSearchInvoice = async () => {
        if (!visitInvoiceId) return;
        setSearchingInvoice(true);
        try {
            const res = await fetch(`${API_BASE}/api/billing/visit/${visitInvoiceId}`, {
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

    // Derived values
    const selectedBillsObj = bills.filter(b => selectedBillIds.includes(b.id));
    const rawTotal = selectedBillsObj.reduce((sum, b) => sum + b.subTotal + b.gstAmount, 0);
    const netPayable = Math.max(rawTotal - discount, 0);

    return (
        <div className="max-w-[1400px] mx-auto space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center shrink-0">
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                    <div className="p-2 bg-indigo-600/20 rounded-lg border border-indigo-500/30">
                        <Wallet className="text-indigo-400" size={24} />
                    </div>
                    Central Billing Desk
                </h1>
                <div className="flex bg-slate-800/80 p-1.5 rounded-xl border border-white/5 backdrop-blur-sm">
                    <button onClick={() => setActiveTab('checkout')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'checkout' ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:text-white'}`}>Pending Checkouts</button>
                    <button onClick={() => setActiveTab('invoice')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'invoice' ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:text-white'}`}>Visit Invoices</button>
                </div>
            </div>

            {activeTab === 'checkout' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
                    
                    {/* LEFT PANE: Pending Checkout Queue */}
                    <div className="lg:col-span-4 flex flex-col gap-4 min-h-0 h-full">
                        <div className="liquid-glass-card rounded-2xl flex flex-col flex-1 min-h-0 border border-white/10 shadow-2xl relative overflow-hidden">
                            {/* Header / Search Toggle */}
                            <div className="p-5 border-b border-white/10 bg-black/40 backdrop-blur-md flex justify-between items-center z-10">
                                <h2 className="font-bold text-white flex items-center gap-2">
                                    <Clock size={18} className="text-amber-400" /> Checkout Queue
                                    <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full text-xs ml-2">{pendingQueue.length}</span>
                                </h2>
                                <button 
                                    onClick={() => setSearchMode(!searchMode)} 
                                    className={`p-2 rounded-lg transition-colors ${searchMode ? 'bg-indigo-600 text-white' : 'bg-white/5 hover:bg-white/10 text-slate-300'}`}
                                    title="Manual Search Fallback"
                                >
                                    {searchMode ? <X size={16} /> : <UserSearch size={16} />}
                                </button>
                            </div>

                            {/* Optional Search Bar */}
                            {searchMode && (
                                <div className="p-4 bg-indigo-900/20 border-b border-white/5 z-10 animate-fade-in">
                                    <div className="text-xs text-indigo-300 font-bold mb-2 uppercase tracking-wider">Manual Fallback Search</div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Enter UHID, Name, or Mobile..."
                                            className="flex-1 px-4 py-2 bg-black/40 border border-indigo-500/30 rounded-lg text-sm text-white transition-all focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && executeSearch()}
                                            autoFocus
                                        />
                                        <button onClick={executeSearch} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-indigo-900/50">
                                            <Search size={16} />
                                        </button>
                                    </div>
                                    
                                    {searchResults.length > 0 && (
                                        <div className="mt-3 bg-black/60 rounded-xl border border-white/10 max-h-48 overflow-y-auto">
                                            {searchResults.map(p => (
                                                <div key={p.id} onClick={() => handleSelectPatient(p)} className="p-3 border-b border-white/5 last:border-0 hover:bg-indigo-600/30 cursor-pointer transition-colors">
                                                    <div className="font-bold text-white text-sm">{p.firstName} {p.lastName}</div>
                                                    <div className="text-[11px] text-slate-400 flex justify-between mt-1">
                                                        <span>UHID: {p.uhid}</span>
                                                        <span>{p.mobile}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Queue List */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-2 z-10 bg-gradient-to-b from-transparent to-black/20">
                                {queueLoading && pendingQueue.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
                                        <span className="text-sm">Loading queue...</span>
                                    </div>
                                ) : pendingQueue.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center">
                                        <CheckCircle2 size={40} className="mb-3 text-slate-600 opacity-50" />
                                        <div className="text-sm font-bold text-slate-400 mb-1">Queue is Empty</div>
                                        <div className="text-xs">All patients are cleared. No pending checkouts found.</div>
                                    </div>
                                ) : (
                                    pendingQueue.map(item => {
                                        const isSelected = selectedPatient?.uhid === item.patient.uhid;
                                        return (
                                            <div 
                                                key={item.patient.id} 
                                                onClick={() => handleSelectPatient(item.patient)}
                                                className={`group p-4 rounded-xl border cursor-pointer transition-all duration-300 relative overflow-hidden
                                                    ${isSelected ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-indigo-500/50'}`}
                                            >
                                                {isSelected && <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />}
                                                
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">{item.patient.firstName} {item.patient.lastName}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">UHID: {item.patient.uhid}</div>
                                                    </div>
                                                    <div className="bg-rose-500/20 text-rose-400 text-[10px] font-black px-2 py-1 rounded-md border border-rose-500/20">
                                                        {item.bills.length} BILL{item.bills.length > 1 ? 'S' : ''}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-end mt-3">
                                                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                                        <Clock size={10} /> Pending
                                                    </div>
                                                    <div className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors">
                                                        ₹{item.totalPending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANE: Billing Workspace */}
                    <div className="lg:col-span-8 h-full flex flex-col min-h-0">
                        {!selectedPatient ? (
                            <div className="liquid-glass-card rounded-2xl h-full flex flex-col items-center justify-center p-12 text-slate-400 border border-white/5 shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <Receipt size={80} className="mb-6 opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-700 text-indigo-400" />
                                <h3 className="text-2xl font-black text-white/50 mb-3 tracking-wide">Workspace Ready</h3>
                                <p className="text-center max-w-md text-sm text-slate-500 leading-relaxed">
                                    Select a patient from the <b className="text-indigo-400">Checkout Queue</b> on the left to process their pending bills and settle payments.
                                </p>
                            </div>
                        ) : (
                            <div className="liquid-glass-card rounded-2xl flex flex-col h-full border border-white/10 shadow-2xl overflow-hidden animate-fade-in relative">
                                
                                {/* Patient Context Header */}
                                <div className="p-6 bg-gradient-to-r from-indigo-900/80 to-slate-900 border-b border-indigo-500/30 flex justify-between items-center shrink-0">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center">
                                            <User size={24} className="text-indigo-300" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-white">{selectedPatient.firstName} {selectedPatient.lastName}</h2>
                                            <div className="flex gap-3 text-xs text-indigo-200/70 mt-1">
                                                <span className="font-mono">UHID: {selectedPatient.uhid}</span>
                                                <span>•</span>
                                                <span>{selectedPatient.age} Yrs / {selectedPatient.gender}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={clearPatient} className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors border border-white/10 hover:border-rose-500/30">
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Bills List Area */}
                                <div className="flex-1 p-6 overflow-y-auto bg-black/20">
                                    {successMsg && (
                                        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center gap-3 font-medium shadow-[0_0_20px_rgba(16,185,129,0.1)] animate-fade-in">
                                            <CheckCircle2 className="text-emerald-400 shrink-0" size={24} />
                                            {successMsg}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-slate-300 text-sm uppercase tracking-widest flex items-center gap-2">
                                            <Receipt size={16} /> Unpaid Invoices
                                        </h3>
                                        <button 
                                            onClick={() => setSelectedBillIds(selectedBillIds.length === bills.length ? [] : bills.map(b => b.id))}
                                            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                                        >
                                            {selectedBillIds.length === bills.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>

                                    {bills.length === 0 ? (
                                        <div className="text-center py-16 text-slate-400">
                                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <CheckCircle2 size={40} className="text-emerald-500" />
                                            </div>
                                            <p className="text-xl font-bold text-white mb-2">All Clear!</p>
                                            <p className="text-sm">There are no pending bills left for this patient.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {bills.map((bill: any) => {
                                                const isSelected = selectedBillIds.includes(bill.id);
                                                return (
                                                    <div
                                                        key={bill.id}
                                                        onClick={() => toggleBillSelection(bill.id)}
                                                        className={`group p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 
                                                            ${isSelected ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'}`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex gap-4 items-center">
                                                                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors
                                                                    ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-600 bg-black/50'}`}>
                                                                    {isSelected && <CheckCircle2 size={14} className="text-white" />}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors">{bill.billNo}</div>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded uppercase tracking-wider">{bill.type}</span>
                                                                        <span className="text-[10px] text-slate-500 font-mono">{new Date(bill.createdAt).toLocaleDateString()}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-xs text-slate-400 mb-0.5">Amount Due</div>
                                                                <div className={`text-xl font-black transition-colors ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                                                                    ₹{(bill.subTotal + bill.gstAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Checkout Footer */}
                                <div className="p-6 bg-slate-900 border-t border-white/10 shrink-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                        
                                        {/* Discount Control */}
                                        <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                Apply Discount (₹)
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <IndianRupee size={16} className="text-slate-500" />
                                                </div>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full bg-slate-800 border border-slate-700 pl-9 pr-4 py-3 rounded-lg text-white font-bold transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none placeholder-slate-600 disabled:opacity-50"
                                                    value={discount || ''}
                                                    onChange={e => setDiscount(Number(e.target.value))}
                                                    placeholder="0.00"
                                                    disabled={bills.length === 0}
                                                />
                                            </div>
                                        </div>

                                        {/* Ledger Totals */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-slate-400 text-sm px-2">
                                                <span>Subtotal Selected</span>
                                                <span className="font-mono">₹{rawTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-rose-400 text-sm font-medium px-2">
                                                <span>Discount Applied</span>
                                                <span className="font-mono">- ₹{(discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-3xl font-black text-white border-t border-white/10 pt-4 px-2 mt-2">
                                                <span>Net Payable</span>
                                                <span className="text-emerald-400">₹{netPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handlePayment}
                                        disabled={loading || selectedBillIds.length === 0 || netPayable < 0}
                                        className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white text-lg font-black py-4 rounded-xl shadow-[0_10px_30px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                                        <CreditCard size={24} className="relative z-10" />
                                        <span className="relative z-10">{loading ? 'Processing Secure Payment...' : 'Settle Cash Payment & Checkout'}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="liquid-glass-card rounded-2xl p-10 border border-white/10 flex flex-col items-center flex-1">
                    <div className="w-full max-w-2xl mb-10">
                        <label className="block text-sm font-bold text-indigo-300 mb-3 uppercase tracking-wider text-center">Lookup Historic Visit Invoice</label>
                        <div className="flex gap-2 p-2 bg-black/40 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search size={20} className="text-slate-500" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Enter Visit ID..."
                                    className="w-full pl-12 pr-4 py-4 bg-transparent text-lg text-white font-mono focus:outline-none placeholder-slate-600"
                                    value={visitInvoiceId}
                                    onChange={e => setVisitInvoiceId(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearchInvoice()}
                                />
                            </div>
                            <button 
                                onClick={handleSearchInvoice} 
                                disabled={searchingInvoice || !visitInvoiceId} 
                                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white px-8 rounded-xl transition-all font-bold shadow-lg flex items-center gap-2"
                            >
                                {searchingInvoice ? <span className="animate-pulse">Searching...</span> : 'Retrieve'}
                            </button>
                        </div>
                    </div>

                    {invoiceData && (
                        <div className="w-full bg-slate-50 text-slate-900 rounded-2xl p-10 shadow-2xl flex flex-col max-w-4xl border border-slate-200 animate-fade-in relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100 rounded-full blur-3xl -mr-20 -mt-20 opacity-50" />
                            
                            <div className="flex justify-between items-start border-b-2 border-slate-200 pb-8 mb-8 relative z-10">
                                <div>
                                    <h2 className="text-4xl font-black text-indigo-900 mb-2 tracking-tight">VISIT INVOICE</h2>
                                    <div className="text-slate-500 font-mono text-sm bg-white px-3 py-1 rounded-md border inline-block shadow-sm">ID: {invoiceData.visit.id}</div>
                                    <div className="text-slate-500 text-sm mt-3 font-medium flex items-center gap-2">
                                        <Clock size={16} /> Date: {new Date(invoiceData.visit.createdAt).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                </div>
                                <div className="text-right bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                    <div className="text-2xl font-bold text-slate-800">{invoiceData.visit.patient.firstName} {invoiceData.visit.patient.lastName}</div>
                                    <div className="text-sm font-mono text-indigo-600 font-bold mt-1">UHID: {invoiceData.visit.patient.uhid}</div>
                                    <div className="text-sm text-slate-600 mt-2 bg-slate-100 px-2 py-1 rounded inline-block font-medium">Dept: {invoiceData.visit.department}</div>
                                </div>
                            </div>

                            <table className="w-full text-left mb-8 text-sm relative z-10">
                                <thead>
                                    <tr className="border-b-2 border-slate-300 text-slate-600 uppercase tracking-widest text-xs">
                                        <th className="py-4 px-2 font-bold">Type / Description</th>
                                        <th className="py-4 px-2 text-right font-bold">Subtotal</th>
                                        <th className="py-4 px-2 text-right font-bold">GST</th>
                                        <th className="py-4 px-2 text-right font-bold">Discount</th>
                                        <th className="py-4 px-2 text-right font-black text-indigo-900">Net Payable</th>
                                        <th className="py-4 px-2 text-center font-bold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {invoiceData.bills.map((bill: any) => (
                                        <tr key={bill.id} className="hover:bg-white transition-colors">
                                            <td className="py-5 px-2">
                                                <div className="font-bold text-slate-800 text-base">{bill.type}</div>
                                                <div className="text-xs text-slate-500 mt-1 font-mono">{bill.billNo}</div>
                                            </td>
                                            <td className="py-5 px-2 text-right font-medium">₹{bill.subTotal.toFixed(2)}</td>
                                            <td className="py-5 px-2 text-right font-medium">₹{bill.gstAmount.toFixed(2)}</td>
                                            <td className="py-5 px-2 text-right text-rose-500 font-medium">{bill.discount > 0 ? `-₹${bill.discount.toFixed(2)}` : '—'}</td>
                                            <td className="py-5 px-2 text-right font-black text-slate-800 text-lg">₹{bill.netPayable.toFixed(2)}</td>
                                            <td className="py-5 px-2 text-center">
                                                <span className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${bill.status === 'PAID' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'}`}>
                                                    {bill.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {invoiceData.bills.length === 0 && (
                                        <tr><td colSpan={6} className="py-12 text-center text-slate-400 font-medium bg-white rounded-lg mt-4">No bills recorded for this visit.</td></tr>
                                    )}
                                </tbody>
                            </table>

                            <div className="bg-white rounded-2xl p-8 border border-slate-200 mt-auto ml-auto min-w-[350px] shadow-xl relative z-10">
                                <div className="space-y-3 text-sm text-slate-600 mb-6 border-b border-slate-200 pb-6">
                                    <div className="flex justify-between items-center"><span>Total Subtotal:</span> <span className="font-mono font-medium">₹{invoiceData.totalSubTotal.toFixed(2)}</span></div>
                                    <div className="flex justify-between items-center"><span>Total GST:</span> <span className="font-mono font-medium">₹{invoiceData.totalGst.toFixed(2)}</span></div>
                                    <div className="flex justify-between items-center text-rose-500 font-medium"><span>Total Discount:</span> <span className="font-mono">- ₹{invoiceData.totalDiscount.toFixed(2)}</span></div>
                                </div>
                                <div className="space-y-3 font-bold mb-6">
                                    <div className="flex justify-between items-center text-slate-800 text-lg"><span>Total Bill:</span> <span className="font-mono">₹{invoiceData.netPayable.toFixed(2)}</span></div>
                                    <div className="flex justify-between items-center text-emerald-600 text-lg"><span>Total Paid:</span> <span className="font-mono">₹{invoiceData.paidAmount.toFixed(2)}</span></div>
                                </div>
                                <div className="flex justify-between items-center text-rose-600 text-2xl font-black border-t-2 border-slate-200 pt-6">
                                    <span>PENDING DUE</span>
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
