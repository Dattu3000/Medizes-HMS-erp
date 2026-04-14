'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#ec4899', '#14b8a6'];

export default function DashboardOverview() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:5000/api/reports/analytics', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => res.json())
            .then(resData => {
                setData(resData);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-10 text-gray-400">Loading live analytics...</div>;

    const flowData = data?.charts?.flowTrend || [];
    const deptData = data?.charts?.departmentLoad || [];

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-[24px] font-semibold text-gray-50 tracking-tight">Hospital Overview</h1>
                <div className="flex items-center gap-3">
                    <button className="bg-[#1e293b] border border-slate-700 text-sm px-4 py-2 rounded-[8px] text-gray-300 hover:text-white transition">Export PDF</button>
                    <button className="bg-emerald-500 hover:bg-emerald-600 text-sm px-4 py-2 rounded-[8px] text-white font-bold transition">Generate Report</button>
                </div>
            </div>

            {/* 4 Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                <div className="bg-[#1e293b] p-5 rounded-[16px] border border-slate-800 shadow-xl flex flex-col justify-between h-32 relative overflow-hidden group hover:border-slate-600 transition">
                    <div className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Total Patients</div>
                    <div className="text-3xl font-bold text-gray-50 mt-2">{data?.patients?.total?.toLocaleString() || 0}</div>
                    <div className="text-emerald-400 text-xs font-semibold mt-1 flex items-center gap-1">Visits: {data?.patients?.visits?.toLocaleString() || 0}</div>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition duration-500"></div>
                </div>

                <div className="bg-[#1e293b] p-5 rounded-[16px] border border-slate-800 shadow-xl flex flex-col justify-between h-32 relative overflow-hidden group hover:border-slate-600 transition">
                    <div className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Active Staff</div>
                    <div className="text-3xl font-bold text-gray-50 mt-2">{data?.hr?.employees?.toLocaleString() || 0}</div>
                    <div className="text-emerald-400 text-xs font-semibold mt-1 flex items-center gap-1">On payroll</div>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition duration-500"></div>
                </div>

                <div className="bg-[#1e293b] p-5 rounded-[16px] border border-slate-800 shadow-xl flex flex-col justify-between h-32 relative overflow-hidden group hover:border-slate-600 transition">
                    <div className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Active IPD Admissions</div>
                    <div className="text-3xl font-bold text-gray-50 mt-2">{data?.ipd?.active || 0} <span className="text-sm font-medium text-gray-500">currently</span></div>
                    <div className="text-emerald-400 text-xs font-semibold mt-1 flex items-center gap-1">Total All-Time: {data?.ipd?.total || 0}</div>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition duration-500"></div>
                </div>

                <div className="bg-[#1e293b] p-5 rounded-[16px] border border-slate-800 shadow-xl flex flex-col justify-between h-32 relative overflow-hidden group hover:border-slate-600 transition">
                    <div className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Est. Revenue</div>
                    <div className="text-3xl font-bold text-gray-50 mt-2">₹{(data?.billing?.totalRevenue || 0).toLocaleString()}</div>
                    <div className="text-emerald-400 text-xs font-semibold mt-1 flex items-center gap-1">{data?.billing?.unpaid || 0} Unpaid Bills</div>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition duration-500"></div>
                </div>

            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Graph - Recharts AreaChart */}
                <div className="lg:col-span-2 bg-[#1e293b] p-6 rounded-[16px] border border-slate-800 shadow-xl flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-bold text-gray-50 text-[15px]">Patient Flow Dynamics (7 Days)</h3>
                        <div className="flex gap-4 text-xs">
                            <span className="flex items-center gap-1 text-blue-400 font-medium"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Inpatient</span>
                            <span className="flex items-center gap-1 text-emerald-400 font-medium"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Outpatient</span>
                        </div>
                    </div>

                    <div className="flex-1 w-full relative min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={flowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                                    itemStyle={{ fontSize: '13px', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="outpatient" name="Outpatient Visits" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" />
                                <Area type="monotone" dataKey="inpatient" name="IPD Admissions" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Secondary Donut/Composition - Recharts PieChart */}
                <div className="lg:col-span-1 bg-[#1e293b] p-6 rounded-[16px] border border-slate-800 shadow-xl flex flex-col">
                    <h3 className="font-bold text-gray-50 text-[15px] mb-4">7-Day Department Load</h3>
                    <div className="flex-1 w-full relative flex items-center justify-center min-h-[180px]">
                        {deptData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={deptData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {deptData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                                        itemStyle={{ fontSize: '12px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-gray-500 text-sm">No data available</div>
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold text-gray-50">{deptData.reduce((a: number, b: any) => a + b.value, 0)}</span>
                            <span className="text-[10px] uppercase tracking-wider text-gray-400">Total Visits</span>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        {deptData.map((d: any, i: number) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="font-medium line-clamp-1 flex gap-2 items-center text-gray-300">
                                    <div className="w-3 h-3 rounded-md" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                    {d.name}
                                </span>
                                <span className="text-gray-300 font-semibold">{d.value}</span>
                            </div>
                        ))}
                        {deptData.length === 0 && <div className="text-center text-xs text-slate-500 mt-4">Waiting for visits to be logged</div>}
                    </div>
                </div>

            </div>

        </div>
    );
}
