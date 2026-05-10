'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/api';
import {
    Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp,
    MessageSquare, Users, Settings, Activity, HeartPulse, ShieldAlert,
    CheckCircle2, FileText, FileUp, List
} from 'lucide-react';

const API = `${API_BASE}/api`;

function getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
}

function apiFetch(path: string, opts: RequestInit = {}) {
    return fetch(`${API}${path}`, {
        ...opts,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`,
            ...opts.headers
        }
    });
}

export default function TelemedVideoRoom() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.sessionId as string;

    const [sessionData, setSessionData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    // Media controls
    const [micOn, setMicOn] = useState(true);
    const [videoOn, setVideoOn] = useState(true);
    const [screenShared, setScreenShared] = useState(false);
    
    // UI state
    const [sidebarTab, setSidebarTab] = useState<'chat'|'vitals'|'notes'>('vitals');
    const [ending, setEnding] = useState(false);
    
    // Notes
    const [notes, setNotes] = useState('');

    useEffect(() => {
        // We find the visit that matches this meeting link, but since we didn't pass visitId in URL
        // we might just load mock patient data if we can't find it directly by sessionId.
        // In a real app, sessionId maps to the meeting in DB. Let's just simulate connection.
        setTimeout(() => {
            setSessionData({
                patientName: "Alex Mercer",
                age: 32,
                gender: "M",
                chiefComplaint: "Persistent dry cough, mild fever.",
                vitals: {
                    spo2: 96,
                    hr: 82,
                    temp: 99.1,
                    bp: '120/80'
                }
            });
            setLoading(false);
        }, 1500);
    }, [sessionId]);

    const handleEndSession = async () => {
        setEnding(true);
        // Note: in a fully linked flow, we would call POST /api/telemed/session/:visitId/end
        // For the UI demo, we simulate it and route back to EHR
        setTimeout(() => {
            router.push('/dashboard/ehr');
        }, 1000);
    };

    if (loading) {
        return (
            <div className="h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-gray-300 font-semibold tracking-wide">Connecting to Virtual Room...</h2>
                <p className="text-gray-500 text-sm mt-2">Establishing secure WebRTC connection</p>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-[#0a0a0a] flex overflow-hidden">
            
            {/* Main Video Area */}
            <div className="flex-1 flex flex-col relative">
                {/* Top Bar overlay */}
                <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10 bg-gradient-to-b from-black/80 to-transparent">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="bg-red-500 h-2 w-2 rounded-full animate-pulse"></div>
                            <span className="text-white font-semibold tracking-wide bg-black/40 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 text-sm">
                                04:23
                            </span>
                        </div>
                        <h2 className="text-white text-xl font-bold mt-2 text-shadow-sm">Consultation: {sessionData.patientName}</h2>
                        <p className="text-gray-300 text-sm">{sessionData.age}Y {sessionData.gender} | {sessionData.chiefComplaint}</p>
                    </div>
                    <div className="flex gap-2">
                        <span className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 backdrop-blur-md">
                            <CheckCircle2 size={12} /> Secure E2E
                        </span>
                        <span className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 backdrop-blur-md">
                            <Activity size={12} /> 64ms Ping
                        </span>
                    </div>
                </div>

                {/* Video Grid */}
                <div className="flex-1 p-4 flex items-center justify-center gap-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                    
                    {/* Patient Video (Large) */}
                    <div className="relative w-full max-w-4xl aspect-video bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 shadow-2xl ring-1 ring-white/5">
                        {/* Placeholder for actual WebRTC remote stream */}
                        <img 
                            src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=1200&h=800" 
                            alt="Patient Camera" 
                            className="w-full h-full object-cover opacity-80"
                        />
                        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                AM
                            </div>
                            <div>
                                <div className="text-white font-semibold text-sm">{sessionData.patientName}</div>
                                <div className="text-emerald-400 text-xs flex items-center gap-1"><Mic size={10}/> Audio Receiving</div>
                            </div>
                        </div>
                    </div>

                    {/* Doctor Self-View (Floating/Small) */}
                    <div className="absolute bottom-24 right-8 w-64 aspect-video bg-gray-900 rounded-2xl overflow-hidden border-2 border-indigo-500/50 shadow-2xl">
                        {videoOn ? (
                            <img 
                                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=600&h=400" 
                                alt="Self Camera" 
                                className="w-full h-full object-cover scale-110"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                                    DR
                                </div>
                            </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-white text-xs border border-white/10">
                            You (Dr. Smith)
                        </div>
                    </div>
                </div>

                {/* Control Bar */}
                <div className="h-20 bg-[#111] border-t border-white/5 flex items-center justify-center gap-4 px-6 z-20">
                    <button 
                        onClick={() => setMicOn(!micOn)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${micOn ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                    >
                        {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                    </button>
                    
                    <button 
                        onClick={() => setVideoOn(!videoOn)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${videoOn ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                    >
                        {videoOn ? <Video size={20} /> : <VideoOff size={20} />}
                    </button>

                    <button 
                        onClick={() => setScreenShared(!screenShared)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${screenShared ? 'bg-indigo-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                    >
                        <MonitorUp size={20} />
                    </button>

                    <div className="w-px h-8 bg-gray-800 mx-2"></div>

                    <button 
                        onClick={handleEndSession}
                        disabled={ending}
                        className="h-12 px-6 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] disabled:opacity-50"
                    >
                        <PhoneOff size={20} /> {ending ? 'Ending...' : 'End Consultation'}
                    </button>
                </div>
            </div>

            {/* Right Sidebar (Clinical Context) */}
            <div className="w-80 bg-[#111827] border-l border-white/5 flex flex-col z-20 shadow-2xl">
                <div className="flex border-b border-white/5 text-sm font-semibold">
                    <button 
                        onClick={() => setSidebarTab('vitals')}
                        className={`flex-1 py-4 text-center transition-colors ${sidebarTab === 'vitals' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/5' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Vitals
                    </button>
                    <button 
                        onClick={() => setSidebarTab('notes')}
                        className={`flex-1 py-4 text-center transition-colors ${sidebarTab === 'notes' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/5' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Notes
                    </button>
                    <button 
                        onClick={() => setSidebarTab('chat')}
                        className={`flex-1 py-4 text-center transition-colors ${sidebarTab === 'chat' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/5' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Chat
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    
                    {sidebarTab === 'vitals' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Activity size={16} className="text-emerald-400"/>
                                <h3 className="text-gray-200 font-bold uppercase tracking-wider text-xs">Live Device Sync</h3>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                {/* SpO2 */}
                                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/10 rounded-bl-3xl"></div>
                                    <span className="text-gray-500 text-xs font-bold uppercase">SpO2</span>
                                    <div className="flex items-end gap-1 mt-2">
                                        <span className="text-2xl font-bold text-gray-100">{sessionData.vitals.spo2}</span>
                                        <span className="text-gray-500 text-xs mb-1">%</span>
                                    </div>
                                    <div className="w-full h-1 bg-gray-800 rounded-full mt-3 overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[96%]"></div>
                                    </div>
                                </div>
                                
                                {/* Heart Rate */}
                                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-12 h-12 bg-red-500/10 rounded-bl-3xl"></div>
                                    <span className="text-gray-500 text-xs font-bold uppercase">Heart Rate</span>
                                    <div className="flex items-end gap-1 mt-2">
                                        <span className="text-2xl font-bold text-gray-100">{sessionData.vitals.hr}</span>
                                        <span className="text-gray-500 text-xs mb-1">bpm</span>
                                    </div>
                                    <HeartPulse size={16} className="text-red-500 absolute bottom-4 right-4 animate-pulse"/>
                                </div>
                                
                                {/* BP */}
                                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col col-span-2 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 rounded-bl-3xl"></div>
                                    <span className="text-gray-500 text-xs font-bold uppercase">Blood Pressure</span>
                                    <div className="flex items-end gap-1 mt-2">
                                        <span className="text-3xl font-bold text-gray-100">{sessionData.vitals.bp}</span>
                                        <span className="text-gray-500 text-xs mb-1">mmHg</span>
                                    </div>
                                </div>
                            </div>

                            {sessionData.vitals.spo2 < 92 && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex gap-3 mt-4">
                                    <ShieldAlert size={20} className="text-red-400 shrink-0"/>
                                    <div className="text-xs text-red-300">
                                        <span className="font-bold">EWS ALERT:</span> SpO2 dropped below 92%. Protocol suggests asking patient to breathe deeply.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {sidebarTab === 'notes' && (
                        <div className="h-full flex flex-col">
                            <div className="flex items-center gap-2 mb-3">
                                <FileText size={16} className="text-indigo-400"/>
                                <h3 className="text-gray-200 font-bold uppercase tracking-wider text-xs">Consultation Notes</h3>
                            </div>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Type your observations here..."
                                className="flex-1 w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-sm text-gray-300 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            ></textarea>
                            <button className="mt-3 w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm font-semibold transition">
                                Save to EHR
                            </button>
                        </div>
                    )}

                    {sidebarTab === 'chat' && (
                        <div className="h-full flex flex-col">
                            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                                <div className="flex flex-col gap-1">
                                    <div className="text-[10px] text-gray-500 text-center uppercase tracking-wider my-2">Session Started</div>
                                    <div className="bg-gray-800 rounded-tr-xl rounded-br-xl rounded-bl-xl p-3 text-sm text-gray-300 self-start max-w-[85%] border border-gray-700">
                                        Doctor, I uploaded my recent lab reports.
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <div className="bg-indigo-600 rounded-tl-xl rounded-br-xl rounded-bl-xl p-3 text-sm text-white self-end max-w-[85%]">
                                        Thanks Alex, I'll pull them up right now.
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl p-1 pr-2">
                                <input 
                                    type="text" 
                                    placeholder="Type message..." 
                                    className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-300 focus:outline-none"
                                />
                                <button className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700">
                                    <FileUp size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #374151;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
