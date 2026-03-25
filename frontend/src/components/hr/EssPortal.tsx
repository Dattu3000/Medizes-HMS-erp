'use client';

import { useState, useEffect } from 'react';
import { Plane, FileText, CheckSquare, Settings, Bell, BookOpen } from 'lucide-react';

export default function EssPortal() {
    const [tasks, setTasks] = useState([{ id: 1, name: "Upload ID Proof", status: "PENDING" }]);
    const [paystubs, setPaystubs] = useState([{ month: 'February', year: 2026, amount: 4500 }]);
    const [ptoBalance] = useState(14);

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Welcome back, Emily! 👋</h2>
                    <p className="text-slate-500">Here's what's happening today in your workspace.</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-blue-200">
                    Request Time Off
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* PTO Widget */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-teal-50 text-teal-600 rounded-xl group-hover:scale-110 transition-transform">
                            <Plane className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-full">Available</span>
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold text-slate-800">{ptoBalance} Days</h3>
                        <p className="text-sm text-slate-500 mt-1">Paid Time Off Balance</p>
                    </div>
                </div>

                {/* Payroll Widget */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                            <FileText className="w-6 h-6" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Latest Pay Stub</h3>
                        <p className="text-sm text-slate-500 mt-1">Feb 2026 - View Details</p>
                    </div>
                </div>

                {/* Tasks Widget */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:scale-110 transition-transform">
                            <CheckSquare className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-semibold bg-orange-100 text-orange-600 px-2 py-1 rounded-full">{tasks.length} Pending</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Action Required</h3>
                        <p className="text-sm text-slate-500 mt-1">Complete your onboarding tasks</p>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Knowledge Base */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                            Knowledge Base
                        </h3>
                    </div>
                    <div className="p-6">
                        <input type="text" placeholder="Search HR policies, benefits, FAQs..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all mb-4" />
                        <div className="space-y-3">
                            {['2026 Employee Handbook', 'Health Insurance Benefits Guide', 'Work From Home Policy'].map((doc, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                                    <span className="text-sm font-medium text-slate-700">{doc}</span>
                                    <FileText className="w-4 h-4 text-slate-400" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Task List */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <CheckSquare className="w-5 h-5 text-orange-600" />
                            My Tasks
                        </h3>
                    </div>
                    <div className="p-2">
                        {tasks.map((task) => (
                            <div key={task.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors">
                                <span className="font-medium text-slate-700">{task.name}</span>
                                <button className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                                    Complete
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
