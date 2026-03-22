'use client';

import { useState, useEffect } from 'react';
import { IndianRupee, FileText, BarChart3, TrendingUp, Download, Receipt } from 'lucide-react';

export default function AccountsPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'compliance'>('overview');

    const [summary, setSummary] = useState<any>(null);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Expense form state
    const [category, setCategory] = useState('RENT');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [gstAmount, setGstAmount] = useState('');
    const [tdsAmount, setTdsAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('BANK');
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchSummary();
    }, []);

    useEffect(() => {
        if (activeTab === 'expenses') fetchExpenses();
    }, [activeTab]);

    const fetchSummary = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/accounts/summary', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setSummary(await res.json());
        } catch (err) { console.error(err); }
    };

    const fetchExpenses = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/accounts/expenses', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setExpenses(await res.json());
        } catch (err) { console.error(err); }
    };

    const handleAddExpense = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        try {
            await fetch('http://localhost:5000/api/accounts/expenses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    category, description, paymentMode, date: expenseDate,
                    amount: Number(amount),
                    gstAmount: Number(gstAmount || 0),
                    tdsAmount: Number(tdsAmount || 0)
                })
            });
            fetchExpenses();
            fetchSummary(); // Update overview in background
            setDescription(''); setAmount(''); setGstAmount(''); setTdsAmount('');
        } catch (err) { console.error(err) }
        setLoading(false);
    };

    const payExpense = async (id: string) => {
        try {
            await fetch(`http://localhost:5000/api/accounts/expenses/${id}/pay`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            fetchExpenses();
            fetchSummary();
        } catch (err) { console.error(err); }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <IndianRupee className="text-indigo-600" /> Accounts, Finance & Taxation
                </h1>
                <button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold px-4 py-2 rounded-lg text-sm shadow-sm transition flex items-center gap-2">
                    <Download size={16} /> Export Ledgers
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[500px] flex flex-col">
                {/* Tabs */}
                <div className="flex border-b border-slate-200 bg-slate-50 rounded-t-xl">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        <div className="flex justify-center items-center gap-2"><BarChart3 size={16} /> Profit & Loss Overview</div>
                    </button>
                    <button
                        onClick={() => setActiveTab('expenses')}
                        className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'expenses' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        <div className="flex justify-center items-center gap-2"><Receipt size={16} /> Expense Vouchers</div>
                    </button>
                    <button
                        onClick={() => setActiveTab('compliance')}
                        className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'compliance' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        <div className="flex justify-center items-center gap-2"><FileText size={16} /> GST & TDS Compliance</div>
                    </button>
                </div>

                <div className="p-6 flex-1">

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && summary && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                    <div className="text-sm font-bold text-slate-500 mb-1 flex items-center gap-2">Gross Revenue (Total Sales)</div>
                                    <div className="text-3xl font-bold text-slate-900">₹{summary.summary.totalRevenue.toLocaleString()}</div>
                                    <div className="text-xs text-slate-500 mt-2">Aggregate of all paid patient bills (OPD, IPD, Lab, Pharma).</div>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                    <div className="text-sm font-bold text-slate-500 mb-1 flex items-center gap-2">Total Expenses (Outflow)</div>
                                    <div className="text-3xl font-bold text-slate-900">₹{summary.summary.totalExpense.toLocaleString()}</div>
                                    <div className="text-xs text-slate-500 mt-2">Aggregate of all paid vendor and operational expenses.</div>
                                </div>
                                <div className={`p-6 rounded-xl border ${summary.summary.netProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                                    <div className="text-sm font-bold text-slate-600 mb-1 flex items-center gap-2"><TrendingUp size={16} /> Net Profit Tracker</div>
                                    <div className={`text-3xl font-bold ${summary.summary.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                        {summary.summary.netProfit >= 0 ? '+' : '-'}₹{Math.abs(summary.summary.netProfit).toLocaleString()}
                                    </div>
                                    <div className="text-xs text-slate-600 mt-2 font-medium">Real-time P&L status across all integrated models.</div>
                                </div>
                            </div>

                            <h3 className="font-bold text-slate-800 text-lg border-b pb-2 mt-8">Registered Fixed & Current Ledgers</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {summary.ledgers.map((l: any) => (
                                    <div key={l.id} className="border border-slate-200 p-4 rounded-xl shadow-sm">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{l.group}</div>
                                        <div className="font-bold text-slate-800 mt-1">{l.name}</div>
                                    </div>
                                ))}
                                {summary.ledgers.length === 0 && <div className="text-slate-500 text-sm italic col-span-4 p-4 text-center bg-slate-50 border rounded-xl">No manual ledgers created yet. Operating on logical aggregates.</div>}
                            </div>
                        </div>
                    )}

                    {/* EXPENSES TAB */}
                    {activeTab === 'expenses' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* New Expense Form */}
                            <div className="lg:col-span-4 space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-200 h-fit">
                                <h3 className="font-bold text-slate-800 pb-2 border-b">Create Voucher / Expense</h3>
                                <form onSubmit={handleAddExpense} className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-semibold mb-1 text-slate-600">Expense Category</label>
                                        <select className="w-full text-sm border p-2.5 rounded-lg bg-white" value={category} onChange={e => setCategory(e.target.value)}>
                                            <option value="RENT">Rent & Lease</option>
                                            <option value="SALARY">Salary & Wages</option>
                                            <option value="UTILITIES">Utilities (Electricity/Water)</option>
                                            <option value="VENDOR_PAYMENT">Vendor Payments (Inventory)</option>
                                            <option value="MAINTENANCE">Equipment Maintenance</option>
                                            <option value="MISC">Miscellaneous</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold mb-1 text-slate-600">Description / Payee Name</label>
                                        <input type="text" required className="w-full text-sm border p-2.5 rounded-lg" value={description} onChange={e => setDescription(e.target.value)} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold mb-1 text-slate-600">Date</label>
                                            <input type="date" required className="w-full text-sm border p-2.5 rounded-lg" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold mb-1 text-slate-600">Mode</label>
                                            <select className="w-full text-sm border p-2.5 rounded-lg bg-white" value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                                                <option value="BANK">Bank Transfer</option>
                                                <option value="CASH">Cash</option>
                                                <option value="UPI">UPI</option>
                                                <option value="CHEQUE">Cheque</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="bg-white p-3 rounded-lg border border-slate-200 mt-2">
                                        <div>
                                            <label className="block text-xs font-bold mb-1 text-slate-700">Base Amount (₹)</label>
                                            <input type="number" required min="1" className="w-full text-sm border p-2 rounded" value={amount} onChange={e => setAmount(e.target.value)} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <div>
                                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Input GST (+)</label>
                                                <input type="number" min="0" className="w-full text-sm border p-2 rounded border-amber-200 bg-amber-50" value={gstAmount} onChange={e => setGstAmount(e.target.value)} placeholder="0.00" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">TDS Deduct (-)</label>
                                                <input type="number" min="0" className="w-full text-sm border p-2 rounded border-rose-200 bg-rose-50" value={tdsAmount} onChange={e => setTdsAmount(e.target.value)} placeholder="0.00" />
                                            </div>
                                        </div>
                                        <div className="text-xs text-right mt-3 text-slate-500 font-bold">
                                            Total Payout: <span className="text-base text-slate-900 ml-1">₹{(Number(amount || 0) + Number(gstAmount || 0) - Number(tdsAmount || 0)).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 mt-4 rounded-lg shadow transition">
                                        Record Voucher
                                    </button>
                                </form>
                            </div>

                            {/* Vouchers List */}
                            <div className="lg:col-span-8">
                                <h3 className="font-bold text-slate-800 pb-2 border-b mb-4">Voucher Ledger</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm bg-white border border-slate-200 rounded-xl">
                                        <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                                            <tr>
                                                <th className="p-3">Voucher #</th>
                                                <th className="p-3">Category/Desc</th>
                                                <th className="p-3">Financials (₹)</th>
                                                <th className="p-3 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {expenses.map(e => (
                                                <tr key={e.id} className="hover:bg-slate-50">
                                                    <td className="p-3 font-mono text-xs text-slate-500">{e.voucherNo}</td>
                                                    <td className="p-3">
                                                        <div className="font-bold text-slate-800">{e.category}</div>
                                                        <div className="text-xs text-slate-500">{e.description} • {e.paymentMode}</div>
                                                    </td>
                                                    <td className="p-3 text-xs">
                                                        <div>Base: <b>₹{e.amount}</b></div>
                                                        {e.gstAmount > 0 && <div className="text-emerald-600">GST (+): ₹{e.gstAmount}</div>}
                                                        {e.tdsAmount > 0 && <div className="text-rose-600">TDS (-): ₹{e.tdsAmount}</div>}
                                                        <div className="text-sm font-bold mt-1 text-slate-900 border-t pt-1">Net: ₹{e.netAmount}</div>
                                                    </td>
                                                    <td className="p-3 text-right align-middle">
                                                        {e.status === 'PENDING' ? (
                                                            <button onClick={() => payExpense(e.id)} className="bg-white border border-indigo-300 text-indigo-700 font-bold px-3 py-1.5 rounded shadow-sm text-xs hover:bg-indigo-50">Mark Paid</button>
                                                        ) : (
                                                            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold inline-block">PAID</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {expenses.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-400">No expenses recorded.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* COMPLIANCE TAB */}
                    {activeTab === 'compliance' && summary && (
                        <div className="max-w-4xl mx-auto space-y-6">

                            <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-xl flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2"><FileText /> GST Liability Engine</h2>
                                    <p className="text-sm text-indigo-700 mt-1">GSTR-3B / GSTR-1 Automated Mapping</p>
                                </div>
                                <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-lg shadow transition">Export GSTR Format</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Outward */}
                                <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm">
                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Total Outward GST Collected</div>
                                    <div className="text-3xl font-bold text-slate-800">₹{summary.compliance.outwardGstCollected.toLocaleString()}</div>
                                    <div className="text-xs text-slate-500 mt-2 font-medium">Billed to patients on IPD, OPD, LAB bills. Liability to pay to gov.</div>
                                </div>

                                {/* Input ITC */}
                                <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm">
                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Input Tax Credit (ITC) Claimed</div>
                                    <div className="text-3xl font-bold text-emerald-600">₹{summary.compliance.inputGstPaid.toLocaleString()}</div>
                                    <div className="text-xs text-slate-500 mt-2 font-medium">Paid to registered vendors. Deductible from liability.</div>
                                </div>

                                {/* Net Payable */}
                                <div className={`border-2 rounded-xl p-6 shadow-sm ${summary.compliance.netGstPayable > 0 ? 'border-rose-300 bg-rose-50' : 'border-emerald-300 bg-emerald-50'}`}>
                                    <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${summary.compliance.netGstPayable > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>Net GST Payable Liability</div>
                                    <div className={`text-3xl font-black ${summary.compliance.netGstPayable > 0 ? 'text-rose-700' : 'text-emerald-800'}`}>₹{summary.compliance.netGstPayable.toLocaleString()}</div>
                                    <div className="text-xs mt-2 font-bold opacity-70">Calculated as Outward GST - Input Tax Credit.</div>
                                </div>
                            </div>

                            {/* TDS Component */}
                            <div className="bg-slate-800 text-white border border-slate-700 p-6 rounded-xl flex items-center justify-between mt-8 shadow-md">
                                <div>
                                    <h2 className="text-lg font-bold flex items-center gap-2">TDS Deductions Master (Withheld)</h2>
                                    <p className="text-sm text-slate-400 mt-1">Tax Deducted at Source on Vendor Payments/Salaries</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Total TDS Held</div>
                                    <div className="text-3xl font-bold text-sky-400">₹{summary.compliance.tdsDeducted.toLocaleString()}</div>
                                </div>
                            </div>

                        </div>
                    )}

                </div>
            </div>
        </>
    );
}
