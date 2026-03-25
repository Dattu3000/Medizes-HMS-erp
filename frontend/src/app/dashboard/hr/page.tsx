'use client';

import { useState } from 'react';
import { User, Users, Briefcase, BarChart3, Fingerprint } from 'lucide-react';
import EssPortal from '@/components/hr/EssPortal';
import ManagerCenter from '@/components/hr/ManagerCenter';
import StrategicDashboard from '@/components/hr/StrategicDashboard';
import TalentAcquisition from '@/components/hr/TalentAcquisition';

export default function HRPage() {
    const [activeTab, setActiveTab] = useState<'ess' | 'manager' | 'talent' | 'executive'>('ess');

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Human Resources (GUDHR)</h1>
                    <p className="text-slate-500 mt-1">Unified Workforce & Talent Intelligence Platform</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-1">
                <button
                    onClick={() => setActiveTab('ess')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'ess' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    <User className="w-4 h-4" /> Employee Hub (ESS)
                </button>

                <button
                    onClick={() => setActiveTab('manager')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'manager' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    <Users className="w-4 h-4" /> Manager Center
                </button>

                <button
                    onClick={() => setActiveTab('talent')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'talent' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    <Briefcase className="w-4 h-4" /> Talent Acquisition
                </button>

                <button
                    onClick={() => setActiveTab('executive')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'executive' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    <BarChart3 className="w-4 h-4" /> Executive Dashboard
                </button>
            </div>

            {/* Active Content Area */}
            <div className="mt-6">
                {activeTab === 'ess' && <EssPortal />}
                {activeTab === 'manager' && <ManagerCenter />}
                {activeTab === 'talent' && <TalentAcquisition />}
                {activeTab === 'executive' && <StrategicDashboard />}
            </div>
        </div>
    );
}
