'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    BarChart3, FileText, IndianRupee, Users,
    TrendingUp, TrendingDown, Download, Printer,
    FlaskConical, Bed, Activity, CheckCircle2
} from 'lucide-react';

const API = 'http://localhost:5000/api';
const getAuth = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

// ── small helpers ─────────────────────────────────────
const fmt = (n: number) => `₹${(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const pct = (n: number, total: number) => total ? ((n / total) * 100).toFixed(1) : '0.0';

const exportToCSV = (filename: string, rows: any[][]) => {
    const csvContent = rows.map(r => r.map(c => typeof c === 'string' ? `"${c}"` : c).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

type Tab = 'analytics' | 'balance' | 'gst' | 'payroll';

export default function ReportsPage() {
    const [tab, setTab] = useState<Tab>('analytics');

    const [analytics, setAnalytics] = useState<any>(null);
    const [balance, setBalance] = useState<any>(null);
    const [gst, setGst] = useState<any>(null);
    const [payroll, setPayroll] = useState<any>(null);

    // Filters
    const now = new Date();
    const [gstMonth, setGstMonth] = useState(now.getMonth() + 1);
    const [gstYear, setGstYear] = useState(now.getFullYear());
    const [prMonth, setPrMonth] = useState(now.getMonth() + 1);
    const [prYear, setPrYear] = useState(now.getFullYear());

    const load = useCallback(async (which: Tab) => {
        try {
            if (which === 'analytics') {
                const r = await fetch(`${API}/reports/analytics`, { headers: getAuth() });
                setAnalytics(await r.json());
            } else if (which === 'balance') {
                const r = await fetch(`${API}/reports/balance-sheet`, { headers: getAuth() });
                setBalance(await r.json());
            } else if (which === 'gst') {
                const r = await fetch(`${API}/reports/gst?month=${gstMonth}&year=${gstYear}`, { headers: getAuth() });
                setGst(await r.json());
            } else if (which === 'payroll') {
                const r = await fetch(`${API}/reports/payroll-compliance?month=${prMonth}&year=${prYear}`, { headers: getAuth() });
                setPayroll(await r.json());
            }
        } catch (e) { console.error(e); }
    }, [gstMonth, gstYear, prMonth, prYear]);

    useEffect(() => { load('analytics'); }, []);
    useEffect(() => { load(tab); }, [tab, load]);

    // ── Tab bar ──────────────────────────────────────────
    const tabs: { id: Tab; label: string; icon: any }[] = [
        { id: 'analytics', label: 'Dashboard Analytics', icon: BarChart3 },
        { id: 'balance', label: 'Balance Sheet', icon: IndianRupee },
        { id: 'gst', label: 'GST Reports', icon: FileText },
        { id: 'payroll', label: 'Payroll Compliance', icon: Users },
    ];

    return (
        <>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-glass-title tracking-tight flex items-center gap-2">
                    <BarChart3 className="text-violet-600" /> Reports, Analytics & Statutory Compliance
                </h1>
                <button
                    onClick={() => load(tab)}
                    className="bg-white border border-white/10 text-white hover:bg-black/20 font-bold px-4 py-2 rounded-lg text-sm shadow-sm transition flex items-center gap-2"
                >
                    <Download size={15} /> Refresh Data
                </button>
            </div>

            <div className="liquid-glass-card rounded-xl    min-h-[600px] flex flex-col">
                {/* Tab bar */}
                <div className="flex border-b border-white/10 bg-black/20 rounded-t-xl overflow-x-auto">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex-1 min-w-[160px] py-4 font-bold text-sm transition-colors border-b-2 ${tab === t.id ? 'border-violet-600 text-violet-700 bg-white' : 'border-transparent text-glass-body hover:text-glass-title'}`}
                        >
                            <div className="flex justify-center items-center gap-2">
                                <t.icon size={15} /> {t.label}
                            </div>
                        </button>
                    ))}
                </div>

                <div className="p-6 flex-1 overflow-auto">

                    {/* ═══════════════ ANALYTICS TAB ═══════════════ */}
                    {tab === 'analytics' && analytics && (
                        <div className="space-y-8">
                            {/* KPI Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                                {[
                                    { label: 'Total Patients', value: analytics.patients.total, sub: `${analytics.patients.visits} OPD Visits`, color: 'bg-blue-50 border-blue-200', icon: Users, ic: 'text-blue-500' },
                                    { label: 'IPD Admissions', value: analytics.ipd.total, sub: `${analytics.ipd.active} Currently Admitted`, color: 'bg-sky-50 border-sky-200', icon: Bed, ic: 'text-sky-500' },
                                    { label: 'Lab Orders', value: analytics.lab.total, sub: `${analytics.lab.pending} Pending`, color: 'bg-purple-50 border-purple-200', icon: FlaskConical, ic: 'text-purple-500' },
                                    { label: 'Total Revenue', value: fmt(analytics.billing.totalRevenue), sub: `${analytics.billing.unpaid} Unpaid Bills`, color: 'bg-emerald-50 border-emerald-200', icon: TrendingUp, ic: 'text-emerald-500' },
                                ].map(k => (
                                    <div key={k.label} className={`${k.color} border rounded-xl p-5 shadow-sm transform hover:-translate-y-1 transition duration-300 hover:shadow-md`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold uppercase tracking-wider text-glass-body">{k.label}</span>
                                            <k.icon size={20} className={k.ic} />
                                        </div>
                                        <div className="text-3xl font-black text-glass-title">{k.value}</div>
                                        <div className="text-xs text-glass-body mt-1">{k.sub}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Revenue breakdown */}
                            <div>
                                <h3 className="font-bold text-glass-title mb-4 pb-2 border-b flex items-center gap-2"><Activity size={16} /> Revenue Breakdown by Module</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(analytics.billing.byModule as Record<string, number>).map(([type, amount]) => {
                                        const p = pct(amount, analytics.billing.totalRevenue);
                                        return (
                                            <div key={type} className="bg-black/20 border border-white/10 rounded-xl p-4 transform hover:scale-[1.01] transition duration-200 hover:shadow-sm">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-semibold text-white text-sm">{type.replace(/_/g, ' ')}</span>
                                                    <span className="font-bold text-glass-title">{fmt(amount)}</span>
                                                </div>
                                                <div className="w-full bg-slate-200 rounded-full h-2">
                                                    <div className="bg-violet-500 h-2 rounded-full transition-all" style={{ width: `${p}%` }} />
                                                </div>
                                                <div className="text-xs text-glass-body mt-1 text-right">{p}% of total revenue</div>
                                            </div>
                                        );
                                    })}
                                    {Object.keys(analytics.billing.byModule).length === 0 && (
                                        <div className="col-span-2 text-center p-8 bg-black/20 rounded-xl border text-slate-400">No paid bills recorded yet</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══════════════ BALANCE SHEET TAB ═══════════════ */}
                    {tab === 'balance' && balance && (
                        <div className="max-w-4xl mx-auto space-y-6" id="balance-sheet-area">
                            <div className="flex justify-end mb-2">
                                <button
                                    onClick={() => window.print()}
                                    className="bg-slate-800 text-white font-bold px-4 py-2 flex items-center gap-2 rounded-lg text-sm hover:bg-slate-700 transition shadow-sm"
                                >
                                    <Printer size={15} /> Print / Save as PDF
                                </button>
                            </div>

                            {/* Net Result Banner */}
                            <div className={`p-6 rounded-xl border-2 flex justify-between items-center ${balance.surplus === 'PROFIT' ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50 border-rose-300'}`}>
                                <div>
                                    <div className={`text-sm font-bold uppercase tracking-wider mb-1 ${balance.surplus === 'PROFIT' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                        {balance.surplus === 'PROFIT' ? '📈 Net Profit' : '📉 Net Loss'}
                                    </div>
                                    <div className={`text-4xl font-black ${balance.surplus === 'PROFIT' ? 'text-emerald-800' : 'text-rose-800'}`}>
                                        {fmt(Math.abs(balance.netProfitOrLoss))}
                                    </div>
                                </div>
                                <div className="text-right text-sm text-glass-muted space-y-1">
                                    <div>Total Income: <b className="text-emerald-700">{fmt(balance.income.total)}</b></div>
                                    <div>Total Expense: <b className="text-rose-700">{fmt(balance.expenses.total)}</b></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Income */}
                                <div className="border border-emerald-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-emerald-600 text-white px-5 py-3 font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                                        <TrendingUp size={15} /> Income / Revenue
                                    </div>
                                    <table className="w-full text-sm">
                                        <tbody className="divide-y divide-white/5">
                                            {Object.entries(balance.income.breakdown as Record<string, number>).map(([k, v]) => (
                                                <tr key={k} className="hover:bg-black/20">
                                                    <td className="px-5 py-3 text-white">{k.replace(/_/g, ' ')}</td>
                                                    <td className="px-5 py-3 text-right font-bold text-emerald-700">{fmt(v)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-emerald-50 font-black">
                                                <td className="px-5 py-3">Total Income</td>
                                                <td className="px-5 py-3 text-right text-emerald-800">{fmt(balance.income.total)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* Expenses */}
                                <div className="border border-rose-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-rose-600 text-white px-5 py-3 font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                                        <TrendingDown size={15} /> Expenses / Outflow
                                    </div>
                                    <table className="w-full text-sm">
                                        <tbody className="divide-y divide-white/5">
                                            {Object.entries(balance.expenses.breakdown as Record<string, number>).map(([k, v]) => (
                                                <tr key={k} className="hover:bg-black/20">
                                                    <td className="px-5 py-3 text-white">{k.replace(/_/g, ' ')}</td>
                                                    <td className="px-5 py-3 text-right font-bold text-rose-700">{fmt(v)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-rose-50 font-black">
                                                <td className="px-5 py-3">Total Expenses</td>
                                                <td className="px-5 py-3 text-right text-rose-800">{fmt(balance.expenses.total)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══════════════ GST REPORT TAB ═══════════════ */}
                    {tab === 'gst' && (
                        <div className="space-y-6">
                            {/* Period Filter */}
                            <div className="flex items-center gap-4 flex-wrap">
                                <label className="text-sm font-bold text-glass-muted">Period:</label>
                                <select className="border rounded-lg px-3 py-2 text-sm bg-white" value={gstMonth} onChange={e => setGstMonth(Number(e.target.value))}>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('en', { month: 'long' })}</option>
                                    ))}
                                </select>
                                <input type="number" className="border rounded-lg px-3 py-2 text-sm w-24" value={gstYear} onChange={e => setGstYear(Number(e.target.value))} />
                                <button onClick={() => load('gst')} className="bg-violet-600 text-white font-bold px-4 py-2 rounded-lg text-sm">Apply Filter</button>
                            </div>

                            {gst && (
                                <>
                                    {/* GSTR-3B Summary cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div className="bg-slate-800 text-white rounded-xl p-5 shadow">
                                            <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">Outward GST Liability (GSTR-1)</div>
                                            <div className="text-3xl font-black">{fmt(gst.gstr3b.outwardGST)}</div>
                                            <div className="text-xs text-slate-400 mt-1">Collected from patients on all bills</div>
                                        </div>
                                        <div className="bg-emerald-700 text-white rounded-xl p-5 shadow">
                                            <div className="text-xs uppercase tracking-widest text-emerald-200 mb-2">Input Tax Credit (ITC)</div>
                                            <div className="text-3xl font-black">{fmt(gst.gstr3b.inputTaxCredit)}</div>
                                            <div className="text-xs text-emerald-200 mt-1">Paid to registered vendors (deductible)</div>
                                        </div>
                                        <div className={`rounded-xl p-5 shadow ${gst.gstr3b.netGstPayable > 0 ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
                                            <div className="text-xs uppercase tracking-widest opacity-75 mb-2">Net GST Payable (GSTR-3B)</div>
                                            <div className="text-3xl font-black">{fmt(gst.gstr3b.netGstPayable)}</div>
                                            <div className="text-xs opacity-75 mt-1">Outward GST − ITC = Payable to Government</div>
                                        </div>
                                    </div>

                                    {/* TDS */}
                                    <div className="bg-slate-900 text-white rounded-xl p-5 flex justify-between items-center shadow">
                                        <div>
                                            <div className="text-xs uppercase tracking-widest text-slate-400 mb-1">TDS Deducted (Form 26Q / 24Q)</div>
                                            <div className="text-sm text-slate-400">TDS withheld from vendor & contractor payments</div>
                                        </div>
                                        <div className="text-3xl font-black text-sky-400">{fmt(gst.tdsDeducted)}</div>
                                    </div>

                                    {/* GSTR-1 Line Items */}
                                    <div>
                                        <div className="flex justify-between items-center mb-3 pb-2 border-b">
                                            <h3 className="font-bold text-glass-title">GSTR-1: Outward Supply Register ({gst.period})</h3>
                                            <button
                                                onClick={() => {
                                                    const headers = ['Bill No.', 'Type', 'Taxable Value', 'GST Amount', 'Invoice Total', 'Date'];
                                                    const data = gst.gstr1.lines.map((l: any) => [
                                                        l.billNo, l.type, l.taxableValue, l.gstAmount, l.totalValue, new Date(l.date).toLocaleDateString('en-IN')
                                                    ]);
                                                    exportToCSV(`GSTR1_${gst.period.replace('/', '-')}.csv`, [headers, ...data]);
                                                }}
                                                className="text-xs font-bold bg-slate-800 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-700 transition shadow-sm"
                                            >
                                                <Download size={14} /> Export CSV
                                            </button>
                                        </div>
                                        <div className="overflow-x-auto rounded-xl border border-white/10">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-slate-100 text-glass-muted font-semibold">
                                                    <tr>
                                                        <th className="p-3">Bill No.</th>
                                                        <th className="p-3">Type</th>
                                                        <th className="p-3 text-right">Taxable Value</th>
                                                        <th className="p-3 text-right">GST Amount</th>
                                                        <th className="p-3 text-right">Invoice Total</th>
                                                        <th className="p-3">Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {gst.gstr1.lines.map((l: any) => (
                                                        <tr key={l.billNo} className="hover:bg-black/20">
                                                            <td className="p-3 font-mono font-bold text-white">{l.billNo}</td>
                                                            <td className="p-3"><span className="bg-slate-100 px-2 py-0.5 rounded text-glass-muted">{l.type.replace(/_/g, ' ')}</span></td>
                                                            <td className="p-3 text-right">{fmt(l.taxableValue)}</td>
                                                            <td className="p-3 text-right text-amber-700 font-bold">{fmt(l.gstAmount)}</td>
                                                            <td className="p-3 text-right font-bold">{fmt(l.totalValue)}</td>
                                                            <td className="p-3 text-glass-body">{new Date(l.date).toLocaleDateString('en-IN')}</td>
                                                        </tr>
                                                    ))}
                                                    {gst.gstr1.lines.length === 0 && (
                                                        <tr><td colSpan={6} className="p-8 text-center text-slate-400">No paid bills for this period</td></tr>
                                                    )}
                                                </tbody>
                                                <tfoot className="bg-black/20 font-black text-sm">
                                                    <tr>
                                                        <td colSpan={2} className="p-3">Totals</td>
                                                        <td className="p-3 text-right">{fmt(gst.gstr1.totalTaxableValue)}</td>
                                                        <td className="p-3 text-right text-amber-700">{fmt(gst.gstr1.totalOutwardGST)}</td>
                                                        <td colSpan={2} />
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* ═══════════════ PAYROLL COMPLIANCE TAB ═══════════════ */}
                    {tab === 'payroll' && (
                        <div className="space-y-6">
                            {/* Period Filter */}
                            <div className="flex items-center gap-4 flex-wrap">
                                <label className="text-sm font-bold text-glass-muted">Period:</label>
                                <select className="border rounded-lg px-3 py-2 text-sm bg-white" value={prMonth} onChange={e => setPrMonth(Number(e.target.value))}>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('en', { month: 'long' })}</option>
                                    ))}
                                </select>
                                <input type="number" className="border rounded-lg px-3 py-2 text-sm w-24" value={prYear} onChange={e => setPrYear(Number(e.target.value))} />
                                <button onClick={() => load('payroll')} className="bg-violet-600 text-white font-bold px-4 py-2 rounded-lg text-sm">Apply Filter</button>
                            </div>

                            {payroll && (
                                <>
                                    {/* Compliance Summary */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        {/* EPF */}
                                        <div className="bg-blue-700 text-white rounded-xl p-5 shadow">
                                            <div className="text-xs uppercase tracking-widest text-blue-200 mb-2">EPF (Provident Fund) — 12%+12%</div>
                                            <div className="text-2xl font-black">{fmt(payroll.compliance.epf.total)}</div>
                                            <div className="flex justify-between text-xs text-blue-200 mt-2">
                                                <span>Emp: {fmt(payroll.compliance.epf.employee)}</span>
                                                <span>Employer: {fmt(payroll.compliance.epf.employer)}</span>
                                            </div>
                                        </div>
                                        {/* ESI */}
                                        <div className="bg-indigo-700 text-white rounded-xl p-5 shadow">
                                            <div className="text-xs uppercase tracking-widest text-indigo-200 mb-2">ESI (Employee State Insurance)</div>
                                            <div className="text-2xl font-black">{fmt(payroll.compliance.esi.total)}</div>
                                            <div className="flex justify-between text-xs text-indigo-200 mt-2">
                                                <span>Emp 0.75%: {fmt(payroll.compliance.esi.employee)}</span>
                                                <span>Employer 3.25%: {fmt(payroll.compliance.esi.employer)}</span>
                                            </div>
                                        </div>
                                        {/* PT */}
                                        <div className="bg-violet-700 text-white rounded-xl p-5 shadow">
                                            <div className="text-xs uppercase tracking-widest text-violet-200 mb-2">PT (Professional Tax)</div>
                                            <div className="text-2xl font-black">{fmt(payroll.compliance.pt.total)}</div>
                                            <div className="text-xs text-violet-200 mt-2">₹200/month per employee earning &gt;₹15,000</div>
                                        </div>
                                    </div>

                                    {/* Individual Payslips */}
                                    <div>
                                        <div className="flex justify-between items-center mb-3 pb-2 border-b">
                                            <h3 className="font-bold text-glass-title">Employee Payslips — {payroll.period}</h3>
                                            <button
                                                onClick={() => {
                                                    const headers = ['Employee ID', 'Name', 'Gross Salary', 'EPF', 'ESI', 'PT', 'Other Ded.', 'Net Take-Home'];
                                                    const data = payroll.payslips.map((p: any) => [
                                                        p.employeeId, p.name, p.grossSalary, p.epfEmployee, p.esiEmployee, p.pt, p.otherDeductions, p.netTakeHome
                                                    ]);
                                                    exportToCSV(`Payroll_${payroll.period.replace('/', '-')}.csv`, [headers, ...data]);
                                                }}
                                                className="text-xs font-bold bg-slate-800 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-700 transition shadow-sm"
                                            >
                                                <Download size={14} /> Export CSV
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            {payroll.payslips.map((p: any) => (
                                                <div key={p.employeeId} className="bg-white border border-white/10 rounded-xl shadow-sm overflow-hidden">
                                                    {/* Payslip Header */}
                                                    <div className="bg-slate-800 text-white px-5 py-3 flex justify-between items-center">
                                                        <div>
                                                            <span className="font-bold">{p.name}</span>
                                                            <span className="ml-3 font-mono text-xs text-slate-400">{p.employeeId}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-slate-400">{`${p.month}/${p.year}`}</span>
                                                            <CheckCircle2 size={14} className="text-emerald-400" />
                                                        </div>
                                                    </div>
                                                    {/* Payslip Body */}
                                                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5 text-sm">
                                                        <div className="p-4">
                                                            <div className="text-xs font-bold text-slate-400 uppercase mb-2">Earnings</div>
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between"><span>Basic</span><span className="font-bold text-emerald-700">{fmt(p.basicSalary)}</span></div>
                                                                <div className="flex justify-between"><span>Allowances</span><span className="font-bold text-emerald-700">{fmt(p.allowances)}</span></div>
                                                                <div className="flex justify-between border-t pt-1 mt-1"><span className="font-bold">Gross</span><span className="font-black">{fmt(p.grossSalary)}</span></div>
                                                            </div>
                                                        </div>
                                                        <div className="p-4">
                                                            <div className="text-xs font-bold text-slate-400 uppercase mb-2">Statutory Deductions</div>
                                                            <div className="space-y-1 text-rose-700">
                                                                <div className="flex justify-between"><span>EPF</span><span>{fmt(p.epfEmployee)}</span></div>
                                                                <div className="flex justify-between"><span>ESI</span><span>{fmt(p.esiEmployee)}</span></div>
                                                                <div className="flex justify-between"><span>PT</span><span>{fmt(p.pt)}</span></div>
                                                                <div className="flex justify-between"><span>Other</span><span>{fmt(p.otherDeductions)}</span></div>
                                                            </div>
                                                        </div>
                                                        <div className="p-4">
                                                            <div className="text-xs font-bold text-slate-400 uppercase mb-2">Employer Contributions</div>
                                                            <div className="space-y-1 text-blue-700">
                                                                <div className="flex justify-between"><span>EPF</span><span>{fmt(p.epfEmployer)}</span></div>
                                                                <div className="flex justify-between"><span>ESI</span><span>{fmt(p.esiEmployer)}</span></div>
                                                            </div>
                                                        </div>
                                                        <div className="p-4 bg-emerald-50">
                                                            <div className="text-xs font-bold text-slate-400 uppercase mb-2">Net Take-Home</div>
                                                            <div className="text-2xl font-black text-emerald-700">{fmt(p.netTakeHome)}</div>
                                                            <div className="text-xs text-glass-body mt-1">After all deductions</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {payroll.payslips.length === 0 && (
                                                <div className="text-center p-10 bg-black/20 border border-white/10 rounded-xl text-slate-400">
                                                    No PAID payrolls found for {prMonth}/{prYear}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}
