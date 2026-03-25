'use client';

import { useState } from 'react';
import { Briefcase, UserPlus, FileText, CheckCircle, Search, Clock } from 'lucide-react';

export default function TalentAcquisition() {
    const [jobs] = useState([
        { id: 1, title: 'Senior Backend Engineer', department: 'Engineering', candidates: 14, status: 'PUBLISHED' },
        { id: 2, title: 'HR Business Partner', department: 'Human Resources', candidates: 5, status: 'PUBLISHED' }
    ]);

    const [pipeline] = useState([
        { id: 1, name: 'Alex Johnson', stage: 'Screening', role: 'Senior Backend Engineer' },
        { id: 2, name: 'Sarah Wu', stage: 'Interview', role: 'Senior Backend Engineer' },
        { id: 3, name: 'Michael T.', stage: 'Offer', role: 'HR Business Partner' },
    ]);

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-indigo-600" />
                        Talent Acquisition
                    </h2>
                    <p className="text-slate-500">Manage job postings, candidates, and AI-assisted interviews.</p>
                </div>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> Create New Job
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Jobs List */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800">Active Roles</h3>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {jobs.map((job) => (
                                <div key={job.id} className="p-5 hover:bg-slate-50 cursor-pointer transition-colors relative">
                                    <div className="absolute left-0 top-0 h-full w-1 bg-indigo-500 rounded-r-full opacity-0 hover:opacity-100 transition-opacity"></div>
                                    <h4 className="font-bold text-slate-800">{job.title}</h4>
                                    <p className="text-sm text-slate-500">{job.department}</p>
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">{job.candidates} Candidates</span>
                                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Published</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Candidate Pipeline */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-full">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Search className="w-5 h-5 text-blue-500" />
                                Candidate Pipeline
                            </h3>
                            <button className="text-sm text-blue-600 font-medium hover:underline">View All</button>
                        </div>

                        <div className="p-6">
                            <div className="flex gap-4 mb-6 overflows-x-auto pb-2">
                                {/* Kanban-style columns simplified for view */}
                                {['Applied', 'Screening', 'Interview', 'Offer'].map((stage) => (
                                    <div key={stage} className="flex-1 min-w-[200px] bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        <h4 className="font-bold text-slate-700 mb-4">{stage}</h4>
                                        <div className="space-y-3">
                                            {pipeline.filter(p => p.stage === stage).map(p => (
                                                <div key={p.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 cursor-move hover:border-indigo-300 transition-colors">
                                                    <p className="font-semibold text-sm text-slate-800">{p.name}</p>
                                                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{p.role}</p>
                                                    {stage === 'Interview' && (
                                                        <div className="mt-3 flex gap-2">
                                                            <button className="w-full text-xs font-medium bg-blue-50 text-blue-700 py-1.5 rounded flex items-center justify-center gap-1 hover:bg-blue-100 transition">
                                                                <Clock className="w-3 h-3" /> Add Scorecard
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {pipeline.filter(p => p.stage === stage).length === 0 && (
                                                <div className="text-center p-4 border-2 border-dashed border-slate-200 rounded-lg">
                                                    <p className="text-xs text-slate-400">No candidates</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI Assistance Promo */}
                        <div className="m-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 flex items-start gap-4">
                            <div className="p-2 bg-indigo-600 rounded-lg text-white">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-indigo-900">AI Job Description Generator Active</h4>
                                <p className="text-sm text-indigo-700 mt-1">GUDHR AI is actively checking your drafts for inclusivity and surfacing past applicant matches.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
