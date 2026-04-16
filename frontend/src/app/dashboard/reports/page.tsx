'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    BarChart3, FileText, IndianRupee, Users,
    TrendingUp, TrendingDown, Download, Printer,
    FlaskConical, Bed, Activity, CheckCircle2,
    Stethoscope, Building2, Percent, TestTube2, UserCheck
} from 'lucide-react';

const API = 'http://localhost:5000/api';
const getAuth = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const fmt = (n: number) => `₹${(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const pct = (n: number, total: number) => total ? ((n / total) * 100).toFixed(1) : '0.0';

const exportToCSV = (filename: string, rows: any[][]) => {
    const csvContent = rows.map(r => r.map(c => typeof c === 'string' ? `"${c}"` : c).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

type Tab = 'analytics' | 'balance' | 'gst' | 'payroll' | 'revenue' | 'operational' | 'trends' | 'collection';

export default function ReportsPage() {
    const [tab, setTab] = useState<Tab>('analytics');
    const [analytics, setAnalytics] = useState<any>(null);
    const [balance, setBalance] = useState<any>(null);
    const [gst, setGst] = useState<any>(null);
    const [payroll, setPayroll] = useState<any>(null);
    const [doctorRev, setDoctorRev] = useState<any>(null);
    const [deptRev, setDeptRev] = useState<any>(null);
    const [bedOcc, setBedOcc] = useState<any>(null);
    const [labVol, setLabVol] = useState<any>(null);
    const [demographics, setDemographics] = useState<any>(null);
    const [revTrend, setRevTrend] = useState<any>(null);
    const [expTrend, setExpTrend] = useState<any>(null);
    const [collection, setCollection] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const now = new Date();
    const [gstMonth, setGstMonth] = useState(now.getMonth() + 1);
    const [gstYear, setGstYear] = useState(now.getFullYear());
    const [prMonth, setPrMonth] = useState(now.getMonth() + 1);
    const [prYear, setPrYear] = useState(now.getFullYear());

    const load = useCallback(async (which: Tab) => {
        setLoading(true);
        try {
            const h = getAuth();
            if (which === 'analytics') { setAnalytics(await (await fetch(`${API}/reports/analytics`, { headers: h })).json()); }
            else if (which === 'balance') { setBalance(await (await fetch(`${API}/reports/balance-sheet`, { headers: h })).json()); }
            else if (which === 'gst') { setGst(await (await fetch(`${API}/reports/gst?month=${gstMonth}&year=${gstYear}`, { headers: h })).json()); }
            else if (which === 'payroll') { setPayroll(await (await fetch(`${API}/reports/payroll-compliance?month=${prMonth}&year=${prYear}`, { headers: h })).json()); }
            else if (which === 'revenue') {
                const [r1, r2] = await Promise.all([
                    fetch(`${API}/reports/revenue-by-doctor`, { headers: h }),
                    fetch(`${API}/reports/revenue-by-department`, { headers: h })
                ]);
                setDoctorRev(await r1.json());
                setDeptRev(await r2.json());
            }
            else if (which === 'operational') {
                const [r1, r2, r3] = await Promise.all([
                    fetch(`${API}/reports/bed-occupancy`, { headers: h }),
                    fetch(`${API}/reports/lab-volume`, { headers: h }),
                    fetch(`${API}/reports/patient-demographics`, { headers: h })
                ]);
                setBedOcc(await r1.json());
                setLabVol(await r2.json());
                setDemographics(await r3.json());
            }
            else if (which === 'trends') {
                const [r1, r2] = await Promise.all([
                    fetch(`${API}/reports/revenue-trend`, { headers: h }),
                    fetch(`${API}/reports/expense-trend`, { headers: h })
                ]);
                setRevTrend(await r1.json());
                setExpTrend(await r2.json());
            }
            else if (which === 'collection') {
                setCollection(await (await fetch(`${API}/reports/collection-efficiency`, { headers: h })).json());
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [gstMonth, gstYear, prMonth, prYear]);

    useEffect(() => { load('analytics'); }, []);
    useEffect(() => { load(tab); }, [tab]);

    const tabs: { id: Tab; label: string; icon: any }[] = [
        { id: 'analytics', label: 'Dashboard', icon: BarChart3 },
        { id: 'balance', label: 'Balance Sheet', icon: IndianRupee },
        { id: 'gst', label: 'GST Reports', icon: FileText },
        { id: 'payroll', label: 'Payroll', icon: Users },
        { id: 'revenue', label: 'Revenue Intel', icon: Stethoscope },
        { id: 'operational', label: 'Operations', icon: Building2 },
        { id: 'trends', label: 'Trends', icon: TrendingUp },
        { id: 'collection', label: 'Collections', icon: Percent },
    ];

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-glass-title tracking-tight flex items-center gap-2">
                    <BarChart3 className="text-violet-600" /> Reports, Analytics & Compliance
                </h1>
                {loading && <span className="text-xs text-glass-muted animate-pulse">Loading...</span>}
            </div>

            <div className="liquid-glass-card rounded-xl min-h-[600px] flex flex-col">
                <div className="flex border-b border-white/10 bg-black/20 rounded-t-xl overflow-x-auto">
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`min-w-[120px] py-3 px-3 font-bold text-xs transition-colors border-b-2 ${tab === t.id ? 'border-violet-600 text-violet-400 bg-white/5' : 'border-transparent text-glass-body hover:text-glass-title'}`}>
                            <div className="flex justify-center items-center gap-1.5"><t.icon size={13} />{t.label}</div>
                        </button>
                    ))}
                </div>

                <div className="p-6 flex-1 overflow-auto">

                    {/* ═══ ANALYTICS ═══ */}
                    {tab === 'analytics' && analytics && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Total Patients', value: analytics.patients.total, sub: `${analytics.patients.visits} Visits`, color: 'bg-blue-600/10 border-blue-500/30', ic: 'text-blue-400', icon: Users },
                                    { label: 'IPD Active', value: analytics.ipd.active, sub: `${analytics.ipd.total} Total`, color: 'bg-sky-600/10 border-sky-500/30', ic: 'text-sky-400', icon: Bed },
                                    { label: 'Lab Pending', value: analytics.lab.pending, sub: `${analytics.lab.total} Orders`, color: 'bg-purple-600/10 border-purple-500/30', ic: 'text-purple-400', icon: FlaskConical },
                                    { label: 'Revenue', value: fmt(analytics.billing.totalRevenue), sub: `${analytics.billing.unpaid} Unpaid`, color: 'bg-emerald-600/10 border-emerald-500/30', ic: 'text-emerald-400', icon: TrendingUp },
                                ].map(k => (
                                    <div key={k.label} className={`${k.color} border rounded-xl p-4`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-glass-muted">{k.label}</span>
                                            <k.icon size={16} className={k.ic} />
                                        </div>
                                        <div className="text-2xl font-black text-white">{k.value}</div>
                                        <div className="text-xs text-glass-muted mt-1">{k.sub}</div>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <h3 className="font-bold text-glass-title mb-3 flex items-center gap-2 pb-2 border-b border-white/10"><Activity size={15} /> Revenue by Module</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {Object.entries(analytics.billing.byModule as Record<string, number>).map(([type, amount]) => (
                                        <div key={type} className="bg-black/20 border border-white/10 rounded-xl p-4">
                                            <div className="flex justify-between mb-2"><span className="text-white text-sm font-bold">{type.replace(/_/g, ' ')}</span><span className="font-black text-glass-title">{fmt(amount)}</span></div>
                                            <div className="w-full bg-white/10 rounded-full h-1.5"><div className="bg-violet-500 h-1.5 rounded-full" style={{ width: `${pct(amount, analytics.billing.totalRevenue)}%` }} /></div>
                                            <div className="text-[10px] text-glass-muted mt-1 text-right">{pct(amount, analytics.billing.totalRevenue)}%</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ BALANCE SHEET ═══ */}
                    {tab === 'balance' && balance && (
                        <div className="max-w-4xl mx-auto space-y-4">
                            <div className="flex justify-end"><button onClick={() => window.print()} className="bg-slate-700 text-white font-bold px-3 py-1.5 flex items-center gap-2 rounded-lg text-xs"><Printer size={13} /> Print</button></div>
                            <div className={`p-5 rounded-xl border-2 flex justify-between items-center ${balance.surplus === 'PROFIT' ? 'bg-emerald-600/10 border-emerald-400/50' : 'bg-rose-600/10 border-rose-400/50'}`}>
                                <div>
                                    <div className="text-xs font-bold uppercase mb-1 text-glass-muted">{balance.surplus === 'PROFIT' ? '📈 Net Profit' : '📉 Net Loss'}</div>
                                    <div className={`text-3xl font-black ${balance.surplus === 'PROFIT' ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt(Math.abs(balance.netProfitOrLoss))}</div>
                                </div>
                                <div className="text-right text-xs space-y-1 text-glass-muted">
                                    <div>Income: <b className="text-emerald-400">{fmt(balance.income.total)}</b></div>
                                    <div>Expenses: <b className="text-rose-400">{fmt(balance.expenses.total)}</b></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {[{ title: 'Income', data: balance.income.breakdown, total: balance.income.total, color: 'emerald' },
                                { title: 'Expenses', data: balance.expenses.breakdown, total: balance.expenses.total, color: 'rose' }].map(side => (
                                    <div key={side.title} className="border border-white/10 rounded-xl overflow-hidden">
                                        <div className={`bg-${side.color}-600/20 px-4 py-2 font-bold text-sm text-${side.color}-400 uppercase`}>{side.title}</div>
                                        <table className="w-full text-xs"><tbody className="divide-y divide-white/5">
                                            {Object.entries(side.data as Record<string, number>).map(([k, v]) => (
                                                <tr key={k} className="hover:bg-white/5"><td className="px-4 py-2 text-white">{k.replace(/_/g, ' ')}</td><td className={`px-4 py-2 text-right font-bold text-${side.color}-400`}>{fmt(v)}</td></tr>
                                            ))}
                                        </tbody><tfoot><tr className="bg-black/20 font-black"><td className="px-4 py-2">Total</td><td className={`px-4 py-2 text-right text-${side.color}-400`}>{fmt(side.total)}</td></tr></tfoot></table>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ═══ GST ═══ */}
                    {tab === 'gst' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 flex-wrap">
                                <select className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" value={gstMonth} onChange={e => setGstMonth(Number(e.target.value))}>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('en', { month: 'long' })}</option>)}
                                </select>
                                <input type="number" className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm w-20 text-white" value={gstYear} onChange={e => setGstYear(Number(e.target.value))} />
                                <button onClick={() => load('gst')} className="bg-violet-600 text-white font-bold px-4 py-2 rounded-lg text-xs">Apply</button>
                            </div>
                            {gst && (
                                <>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4"><div className="text-[10px] uppercase text-glass-muted mb-1">Outward GST</div><div className="text-2xl font-black text-white">{fmt(gst.gstr3b.outwardGST)}</div></div>
                                        <div className="bg-emerald-600/10 border border-emerald-500/30 rounded-xl p-4"><div className="text-[10px] uppercase text-glass-muted mb-1">Input Tax Credit</div><div className="text-2xl font-black text-emerald-400">{fmt(gst.gstr3b.inputTaxCredit)}</div></div>
                                        <div className={`${gst.gstr3b.netGstPayable > 0 ? 'bg-rose-600/10 border-rose-500/30' : 'bg-emerald-600/10 border-emerald-500/30'} rounded-xl p-4`}><div className="text-[10px] uppercase text-glass-muted mb-1">Net Payable</div><div className="text-2xl font-black text-white">{fmt(gst.gstr3b.netGstPayable)}</div></div>
                                    </div>
                                    <div className="flex justify-between items-center"><h3 className="font-bold text-glass-title text-sm">GSTR-1 Register ({gst.period})</h3>
                                        <button onClick={() => { exportToCSV(`GSTR1_${gst.period.replace('/', '-')}.csv`, [['Bill No', 'Type', 'Taxable', 'GST', 'Total', 'Date'], ...gst.gstr1.lines.map((l: any) => [l.billNo, l.type, l.taxableValue, l.gstAmount, l.totalValue, new Date(l.date).toLocaleDateString('en-IN')])]); }} className="text-xs bg-slate-700 text-white px-3 py-1 rounded-lg flex items-center gap-1"><Download size={12} /> CSV</button>
                                    </div>
                                    <div className="overflow-x-auto rounded-xl border border-white/10"><table className="w-full text-xs"><thead className="bg-black/30 text-glass-muted"><tr><th className="p-2 text-left">Bill</th><th className="p-2">Type</th><th className="p-2 text-right">Taxable</th><th className="p-2 text-right">GST</th><th className="p-2 text-right">Total</th><th className="p-2">Date</th></tr></thead><tbody className="divide-y divide-white/5">
                                        {gst.gstr1.lines.map((l: any) => (<tr key={l.billNo} className="hover:bg-white/5"><td className="p-2 font-mono text-violet-400">{l.billNo}</td><td className="p-2 text-white/70">{l.type}</td><td className="p-2 text-right text-white">{fmt(l.taxableValue)}</td><td className="p-2 text-right text-amber-400">{fmt(l.gstAmount)}</td><td className="p-2 text-right font-bold text-white">{fmt(l.totalValue)}</td><td className="p-2 text-glass-muted">{new Date(l.date).toLocaleDateString('en-IN')}</td></tr>))}
                                    </tbody></table></div>
                                </>
                            )}
                        </div>
                    )}

                    {/* ═══ PAYROLL ═══ */}
                    {tab === 'payroll' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 flex-wrap">
                                <select className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" value={prMonth} onChange={e => setPrMonth(Number(e.target.value))}>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('en', { month: 'long' })}</option>)}
                                </select>
                                <input type="number" className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm w-20 text-white" value={prYear} onChange={e => setPrYear(Number(e.target.value))} />
                                <button onClick={() => load('payroll')} className="bg-violet-600 text-white font-bold px-4 py-2 rounded-lg text-xs">Apply</button>
                            </div>
                            {payroll && (
                                <>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4"><div className="text-[10px] uppercase text-glass-muted mb-1">EPF Total</div><div className="text-xl font-black text-blue-400">{fmt(payroll.compliance.epf.total)}</div></div>
                                        <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-4"><div className="text-[10px] uppercase text-glass-muted mb-1">ESI Total</div><div className="text-xl font-black text-indigo-400">{fmt(payroll.compliance.esi.total)}</div></div>
                                        <div className="bg-violet-600/10 border border-violet-500/30 rounded-xl p-4"><div className="text-[10px] uppercase text-glass-muted mb-1">Prof. Tax</div><div className="text-xl font-black text-violet-400">{fmt(payroll.compliance.pt.total)}</div></div>
                                    </div>
                                    <div className="flex justify-between items-center"><h3 className="font-bold text-glass-title text-sm">Payslips — {payroll.period}</h3>
                                        <button onClick={() => { exportToCSV(`Payroll_${payroll.period.replace('/', '-')}.csv`, [['EmpID', 'Name', 'Gross', 'EPF', 'ESI', 'PT', 'Net'], ...payroll.payslips.map((p: any) => [p.employeeId, p.name, p.grossSalary, p.epfEmployee, p.esiEmployee, p.pt, p.netTakeHome])]); }} className="text-xs bg-slate-700 text-white px-3 py-1 rounded-lg flex items-center gap-1"><Download size={12} /> CSV</button>
                                    </div>
                                    <div className="space-y-2">
                                        {payroll.payslips.map((p: any) => (
                                            <div key={p.employeeId} className="bg-black/20 border border-white/10 rounded-xl overflow-hidden">
                                                <div className="bg-black/30 px-4 py-2 flex justify-between text-sm"><span className="font-bold text-white">{p.name} <span className="text-glass-muted font-mono text-xs ml-2">{p.employeeId}</span></span><span className="text-emerald-400 font-black">{fmt(p.netTakeHome)}</span></div>
                                                <div className="grid grid-cols-4 divide-x divide-white/5 text-xs p-2">
                                                    <div className="px-2"><div className="text-glass-muted mb-1">Gross</div><div className="font-bold text-white">{fmt(p.grossSalary)}</div></div>
                                                    <div className="px-2"><div className="text-glass-muted mb-1">EPF</div><div className="text-rose-400">{fmt(p.epfEmployee)}</div></div>
                                                    <div className="px-2"><div className="text-glass-muted mb-1">ESI</div><div className="text-rose-400">{fmt(p.esiEmployee)}</div></div>
                                                    <div className="px-2"><div className="text-glass-muted mb-1">PT</div><div className="text-rose-400">{fmt(p.pt)}</div></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* ═══ REVENUE INTELLIGENCE ═══ */}
                    {tab === 'revenue' && (
                        <div className="space-y-6">
                            {doctorRev && (
                                <div>
                                    <div className="flex justify-between items-center mb-3"><h3 className="font-bold text-glass-title flex items-center gap-2"><Stethoscope size={15} /> Doctor-wise Revenue</h3>
                                        <button onClick={() => { exportToCSV('DoctorRevenue.csv', [['Rank', 'Doctor', 'Department', 'Revenue', 'Bills', 'Avg/Bill', '%'], ...doctorRev.doctors.map((d: any) => [d.rank, d.name, d.department, d.revenue, d.billCount, d.avgPerBill, d.percentage])]); }} className="text-xs bg-slate-700 text-white px-3 py-1 rounded-lg flex items-center gap-1"><Download size={12} /> CSV</button>
                                    </div>
                                    <div className="space-y-2">
                                        {doctorRev.doctors.map((d: any) => (
                                            <div key={d.rank} className="bg-black/20 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 font-black text-sm">#{d.rank}</div>
                                                <div className="flex-1">
                                                    <div className="font-bold text-white text-sm">{d.name}</div>
                                                    <div className="text-[10px] text-glass-muted">{d.department} • {d.billCount} bills • Avg {fmt(Number(d.avgPerBill))}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-black text-emerald-400">{fmt(d.revenue)}</div>
                                                    <div className="text-[10px] text-glass-muted">{d.percentage}%</div>
                                                </div>
                                                <div className="w-20 bg-white/10 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${d.percentage}%` }} /></div>
                                            </div>
                                        ))}
                                        {doctorRev.doctors.length === 0 && <div className="text-center p-6 text-glass-muted">No doctor-linked revenue data yet</div>}
                                    </div>
                                </div>
                            )}
                            {deptRev && (
                                <div>
                                    <h3 className="font-bold text-glass-title flex items-center gap-2 mb-3"><Building2 size={15} /> Department-wise Revenue</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {deptRev.departments.map((d: any) => (
                                            <div key={d.department} className="bg-black/20 border border-white/10 rounded-xl p-4">
                                                <div className="flex justify-between mb-2"><span className="font-bold text-white text-sm">{d.department}</span><span className="font-black text-emerald-400">{fmt(d.revenue)}</span></div>
                                                <div className="w-full bg-white/10 rounded-full h-1.5"><div className="bg-violet-500 h-1.5 rounded-full" style={{ width: `${d.percentage}%` }} /></div>
                                                <div className="flex justify-between text-[10px] text-glass-muted mt-1"><span>{d.billCount} bills</span><span>{d.percentage}%</span></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══ OPERATIONAL ═══ */}
                    {tab === 'operational' && (
                        <div className="space-y-6">
                            {bedOcc && (
                                <div>
                                    <h3 className="font-bold text-glass-title flex items-center gap-2 mb-3"><Bed size={15} /> Bed Occupancy</h3>
                                    <div className="bg-black/20 border border-white/10 rounded-xl p-4 mb-3 text-center">
                                        <div className="text-3xl font-black text-white">{bedOcc.overall.occupancyRate}%</div>
                                        <div className="text-xs text-glass-muted">{bedOcc.overall.occupied} / {bedOcc.overall.totalBeds} beds occupied</div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {bedOcc.wards.map((w: any) => (
                                            <div key={w.ward} className="bg-black/20 border border-white/10 rounded-lg p-3">
                                                <div className="font-bold text-white text-xs mb-1">{w.ward}</div>
                                                <div className="text-lg font-black text-white">{w.occupancyRate}%</div>
                                                <div className="w-full bg-white/10 rounded-full h-1 mt-1"><div className={`h-1 rounded-full ${Number(w.occupancyRate) > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${w.occupancyRate}%` }} /></div>
                                                <div className="text-[10px] text-glass-muted mt-1">{w.occupied}/{w.totalBeds}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {labVol && (
                                <div>
                                    <h3 className="font-bold text-glass-title flex items-center gap-2 mb-3"><TestTube2 size={15} /> Lab Volume ({labVol.totalOrders} orders)</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {labVol.byTest.slice(0, 9).map((t: any) => (
                                            <div key={t.testName} className="bg-black/20 border border-white/10 rounded-lg p-3">
                                                <div className="font-bold text-white text-xs truncate">{t.testName}</div>
                                                <div className="text-lg font-black text-white">{t.total}</div>
                                                <div className="flex gap-2 text-[10px]"><span className="text-emerald-400">{t.completed} done</span><span className="text-yellow-400">{t.pending} pending</span></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {demographics && (
                                <div>
                                    <h3 className="font-bold text-glass-title flex items-center gap-2 mb-3"><UserCheck size={15} /> Patient Demographics ({demographics.totalPatients})</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                                            <div className="text-xs font-bold text-glass-muted mb-2 uppercase">Age Distribution</div>
                                            {Object.entries(demographics.ageBuckets as Record<string, number>).map(([range, count]) => (
                                                <div key={range} className="flex justify-between text-xs py-1"><span className="text-white/70">{range}</span><span className="text-white font-bold">{count}</span></div>
                                            ))}
                                        </div>
                                        <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                                            <div className="text-xs font-bold text-glass-muted mb-2 uppercase">Gender</div>
                                            {Object.entries(demographics.genderDistribution as Record<string, number>).map(([g, c]) => (
                                                <div key={g} className="flex justify-between text-xs py-1"><span className="text-white/70">{g}</span><span className="text-white font-bold">{c}</span></div>
                                            ))}
                                        </div>
                                        <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                                            <div className="text-xs font-bold text-glass-muted mb-2 uppercase">Blood Groups</div>
                                            {Object.entries(demographics.bloodGroups as Record<string, number>).map(([bg, c]) => (
                                                <div key={bg} className="flex justify-between text-xs py-1"><span className="text-white/70">{bg}</span><span className="text-white font-bold">{c}</span></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══ FINANCIAL TRENDS ═══ */}
                    {tab === 'trends' && (
                        <div className="space-y-6">
                            {revTrend && (
                                <div>
                                    <h3 className="font-bold text-glass-title flex items-center gap-2 mb-3"><TrendingUp size={15} /> Revenue Trend (6 Months)</h3>
                                    <div className="grid grid-cols-6 gap-2">
                                        {revTrend.months.map((m: any) => (
                                            <div key={m.month} className="bg-black/20 border border-white/10 rounded-lg p-3 text-center">
                                                <div className="text-[10px] text-glass-muted mb-1">{m.month}</div>
                                                <div className="text-sm font-black text-emerald-400">{fmt(m.revenue)}</div>
                                                <div className="text-[10px] text-glass-muted">{m.billCount} bills</div>
                                                {m.growth && Number(m.growth) !== 0 && (
                                                    <div className={`text-[10px] font-bold mt-1 ${Number(m.growth) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {Number(m.growth) > 0 ? '↑' : '↓'}{m.growth}%
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {expTrend && (
                                <div>
                                    <h3 className="font-bold text-glass-title flex items-center gap-2 mb-3"><TrendingDown size={15} /> Expense Trend (6 Months)</h3>
                                    <div className="grid grid-cols-6 gap-2">
                                        {expTrend.months.map((m: any) => (
                                            <div key={m.month} className="bg-black/20 border border-white/10 rounded-lg p-3 text-center">
                                                <div className="text-[10px] text-glass-muted mb-1">{m.month}</div>
                                                <div className="text-sm font-black text-rose-400">{fmt(m.total)}</div>
                                                <div className="text-[10px] text-glass-muted">OpEx: {fmt(m.operatingExpenses)}</div>
                                                <div className="text-[10px] text-glass-muted">Payroll: {fmt(m.payroll)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══ COLLECTION EFFICIENCY ═══ */}
                    {tab === 'collection' && collection && (
                        <div className="space-y-4 max-w-4xl mx-auto">
                            <div className={`p-5 rounded-xl border-2 text-center ${Number(collection.overall.efficiency) >= 85 ? 'border-emerald-400/50 bg-emerald-600/10' : 'border-yellow-400/50 bg-yellow-600/10'}`}>
                                <div className="text-xs font-bold text-glass-muted uppercase mb-1">Overall Collection Efficiency</div>
                                <div className="text-4xl font-black text-white">{collection.overall.efficiency}%</div>
                                <div className="text-xs text-glass-muted mt-1">Billed: {fmt(collection.overall.billed)} • Collected: {fmt(collection.overall.collected)}</div>
                            </div>
                            <div className="grid grid-cols-6 gap-2">
                                {collection.months.map((m: any) => (
                                    <div key={m.month} className="bg-black/20 border border-white/10 rounded-xl p-4 text-center">
                                        <div className="text-[10px] font-bold text-glass-muted mb-2">{m.month}</div>
                                        <div className={`text-lg font-black ${Number(m.efficiency) >= 85 ? 'text-emerald-400' : Number(m.efficiency) >= 60 ? 'text-yellow-400' : 'text-rose-400'}`}>{m.efficiency}%</div>
                                        <div className="text-[10px] text-glass-muted mt-1">Billed: {fmt(m.billed)}</div>
                                        <div className="text-[10px] text-glass-muted">Got: {fmt(m.collected)}</div>
                                        <div className="text-[10px] text-rose-400 font-bold">Gap: {fmt(m.outstanding)}</div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => { exportToCSV('CollectionEfficiency.csv', [['Month', 'Billed', 'Collected', 'Efficiency', 'Outstanding'], ...collection.months.map((m: any) => [m.month, m.billed, m.collected, m.efficiency, m.outstanding])]); }} className="text-xs bg-slate-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 mx-auto"><Download size={12} /> Export CSV</button>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}
