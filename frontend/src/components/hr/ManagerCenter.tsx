'use client';

import { useState } from 'react';
import { Users, Target, CalendarDays, CheckCircle, AlertCircle, BarChart2 } from 'lucide-react';

export default function ManagerCenter() {
    const [approvals] = useState([
        { id: 1, type: 'Time Off', employee: 'John Doe', dates: 'Mar 25 - Mar 27', status: 'PENDING' },
        { id: 2, type: 'Performance Goal', employee: 'Sarah Smith', status: 'PENDING' },
    ]);

    const [upcoming1on1s] = useState([
        { id: 1, employee: 'Sarah Smith', time: 'Today, 2:00 PM', agendaItems: 3 }
    ]);

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="liquid-glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-glass-title">Manager Command Center</h2>
                    <p className="text-glass-body">Overview of your team's performance, tasks, and analytics.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* To-Do List (Approvals) column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="liquid-glass-card rounded-2xl p-6 border-rose-500/30 overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 border-l border-white/20"></div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-glass-title flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-rose-400" />
                                Action Required
                            </h3>
                            <span className="bg-rose-500/20 border border-rose-500/30 text-rose-200 font-bold px-3 py-1 rounded-full text-xs">
                                {approvals.length} Pending
                            </span>
                        </div>
                        <div className="space-y-4">
                            {approvals.map((item) => (
                                <div key={item.id} className="p-4 border border-white/10 rounded-xl hover:bg-white/10 transition-colors bg-black/10">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-semibold text-glass-body">{item.type}</span>
                                    </div>
                                    <p className="text-white font-medium">{item.employee}</p>
                                    {item.dates && <p className="text-xs text-glass-muted mt-1">{item.dates}</p>}

                                    <div className="flex gap-2 mt-4">
                                        <button className="flex-1 bg-white/5 border border-white/20 text-white py-1.5 rounded-lg text-sm font-medium hover:bg-white/10 transition">Decline</button>
                                        <button className="flex-1 liquid-glass-button py-1.5 rounded-lg text-sm font-medium">Approve</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Team Overview & OKRs column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Team OKRs */}
                        <div className="liquid-glass-card p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <Target className="w-5 h-5 text-blue-300" />
                                <h3 className="text-lg font-bold text-glass-title">Team OKRs (Q1)</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-glass-body">Launch Mobile App v2</span>
                                        <span className="text-blue-300 font-bold">75%</span>
                                    </div>
                                    <div className="w-full bg-black/20 rounded-full h-2">
                                        <div className="bg-gradient-to-r from-blue-400 to-indigo-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-glass-body">Reduce Bug Backlog</span>
                                        <span className="text-amber-300 font-bold">40%</span>
                                    </div>
                                    <div className="w-full bg-black/20 rounded-full h-2">
                                        <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Upcoming 1:1s */}
                        <div className="liquid-glass-card p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <CalendarDays className="w-5 h-5 text-indigo-300" />
                                <h3 className="text-lg font-bold text-glass-title">Upcoming 1:1s</h3>
                            </div>
                            <div className="space-y-3">
                                {upcoming1on1s.map((meeting) => (
                                    <div key={meeting.id} className="flex items-center justify-between p-3 border border-white/10 rounded-xl hover:bg-white/10 cursor-pointer transition">
                                        <div>
                                            <p className="font-semibold text-white">{meeting.employee}</p>
                                            <p className="text-xs text-glass-muted mt-0.5">{meeting.time}</p>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-indigo-100 bg-indigo-500/20 font-bold text-xs px-3 py-1 rounded-md border border-indigo-500/30">{meeting.agendaItems} Topics</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Team Analytics Snippet */}
                    <div className="liquid-glass-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <BarChart2 className="w-5 h-5 text-teal-300" />
                                <h3 className="text-lg font-bold text-glass-title">Team Headcount & Health</h3>
                            </div>
                            <button className="text-sm font-medium text-blue-300 hover:text-white transition">View Full Report</button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center hover:bg-white/10 transition-colors">
                                <p className="text-3xl font-bold text-white">12</p>
                                <p className="text-xs text-glass-muted mt-1 uppercase font-semibold tracking-wider">Total Reports</p>
                            </div>
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center hover:bg-emerald-500/20 transition-colors">
                                <p className="text-3xl font-bold text-emerald-300">95%</p>
                                <p className="text-xs text-emerald-200/80 mt-1 uppercase font-semibold tracking-wider">Retention</p>
                            </div>
                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center hover:bg-indigo-500/20 transition-colors">
                                <p className="text-3xl font-bold text-indigo-300">4.8</p>
                                <p className="text-xs text-indigo-200/80 mt-1 uppercase font-semibold tracking-wider">Avg Perf. Score</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
