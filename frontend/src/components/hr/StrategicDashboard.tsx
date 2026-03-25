'use client';

import { BarChart3, TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

export default function StrategicDashboard() {
    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="bg-slate-900 rounded-2xl p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-white">
                <div>
                    <h2 className="text-2xl font-bold">Strategic Executive Dashboard</h2>
                    <p className="text-slate-400">High-level workforce intelligence and people analytics.</p>
                </div>
                <div className="flex gap-2">
                    <select className="bg-slate-800 border-none text-sm rounded-lg px-4 py-2 focus:ring-0 cursor-pointer">
                        <option>Q1 2026</option>
                        <option>Q4 2025</option>
                    </select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><TrendingUp className="w-3 h-3 mr-1" /> +12%</span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-bold text-slate-800">1,245</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">Total Headcount</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                            <Activity className="w-5 h-5" />
                        </div>
                        <span className="flex items-center text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full"><TrendingUp className="w-3 h-3 mr-1" /> +2.1%</span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-bold text-slate-800">8.4%</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">Annual Turnover</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><TrendingUp className="w-3 h-3 mr-1" /> +5%</span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-bold text-slate-800">$4.2M</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">Q1 Payroll Run</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-bold text-slate-800">22 Days</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">Avg Time-to-Fill</p>
                    </div>
                </div>
            </div>

            {/* Main Data Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Diversity & Inclusion Snapshot */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">Diversity Snapshot (DEI)</h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-semibold text-slate-700">Gender Breakdown</span>
                                <span className="text-slate-500">48% F / 52% M</span>
                            </div>
                            <div className="flex w-full h-3 rounded-full overflow-hidden">
                                <div className="bg-indigo-500" style={{ width: '48%' }}></div>
                                <div className="bg-blue-400" style={{ width: '52%' }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-semibold text-slate-700">Age Demographics</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 h-16 pointer-events-none">
                                <div className="bg-teal-100 rounded flex items-end justify-center pb-2"><span className="text-teal-700 text-xs font-bold">Gen Z</span></div>
                                <div className="bg-teal-300 rounded flex items-end justify-center pb-2"><span className="text-teal-800 text-xs font-bold">Millennial</span></div>
                                <div className="bg-teal-500 rounded flex items-end justify-center pb-2"><span className="text-white text-xs font-bold">Gen X</span></div>
                                <div className="bg-teal-700 rounded flex items-end justify-center pb-2"><span className="text-teal-100 text-xs font-bold">Boomer</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Engagement Pulse Sentiment */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Pulse Survey Sentiment (AI)</h3>
                    <div className="flex flex-col items-center justify-center p-6 border-4 border-emerald-50 rounded-full w-48 h-48 mx-auto relative mb-4">
                        <span className="text-5xl font-black text-emerald-600">82</span>
                        <span className="text-sm font-bold text-emerald-800 mt-1 uppercase tracking-widest">eNPS Score</span>
                    </div>
                    <div className="text-center">
                        <p className="text-slate-600 text-sm">AI Analysis indicates <strong className="text-emerald-600">High Morale</strong>.</p>
                        <p className="text-xs text-slate-400 mt-2">"Work-life balance" and "Team Collaboration" are top trending themes.</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
