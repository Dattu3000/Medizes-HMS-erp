'use client';
import { useState } from 'react';
import { User, Users, Briefcase, BarChart3, Fingerprint } from 'lucide-react';

import EssPortal from '@/components/hr/EssPortal';
import ManagerCenter from '@/components/hr/ManagerCenter';
import StrategicDashboard from '@/components/hr/StrategicDashboard';
import TalentAcquisition from '@/components/hr/TalentAcquisition';
import OnboardingEngine from '@/components/hr/OnboardingEngine';
import TrainingCenter from '@/components/hr/TrainingCenter';
import { Rocket, MonitorPlay, Activity } from 'lucide-react';
import './styles/workforce.css';
import DemandPipeline from './components/DemandPipeline';
import BiddingLedger from './components/BiddingLedger';
import ComplianceSidebar from './components/ComplianceSidebar';

export interface Bid {
    id: string;
    shiftDetails: string;
    department: string;
    employeeName: string;
    employeeId: string;
    status: 'Safe Pass' | 'Overtime Risk' | 'Hard Block';
    fadingOut?: boolean;
}

const mockBids: Bid[] = [
    { id: 'bid-001', shiftDetails: 'Oct 24, 08:00 - 16:00', department: 'ICU', employeeName: 'Sarah Jenkins', employeeId: 'emp-101', status: 'Safe Pass' },
    { id: 'bid-002', shiftDetails: 'Oct 25, 16:00 - 00:00', department: 'ER', employeeName: 'Michael Chang', employeeId: 'emp-102', status: 'Overtime Risk' },
    { id: 'bid-003', shiftDetails: 'Oct 26, 00:00 - 08:00', department: 'NICU', employeeName: 'Emily Clark', employeeId: 'emp-103', status: 'Hard Block' },
];

export default function HRPage() {
    const [activeTab, setActiveTab] = useState<'ess' | 'manager' | 'talent' | 'executive' | 'onboarding' | 'training' | 'workforce'>('workforce');

    // State for Workforce tab
    const [bids, setBids] = useState<Bid[]>(mockBids);
    const [selectedBid, setSelectedBid] = useState<Bid | null>(null);

    const handleWorkforceAction = async (bidId: string, actionUrl: string, payload: any) => {
        setBids(prev => prev.map(b => b.id === bidId ? { ...b, fadingOut: true } : b));
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(actionUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setTimeout(() => {
                    setBids(prev => prev.filter(b => b.id !== bidId));
                    if (selectedBid?.id === bidId) setSelectedBid(null);
                }, 300);
            } else {
                setBids(prev => prev.map(b => b.id === bidId ? { ...b, fadingOut: false } : b));
            }
        } catch (error) {
            setBids(prev => prev.map(b => b.id === bidId ? { ...b, fadingOut: false } : b));
        }
    };

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

                <button
                    onClick={() => setActiveTab('onboarding')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'onboarding' ? 'liquid-glass-button shadow-lg' : 'text-glass-muted hover:bg-white/10 hover:text-white'
                        }`}
                >
                    <Rocket className="w-4 h-4" /> Onboarding Engine
                </button>

                <button
                    onClick={() => setActiveTab('training')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'training' ? 'liquid-glass-button shadow-lg' : 'text-glass-muted hover:bg-white/10 hover:text-white'
                        }`}
                >
                    <MonitorPlay className="w-4 h-4 text-indigo-400" /> AI Learning Path
                </button>

                <button
                    onClick={() => setActiveTab('workforce')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'workforce' ? 'liquid-glass-button shadow-lg' : 'text-glass-muted hover:bg-white/10 hover:text-white'
                        }`}
                >
                    <Activity className="w-4 h-4 text-emerald-400" /> Workforce (v5.1)
                </button>
            </div>

            {/* Active Content Area */}
            <div className="mt-6">
                {activeTab === 'ess' && <EssPortal />}
                {activeTab === 'manager' && <ManagerCenter />}
                {activeTab === 'talent' && <TalentAcquisition />}
                {activeTab === 'executive' && <StrategicDashboard />}
                {activeTab === 'onboarding' && <OnboardingEngine />}
                {activeTab === 'training' && <TrainingCenter />}
                {activeTab === 'workforce' && (
                    <div className="workforce-container rounded-2xl overflow-hidden mt-4">
                        <div className="workforce-col">
                            <DemandPipeline />
                        </div>
                        <div className="workforce-col">
                            <BiddingLedger bids={bids} selectedBid={selectedBid} onSelectBid={setSelectedBid} />
                        </div>
                        <div className="workforce-col">
                            <ComplianceSidebar selectedBid={selectedBid} onAction={handleWorkforceAction} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
