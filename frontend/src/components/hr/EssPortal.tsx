'use client';

import { useState, useEffect } from 'react';
import { Plane, FileText, CheckSquare, Settings, Bell, BookOpen } from 'lucide-react';

export default function EssPortal() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [paystubs, setPaystubs] = useState([{ month: 'February', year: 2026, amount: 4500 }]);
    const [ptoBalance] = useState(14);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/hr/onboarding/my-tasks', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) setTasks(await res.json());
        } catch (err) { console.error(err); }
    };

    const handleCompleteTask = async (id: string) => {
        try {
            const res = await fetch(`http://localhost:5000/api/hr/onboarding/tasks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: 'COMPLETED' })
            });
            if (res.ok) fetchTasks();
        } catch (err) { console.error(err); }
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="liquid-glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-glass-title">Welcome back, Emily! 👋</h2>
                    <p className="text-glass-body mt-1">Here's what's happening today in your workspace.</p>
                </div>
                <button className="liquid-glass-button px-6 py-2.5 rounded-xl font-medium shadow-sm">
                    Request Time Off
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* PTO Widget */}
                <div className="liquid-glass-card p-6 flex flex-col justify-between group hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/10 text-teal-300 rounded-xl group-hover:scale-110 transition-transform shadow-inner">
                            <Plane className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-100 px-3 py-1 rounded-full border border-emerald-500/30">Available</span>
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold text-glass-title">{ptoBalance} Days</h3>
                        <p className="text-sm text-glass-muted mt-1">Paid Time Off Balance</p>
                    </div>
                </div>

                {/* Payroll Widget */}
                <div className="liquid-glass-card p-6 flex flex-col justify-between group hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/10 text-purple-300 rounded-xl group-hover:scale-110 transition-transform shadow-inner">
                            <FileText className="w-6 h-6" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-glass-title">Latest Pay Stub</h3>
                        <p className="text-sm text-glass-muted mt-1">Feb 2026 - View Details</p>
                    </div>
                </div>

                {/* Tasks Widget */}
                <div className="liquid-glass-card p-6 flex flex-col justify-between group hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/10 text-orange-300 rounded-xl group-hover:scale-110 transition-transform shadow-inner">
                            <CheckSquare className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-semibold bg-orange-500/20 text-orange-100 px-3 py-1 rounded-full border border-orange-500/30">{tasks.length} Pending</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-glass-title">Action Required</h3>
                        <p className="text-sm text-glass-muted mt-1">Complete your onboarding tasks</p>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Knowledge Base */}
                <div className="liquid-glass-card rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                        <h3 className="text-lg font-bold text-glass-title flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-blue-300" />
                            Knowledge Base
                        </h3>
                    </div>
                    <div className="p-6">
                        <input type="text" placeholder="Search HR policies, benefits, FAQs..." className="w-full bg-black/20 border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all mb-4 placeholder-white/40 shadow-inner" />
                        <div className="space-y-3">
                            {['2026 Employee Handbook', 'Health Insurance Benefits Guide', 'Work From Home Policy'].map((doc, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 hover:bg-white/10 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-white/20">
                                    <span className="text-sm font-medium text-glass-body">{doc}</span>
                                    <FileText className="w-4 h-4 text-white/40" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Task List */}
                <div className="liquid-glass-card rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                        <h3 className="text-lg font-bold text-glass-title flex items-center gap-2">
                            <CheckSquare className="w-5 h-5 text-orange-400" />
                            My Tasks
                        </h3>
                    </div>
                    <div className="p-4 space-y-2">
                        {tasks.filter(t => t.status === 'PENDING').map((task) => (
                            <div key={task.id} className="flex items-center justify-between p-4 bg-black/10 hover:bg-white/10 border border-white/5 rounded-xl transition-colors">
                                <span className="font-medium text-glass-body">{task.taskName}</span>
                                <button
                                    onClick={() => handleCompleteTask(task.id)}
                                    className="text-sm font-medium text-white liquid-glass-button px-4 py-1.5 rounded-lg"
                                >
                                    Complete
                                </button>
                            </div>
                        ))}
                        {tasks.filter(t => t.status === 'PENDING').length === 0 && (
                            <div className="text-center py-8 text-glass-muted italic text-sm">
                                All caught up! No pending tasks.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
