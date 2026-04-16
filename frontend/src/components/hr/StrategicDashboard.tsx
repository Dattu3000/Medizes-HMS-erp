'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

export default function StrategicDashboard() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/hr/analytics/strategic', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) setData(await res.json());
        } catch (err) { console.error(err); }
    };

    if (!data) return <div className="text-white p-8">Loading analytics...</div>;

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="liquid-glass-card p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-white">
                <div>
                    <h2 className="text-3xl font-bold text-glass-title">Strategic Executive Dashboard</h2>
                    <p className="text-glass-body mt-1">High-level workforce intelligence and people analytics.</p>
                </div>
                <div className="flex gap-2">
                    <select className="bg-black/20 border border-white/20 text-white text-sm rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 cursor-pointer shadow-inner">
                        <option className="text-slate-800">Q1 2026</option>
                        <option className="text-slate-800">Q4 2025</option>
                    </select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="liquid-glass-card p-6 group hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-white/10 text-blue-300 rounded-xl group-hover:scale-110 transition-transform shadow-inner">
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="flex items-center text-xs font-bold text-emerald-200 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full"><TrendingUp className="w-3 h-3 mr-1" /> +12%</span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-bold text-glass-title">{data.headcount}</h3>
                        <p className="text-sm font-medium text-glass-muted mt-1 uppercase tracking-wide">Total Headcount</p>
                    </div>
                </div>

                <div className="liquid-glass-card p-6 group hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-white/10 text-rose-300 rounded-xl group-hover:scale-110 transition-transform shadow-inner">
                            <Activity className="w-5 h-5" />
                        </div>
                        <span className="flex items-center text-xs font-bold text-rose-200 bg-rose-500/20 border border-rose-500/30 px-3 py-1 rounded-full"><TrendingUp className="w-3 h-3 mr-1" /> +2.1%</span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-bold text-glass-title">{data.turnover}%</h3>
                        <p className="text-sm font-medium text-glass-muted mt-1 uppercase tracking-wide">Annual Turnover</p>
                    </div>
                </div>

                <div className="liquid-glass-card p-6 group hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-white/10 text-emerald-300 rounded-xl group-hover:scale-110 transition-transform shadow-inner">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <span className="flex items-center text-xs font-bold text-emerald-200 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full"><TrendingUp className="w-3 h-3 mr-1" /> +5%</span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-bold text-glass-title">$240K</h3>
                        <p className="text-sm font-medium text-glass-muted mt-1 uppercase tracking-wide">Q1 Payroll Run</p>
                    </div>
                </div>

                <div className="liquid-glass-card p-6 group hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-white/10 text-purple-300 rounded-xl group-hover:scale-110 transition-transform shadow-inner">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-bold text-glass-title">{data.hiring.avgTimeToFill} Days</h3>
                        <p className="text-sm font-medium text-glass-muted mt-1 uppercase tracking-wide">Avg Time-to-Fill</p>
                    </div>
                </div>
            </div>

            {/* Main Data Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Diversity & Inclusion Snapshot */}
                <div className="liquid-glass-card p-6">
                    <h3 className="text-xl font-bold text-glass-title mb-6 flex items-center gap-2">Diversity Snapshot (DEI)</h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-semibold text-glass-body">Gender Breakdown</span>
                                <span className="text-glass-muted">{data.diversity.female}% F / {data.diversity.male}% M</span>
                            </div>
                            <div className="flex w-full h-4 rounded-full overflow-hidden bg-black/20 shadow-inner">
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${data.diversity.female}%` }}></div>
                                <div className="bg-gradient-to-r from-blue-400 to-cyan-400" style={{ width: `${data.diversity.male}%` }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-semibold text-glass-body">Age Demographics</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 h-16 pointer-events-none">
                                <div className="bg-teal-500/20 border border-teal-500/30 rounded-lg flex items-end justify-center pb-2"><span className="text-teal-200 text-xs font-bold">Gen Z</span></div>
                                <div className="bg-teal-400/30 border border-teal-400/30 rounded-lg flex items-end justify-center pb-2"><span className="text-teal-100 text-xs font-bold">Millennial</span></div>
                                <div className="bg-teal-300/40 border border-teal-300/40 rounded-lg flex items-end justify-center pb-2"><span className="text-white text-xs font-bold">Gen X</span></div>
                                <div className="bg-teal-200/50 border border-teal-200/50 rounded-lg flex items-end justify-center pb-2"><span className="text-teal-50 text-xs font-bold">Boomer</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Engagement Pulse Sentiment */}
                <div className="liquid-glass-card p-6 border-emerald-500/30">
                    <h3 className="text-xl font-bold text-glass-title mb-6">Pulse Survey Sentiment (AI)</h3>
                    <div className="flex flex-col items-center justify-center p-6 border-4 border-emerald-400/30 bg-emerald-500/10 rounded-full w-48 h-48 mx-auto relative mb-4 shadow-[0_0_30px_rgba(52,211,153,0.2)]">
                        <span className="text-6xl font-black text-emerald-300 drop-shadow-md">{data.sentiment}</span>
                        <span className="text-sm font-bold text-emerald-100/80 mt-1 uppercase tracking-widest">eNPS Score</span>
                    </div>
                    <div className="text-center">
                        <p className="text-glass-body text-sm">AI Analysis indicates <strong className="text-emerald-300 font-bold">{data.sentiment > 70 ? 'High Morale' : 'Normal Morale'}</strong>.</p>
                        <p className="text-xs text-glass-muted mt-2 block mx-auto max-w-sm">"Work-life balance" and "Team Collaboration" are top trending themes from text feedback.</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
