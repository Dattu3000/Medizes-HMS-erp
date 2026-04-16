'use client';

import { useState, useEffect } from 'react';
import { Briefcase, UserPlus, FileText, CheckCircle, Search, Clock, X } from 'lucide-react';

export default function TalentAcquisition() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [pipeline, setPipeline] = useState<any[]>([]);

    const [jdText, setJdText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiResult, setAiResult] = useState<any>(null);

    const [candidateSkills, setCandidateSkills] = useState('');
    const [jobReqs, setJobReqs] = useState('');
    const [isScreening, setIsScreening] = useState(false);
    const [screenResult, setScreenResult] = useState<any>(null);

    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [newJob, setNewJob] = useState({ title: '', department: '', description: '', hiringManagerId: 'system-mgr' }); // hiringManagerId should ideally come from auth

    useEffect(() => {
        fetchJobs();
        fetchCandidates();
    }, []);

    const fetchJobs = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/hr/jobs', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) setJobs(await res.json());
        } catch (err) { console.error(err); }
    };

    const fetchCandidates = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/hr/candidates', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) setPipeline(await res.json());
        } catch (err) { console.error(err); }
    };

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

    const handleScreenResume = async () => {
        if (!candidateSkills || !jobReqs) return;
        setIsScreening(true);
        try {
            const res = await fetch('http://localhost:5000/api/hr/talent/resume-screen', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ candidateSkills, jobRequirements: jobReqs })
            });
            if (res.ok) {
                setScreenResult(await res.json());
            } else {
                alert('Failed to screen resume');
            }
        } catch (err) {
            console.error(err);
        }
        setIsScreening(false);
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`http://localhost:5000/api/hr/candidates/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                fetchCandidates();
            }
        } catch (err) { console.error(err); }
    };

    const handleCreateJob = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/hr/jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(newJob)
            });
            if (res.ok) {
                setIsJobModalOpen(false);
                setNewJob({ title: '', department: '', description: '', hiringManagerId: 'system-mgr' });
                fetchJobs();
            }
        } catch (err) { console.error(err); }
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            {/* Job Creation Modal */}
            {isJobModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="liquid-glass-card w-full max-w-lg p-8 space-y-6 relative border border-white/20 shadow-2xl scale-in">
                        <button onClick={() => setIsJobModalOpen(false)} className="absolute top-4 right-4 text-white/40 hover:text-white transition">
                            <X className="w-6 h-6" />
                        </button>
                        <div>
                            <h3 className="text-2xl font-bold text-glass-title">Create New Job Posting</h3>
                            <p className="text-glass-body">Define the role and requirements for the new position.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-indigo-200 mb-1">Job Title</label>
                                <input
                                    type="text"
                                    value={newJob.title}
                                    onChange={e => setNewJob({ ...newJob, title: e.target.value })}
                                    placeholder="e.g. Senior Medical Officer"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-indigo-200 mb-1">Department</label>
                                <select
                                    value={newJob.department}
                                    onChange={e => setNewJob({ ...newJob, department: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                                >
                                    <option value="">Select Department</option>
                                    <option value="Cardiology">Cardiology</option>
                                    <option value="OPD">OPD</option>
                                    <option value="Pharmacy">Pharmacy</option>
                                    <option value="Nursing">Nursing</option>
                                    <option value="Engineering">Engineering</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-indigo-200 mb-1">Full Description</label>
                                <textarea
                                    value={newJob.description}
                                    onChange={e => setNewJob({ ...newJob, description: e.target.value })}
                                    placeholder="Responsibilities and requirements..."
                                    className="w-full h-32 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-1 focus:ring-indigo-400 focus:outline-none resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={() => setIsJobModalOpen(false)}
                                className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateJob}
                                disabled={!newJob.title || !newJob.department}
                                className="flex-1 liquid-glass-button px-6 py-3 rounded-xl font-bold shadow-lg disabled:opacity-50"
                            >
                                Post Job
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Header */}
            <div className="liquid-glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-glass-title flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-indigo-300" />
                        Talent Acquisition
                    </h2>
                    <p className="text-glass-body">Manage job postings, candidates, and AI-assisted interviews.</p>
                </div>
                <button
                    onClick={() => setIsJobModalOpen(true)}
                    className="liquid-glass-button px-6 py-2.5 rounded-xl font-medium flex items-center gap-2"
                >
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
                                        <span className="text-xs font-semibold bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 px-3 py-1 rounded-full">{job._count?.candidates || 0} Candidates</span>
                                        <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {job.status}</span>
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
                                {[
                                    { key: 'APPLIED', label: 'Applied' },
                                    { key: 'SCREENING', label: 'Screening' },
                                    { key: 'INTERVIEW', label: 'Interview' },
                                    { key: 'OFFERED', label: 'Offer' }
                                ].map((stage) => (
                                    <div key={stage.key} className="w-[280px] bg-black/20 rounded-xl p-4 border border-white/5">
                                        <h4 className="font-bold text-glass-title mb-4">{stage.label}</h4>
                                        <div className="space-y-3">
                                            {pipeline.filter(p => p.status === stage.key).map(p => (
                                                <div key={p.id} className="liquid-glass-panel p-4 rounded-xl border border-white/10 cursor-move hover:border-indigo-400/50 transition-colors">
                                                    <p className="font-semibold text-sm text-white">{p.firstName} {p.lastName}</p>
                                                    <p className="text-xs text-glass-muted mt-1 line-clamp-1">{p.job?.title}</p>
                                                    <div className="mt-3 flex gap-2">
                                                        <select
                                                            onChange={(e) => updateStatus(p.id, e.target.value)}
                                                            className="w-full text-[10px] bg-white/10 border border-white/20 rounded px-1 py-1"
                                                            value={p.status}
                                                        >
                                                            <option value="APPLIED">Applied</option>
                                                            <option value="SCREENING">Screening</option>
                                                            <option value="INTERVIEW">Interview</option>
                                                            <option value="OFFERED">Offered</option>
                                                            <option value="HIRED">Hired</option>
                                                            <option value="REJECTED">Rejected</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            ))}
                                            {pipeline.filter(p => p.status === stage.key).length === 0 && (
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

                        {/* AI Resume Screener */}
                        <div className="m-6 mt-0 p-6 bg-emerald-900/20 rounded-xl border border-emerald-400/30">
                            <h3 className="text-lg font-bold text-emerald-100 flex items-center gap-2 mb-4">
                                <Search className="w-5 h-5 text-emerald-400" /> AI Resume Screener
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                <textarea
                                    value={candidateSkills}
                                    onChange={e => setCandidateSkills(e.target.value)}
                                    placeholder="Paste candidate resume or skills here..."
                                    className="w-full h-[100px] bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-emerald-400 focus:outline-none resize-none"
                                />
                                <textarea
                                    value={jobReqs}
                                    onChange={e => setJobReqs(e.target.value)}
                                    placeholder="Paste job requirements here to match against..."
                                    className="w-full h-[100px] bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-emerald-400 focus:outline-none resize-none"
                                />
                            </div>

                            <button
                                onClick={handleScreenResume}
                                disabled={isScreening || !candidateSkills || !jobReqs}
                                className="liquid-glass-button bg-emerald-600/50 hover:bg-emerald-600 px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-50 transition w-full md:w-auto"
                            >
                                {isScreening ? 'Scanning...' : 'Run AI Screen'}
                            </button>

                            {screenResult && (
                                <div className="mt-4 p-4 bg-black/40 rounded-lg text-sm shadow-inner">
                                    <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-3">
                                        <span className="font-bold text-white">Match Confidence:</span>
                                        <span className={`font-black text-xl ${screenResult.matchScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            {screenResult.matchScore}%
                                        </span>
                                    </div>
                                    <div className="mb-2">
                                        <span className="text-white/60 font-medium block mb-1">Recommendation:</span>
                                        <span className={`px-2 py-1 text-xs font-bold rounded ${screenResult.matchScore >= 80 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                            {screenResult.recommendation}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <span className="text-emerald-400 font-medium block mb-1">Matched Skills:</span>
                                            <div className="flex flex-wrap gap-1">
                                                {screenResult.matchedSkills?.map((s: string, i: number) => (
                                                    <span key={i} className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded text-[10px] uppercase font-bold">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-rose-400 font-medium block mb-1">Missing Skills:</span>
                                            <div className="flex flex-wrap gap-1">
                                                {screenResult.keyMissingSkills?.map((s: string, i: number) => (
                                                    <span key={i} className="bg-rose-500/10 border border-rose-500/30 text-rose-200 px-2 py-0.5 rounded text-[10px] uppercase font-bold">{s}</span>
                                                ))}
                                            </div>
                                        </div>
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
