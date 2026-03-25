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
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Manager Command Center</h2>
                    <p className="text-slate-500">Overview of your team's performance, tasks, and analytics.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* To-Do List (Approvals) column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white border border-rose-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-rose-500" />
                                Action Required
                            </h3>
                            <span className="bg-rose-100 text-rose-700 font-bold px-3 py-1 rounded-full text-xs">
                                {approvals.length} Pending
                            </span>
                        </div>
                        <div className="space-y-4">
                            {approvals.map((item) => (
                                <div key={item.id} className="p-4 border border-slate-100 rounded-xl hover:shadow-md transition-shadow bg-slate-50">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-semibold text-slate-700">{item.type}</span>
                                    </div>
                                    <p className="text-slate-800 font-medium">{item.employee}</p>
                                    {item.dates && <p className="text-xs text-slate-500 mt-1">{item.dates}</p>}

                                    <div className="flex gap-2 mt-4">
                                        <button className="flex-1 bg-white border border-slate-200 text-slate-700 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-100 transition">Decline</button>
                                        <button className="flex-1 bg-green-600 text-white py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition shadow-sm">Approve</button>
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
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-2 mb-6">
                                <Target className="w-5 h-5 text-blue-600" />
                                <h3 className="text-lg font-bold text-slate-800">Team OKRs (Q1)</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-slate-700">Launch Mobile App v2</span>
                                        <span className="text-blue-600 font-bold">75%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-slate-700">Reduce Bug Backlog</span>
                                        <span className="text-amber-500 font-bold">40%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Upcoming 1:1s */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-2 mb-6">
                                <CalendarDays className="w-5 h-5 text-indigo-600" />
                                <h3 className="text-lg font-bold text-slate-800">Upcoming 1:1s</h3>
                            </div>
                            <div className="space-y-3">
                                {upcoming1on1s.map((meeting) => (
                                    <div key={meeting.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition">
                                        <div>
                                            <p className="font-semibold text-slate-800">{meeting.employee}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{meeting.time}</p>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-indigo-600 bg-indigo-50 font-bold text-xs px-2 py-1 rounded-md">{meeting.agendaItems} Topics</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Team Analytics Snippet */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <BarChart2 className="w-5 h-5 text-teal-600" />
                                <h3 className="text-lg font-bold text-slate-800">Team Headcount & Health</h3>
                            </div>
                            <button className="text-sm font-medium text-blue-600 hover:underline">View Full Report</button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-slate-50 rounded-xl text-center">
                                <p className="text-3xl font-bold text-slate-800">12</p>
                                <p className="text-xs text-slate-500 mt-1 uppercase font-semibold tracking-wider">Total Reports</p>
                            </div>
                            <div className="p-4 bg-emerald-50 rounded-xl text-center">
                                <p className="text-3xl font-bold text-emerald-700">95%</p>
                                <p className="text-xs text-emerald-600 mt-1 uppercase font-semibold tracking-wider">Retention</p>
                            </div>
                            <div className="p-4 bg-indigo-50 rounded-xl text-center">
                                <p className="text-3xl font-bold text-indigo-700">4.8</p>
                                <p className="text-xs text-indigo-600 mt-1 uppercase font-semibold tracking-wider">Avg Perf. Score</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
