'use client';
import { API_BASE } from '@/lib/api';
import { useState, useEffect } from 'react';
import {
    BookOpen, Sparkles, PlayCircle, Award,
    CheckCircle2, Clock, Map, TrendingUp, MonitorPlay
} from 'lucide-react';

const API = `${API_BASE}/api`;
const getAuth = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function TrainingCenter() {
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const h = getAuth();
            const [recRes, enrRes] = await Promise.all([
                fetch(`${API}/training/recommendations`, { headers: h }),
                fetch(`${API}/training/my-enrollments`, { headers: h })
            ]);

            if (recRes.ok) {
                const recData = await recRes.json();
                if (recData.recommendations) setRecommendations(recData.recommendations);
            }
            if (enrRes.ok) {
                const enrData = await enrRes.json();
                if (enrData.enrollments) setEnrollments(enrData.enrollments);
            }
        } catch (e) {
            console.error('Error fetching training data:', e);
        }
        setLoading(false);
    };

    const handleEnroll = async (courseId: string, aiSuggested: boolean, matchScore: number) => {
        try {
            const res = await fetch(`${API}/training/enroll`, {
                method: 'POST',
                headers: { ...getAuth(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, aiSuggested, matchScore })
            });
            if (res.ok) {
                // Remove from recommendations and refresh enrollments
                setRecommendations(prev => prev.filter(c => c.id !== courseId));
                loadData();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdateProgress = async (enrollmentId: string, currentProgress: number) => {
        const newProgress = Math.min(currentProgress + 25, 100);
        try {
            const res = await fetch(`${API}/training/progress/${enrollmentId}`, {
                method: 'PUT',
                headers: { ...getAuth(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ progress: newProgress })
            });
            if (res.ok) {
                loadData();
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading) {
        return <div className="text-glass-muted animate-pulse p-6">Loading Training Interface...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-tight">
                    <MonitorPlay className="text-indigo-500" />
                    Medizes AI Learning Hub
                </h2>
                <p className="text-glass-muted text-sm mt-1">
                    Personalized, continuous learning paths to upgrade your skills.
                </p>
            </div>

            {/* AI Recommended Section */}
            <div>
                <h3 className="font-black text-rose-400 flex items-center gap-2 mb-4 tracking-wider uppercase text-sm border-b border-rose-500/20 pb-2">
                    <Sparkles size={16} /> AI Suggested For You
                </h3>

                {recommendations.length === 0 ? (
                    <div className="bg-black/20 border border-white/10 rounded-xl p-6 text-center text-glass-muted text-sm">
                        No new recommendations right now. You're up to date!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recommendations.map(course => (
                            <div key={course.id} className="relative group overflow-hidden bg-black/40 border border-white/10 rounded-xl hover:border-indigo-500/50 transition-all duration-300">
                                {/* AI Match Badge */}
                                {course.aiSuggested && (
                                    <div className="absolute top-0 right-0 bg-gradient-to-r from-rose-500 to-indigo-600 text-[10px] font-black uppercase tracking-wider text-white px-3 py-1 rounded-bl-xl shadow-lg">
                                        {course.aiMatchScore}% Match
                                    </div>
                                )}

                                <div className="p-5">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <BookOpen size={20} />
                                    </div>
                                    <h4 className="font-bold text-white mb-1 leading-tight">{course.title}</h4>
                                    <p className="text-xs text-glass-muted line-clamp-2 h-8">{course.description}</p>

                                    <div className="flex flex-wrap gap-1 mt-3 h-6">
                                        {course.tags.slice(0, 3).map((tag: string) => (
                                            <span key={tag} className="text-[9px] uppercase tracking-wider bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-white/70">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-white/10 flex justify-between items-center">
                                        <div className="text-xs font-bold text-glass-muted flex items-center gap-1">
                                            <Clock size={12} /> {(course.modules as any[])?.length || 0} Modules
                                        </div>
                                        <button
                                            onClick={() => handleEnroll(course.id, course.aiSuggested, course.aiMatchScore)}
                                            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-4 rounded-lg transition-colors"
                                        >
                                            Enroll
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* In Progress Enrollments */}
            <div>
                <h3 className="font-black text-emerald-400 flex items-center gap-2 mb-4 tracking-wider uppercase text-sm border-b border-emerald-500/20 pb-2">
                    <TrendingUp size={16} /> My Progress
                </h3>

                {enrollments.length === 0 ? (
                    <div className="bg-black/20 border border-white/10 rounded-xl p-6 text-center text-glass-muted text-sm">
                        You haven't enrolled in any courses yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {enrollments.map(enr => (
                            <div key={enr.id} className="bg-gradient-to-br from-black/60 to-black/20 border border-white/10 rounded-xl p-5 flex flex-col md:flex-row gap-5">
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <h4 className="font-bold text-white leading-tight mb-1">{enr.course.title}</h4>
                                        {enr.status === 'COMPLETED' ? (
                                            <span className="text-emerald-400 bg-emerald-400/10 px-2 py-1 flex items-center gap-1 rounded-md text-[10px] font-black uppercase tracking-wider">
                                                <Award size={12} /> Done
                                            </span>
                                        ) : (
                                            <span className="text-sky-400 bg-sky-400/10 px-2 py-1 flex items-center gap-1 rounded-md text-[10px] font-black uppercase tracking-wider">
                                                <PlayCircle size={12} /> Active
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-glass-muted mb-4 line-clamp-1">{enr.course.description}</p>

                                    {/* Progress Bar */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[10px] font-bold text-glass-muted">
                                            <span>Progress</span>
                                            <span className={enr.progress === 100 ? 'text-emerald-400' : 'text-white'}>{enr.progress}%</span>
                                        </div>
                                        <div className="w-full bg-white/5 rounded-full h-2 border border-white/5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end
                                                    ${enr.progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-sky-600 to-indigo-500'}`
                                                }
                                                style={{ width: `${Math.max(enr.progress, 2)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {enr.status !== 'COMPLETED' && (
                                    <div className="md:w-32 flex flex-col justify-end">
                                        <button
                                            onClick={() => handleUpdateProgress(enr.id, enr.progress)}
                                            className="w-full text-xs bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold py-2 px-3 rounded-lg flex justify-center items-center gap-2 transition-all"
                                        >
                                            <CheckCircle2 size={14} /> Resume
                                        </button>
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
