'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, UserPlus, Building, KeyRound, CheckCircle2 } from 'lucide-react';

export default function AdminPage() {
    const [loading, setLoading] = useState(false);

    // Form fields
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        department: '',
        designation: '',
        roleId: '',
        branchId: ''
    });

    const [roles, setRoles] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [successData, setSuccessData] = useState<any>(null);

    useEffect(() => {
        fetchMetadata();
    }, []);

    const fetchMetadata = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/meta', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (res.ok) {
                setRoles(data.roles || []);
                setBranches(data.branches || []);
            }
        } catch (error) {
            console.error('Error fetching admin meta:', error);
        }
    };

    const handleCreateEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccessData(null);

        try {
            const res = await fetch('http://localhost:5000/api/admin/employees', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(form)
            });

            const data = await res.json();

            if (res.ok) {
                setSuccessData(data);
                // Reset form
                setForm({
                    firstName: '', lastName: '', email: '',
                    department: '', designation: '', roleId: form.roleId, branchId: form.branchId
                });
            } else {
                alert(data.message || 'Error creating employee');
            }
        } catch (error) {
            console.error('Error registering employee:', error);
            alert('Something went wrong. Check console.');
        }

        setLoading(false);
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <ShieldCheck className="text-indigo-600" /> Admin Control Center
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Create User Card */}
                <div className="lg:col-span-7 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-2">
                        <UserPlus size={20} className="text-indigo-500" /> Create New Employee / User
                    </h2>

                    {successData ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle2 className="text-emerald-600" size={24} />
                                        <h3 className="text-lg font-bold text-emerald-800">Account Created Successfully</h3>
                                    </div>
                                    <p className="text-emerald-700 text-sm mt-4">Provide these credentials to the user. They will be prompted to setup their account on first login.</p>

                                    <div className="bg-white p-4 rounded-lg border border-emerald-100 mt-4 font-mono shadow-sm">
                                        <div className="flex justify-between border-b border-emerald-50 pb-2 mb-2">
                                            <span className="text-slate-500">Employee ID / Login:</span>
                                            <strong className="text-slate-900">{successData.employeeId}</strong>
                                        </div>
                                        <div className="flex justify-between border-b border-emerald-50 pb-2 mb-2">
                                            <span className="text-slate-500">Temporary Password:</span>
                                            <strong className="text-rose-600 bg-rose-50 px-2 rounded tracking-widest">{successData.tempPassword}</strong>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Name:</span>
                                            <strong className="text-slate-900">{successData.employeeDetails?.firstName} {successData.employeeDetails?.lastName}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setSuccessData(null)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded shadow text-sm font-bold transition"
                                >
                                    Create Another User
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleCreateEmployee} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                                    <input required type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                                    <input required type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                    <input type="email" placeholder="Optional" className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                                </div>

                                <div className="md:col-span-2 my-2 border-t border-slate-100"></div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                                    <input type="text" placeholder="e.g. Cardiology, HR, Billing" className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
                                    <input type="text" placeholder="e.g. Senior Surgeon, Staff Nurse" className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} />
                                </div>

                                <div className="md:col-span-2 my-2 border-t border-slate-100"></div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">System Role *</label>
                                    <select required className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500" value={form.roleId} onChange={e => setForm({ ...form, roleId: e.target.value })}>
                                        <option value="">-- Select Role Level --</option>
                                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Branch *</label>
                                    <select required className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500" value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })}>
                                        <option value="">-- Select Hospital Branch --</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.location || 'HQ'})</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-md transition flex items-center gap-2">
                                    <KeyRound size={18} /> {loading ? 'Provisioning...' : 'Provision User Account'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* System Summary Card */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Building size={100} />
                        </div>
                        <h3 className="font-bold text-lg mb-1 relative z-10">System Architecture</h3>
                        <p className="text-slate-400 text-sm mb-6 relative z-10">Active Roles & Branches</p>

                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700">
                                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Roles</div>
                                <div className="text-2xl font-black">{roles.length}</div>
                            </div>
                            <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700">
                                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Branches</div>
                                <div className="text-2xl font-black">{branches.length}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Role Permissions</h3>
                        <div className="space-y-3">
                            {roles.slice(0, 5).map((role: any) => (
                                <div key={role.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                                    <span className="font-medium text-slate-700">{role.name}</span>
                                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-mono">{role.permissions?.length || 0} permits</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}
