'use client';
import { API_BASE } from '@/lib/api';
import { useState, useEffect, useCallback } from 'react';
import {
    BarChart3, FileText, IndianRupee, Users,
    TrendingUp, TrendingDown, Download, Printer,
    FlaskConical, Bed, Activity, CheckCircle2,
    Stethoscope, Building2, Percent, TestTube2, UserCheck
} from 'lucide-react';
import {
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area, LineChart, Line
} from 'recharts';

const API = `${API_BASE}/api`;
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

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#ec4899', '#14b8a6', '#f43f5e'];

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
                    {tab === 'analytics' && analytics && analytics.patients && (
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
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-black/20 border border-white/10 rounded-xl p-6">
                                    <div className="md:col-span-4 h-[200px] relative flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={Object.entries(analytics.billing.byModule as Record<string, number>).map(([type, amount]) => ({
                                                        name: type.replace(/_/g, ' '),
                                                        value: amount
                                                    }))}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={55}
                                                    outerRadius={75}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {Object.entries(analytics.billing.byModule as Record<string, number>).map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value: any) => [fmt(Number(value)), 'Revenue']}
                                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-[9px] uppercase tracking-wider text-glass-muted">Total Billed</span>
                                            <span className="text-sm font-black text-white">{fmt(analytics.billing.totalRevenue)}</span>
                                        </div>
                                    </div>
                                    <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                                        {Object.entries(analytics.billing.byModule as Record<string, number>).map(([type, amount], index) => (
                                            <div key={type} className="bg-black/30 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                    <div className="truncate">
                                                        <div className="text-white text-xs font-bold truncate">{type.replace(/_/g, ' ')}</div>
                                                        <div className="text-[9px] text-glass-muted">{pct(amount, analytics.billing.totalRevenue)}% of total</div>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="font-bold text-xs text-glass-title">{fmt(amount)}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ BALANCE SHEET ═══ */}
                    {tab === 'balance' && balance && balance.income && (
                        <div className="max-w-4xl mx-auto space-y-4">
                            <div className="flex justify-end"><button onClick={() => window.print()} className="bg-slate-700 text-white font-bold px-3 py-1.5 flex items-center gap-2 rounded-lg text-xs hover:bg-slate-600 transition"><Printer size={13} /> Print</button></div>
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

                    {/* ═══ GST REPORTS ═══ */}
                    {tab === 'gst' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 flex-wrap">
                                <select className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" value={gstMonth} onChange={e => setGstMonth(Number(e.target.value))}>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('en', { month: 'long' })}</option>)}
                                </select>
                                <input type="number" className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm w-20 text-white focus:outline-none" value={gstYear} onChange={e => setGstYear(Number(e.target.value))} />
                                <button onClick={() => load('gst')} className="bg-violet-600 text-white font-bold px-4 py-2 rounded-lg text-xs hover:bg-violet-500 transition">Apply</button>
                            </div>
                            {gst && gst.gstr3b && (
                                <>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4"><div className="text-[10px] uppercase text-glass-muted mb-1">Outward GST</div><div className="text-2xl font-black text-white">{fmt(gst.gstr3b.outwardGST)}</div></div>
                                        <div className="bg-emerald-600/10 border border-emerald-500/30 rounded-xl p-4"><div className="text-[10px] uppercase text-glass-muted mb-1">Input Tax Credit</div><div className="text-2xl font-black text-emerald-400">{fmt(gst.gstr3b.inputTaxCredit)}</div></div>
                                        <div className={`${gst.gstr3b.netGstPayable > 0 ? 'bg-rose-600/10 border-rose-500/30' : 'bg-emerald-600/10 border-emerald-500/30'} rounded-xl p-4`}><div className="text-[10px] uppercase text-glass-muted mb-1">Net Payable</div><div className="text-2xl font-black text-white">{fmt(gst.gstr3b.netGstPayable)}</div></div>
                                    </div>
                                    <div className="flex justify-between items-center"><h3 className="font-bold text-glass-title text-sm">GSTR-1 Register ({gst.period})</h3>
                                        <button onClick={() => { exportToCSV(`GSTR1_${gst.period.replace('/', '-')}.csv`, [['Bill No', 'Type', 'Taxable', 'GST', 'Total', 'Date'], ...gst.gstr1.lines.map((l: any) => [l.billNo, l.type, l.taxableValue, l.gstAmount, l.totalValue, new Date(l.date).toLocaleDateString('en-IN')])]); }} className="text-xs bg-slate-700 text-white px-3 py-1 rounded-lg flex items-center gap-1 hover:bg-slate-600 transition"><Download size={12} /> CSV</button>
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
                                <select className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" value={prMonth} onChange={e => setPrMonth(Number(e.target.value))}>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('en', { month: 'long' })}</option>)}
                                </select>
                                <input type="number" className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm w-20 text-white focus:outline-none" value={prYear} onChange={e => setPrYear(Number(e.target.value))} />
                                <button onClick={() => load('payroll')} className="bg-violet-600 text-white font-bold px-4 py-2 rounded-lg text-xs hover:bg-violet-500 transition">Apply</button>
                            </div>
                            {payroll && payroll.compliance && (
                                <>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4"><div className="text-[10px] uppercase text-glass-muted mb-1">EPF Total</div><div className="text-xl font-black text-blue-400">{fmt(payroll.compliance.epf.total)}</div></div>
                                        <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-4"><div className="text-[10px] uppercase text-glass-muted mb-1">ESI Total</div><div className="text-xl font-black text-indigo-400">{fmt(payroll.compliance.esi.total)}</div></div>
                                        <div className="bg-violet-600/10 border border-violet-500/30 rounded-xl p-4"><div className="text-[10px] uppercase text-glass-muted mb-1">Prof. Tax</div><div className="text-xl font-black text-violet-400">{fmt(payroll.compliance.pt.total)}</div></div>
                                    </div>
                                    <div className="flex justify-between items-center"><h3 className="font-bold text-glass-title text-sm">Payslips — {payroll.period}</h3>
                                        <button onClick={() => { exportToCSV(`Payroll_${payroll.period.replace('/', '-')}.csv`, [['EmpID', 'Name', 'Gross', 'EPF', 'ESI', 'PT', 'Net'], ...payroll.payslips.map((p: any) => [p.employeeId, p.name, p.grossSalary, p.epfEmployee, p.esiEmployee, p.pt, p.netTakeHome])]); }} className="text-xs bg-slate-700 text-white px-3 py-1 rounded-lg flex items-center gap-1 hover:bg-slate-600 transition"><Download size={12} /> CSV</button>
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
                        <div className="space-y-8">
                            {doctorRev && doctorRev.doctors && (
                                <div>
                                    <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-glass-title flex items-center gap-2"><Stethoscope size={15} /> Doctor-wise Revenue</h3>
                                        <button onClick={() => { exportToCSV('DoctorRevenue.csv', [['Rank', 'Doctor', 'Department', 'Revenue', 'Bills', 'Avg/Bill', '%'], ...doctorRev.doctors.map((d: any) => [d.rank, d.name, d.department, d.revenue, d.billCount, d.avgPerBill, d.percentage])]); }} className="text-xs bg-slate-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-slate-600 transition"><Download size={12} /> CSV</button>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                        <div className="lg:col-span-5 bg-black/20 border border-white/10 rounded-xl p-5 h-[340px] flex flex-col justify-between">
                                            <span className="text-xs font-bold uppercase tracking-wider text-glass-muted">Top Doctors By Revenue</span>
                                            <div className="flex-1 w-full mt-4">
                                                <ResponsiveContainer width="100%" height="90%">
                                                    <BarChart data={doctorRev.doctors.slice(0, 5).map((d: any) => ({ name: d.name.replace('Dr. ', ''), revenue: d.revenue }))} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                                        <XAxis type="number" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                                                        <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} width={70} />
                                                        <Tooltip formatter={(value: any) => fmt(Number(value))} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
                                                        <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                        <div className="lg:col-span-7 space-y-2 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
                                            {doctorRev.doctors.map((d: any) => (
                                                <div key={d.rank} className="bg-black/20 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 font-black text-xs shrink-0">#{d.rank}</div>
                                                        <div>
                                                            <div className="font-bold text-white text-sm">{d.name}</div>
                                                            <div className="text-[10px] text-glass-muted mt-0.5">{d.department} • {d.billCount} bills</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right shrink-0">
                                                            <div className="font-black text-emerald-400 text-sm">{fmt(d.revenue)}</div>
                                                            <div className="text-[10px] text-glass-muted">{d.percentage}%</div>
                                                        </div>
                                                        <div className="w-16 bg-white/10 rounded-full h-1.5 shrink-0 hidden sm:block"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${d.percentage}%` }} /></div>
                                                    </div>
                                                </div>
                                            ))}
                                            {doctorRev.doctors.length === 0 && <div className="text-center p-6 text-glass-muted">No doctor-linked revenue data yet</div>}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {deptRev && deptRev.departments && (
                                <div>
                                    <h3 className="font-bold text-glass-title flex items-center gap-2 mb-4"><Building2 size={15} /> Department-wise Revenue</h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                        <div className="lg:col-span-5 bg-black/20 border border-white/10 rounded-xl p-5 h-[320px] flex flex-col justify-between items-center relative">
                                            <span className="text-xs font-bold uppercase tracking-wider text-glass-muted w-full text-left">Department Share</span>
                                            <div className="flex-1 w-full relative flex items-center justify-center">
                                                <ResponsiveContainer width="100%" height="90%">
                                                    <PieChart>
                                                        <Pie
                                                            data={deptRev.departments.map((d: any) => ({ name: d.department, value: d.revenue }))}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={50}
                                                            outerRadius={70}
                                                            paddingAngle={3}
                                                            dataKey="value"
                                                            stroke="none"
                                                        >
                                                            {deptRev.departments.map((_, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip formatter={(value: any) => fmt(Number(value))} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {deptRev.departments.map((d: any, index: number) => (
                                                <div key={d.department} className="bg-black/20 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                                                    <div className="flex justify-between mb-2">
                                                        <span className="font-bold text-white text-sm flex items-center gap-2">
                                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }} />
                                                            {d.department}
                                                        </span>
                                                        <span className="font-black text-emerald-400">{fmt(d.revenue)}</span>
                                                    </div>
                                                    <div className="w-full bg-white/10 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${d.percentage}%` }} /></div>
                                                    <div className="flex justify-between text-[10px] text-glass-muted mt-1"><span>{d.billCount} bills</span><span>{d.percentage}%</span></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══ OPERATIONAL ═══ */}
                    {tab === 'operational' && (
                        <div className="space-y-8">
                            {bedOcc && bedOcc.overall && (
                                <div>
                                    <h3 className="font-bold text-glass-title flex items-center gap-2 mb-4"><Bed size={15} /> Bed Occupancy</h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                        <div className="lg:col-span-7 flex flex-col gap-4">
                                            <div className="bg-black/20 border border-white/10 rounded-xl p-6 text-center">
                                                <div className="text-4xl font-black text-white">{bedOcc.overall.occupancyRate}%</div>
                                                <div className="text-xs text-glass-muted mt-1">{bedOcc.overall.occupied} / {bedOcc.overall.totalBeds} beds occupied overall</div>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                {bedOcc.wards.map((w: any) => (
                                                    <div key={w.ward} className="bg-black/20 border border-white/10 rounded-xl p-3 flex flex-col justify-between">
                                                        <div className="font-bold text-white text-xs truncate">{w.ward}</div>
                                                        <div className="text-md font-bold text-white mt-1">{w.occupancyRate}%</div>
                                                        <div className="w-full bg-white/10 rounded-full h-1 mt-1.5"><div className={`h-1 rounded-full ${Number(w.occupancyRate) > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${w.occupancyRate}%` }} /></div>
                                                        <div className="text-[9px] text-glass-muted mt-1">{w.occupied}/{w.totalBeds} beds</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="lg:col-span-5 bg-black/20 border border-white/10 rounded-xl p-5 h-[260px]">
                                            <span className="text-xs font-bold uppercase tracking-wider text-glass-muted">Ward Rates Comparison</span>
                                            <div className="flex-1 h-[90%] w-full mt-2">
                                                <ResponsiveContainer width="100%" height="95%">
                                                    <BarChart data={bedOcc.wards.map((w: any) => ({ name: w.ward, rate: Number(w.occupancyRate) }))}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                        <XAxis dataKey="name" stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} />
                                                        <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} unit="%" />
                                                        <Tooltip formatter={(value: any) => [`${value}%`, 'Occupancy']} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
                                                        <Bar dataKey="rate" fill="#a855f7" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {labVol && labVol.byTest && (
                                <div>
                                    <h3 className="font-bold text-glass-title flex items-center gap-2 mb-4"><TestTube2 size={15} /> Lab Volume ({labVol.totalOrders} orders)</h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                        <div className="lg:col-span-6 bg-black/20 border border-white/10 rounded-xl p-5 h-[280px]">
                                            <span className="text-xs font-bold uppercase tracking-wider text-glass-muted">Top Tests Volume Distribution</span>
                                            <div className="flex-1 h-[90%] w-full mt-2">
                                                <ResponsiveContainer width="100%" height="95%">
                                                    <BarChart data={labVol.byTest.slice(0, 5).map((t: any) => ({ name: t.testName.substring(0, 10), completed: t.completed, pending: t.pending }))}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                        <XAxis dataKey="name" stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} />
                                                        <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
                                                        <Legend wrapperStyle={{ fontSize: '9px' }} />
                                                        <Bar dataKey="completed" name="Completed" fill="#10b981" stackId="a" />
                                                        <Bar dataKey="pending" name="Pending" fill="#f59e0b" stackId="a" radius={[3, 3, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                        <div className="lg:col-span-6 grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                                            {labVol.byTest.slice(0, 9).map((t: any) => (
                                                <div key={t.testName} className="bg-black/20 border border-white/10 rounded-xl p-3 flex flex-col justify-between">
                                                    <div className="font-bold text-white text-xs truncate" title={t.testName}>{t.testName}</div>
                                                    <div className="text-lg font-black text-white mt-1">{t.total}</div>
                                                    <div className="flex gap-2 text-[9px] mt-1.5"><span className="text-emerald-400">{t.completed} ok</span><span className="text-yellow-400">{t.pending} wait</span></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {demographics && demographics.ageBuckets && (
                                <div>
                                    <h3 className="font-bold text-glass-title flex items-center gap-2 mb-4"><UserCheck size={15} /> Patient Demographics ({demographics.totalPatients})</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Age */}
                                        <div className="bg-black/20 border border-white/10 rounded-xl p-5 h-[250px] flex flex-col justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-glass-muted">Age Distribution</span>
                                            <div className="flex-1 h-[85%] w-full mt-2">
                                                <ResponsiveContainer width="100%" height="95%">
                                                    <BarChart data={Object.entries(demographics.ageBuckets).map(([k, v]) => ({ name: k, count: v }))}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                        <XAxis dataKey="name" stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} />
                                                        <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
                                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
                                                        <Bar dataKey="count" fill="#3b82f6" name="Patients" radius={[3, 3, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                        {/* Gender */}
                                        <div className="bg-black/20 border border-white/10 rounded-xl p-5 h-[250px] flex flex-col justify-between items-center relative">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-glass-muted w-full text-left">Gender Distribution</span>
                                            <div className="flex-1 w-full relative flex items-center justify-center">
                                                <ResponsiveContainer width="100%" height="90%">
                                                    <PieChart>
                                                        <Pie
                                                            data={Object.entries(demographics.genderDistribution).map(([k, v]) => ({ name: k, value: v }))}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={40}
                                                            outerRadius={60}
                                                            paddingAngle={4}
                                                            dataKey="value"
                                                            stroke="none"
                                                        >
                                                            {Object.entries(demographics.genderDistribution).map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                                                        </Pie>
                                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="flex justify-center gap-3 text-[10px] text-gray-400 mt-2">
                                                {Object.entries(demographics.genderDistribution).map(([name, val], idx) => (
                                                    <span key={name} className="flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} /> {name} ({val})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Blood Group */}
                                        <div className="bg-black/20 border border-white/10 rounded-xl p-5 h-[250px] flex flex-col justify-between items-center relative">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-glass-muted w-full text-left">Blood Groups</span>
                                            <div className="flex-1 w-full relative flex items-center justify-center">
                                                <ResponsiveContainer width="100%" height="90%">
                                                    <PieChart>
                                                        <Pie
                                                            data={Object.entries(demographics.bloodGroups).map(([k, v]) => ({ name: k, value: v }))}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={40}
                                                            outerRadius={60}
                                                            paddingAngle={3}
                                                            dataKey="value"
                                                            stroke="none"
                                                        >
                                                            {Object.entries(demographics.bloodGroups).map((_, idx) => <Cell key={idx} fill={COLORS[(idx + 4) % COLORS.length]} />)}
                                                        </Pie>
                                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══ FINANCIAL TRENDS ═══ */}
                    {tab === 'trends' && revTrend && revTrend.months && expTrend && expTrend.months && (
                        <div className="space-y-6">
                            <div className="bg-black/20 border border-white/10 rounded-xl p-5 h-[380px] flex flex-col justify-between">
                                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                                    <h3 className="font-bold text-glass-title text-sm flex items-center gap-2"><TrendingUp size={15} /> Revenue vs. Expense Flow (6 Months)</h3>
                                    <div className="flex gap-4 text-[10px] font-bold">
                                        <span className="flex items-center gap-1 text-emerald-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Cash Inflow</span>
                                        <span className="flex items-center gap-1 text-rose-400"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Cash Outflow</span>
                                        <span className="flex items-center gap-1 text-indigo-400"><span className="w-2.5 h-1 bg-indigo-500 rounded-sm"></span> Net Surplus</span>
                                    </div>
                                </div>
                                <div className="flex-1 w-full">
                                    <ResponsiveContainer width="100%" height="95%">
                                        <AreaChart
                                            data={revTrend.months.map((rm: any) => {
                                                const em = expTrend.months.find((e: any) => e.month === rm.month) || { total: 0 };
                                                return {
                                                    month: rm.month,
                                                    revenue: rm.revenue,
                                                    expense: em.total,
                                                    net: rm.revenue - em.total
                                                };
                                            })}
                                            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                            <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                                            <Tooltip formatter={(value: any) => fmt(Number(value))} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
                                            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                                            <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                                            <Line type="monotone" dataKey="net" name="Net Surplus" stroke="#6366f1" strokeWidth={3} dot={{ r: 3 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                                {revTrend.months.map((m: any) => {
                                    const em = expTrend.months.find((e: any) => e.month === m.month) || { total: 0 };
                                    const netVal = m.revenue - em.total;
                                    return (
                                        <div key={m.month} className="bg-black/20 border border-white/10 rounded-xl p-3 text-center flex flex-col justify-between">
                                            <div>
                                                <div className="text-[10px] text-glass-muted font-bold uppercase">{m.month}</div>
                                                <div className="text-xs font-semibold text-emerald-400 mt-1">{fmt(m.revenue)} In</div>
                                                <div className="text-xs font-semibold text-rose-400 mt-0.5">{fmt(em.total)} Out</div>
                                            </div>
                                            <div className={`text-xs font-bold mt-2 pt-1 border-t border-white/5 ${netVal >= 0 ? 'text-indigo-400' : 'text-rose-500'}`}>
                                                {netVal >= 0 ? '+' : ''}{fmt(netVal)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ═══ COLLECTION EFFICIENCY ═══ */}
                    {tab === 'collection' && collection && collection.overall && (
                        <div className="space-y-6 max-w-5xl mx-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-4 flex flex-col gap-4">
                                    <div className={`p-6 rounded-xl border-2 text-center flex-1 flex flex-col justify-center items-center ${Number(collection.overall.efficiency) >= 85 ? 'border-emerald-500/30 bg-emerald-600/10' : 'border-yellow-500/30 bg-yellow-600/10'}`}>
                                        <div className="text-xs font-bold text-glass-muted uppercase mb-2">Overall Collection Efficiency</div>
                                        <div className="text-5xl font-black text-white">{collection.overall.efficiency}%</div>
                                        <div className="text-xs text-glass-muted mt-4">Billed: <span className="text-white font-semibold">{fmt(collection.overall.billed)}</span></div>
                                        <div className="text-xs text-glass-muted mt-1.5">Collected: <span className="text-emerald-400 font-semibold">{fmt(collection.overall.collected)}</span></div>
                                    </div>
                                </div>
                                <div className="lg:col-span-8 bg-black/20 border border-white/10 rounded-xl p-5 h-[300px] flex flex-col justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-glass-muted">6-Month Collection vs. Billing Gap</span>
                                    <div className="flex-1 w-full mt-2">
                                        <ResponsiveContainer width="100%" height="95%">
                                            <BarChart data={collection.months.map((m: any) => ({ month: m.month, billed: m.billed, collected: m.collected, efficiency: Number(m.efficiency) }))} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                                                <Tooltip formatter={(value: any, name: any) => name === 'efficiency' ? [`${value}%`, 'Efficiency'] : [fmt(Number(value)), name === 'billed' ? 'Total Billed' : 'Total Collected']} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
                                                <Legend wrapperStyle={{ fontSize: '9px' }} />
                                                <Bar dataKey="billed" name="Billed" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                                                <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[3, 3, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                                {collection.months.map((m: any) => (
                                    <div key={m.month} className="bg-black/20 border border-white/10 rounded-xl p-3 text-center flex flex-col justify-between">
                                        <div>
                                            <div className="text-[10px] font-bold text-glass-muted uppercase">{m.month}</div>
                                            <div className={`text-md font-black mt-1 ${Number(m.efficiency) >= 85 ? 'text-emerald-400' : Number(m.efficiency) >= 60 ? 'text-yellow-400' : 'text-rose-400'}`}>{m.efficiency}%</div>
                                        </div>
                                        <div className="text-[10px] text-glass-muted mt-2 border-t border-white/5 pt-1">Gap: <span className="text-rose-400 font-bold">{fmt(m.outstanding)}</span></div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => { exportToCSV('CollectionEfficiency.csv', [['Month', 'Billed', 'Collected', 'Efficiency', 'Outstanding'], ...collection.months.map((m: any) => [m.month, m.billed, m.collected, m.efficiency, m.outstanding])]); }} className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 flex items-center gap-1.5 rounded-lg mx-auto transition"><Download size={13} /> Export CSV</button>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}
