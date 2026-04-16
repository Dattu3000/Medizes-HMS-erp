'use client';

import { useState, useEffect } from 'react';
import { Users, Target, CalendarDays, CheckCircle, AlertCircle, BarChart2, CalendarClock, Bot } from 'lucide-react';

export default function ManagerCenter() {
    const [approvals] = useState([
        { id: 1, type: 'Time Off', employee: 'John Doe', dates: 'Mar 25 - Mar 27', status: 'PENDING' },
        { id: 2, type: 'Performance Goal', employee: 'Sarah Smith', status: 'PENDING' },
    ]);

    const [upcoming1on1s] = useState([
        { id: 1, employee: 'Sarah Smith', time: 'Today, 2:00 PM', agendaItems: 3 }
    ]);

    const [shifts, setShifts] = useState<any[]>([]);
    const [goals, setGoals] = useState<any[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        fetchShifts();
        fetchGoals();
    }, []);

    const fetchShifts = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/hr/shifts', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) setShifts(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchGoals = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/hr/goals', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) setGoals(await res.json());
        } catch (err) { console.error(err); }
    };

    const handleAutoGenerate = async () => {
        setIsGenerating(true);
        try {
            const payload = { targetDate: new Date().toISOString(), department: null };
            const res = await fetch('http://localhost:5000/api/hr/shifts/auto-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert("Smart Shifts Generated Successfully based on availability and burnout constraints.");
                fetchShifts();
            } else {
                alert("Failed to generate shifts. Please check backend.");
            }
        } catch (err) {
            console.error(err);
        }
        setIsGenerating(false);
    };

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
                            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
                                {goals.length > 0 ? goals.map(goal => (
                                    <div key={goal.id}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-glass-body">{goal.title}</span>
                                            <span className="text-blue-300 font-bold">{goal.progress}%</span>
                                        </div>
                                        <div className="w-full bg-black/20 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full bg-gradient-to-r ${goal.progress >= 70 ? 'from-emerald-400 to-teal-500' : goal.progress >= 40 ? 'from-blue-400 to-indigo-500' : 'from-amber-400 to-orange-500'}`}
                                                style={{ width: `${goal.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-6 text-glass-muted italic text-sm">
                                        No team goals set for this period.
                                    </div>
                                )}
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

            {/* Smart Shift Intelligence */}
            <div className="liquid-glass-card p-6 mt-6 border-indigo-500/20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/20 p-2 rounded-xl text-indigo-400">
                            <CalendarClock className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-glass-title">Shift Intelligence & Roster</h3>
                            <p className="text-sm text-glass-body mt-0.5">Automated Hospital Deployment scheduling analyzing burnout thresholds.</p>
                        </div>
                    </div>
                    <button onClick={handleAutoGenerate} disabled={isGenerating} className="liquid-glass-button bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-100 font-bold px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 border border-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        <Bot className="w-4 h-4" /> {isGenerating ? 'Synthesizing...' : 'AI Auto-Generate Upcoming Roster'}
                    </button>
                </div>

                {shifts.length === 0 ? (
                    <div className="py-12 flex flex-col justify-center items-center text-glass-muted border-2 border-dashed border-white/10 rounded-2xl">
                        <CalendarDays className="w-10 h-10 mb-3 opacity-30" />
                        <p className="font-semibold text-lg">No Active Shifts Scheduled</p>
                        <p className="text-sm opacity-70 mt-1">Deploy the AI Generator to organize next week's availability.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {shifts.map((s, idx) => (
                            <div key={idx} className={`p-4 rounded-xl border ${s.isBurnoutRisk ? 'bg-rose-500/10 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'bg-black/20 border-white/10'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="font-bold text-white text-md">
                                            {s.employee?.firstName} {s.employee?.lastName}
                                        </div>
                                        <div className="text-xs text-indigo-300 font-semibold">{s.roleType} // {s.department}</div>
                                    </div>
                                    {s.isBurnoutRisk && (
                                        <span className="bg-rose-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded animate-pulse">
                                            BURNOUT RISK
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-1 mt-3 pt-3 border-t border-white/10 text-sm">
                                    <div className="flex justify-between text-glass-body">
                                        <span>Start:</span>
                                        <span className="font-semibold text-white">{new Date(s.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                    </div>
                                    <div className="flex justify-between text-glass-body">
                                        <span>End:</span>
                                        <span className="font-semibold text-white">{new Date(s.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                    </div>
                                </div>
                                {s.isBurnoutRisk && s.burnoutReason && (
                                    <div className="mt-3 bg-rose-500/20 text-rose-200 text-xs p-2 rounded border border-rose-500/30">
                                        <AlertCircle className="w-3 h-3 inline mr-1" />
                                        {s.burnoutReason}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}
