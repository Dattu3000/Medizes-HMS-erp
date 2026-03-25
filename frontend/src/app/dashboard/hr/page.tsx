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
        <div className="space-y-6 liquid-bg p-6 rounded-3xl min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-indigo-300 drop-shadow-sm">Human Resources (GUDHR)</h1>
                    <p className="text-glass-body font-medium mt-1">Unified Workforce & Talent Intelligence Platform</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="liquid-glass-panel p-2 rounded-2xl flex flex-wrap gap-2">
                <button
                    onClick={() => setActiveTab('ess')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'ess' ? 'liquid-glass-button shadow-lg' : 'text-glass-muted hover:bg-white/10 hover:text-white'
                        }`}
                >
                    <User className="w-4 h-4" /> Employee Hub (ESS)
                </button>

                <button
                    onClick={() => setActiveTab('manager')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'manager' ? 'liquid-glass-button shadow-lg' : 'text-glass-muted hover:bg-white/10 hover:text-white'
                        }`}
                >
                    <Users className="w-4 h-4" /> Manager Center
                </button>

                <button
                    onClick={() => setActiveTab('talent')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'talent' ? 'liquid-glass-button shadow-lg' : 'text-glass-muted hover:bg-white/10 hover:text-white'
                        }`}
                >
                    <Briefcase className="w-4 h-4" /> Talent Acquisition
                </button>

                <button
                    onClick={() => setActiveTab('executive')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'executive' ? 'liquid-glass-button shadow-lg' : 'text-glass-muted hover:bg-white/10 hover:text-white'
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
