'use client';

import { useState, useEffect } from 'react';
import {
    Calendar, RefreshCcw, Bell, ChevronRight, UserCircle, Activity, Save
} from 'lucide-react';

export default function DoctorEHRPage() {
    const [activeTab, setActiveTab] = useState('Visits');
    const [visits, setVisits] = useState<any[]>([]);
    const [selectedVisit, setSelectedVisit] = useState<any | null>(null);
    const [noteContent, setNoteContent] = useState("");
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadVisits = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch('/api/patients/ehr/visits', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setVisits(data);
                if (data.length > 0) {
                    setSelectedVisit(data[0]);
                    setNoteContent(data[0].notes || "");
                }
            }
        } catch (error) {
            console.error("Failed to load EHR visits", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVisits();
    }, []);

    const handleSaveNote = async () => {
        if (!selectedVisit) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/patients/ehr/note/${selectedVisit.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ notes: noteContent, status: 'COMPLETED' })
            });

            if (res.ok) {
                setSaved(true);
                // Remove from queue or just show saved
                setVisits(visits.filter(v => v.id !== selectedVisit.id));
                setTimeout(() => {
                    setSaved(false);
                    setSelectedVisit(null);
                    setNoteContent("");
                }, 2000);
            }
        } catch (error) {
            console.error("Failed to save note", error);
        }
    };

    return (
        <div className="p-8 h-full flex flex-col pt-0 max-w-7xl mx-auto">

            {/* Header & User Profile */}
            <div className="mb-6">
                <h2 className="text-[24px] font-bold text-gray-50 uppercase tracking-tight mb-6">CLINICAL PERSONNEL: DOCTOR'S EHR VIEW</h2>

                <div className="bg-[#1e293b] rounded-[16px] p-4 flex items-center justify-between border border-slate-800 cursor-pointer hover:bg-slate-800 transition group shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-400">
                            <img src="https://i.pravatar.cc/150?img=9" alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h3 className="text-gray-50 font-bold text-[15px]">Sophia Chen <span className="text-gray-400 font-normal ml-2">DOB: 17/03/1988</span></h3>
                            <p className="text-gray-400 text-[13px]">Patient ID: HMS-247-890</p>
                        </div>
                    </div>
                    <div className="text-gray-500 group-hover:text-gray-300 transition">
                        <ChevronRight size={20} />
                    </div>
                </div>
            </div>

            {/* Tabs & Controls */}
            <div className="flex items-center justify-between border-b border-slate-800 mb-6 pb-1">
                <div className="flex gap-8">
                    {['Vitals', 'Medications', 'Lab Results', 'History', 'Clinical Notes'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`font-semibold text-[13px] tracking-wide pb-3 px-2 transition border-b-[3px] ${activeTab === tab ? 'text-gray-50 border-emerald-500' : 'text-gray-400 hover:text-gray-200 border-transparent'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-6 pb-2 text-gray-400">
                    <Calendar size={16} className="cursor-pointer hover:text-white" />
                    <RefreshCcw size={16} className="cursor-pointer hover:text-white" />
                    <Bell size={16} className="cursor-pointer hover:text-white" />
                </div>
            </div>

            {/* Main Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">

                {/* Left side: Hybrid Table/Details View */}
                <div className="lg:col-span-8 flex gap-2 h-full min-h-[500px]">

                    {/* Vitals / Selection List */}
                    <div className="flex-1 bg-white rounded-l-[16px] overflow-hidden flex flex-col shadow-2xl">
                        <div className="flex justify-between items-center bg-gray-50 p-3 border-b border-gray-200 text-sm font-semibold text-gray-500">
                            <span>{activeTab} Log</span>
                            <span>Status</span>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-2">
                            {visits.map(v => (
                                <div
                                    key={v.id}
                                    onClick={() => {
                                        setSelectedVisit(v);
                                        setNoteContent(v.notes || "");
                                    }}
                                    className={`flex justify-between items-center p-3 rounded-lg cursor-pointer text-sm mb-1 transition-colors ${selectedVisit?.id === v.id ? 'bg-teal-50 border border-teal-100 relative' : 'hover:bg-gray-50'
                                        }`}
                                >
                                    {selectedVisit?.id === v.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500 rounded-l-lg"></div>
                                    )}
                                    <span className="font-bold text-gray-700 flex items-center gap-2">
                                        <span className="text-gray-400 w-4 text-center">
                                            <UserCircle size={14} className="text-teal-600" />
                                        </span> {v.patient?.firstName} {v.patient?.lastName}
                                    </span>
                                    <span className={`font-medium text-gray-500`}>
                                        {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right View / Editor inside Left Col */}
                    <div className="flex-1 bg-white rounded-r-[16px] overflow-hidden flex flex-col shadow-2xl border-l border-gray-200 p-2">
                        <div className="p-1 mb-2">
                            <select className="w-full p-3 bg-white border border-gray-200 rounded-[8px] text-sm font-medium text-gray-700 focus:outline-none appearance-none shadow-sm cursor-pointer">
                                <option>Dr. Lee, Oct 26, 2024</option>
                                <option>Dr. Smith, Sep 15, 2024</option>
                            </select>
                            <div className="pointer-events-none absolute relative right-4 mt-[-28px] text-gray-400 text-right">
                                ↕
                            </div>
                        </div>

                        <div className="flex-1 bg-white rounded-[8px] border border-gray-200 relative flex flex-col">
                            {/* Editor Sidebar marks */}
                            <div className="absolute left-2 top-4 bottom-4 w-0.5 bg-gray-200 flex flex-col gap-4 items-center pt-2">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                <div className="w-1.5 h-6 bg-gray-300 rounded-full mt-4"></div>
                            </div>
                            <div className="pl-6 pt-5 pr-4 flex-1 flex flex-col">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold text-[13px] text-slate-800">Clinical Notes Editor</h4>
                                    {saved && <span className="text-xs text-emerald-500 font-bold bg-emerald-50 px-2 py-1 rounded">Saved!</span>}
                                </div>
                                <textarea
                                    className="w-full flex-1 text-[13px] text-gray-600 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded p-2"
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                    placeholder="Enter clinical notes here..."
                                />
                            </div>
                        </div>

                        <div className="p-1 mt-2">
                            <button
                                onClick={handleSaveNote}
                                className="w-full bg-[#1e293b] hover:bg-[#0f172a] text-white p-3 rounded-[8px] text-sm font-bold flex justify-center items-center gap-2 transition"
                            >
                                <Save size={16} /> Save Notes to EHR
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right side: Summary & Quick Actions */}
                <div className="lg:col-span-4 flex flex-col gap-6">

                    {/* QUICK ACTIONS */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-[13px] tracking-widest text-gray-50">QUICK ACTIONS</h3>
                            <div className="flex gap-1">
                                <div className="w-1 h-1 rounded-full bg-gray-500"></div><div className="w-1 h-1 rounded-full bg-gray-500"></div><div className="w-1 h-1 rounded-full bg-gray-500"></div>
                            </div>
                        </div>
                        <button className="w-full bg-[#35a79c] hover:bg-[#2b8980] text-white font-bold py-4 rounded-[12px] flex items-center justify-center gap-2 transition text-sm tracking-wide shadow-lg">
                            <Activity size={18} /> Order New Lab Test
                        </button>
                    </div>

                    {/* Vitals Summary Card */}
                    <div>
                        <h3 className="font-bold text-[13px] tracking-widest text-gray-50 mb-3">Today's Vitals</h3>
                        <div className="bg-white rounded-[12px] p-5 text-slate-800 grid grid-cols-3 gap-2 py-6">
                            <div>
                                <div className="text-[14px] font-semibold text-gray-800 mb-1">BP: 120/80</div>
                                <div className="text-[14px] font-semibold text-gray-800">HR: 72</div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="text-[12px] text-gray-500 mb-1">Temp</div>
                                <div className="text-[14px] font-semibold text-gray-800">98.6°F</div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="text-[12px] text-gray-500 mb-1">Status</div>
                                <div className="text-[14px] font-semibold text-emerald-600">Stable</div>
                            </div>
                        </div>
                    </div>

                    {/* Medications List */}
                    <div className="flex-1">
                        <h3 className="font-bold text-[13px] tracking-widest text-gray-50 mb-3">Active Medications</h3>

                        <div className="bg-white rounded-[12px] overflow-hidden">
                            {[
                                { id: 1, name: 'Amlodipine 5mg', dosage: '1 tablet daily' },
                                { id: 2, name: 'Metformin 500mg', dosage: 'Twice daily with meals' },
                                { id: 3, name: 'Atorvastatin 20mg', dosage: 'At bedtime' },
                            ].map(med => (
                                <div key={med.id} className="flex justify-between items-center bg-gray-50 px-4 py-3.5 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition">
                                    <div>
                                        <div className="text-[13px] font-medium text-gray-700">{med.name}</div>
                                        <div className="text-[11px] text-gray-500">{med.dosage}</div>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-400" />
                                </div>
                            ))}
                            <div className="flex justify-center items-center bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 text-blue-500 text-xs font-bold uppercase transition">
                                + Add Medication
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
}
