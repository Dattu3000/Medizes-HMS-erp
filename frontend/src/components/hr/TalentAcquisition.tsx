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

    const [jdText, setJdText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiResult, setAiResult] = useState<any>(null);

    const handleAnalyze = async () => {
        if (!jdText) return;
        setIsAnalyzing(true);
        try {
            const res = await fetch('http://localhost:5000/api/hr/jobs/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ description: jdText })
            });
            if (res.ok) {
                setAiResult(await res.json());
            } else {
                alert('Failed to analyze description');
            }
        } catch (err) {
            console.error(err);
        }
        setIsAnalyzing(false);
    };

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

                        {/* AI Job Description Analyzer */}
                        <div className="m-6 p-6 bg-indigo-900/20 rounded-xl border border-indigo-400/30">
                            <h3 className="text-lg font-bold text-indigo-100 flex items-center gap-2 mb-4">
                                <FileText className="w-5 h-5 text-indigo-400" /> AI Job Description Analyzer
                            </h3>
                            <textarea
                                value={jdText}
                                onChange={e => setJdText(e.target.value)}
                                placeholder="Paste job description draft here to analyze for inclusivity and bias..."
                                className="w-full h-[100px] bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-indigo-400 focus:outline-none mb-3 resize-none"
                            />
                            <button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || !jdText}
                                className="liquid-glass-button bg-indigo-600/50 hover:bg-indigo-600 px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-50 transition"
                            >
                                {isAnalyzing ? 'Analyzing...' : 'Analyze Inclusion Score'}
                            </button>

                            {aiResult && (
                                <div className="mt-4 p-4 bg-black/40 rounded-lg text-sm shadow-inner">
                                    <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-3">
                                        <span className="font-bold text-white">Inclusivity Score:</span>
                                        <span className={`font-black text-xl ${aiResult.inclusivityScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            {aiResult.inclusivityScore}/100
                                        </span>
                                    </div>
                                    <div className="mb-3">
                                        <span className="text-white/60 font-medium block mb-1">Keywords Detected:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {aiResult.recommendedKeywords?.map((k: string, i: number) => (
                                                <span key={i} className="bg-white/10 px-2 py-0.5 rounded text-xs text-white/80">{k}</span>
                                            ))}
                                        </div>
                                    </div>
                                    {aiResult.biasedTermsFound?.length > 0 && (
                                        <div className="mb-3">
                                            <span className="text-rose-400 font-medium block mb-1">Biased Terms Found:</span>
                                            <div className="flex flex-wrap gap-2">
                                                {aiResult.biasedTermsFound.map((t: string, i: number) => (
                                                    <span key={i} className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded text-xs">{t}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-emerald-400 font-medium block mb-1">Suggested Rewrite:</span>
                                        <p className="text-white/80 text-xs leading-relaxed p-3 bg-white/5 rounded border border-white/5">
                                            {aiResult.suggestedDescription}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
