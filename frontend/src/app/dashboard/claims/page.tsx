'use client';
import { API_BASE } from '@/lib/api';
import { useState, useEffect } from 'react';
import { FileText, DollarSign, Activity, AlertCircle, Plus, Search, Filter, ShieldCheck, CheckCircle2, Clock, XCircle, MoreVertical } from 'lucide-react';
import './styles/claims.css';

export default function ClaimsDashboard() {
    const [claims, setClaims] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState<any>(null);

    const [newStatus, setNewStatus] = useState('');
    const [approvedAmount, setApprovedAmount] = useState('');
    const [denialReason, setDenialReason] = useState('');

    useEffect(() => {
        fetchData();
        const handleMouseMove = (e: MouseEvent) => {
            const cards = document.querySelectorAll('.metric-card');
            cards.forEach((card: any) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            });
        };
        document.addEventListener('mousemove', handleMouseMove);
        return () => document.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [claimsRes, analyticsRes] = await Promise.all([
                fetch(`${API_BASE}/api/claims`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE}/api/claims/analytics`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            
            if (claimsRes.ok) setClaims(await claimsRes.json());
            if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
        } catch (error) {
            console.error('Failed to fetch claims data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!selectedClaim) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/claims/${selectedClaim.id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: newStatus,
                    approvedAmount: newStatus === 'APPROVED' || newStatus === 'PARTIAL' ? approvedAmount : undefined,
                    denialReason: newStatus === 'DENIED' ? denialReason : undefined
                })
            });

            if (res.ok) {
                fetchData();
                setIsModalOpen(false);
            }
        } catch (error) {
            console.error('Failed to update claim', error);
        }
    };

    const openModal = (claim: any) => {
        setSelectedClaim(claim);
        setNewStatus(claim.status);
        setApprovedAmount(claim.approvedAmount || claim.requestedAmount || '');
        setDenialReason(claim.denialReason || '');
        setIsModalOpen(true);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
    };

    if (loading) return <div className="p-8 text-slate-400">Loading Claims Data...</div>;

    const columns = [
        { id: 'DRAFT', title: 'Draft / Pre-Auth', icon: <FileText size={16} /> },
        { id: 'SUBMITTED', title: 'Submitted to TPA', icon: <Activity size={16} /> },
        { id: 'IN_PROCESS', title: 'In Process', icon: <Clock size={16} /> },
        { id: 'PARTIAL', title: 'Partially Paid', icon: <CheckCircle2 size={16} className="text-purple-400" /> },
        { id: 'APPROVED', title: 'Approved & Paid', icon: <ShieldCheck size={16} className="text-emerald-400" /> },
        { id: 'DENIED', title: 'Denied', icon: <XCircle size={16} className="text-red-400" /> },
    ];

    return (
        <div className="claims-dashboard text-white">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ShieldCheck className="text-blue-500" /> Insurance Claims & TPA
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Manage revenue cycle and third-party administrator workflows</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 bg-[#1e293b] border border-slate-700 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition">
                        <Filter size={16} /> Filter
                    </button>
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-blue-500/20">
                        <Plus size={16} /> New Claim
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="metric-card bg-[#111827] border border-[#1f2937] p-5 rounded-xl">
                    <div className="flex items-center gap-3 mb-2 relative z-10">
                        <div className="p-2 bg-blue-500/10 rounded-lg"><DollarSign size={20} className="text-blue-400" /></div>
                        <h3 className="text-slate-400 text-sm font-medium">Total Billed</h3>
                    </div>
                    <div className="text-2xl font-bold relative z-10">{formatCurrency(analytics?.totalBilled)}</div>
                </div>
                <div className="metric-card bg-[#111827] border border-[#1f2937] p-5 rounded-xl">
                    <div className="flex items-center gap-3 mb-2 relative z-10">
                        <div className="p-2 bg-emerald-500/10 rounded-lg"><CheckCircle2 size={20} className="text-emerald-400" /></div>
                        <h3 className="text-slate-400 text-sm font-medium">Total Approved</h3>
                    </div>
                    <div className="text-2xl font-bold relative z-10">{formatCurrency(analytics?.totalApprovedAmount)}</div>
                </div>
                <div className="metric-card bg-[#111827] border border-[#1f2937] p-5 rounded-xl">
                    <div className="flex items-center gap-3 mb-2 relative z-10">
                        <div className="p-2 bg-red-500/10 rounded-lg"><AlertCircle size={20} className="text-red-400" /></div>
                        <h3 className="text-slate-400 text-sm font-medium">Denial Rate</h3>
                    </div>
                    <div className="text-2xl font-bold relative z-10">{analytics?.denialRate?.toFixed(1)}%</div>
                </div>
                <div className="metric-card bg-[#111827] border border-[#1f2937] p-5 rounded-xl">
                    <div className="flex items-center gap-3 mb-2 relative z-10">
                        <div className="p-2 bg-purple-500/10 rounded-lg"><Activity size={20} className="text-purple-400" /></div>
                        <h3 className="text-slate-400 text-sm font-medium">Avg Days in AR</h3>
                    </div>
                    <div className="text-2xl font-bold relative z-10">{analytics?.avgDaysInAR?.toFixed(1) || 0} <span className="text-sm font-normal text-slate-500">days</span></div>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="claims-kanban-board">
                {columns.map(col => (
                    <div key={col.id} className="kanban-column">
                        <div className="kanban-column-header">
                            <div className="flex items-center gap-2">
                                {col.icon}
                                <span className="text-sm">{col.title}</span>
                            </div>
                            <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full">
                                {analytics?.statusCounts?.[col.id] || 0}
                            </span>
                        </div>
                        <div className="kanban-cards-container">
                            {claims.filter(c => c.status === col.id).map(claim => (
                                <div key={claim.id} className="kanban-card" onClick={() => openModal(claim)}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`status-badge status-${claim.status.toLowerCase()}`}>{claim.status}</span>
                                        <MoreVertical size={14} className="text-slate-500" />
                                    </div>
                                    <div className="text-sm font-medium mb-1">{claim.claimNumber}</div>
                                    <div className="text-xs text-slate-400 mb-3">{claim.provider?.name || 'Unknown TPA'}</div>
                                    
                                    <div className="flex justify-between items-end mt-4 pt-3 border-t border-slate-700/50">
                                        <div className="text-xs">
                                            <div className="text-slate-500">Requested</div>
                                            <div className="font-semibold">{formatCurrency(claim.requestedAmount)}</div>
                                        </div>
                                        <div className="text-xs text-right">
                                            <div className="text-slate-500">Patient</div>
                                            <div className="font-medium text-slate-300 truncate max-w-[100px]">{claim.patient?.firstName} {claim.patient?.lastName}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {isModalOpen && selectedClaim && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-5 border-b border-[#1e293b] flex justify-between items-center bg-[#111827]">
                            <h2 className="font-semibold flex items-center gap-2"><FileText size={18} className="text-blue-500" /> Claim Details: {selectedClaim.claimNumber}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><XCircle size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-slate-500 mb-1">Provider (TPA)</div>
                                    <div className="font-medium">{selectedClaim.provider?.name}</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 mb-1">Patient</div>
                                    <div className="font-medium">{selectedClaim.patient?.firstName} {selectedClaim.patient?.lastName}</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 mb-1">Requested Amount</div>
                                    <div className="font-medium">{formatCurrency(selectedClaim.requestedAmount)}</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 mb-1">Bill Reference</div>
                                    <div className="font-medium text-blue-400">{selectedClaim.bill?.billNo || 'N/A'}</div>
                                </div>
                            </div>

                            <hr className="border-[#1e293b] my-2" />

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Update Status</label>
                                <select 
                                    className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                >
                                    <option value="DRAFT">Draft / Pre-Auth</option>
                                    <option value="SUBMITTED">Submitted to TPA</option>
                                    <option value="IN_PROCESS">In Process</option>
                                    <option value="PARTIAL">Partially Paid</option>
                                    <option value="APPROVED">Approved & Paid</option>
                                    <option value="DENIED">Denied</option>
                                </select>
                            </div>

                            {(newStatus === 'APPROVED' || newStatus === 'PARTIAL') && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Approved Amount (INR)</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                        value={approvedAmount}
                                        onChange={(e) => setApprovedAmount(e.target.value)}
                                    />
                                </div>
                            )}

                            {newStatus === 'DENIED' && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Denial Reason</label>
                                    <textarea 
                                        className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 h-24 resize-none"
                                        value={denialReason}
                                        onChange={(e) => setDenialReason(e.target.value)}
                                        placeholder="e.g., Procedure not covered under active policy..."
                                    />
                                </div>
                            )}

                            <div className="pt-4 flex justify-end gap-3">
                                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1e293b] transition">Cancel</button>
                                <button onClick={handleUpdateStatus} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-blue-500/20">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
