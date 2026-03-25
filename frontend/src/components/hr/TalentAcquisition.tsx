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
            <div className="liquid-glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-glass-title flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-indigo-300" />
                        Talent Acquisition
                    </h2>
                    <p className="text-glass-body">Manage job postings, candidates, and AI-assisted interviews.</p>
                </div>
                <button className="liquid-glass-button px-6 py-2.5 rounded-xl font-medium flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> Create New Job
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Jobs List */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="liquid-glass-card rounded-2xl overflow-hidden">
                        <div className="p-5 border-b border-white/10 bg-white/5">
                            <h3 className="text-lg font-bold text-glass-title">Active Roles</h3>
                        </div>
                        <div className="divide-y divide-white/5">
                            {jobs.map((job) => (
                                <div key={job.id} className="p-5 hover:bg-white/10 cursor-pointer transition-colors relative">
                                    <div className="absolute left-0 top-0 h-full w-1 bg-indigo-400 rounded-r-full opacity-0 hover:opacity-100 transition-opacity"></div>
                                    <h4 className="font-bold text-white">{job.title}</h4>
                                    <p className="text-sm text-glass-muted">{job.department}</p>
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="text-xs font-semibold bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 px-3 py-1 rounded-full">{job.candidates} Candidates</span>
                                        <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Published</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Candidate Pipeline */}
                <div className="lg:col-span-2">
                    <div className="liquid-glass-card rounded-2xl h-full flex flex-col">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="text-lg font-bold text-glass-title flex items-center gap-2">
                                <Search className="w-5 h-5 text-blue-300" />
                                Candidate Pipeline
                            </h3>
                            <button className="text-sm text-blue-300 font-medium hover:text-white transition">View All</button>
                        </div>

                        <div className="p-6 flex-1 overflow-x-auto">
                            <div className="flex gap-4 min-w-max pb-2">
                                {/* Kanban-style columns */}
                                {['Applied', 'Screening', 'Interview', 'Offer'].map((stage) => (
                                    <div key={stage} className="w-[280px] bg-black/20 rounded-xl p-4 border border-white/5">
                                        <h4 className="font-bold text-glass-title mb-4">{stage}</h4>
                                        <div className="space-y-3">
                                            {pipeline.filter(p => p.stage === stage).map(p => (
                                                <div key={p.id} className="liquid-glass-panel p-4 rounded-xl border border-white/10 cursor-move hover:border-indigo-400/50 transition-colors">
                                                    <p className="font-semibold text-sm text-white">{p.name}</p>
                                                    <p className="text-xs text-glass-muted mt-1 line-clamp-1">{p.role}</p>
                                                    {stage === 'Interview' && (
                                                        <div className="mt-3 flex gap-2">
                                                            <button className="w-full text-xs font-medium text-white liquid-glass-button py-2 rounded-lg flex items-center justify-center gap-1">
                                                                <Clock className="w-3 h-3" /> Add Scorecard
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {pipeline.filter(p => p.stage === stage).length === 0 && (
                                                <div className="text-center p-4 border-2 border-dashed border-white/10 rounded-lg">
                                                    <p className="text-xs text-white/30">No candidates</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI Assistance Promo */}
                        <div className="m-6 p-4 bg-indigo-900/40 rounded-xl border border-indigo-400/30 flex items-start gap-4">
                            <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-lg text-indigo-200">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-indigo-100">AI Job Description Generator Active</h4>
                                <p className="text-sm text-indigo-200/80 mt-1">GUDHR AI is actively checking your drafts for inclusivity and surfacing past applicant matches.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
