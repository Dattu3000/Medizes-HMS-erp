'use client';

import { useState, useEffect } from 'react';
import { Rocket, UserCheck, ClipboardList, Send, CheckCircle2, Clock } from 'lucide-react';

export default function OnboardingEngine() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [template, setTemplate] = useState('STANDARD_HOSPITAL_ONBOARDING');
    const [isDeploying, setIsDeploying] = useState(false);
    const [recentWorkflows, setRecentWorkflows] = useState<any[]>([]);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/hr/employees', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) setEmployees(await res.json());
        } catch (err) { console.error(err); }
    };

    const handleDeploy = async () => {
        if (!selectedEmployee) return;
        setIsDeploying(true);
        try {
            const res = await fetch('http://localhost:5000/api/hr/onboarding/deploy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ employeeId: selectedEmployee, templateName: template })
            });
            if (res.ok) {
                alert("Workflow Deployed Successfully");
                setSelectedEmployee('');
            }
        } catch (err) { console.error(err); }
        setIsDeploying(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="liquid-glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-glass-title flex items-center gap-2">
                        <Rocket className="w-6 h-6 text-orange-400" />
                        Onboarding Engine
                    </h2>
                    <p className="text-glass-body">Orchestrate the journey from candidate to productive employee.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Deployment Panel */}
                <div className="liquid-glass-card p-8 space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-emerald-400" />
                        Deploy New Workflow
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-glass-muted mb-2">Select New Hire</label>
                            <select
                                value={selectedEmployee}
                                onChange={e => setSelectedEmployee(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-orange-400 focus:outline-none"
                            >
                                <option value="">Select an employee...</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.department})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-glass-muted mb-2">Workflow Template</label>
                            <select
                                value={template}
                                onChange={e => setTemplate(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-orange-400 focus:outline-none"
                            >
                                <option value="STANDARD_HOSPITAL_ONBOARDING">Standard Hospital Onboarding</option>
                                <option value="MEDICAL_STAFF_ONBOARDING">Medical Staff (Credentialing)</option>
                                <option value="IT_ENGINEERING_ONBOARDING">IT & Admin Onboarding</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleDeploy}
                        disabled={isDeploying || !selectedEmployee}
                        className="w-full liquid-glass-button bg-orange-600/40 hover:bg-orange-600 px-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                        {isDeploying ? 'Deploying...' : (
                            <>
                                <Send className="w-5 h-5" /> Deploy Workflow
                            </>
                        )}
                    </button>
                    <p className="text-xs text-center text-glass-muted italic">This will auto-assign IT provisioning, HR doc requests, and Manager intro tasks.</p>
                </div>

                {/* Status Tracking */}
                <div className="liquid-glass-card p-8">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                        <ClipboardList className="w-5 h-5 text-blue-400" />
                        Live Onboarding Status
                    </h3>

                    <div className="space-y-4">
                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded-lg">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-white">IT Provisioning</p>
                                    <p className="text-xs text-glass-muted">Assigned to IT Admin</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded uppercase tracking-wider">Completed</span>
                        </div>

                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/20 rounded-lg">
                                    <Clock className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-white">Background Check</p>
                                    <p className="text-xs text-glass-muted">Assigned to HR Team</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-1 rounded uppercase tracking-wider">In Progress</span>
                        </div>

                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <Clock className="w-5 h-5 text-white/40" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-white">Compliance Training</p>
                                    <p className="text-xs text-glass-muted">Assigned to Employee</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold bg-white/10 text-white/40 px-2 py-1 rounded uppercase tracking-wider">Pending</span>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10">
                        <h4 className="text-sm font-bold text-glass-body mb-4 uppercase tracking-widest">Recent Deployments</h4>
                        <div className="space-y-2">
                            {['Johnathan Wright (OPD)', 'Sarah Jenkins (Nursing)'].map((name, i) => (
                                <div key={i} className="flex justify-between text-xs py-1">
                                    <span className="text-glass-muted">{name}</span>
                                    <span className="text-white font-medium">Deployed 2d ago</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
