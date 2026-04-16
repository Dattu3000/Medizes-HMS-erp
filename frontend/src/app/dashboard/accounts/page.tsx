'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    IndianRupee, FileText, BarChart3, TrendingUp, TrendingDown, Download, Receipt,
    BookOpen, Scale, Wallet, Calendar, Clock, Brain, ChevronRight, Plus,
    AlertTriangle, CheckCircle2, Info, Zap, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const API = 'http://localhost:5000/api';
const getAuth = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const fmt = (n: number) => `₹${(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

type Tab = 'overview' | 'coa' | 'journal' | 'trial' | 'cashflow' | 'aging' | 'daybook' | 'ai';

export default function AccountsPage() {
    const [tab, setTab] = useState<Tab>('overview');
    const [summary, setSummary] = useState<any>(null);
    const [coa, setCoa] = useState<any>(null);
    const [journals, setJournals] = useState<any[]>([]);
    const [trialBalance, setTrialBalance] = useState<any>(null);
    const [cashFlow, setCashFlow] = useState<any>(null);
    const [arAging, setArAging] = useState<any>(null);
    const [apAging, setApAging] = useState<any>(null);
    const [dayBook, setDayBook] = useState<any>(null);
    const [aiInsights, setAiInsights] = useState<any>(null);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Expense form
    const [category, setCategory] = useState('RENT');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [gstAmount, setGstAmount] = useState('');
    const [tdsAmount, setTdsAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('BANK');

    // Journal form
    const [jeNarration, setJeNarration] = useState('');
    const [jeLines, setJeLines] = useState<any[]>([{ ledgerId: '', debit: '', credit: '' }, { ledgerId: '', debit: '', credit: '' }]);
    const [ledgerList, setLedgerList] = useState<any[]>([]);
    const [jeError, setJeError] = useState('');

    // Day book date
    const [dayBookDate, setDayBookDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchData = useCallback(async (which: Tab) => {
        setLoading(true);
        try {
            const h = getAuth();
            if (which === 'overview') {
                const [r1, r2] = await Promise.all([
                    fetch(`${API}/accounts/summary`, { headers: h }),
                    fetch(`${API}/accounts/expenses`, { headers: h })
                ]);
                setSummary(await r1.json());
                setExpenses(await r2.json());
            } else if (which === 'coa') {
                const r = await fetch(`${API}/accounts/chart-of-accounts`, { headers: h });
                const data = await r.json();
                setCoa(data);
                // Build flat ledger list for journal entry dropdowns
                if (data.tree) setLedgerList(data.tree.flatMap((t: any) => [t, ...(t.children || [])]));
            } else if (which === 'journal') {
                const r = await fetch(`${API}/accounts/journal-entries`, { headers: h });
                setJournals(await r.json());
                if (ledgerList.length === 0) {
                    const r2 = await fetch(`${API}/accounts/chart-of-accounts`, { headers: h });
                    const d = await r2.json();
                    if (d.tree) setLedgerList(d.tree.flatMap((t: any) => [t, ...(t.children || [])]));
                }
            } else if (which === 'trial') {
                const r = await fetch(`${API}/accounts/trial-balance`, { headers: h });
                setTrialBalance(await r.json());
            } else if (which === 'cashflow') {
                const r = await fetch(`${API}/accounts/cash-flow`, { headers: h });
                setCashFlow(await r.json());
            } else if (which === 'aging') {
                const [r1, r2] = await Promise.all([
                    fetch(`${API}/accounts/receivable-aging`, { headers: h }),
                    fetch(`${API}/accounts/payable-aging`, { headers: h })
                ]);
                setArAging(await r1.json());
                setApAging(await r2.json());
            } else if (which === 'daybook') {
                const r = await fetch(`${API}/accounts/day-book?date=${dayBookDate}`, { headers: h });
                setDayBook(await r.json());
            } else if (which === 'ai') {
                const r = await fetch(`${API}/accounts/ai/analyze`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' } });
                setAiInsights(await r.json());
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [dayBookDate, ledgerList.length]);

    useEffect(() => { fetchData('overview'); }, []);
    useEffect(() => { fetchData(tab); }, [tab]);

    const seedCoA = async () => {
        await fetch(`${API}/accounts/chart-of-accounts/seed`, { method: 'POST', headers: { ...getAuth(), 'Content-Type': 'application/json' } });
        fetchData('coa');
    };

    const addExpense = async () => {
        if (!amount || !description) return;
        await fetch(`${API}/accounts/expenses`, {
            method: 'POST', headers: { ...getAuth(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, description, amount: Number(amount), gstAmount: Number(gstAmount || 0), tdsAmount: Number(tdsAmount || 0), paymentMode })
        });
        setDescription(''); setAmount(''); setGstAmount(''); setTdsAmount('');
        fetchData('overview');
    };

    const payExp = async (id: string) => {
        await fetch(`${API}/accounts/expenses/${id}/pay`, { method: 'PUT', headers: getAuth() });
        fetchData('overview');
    };

    const submitJournal = async () => {
        setJeError('');
        const totalD = jeLines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
        const totalC = jeLines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
        if (Math.abs(totalD - totalC) > 0.01) { setJeError(`Debits (${fmt(totalD)}) ≠ Credits (${fmt(totalC)})`); return; }
        if (!jeNarration) { setJeError('Narration is required'); return; }
        const r = await fetch(`${API}/accounts/journal-entries`, {
            method: 'POST', headers: { ...getAuth(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ narration: jeNarration, lines: jeLines.filter(l => l.ledgerId) })
        });
        const data = await r.json();
        if (!r.ok) { setJeError(data.message); return; }
        setJeNarration(''); setJeLines([{ ledgerId: '', debit: '', credit: '' }, { ledgerId: '', debit: '', credit: '' }]);
        fetchData('journal');
    };

    const tabs: { id: Tab; label: string; icon: any }[] = [
        { id: 'overview', label: 'P&L Overview', icon: IndianRupee },
        { id: 'coa', label: 'Chart of Accounts', icon: BookOpen },
        { id: 'journal', label: 'Journal Entries', icon: FileText },
        { id: 'trial', label: 'Trial Balance', icon: Scale },
        { id: 'cashflow', label: 'Cash Flow', icon: Wallet },
        { id: 'aging', label: 'AR / AP Aging', icon: Clock },
        { id: 'daybook', label: 'Day Book', icon: Calendar },
        { id: 'ai', label: 'AI Advisor', icon: Brain },
    ];

    const agingColor = (bucket: string) => {
        if (bucket === 'current') return 'bg-emerald-500/20 text-emerald-400';
        if (bucket === 'days30') return 'bg-yellow-500/20 text-yellow-400';
        if (bucket === 'days60') return 'bg-orange-500/20 text-orange-400';
        if (bucket === 'days90') return 'bg-rose-500/20 text-rose-400';
        return 'bg-red-600/30 text-red-400';
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-glass-title tracking-tight flex items-center gap-2">
                    <IndianRupee className="text-emerald-500" /> Expert Finance & Ledger
                </h1>
                {loading && <span className="text-xs text-glass-muted animate-pulse">Loading...</span>}
            </div>

            <div className="liquid-glass-card rounded-xl min-h-[600px] flex flex-col">
                {/* Tab bar — horizontal scroll */}
                <div className="flex border-b border-white/10 bg-black/20 rounded-t-xl overflow-x-auto">
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`min-w-[130px] py-3 px-4 font-bold text-xs transition-colors border-b-2 ${tab === t.id ? 'border-emerald-500 text-emerald-400 bg-white/5' : 'border-transparent text-glass-body hover:text-glass-title'}`}>
                            <div className="flex justify-center items-center gap-1.5"><t.icon size={14} />{t.label}</div>
                        </button>
                    ))}
                </div>

                <div className="p-6 flex-1 overflow-auto">

                    {/* ═══ OVERVIEW TAB ═══ */}
                    {tab === 'overview' && summary && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: 'Gross Revenue', value: fmt(summary.summary.totalRevenue), color: 'text-emerald-400', icon: TrendingUp },
                                    { label: 'Total Expenses', value: fmt(summary.summary.totalExpense), color: 'text-rose-400', icon: TrendingDown },
                                    { label: 'Net Profit', value: fmt(summary.summary.netProfit), color: summary.summary.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400', icon: IndianRupee },
                                ].map(k => (
                                    <div key={k.label} className="bg-black/30 border border-white/10 rounded-xl p-5">
                                        <div className="text-xs font-bold text-glass-muted uppercase tracking-wider mb-2 flex items-center gap-1.5"><k.icon size={13} />{k.label}</div>
                                        <div className={`text-2xl font-black ${k.color}`}>{k.value}</div>
                                    </div>
                                ))}
                            </div>
                            {/* Expense Form */}
                            <div className="bg-black/20 border border-white/10 rounded-xl p-5">
                                <h3 className="font-bold text-glass-title mb-3 flex items-center gap-2"><Receipt size={15} /> Record Expense Voucher</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    <select value={category} onChange={e => setCategory(e.target.value)} className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white">
                                        {['RENT', 'MAINTENANCE', 'UTILITIES', 'VENDOR_PAYMENT', 'MEDICAL_SUPPLIES', 'MISC'].map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                                    </select>
                                    <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white" />
                                    <input placeholder="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white" />
                                    <input placeholder="GST" type="number" value={gstAmount} onChange={e => setGstAmount(e.target.value)} className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white" />
                                    <input placeholder="TDS" type="number" value={tdsAmount} onChange={e => setTdsAmount(e.target.value)} className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white" />
                                    <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white">
                                        {['BANK', 'CASH', 'UPI', 'CREDIT'].map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <button onClick={addExpense} className="bg-emerald-600 text-white font-bold rounded-lg px-4 py-2 text-sm hover:bg-emerald-500 transition col-span-2">+ Record Expense</button>
                                </div>
                            </div>
                            {/* Expense table */}
                            <div className="overflow-x-auto rounded-xl border border-white/10">
                                <table className="w-full text-xs">
                                    <thead className="bg-black/30 text-glass-muted"><tr><th className="p-3 text-left">Voucher</th><th className="p-3">Category</th><th className="p-3">Description</th><th className="p-3 text-right">Amount</th><th className="p-3 text-right">GST</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead>
                                    <tbody className="divide-y divide-white/5">
                                        {expenses.slice(0, 15).map((e: any) => (
                                            <tr key={e.id} className="hover:bg-white/5">
                                                <td className="p-3 font-mono text-white">{e.voucherNo}</td>
                                                <td className="p-3"><span className="bg-slate-700 px-2 py-0.5 rounded text-white">{e.category}</span></td>
                                                <td className="p-3 text-white/70">{e.description}</td>
                                                <td className="p-3 text-right font-bold text-white">{fmt(e.amount)}</td>
                                                <td className="p-3 text-right text-amber-400">{fmt(e.gstAmount)}</td>
                                                <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs font-bold ${e.status === 'PAID' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-yellow-600/20 text-yellow-400'}`}>{e.status}</span></td>
                                                <td className="p-3">{e.status === 'PENDING' && <button onClick={() => payExp(e.id)} className="bg-emerald-600 text-white px-2 py-1 rounded text-xs font-bold">Pay</button>}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ═══ CHART OF ACCOUNTS ═══ */}
                    {tab === 'coa' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-glass-title text-lg">Chart of Accounts</h3>
                                <button onClick={seedCoA} className="bg-violet-600 text-white font-bold px-4 py-2 rounded-lg text-xs hover:bg-violet-500 transition">Seed Default CoA</button>
                            </div>
                            {coa && Object.entries(coa.grouped || {}).map(([group, accounts]: [string, any]) => (
                                <div key={group} className="bg-black/20 border border-white/10 rounded-xl overflow-hidden">
                                    <div className={`px-4 py-3 font-bold text-sm uppercase tracking-wider ${group === 'ASSET' ? 'bg-blue-600/20 text-blue-400' :
                                            group === 'LIABILITY' ? 'bg-rose-600/20 text-rose-400' :
                                                group === 'EQUITY' ? 'bg-purple-600/20 text-purple-400' :
                                                    group === 'INCOME' ? 'bg-emerald-600/20 text-emerald-400' :
                                                        'bg-orange-600/20 text-orange-400'
                                        }`}>{group}</div>
                                    {accounts.map((acc: any) => (
                                        <div key={acc.id}>
                                            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 hover:bg-white/5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs text-glass-muted w-12">{acc.code || '—'}</span>
                                                    <span className="font-bold text-white text-sm">{acc.name}</span>
                                                    {acc.accountType === 'CONTROL' && <span className="bg-violet-600/20 text-violet-400 text-[10px] px-1.5 py-0.5 rounded font-bold">CONTROL</span>}
                                                </div>
                                                <span className={`font-mono font-bold text-sm ${acc.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt(Math.abs(acc.balance))}</span>
                                            </div>
                                            {(acc.children || []).map((child: any) => (
                                                <div key={child.id} className="flex items-center justify-between px-4 py-2 pl-10 border-b border-white/5 hover:bg-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <ChevronRight size={10} className="text-glass-muted" />
                                                        <span className="font-mono text-xs text-glass-muted w-12">{child.code || '—'}</span>
                                                        <span className="text-white/80 text-sm">{child.name}</span>
                                                    </div>
                                                    <span className={`font-mono text-sm ${child.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt(Math.abs(child.balance))}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ═══ JOURNAL ENTRIES ═══ */}
                    {tab === 'journal' && (
                        <div className="space-y-6">
                            <div className="bg-black/20 border border-white/10 rounded-xl p-5">
                                <h3 className="font-bold text-glass-title mb-3 flex items-center gap-2"><Plus size={15} /> New Journal Entry (Double-Entry)</h3>
                                <input placeholder="Narration / Description" value={jeNarration} onChange={e => setJeNarration(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm mb-3" />
                                {jeLines.map((line, idx) => (
                                    <div key={idx} className="grid grid-cols-3 gap-2 mb-2">
                                        <select value={line.ledgerId} onChange={e => { const n = [...jeLines]; n[idx].ledgerId = e.target.value; setJeLines(n); }} className="bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-white text-xs">
                                            <option value="">Select Account</option>
                                            {ledgerList.filter((l: any) => l.accountType === 'DETAIL').map((l: any) => <option key={l.id} value={l.id}>{l.code} - {l.name}</option>)}
                                        </select>
                                        <input placeholder="Debit ₹" type="number" value={line.debit} onChange={e => { const n = [...jeLines]; n[idx].debit = e.target.value; setJeLines(n); }} className="bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-emerald-400 text-xs" />
                                        <input placeholder="Credit ₹" type="number" value={line.credit} onChange={e => { const n = [...jeLines]; n[idx].credit = e.target.value; setJeLines(n); }} className="bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-rose-400 text-xs" />
                                    </div>
                                ))}
                                <div className="flex gap-2 mt-2">
                                    <button onClick={() => setJeLines([...jeLines, { ledgerId: '', debit: '', credit: '' }])} className="text-xs text-violet-400 font-bold">+ Add Line</button>
                                    <button onClick={submitJournal} className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-lg text-xs ml-auto">Post Journal Entry</button>
                                </div>
                                {jeError && <div className="text-rose-400 text-xs mt-2 font-bold">⚠ {jeError}</div>}
                                <div className="flex justify-between text-xs text-glass-muted mt-2 border-t border-white/10 pt-2">
                                    <span>Total Debits: <b className="text-emerald-400">{fmt(jeLines.reduce((s, l) => s + (Number(l.debit) || 0), 0))}</b></span>
                                    <span>Total Credits: <b className="text-rose-400">{fmt(jeLines.reduce((s, l) => s + (Number(l.credit) || 0), 0))}</b></span>
                                </div>
                            </div>
                            {/* Journal register */}
                            <div className="overflow-x-auto rounded-xl border border-white/10">
                                <table className="w-full text-xs">
                                    <thead className="bg-black/30 text-glass-muted"><tr><th className="p-3 text-left">Entry #</th><th className="p-3">Date</th><th className="p-3">Narration</th><th className="p-3">Lines</th><th className="p-3">Status</th></tr></thead>
                                    <tbody className="divide-y divide-white/5">
                                        {journals.map((je: any) => (
                                            <tr key={je.id} className="hover:bg-white/5">
                                                <td className="p-3 font-mono font-bold text-violet-400">{je.entryNo}</td>
                                                <td className="p-3 text-white/70">{new Date(je.date).toLocaleDateString('en-IN')}</td>
                                                <td className="p-3 text-white">{je.narration}</td>
                                                <td className="p-3">
                                                    {(je.lines || []).map((l: any, i: number) => (
                                                        <div key={i} className="flex gap-2 text-[10px]">
                                                            <span className="text-white/60">{l.ledger?.code || '—'} {l.ledger?.name}</span>
                                                            {l.debit > 0 && <span className="text-emerald-400">Dr {fmt(l.debit)}</span>}
                                                            {l.credit > 0 && <span className="text-rose-400">Cr {fmt(l.credit)}</span>}
                                                        </div>
                                                    ))}
                                                </td>
                                                <td className="p-3"><span className="bg-emerald-600/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">{je.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ═══ TRIAL BALANCE ═══ */}
                    {tab === 'trial' && trialBalance && (
                        <div className="space-y-4">
                            <div className={`p-4 rounded-xl border-2 text-center font-bold ${trialBalance.totals.isBalanced ? 'border-emerald-400 bg-emerald-600/10 text-emerald-400' : 'border-rose-400 bg-rose-600/10 text-rose-400'}`}>
                                {trialBalance.totals.isBalanced ? '✅ Books are Balanced — Debits equal Credits' : '⚠️ Imbalance Detected — Books do not balance'}
                            </div>
                            <div className="overflow-x-auto rounded-xl border border-white/10">
                                <table className="w-full text-xs">
                                    <thead className="bg-black/30 text-glass-muted"><tr><th className="p-3 text-left">Code</th><th className="p-3 text-left">Account</th><th className="p-3">Group</th><th className="p-3 text-right">Total Debit</th><th className="p-3 text-right">Total Credit</th><th className="p-3 text-right">Balance</th></tr></thead>
                                    <tbody className="divide-y divide-white/5">
                                        {trialBalance.trialBalance.map((tb: any) => (
                                            <tr key={tb.code || tb.name} className="hover:bg-white/5">
                                                <td className="p-3 font-mono text-violet-400">{tb.code || '—'}</td>
                                                <td className="p-3 text-white font-bold">{tb.name}</td>
                                                <td className="p-3"><span className="bg-slate-700 px-1.5 py-0.5 rounded text-glass-muted">{tb.group}</span></td>
                                                <td className="p-3 text-right text-emerald-400 font-mono">{tb.totalDebit > 0 ? fmt(tb.totalDebit) : '—'}</td>
                                                <td className="p-3 text-right text-rose-400 font-mono">{tb.totalCredit > 0 ? fmt(tb.totalCredit) : '—'}</td>
                                                <td className={`p-3 text-right font-bold font-mono ${tb.balance >= 0 ? 'text-white' : 'text-rose-400'}`}>{fmt(Math.abs(tb.balance))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-black/40 font-black text-sm">
                                        <tr><td colSpan={3} className="p-3 text-white">TOTALS</td><td className="p-3 text-right text-emerald-400">{fmt(trialBalance.totals.debit)}</td><td className="p-3 text-right text-rose-400">{fmt(trialBalance.totals.credit)}</td><td></td></tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ═══ CASH FLOW ═══ */}
                    {tab === 'cashflow' && cashFlow && (
                        <div className="space-y-4 max-w-3xl mx-auto">
                            {[
                                {
                                    title: '🏥 Operating Activities', items: [
                                        { label: 'Cash from Patients', value: cashFlow.operating.cashFromPatients, positive: true },
                                        { label: 'Cash to Vendors', value: cashFlow.operating.cashToVendors, positive: false },
                                        { label: 'Cash to Employees', value: cashFlow.operating.cashToEmployees, positive: false },
                                        { label: 'Net GST', value: cashFlow.operating.gstNet, positive: false },
                                    ], total: cashFlow.operating.total
                                },
                                {
                                    title: '🏗️ Investing Activities', items: [
                                        { label: 'Equipment Purchases', value: cashFlow.investing.equipmentPurchases, positive: false },
                                    ], total: cashFlow.investing.total
                                },
                                {
                                    title: '💳 Financing Activities', items: [
                                        { label: 'Loan Repayments', value: cashFlow.financing.loanRepayments, positive: false },
                                    ], total: cashFlow.financing.total
                                },
                            ].map(section => (
                                <div key={section.title} className="bg-black/20 border border-white/10 rounded-xl overflow-hidden">
                                    <div className="px-5 py-3 bg-black/30 font-bold text-glass-title text-sm">{section.title}</div>
                                    {section.items.map(item => (
                                        <div key={item.label} className="flex justify-between px-5 py-2 border-b border-white/5 text-sm">
                                            <span className="text-white/70">{item.label}</span>
                                            <span className={`font-mono font-bold ${item.value >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {item.value >= 0 ? '+' : ''}{fmt(item.value)}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between px-5 py-3 bg-black/20 font-bold text-sm">
                                        <span className="text-white">Net</span>
                                        <span className={`font-mono ${section.total >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt(section.total)}</span>
                                    </div>
                                </div>
                            ))}
                            <div className={`p-5 rounded-xl border-2 text-center ${cashFlow.netCashChange >= 0 ? 'border-emerald-400 bg-emerald-600/10' : 'border-rose-400 bg-rose-600/10'}`}>
                                <div className="text-xs font-bold text-glass-muted mb-1 uppercase">Net Cash Change</div>
                                <div className={`text-3xl font-black ${cashFlow.netCashChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt(cashFlow.netCashChange)}</div>
                            </div>
                        </div>
                    )}

                    {/* ═══ AR / AP AGING ═══ */}
                    {tab === 'aging' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* AR */}
                            <div className="space-y-3">
                                <h3 className="font-bold text-glass-title flex items-center gap-2"><ArrowDownRight size={15} className="text-blue-400" /> Accounts Receivable (Patients Owe Us)</h3>
                                {arAging && (
                                    <>
                                        <div className="grid grid-cols-5 gap-2 text-center">
                                            {[
                                                { label: 'Current', value: arAging.buckets.current, key: 'current' },
                                                { label: '1-30d', value: arAging.buckets.days30, key: 'days30' },
                                                { label: '31-60d', value: arAging.buckets.days60, key: 'days60' },
                                                { label: '61-90d', value: arAging.buckets.days90, key: 'days90' },
                                                { label: '90d+', value: arAging.buckets.over90, key: 'over90' },
                                            ].map(b => (
                                                <div key={b.key} className={`rounded-lg p-3 ${agingColor(b.key)}`}>
                                                    <div className="text-[10px] font-bold uppercase">{b.label}</div>
                                                    <div className="text-sm font-black">{fmt(b.value)}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-sm text-center text-glass-muted">Total Outstanding: <b className="text-white">{fmt(arAging.totalOutstanding)}</b> ({arAging.count} bills)</div>
                                    </>
                                )}
                            </div>
                            {/* AP */}
                            <div className="space-y-3">
                                <h3 className="font-bold text-glass-title flex items-center gap-2"><ArrowUpRight size={15} className="text-rose-400" /> Accounts Payable (We Owe Vendors)</h3>
                                {apAging && (
                                    <>
                                        <div className="grid grid-cols-5 gap-2 text-center">
                                            {[
                                                { label: 'Current', value: apAging.buckets.current, key: 'current' },
                                                { label: '1-30d', value: apAging.buckets.days30, key: 'days30' },
                                                { label: '31-60d', value: apAging.buckets.days60, key: 'days60' },
                                                { label: '61-90d', value: apAging.buckets.days90, key: 'days90' },
                                                { label: '90d+', value: apAging.buckets.over90, key: 'over90' },
                                            ].map(b => (
                                                <div key={b.key} className={`rounded-lg p-3 ${agingColor(b.key)}`}>
                                                    <div className="text-[10px] font-bold uppercase">{b.label}</div>
                                                    <div className="text-sm font-black">{fmt(b.value)}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-sm text-center text-glass-muted">Total Outstanding: <b className="text-white">{fmt(apAging.totalOutstanding)}</b> ({apAging.count} expenses)</div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ═══ DAY BOOK ═══ */}
                    {tab === 'daybook' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <input type="date" value={dayBookDate} onChange={e => setDayBookDate(e.target.value)} className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                                <button onClick={() => fetchData('daybook')} className="bg-violet-600 text-white font-bold px-4 py-2 rounded-lg text-xs">Load</button>
                            </div>
                            {dayBook && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                                        <h4 className="font-bold text-emerald-400 text-sm mb-2">Bills ({dayBook.bills.items.length})</h4>
                                        <div className="text-lg font-black text-white mb-2">{fmt(dayBook.bills.totalBilled)}</div>
                                        {dayBook.bills.items.map((b: any) => (
                                            <div key={b.id} className="flex justify-between text-xs py-1 border-b border-white/5">
                                                <span className="text-white/70">{b.billNo} — {b.type}</span>
                                                <span className={b.status === 'PAID' ? 'text-emerald-400' : 'text-yellow-400'}>{fmt(b.netPayable)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                                        <h4 className="font-bold text-rose-400 text-sm mb-2">Expenses ({dayBook.expenses.items.length})</h4>
                                        <div className="text-lg font-black text-white mb-2">{fmt(dayBook.expenses.totalExpensed)}</div>
                                        {dayBook.expenses.items.map((e: any) => (
                                            <div key={e.id} className="flex justify-between text-xs py-1 border-b border-white/5">
                                                <span className="text-white/70">{e.voucherNo} — {e.category}</span>
                                                <span className="text-rose-400">{fmt(e.netAmount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══ AI FINANCIAL ADVISOR ═══ */}
                    {tab === 'ai' && (
                        <div className="space-y-4 max-w-4xl mx-auto">
                            {!aiInsights && <button onClick={() => fetchData('ai')} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-4 rounded-xl text-sm flex items-center justify-center gap-2 hover:opacity-90 transition"><Brain size={18} /> Run AI Financial Analysis</button>}
                            {aiInsights && (
                                <>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { label: 'Profit Margin', value: `${aiInsights.summary.profitMargin}%`, color: Number(aiInsights.summary.profitMargin) > 15 ? 'text-emerald-400' : 'text-rose-400' },
                                            { label: 'Collection Rate', value: `${aiInsights.summary.collectionRate}%`, color: Number(aiInsights.summary.collectionRate) > 85 ? 'text-emerald-400' : 'text-yellow-400' },
                                            { label: 'Payroll Ratio', value: `${aiInsights.summary.payrollRatio}%`, color: Number(aiInsights.summary.payrollRatio) < 55 ? 'text-emerald-400' : 'text-rose-400' },
                                        ].map(k => (
                                            <div key={k.label} className="bg-black/30 border border-white/10 rounded-xl p-4 text-center">
                                                <div className="text-xs text-glass-muted mb-1 uppercase font-bold">{k.label}</div>
                                                <div className={`text-2xl font-black ${k.color}`}>{k.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {(aiInsights.insights || []).map((i: any, idx: number) => (
                                        <div key={idx} className={`p-4 rounded-xl border flex gap-3 items-start ${i.type === 'WARNING' ? 'border-yellow-500/30 bg-yellow-600/10' : i.type === 'SUCCESS' ? 'border-emerald-500/30 bg-emerald-600/10' : 'border-blue-500/30 bg-blue-600/10'}`}>
                                            {i.type === 'WARNING' ? <AlertTriangle size={18} className="text-yellow-400 mt-0.5" /> : i.type === 'SUCCESS' ? <CheckCircle2 size={18} className="text-emerald-400 mt-0.5" /> : <Info size={18} className="text-blue-400 mt-0.5" />}
                                            <div><div className="font-bold text-white text-sm">{i.title}</div><div className="text-xs text-glass-muted mt-1">{i.detail}</div></div>
                                        </div>
                                    ))}
                                    {(aiInsights.anomalies || []).map((a: any, idx: number) => (
                                        <div key={idx} className="p-4 rounded-xl border border-rose-500/30 bg-rose-600/10 flex gap-3 items-start">
                                            <Zap size={18} className="text-rose-400 mt-0.5" />
                                            <div><div className="font-bold text-rose-400 text-sm">{a.title}</div><div className="text-xs text-glass-muted mt-1">{a.detail}</div></div>
                                        </div>
                                    ))}
                                    {(aiInsights.recommendations || []).map((r: any, idx: number) => (
                                        <div key={idx} className="p-4 rounded-xl border border-violet-500/30 bg-violet-600/10 flex gap-3 items-start">
                                            <Brain size={18} className="text-violet-400 mt-0.5" />
                                            <div><div className="font-bold text-violet-400 text-sm">{r.title}</div><div className="text-xs text-glass-muted mt-1">{r.detail}</div></div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}
