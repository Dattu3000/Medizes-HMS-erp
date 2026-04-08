'use client';

import { useState, useEffect } from 'react';
import {
    RefreshCcw, ExternalLink, UserCircle, ChevronRight, CheckCircle2, FlaskConical
} from 'lucide-react';

export default function LabOrderManagement() {
    const [activeTab, setActiveTab] = useState('pending');
    const [orders, setOrders] = useState<any[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [resultText, setResultText] = useState("");
    const [processing, setProcessing] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch('/api/lab/orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
                if (data.length > 0) setSelectedOrder(data[0]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const handleCompleteOrder = async () => {
        if (!selectedOrder) return;
        setProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/lab/order/${selectedOrder.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'RESULT_ENTERED',
                    resultText
                })
            });

            if (res.ok) {
                setOrders(orders.filter(o => o.id !== selectedOrder.id));
                setSelectedOrder(null);
                setResultText("");
                alert("Lab Result saved successfully.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="p-8 h-full flex flex-col max-w-7xl mx-auto">

            {/* Header & User Profile */}
            <div className="mb-6">
                <h2 className="text-[24px] font-bold text-gray-50 uppercase tracking-tight mb-6 flex items-center gap-3">
                    <FlaskConical className="text-emerald-500" /> LAB ORDER MANAGEMENT
                </h2>

                <div className="bg-[#1e293b] rounded-[16px] p-4 flex items-center justify-between border border-slate-800 cursor-pointer hover:bg-slate-800 shadow-xl transition group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-400">
                            <img src="https://i.pravatar.cc/150?img=5" alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h3 className="text-gray-50 font-bold text-[15px]">Dr. Emma Dubois</h3>
                            <p className="text-gray-400 text-[13px]">Pathology & Diagnostic Results</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs & Controls */}
            <div className="flex items-center justify-between border-b border-slate-800 mb-8 pb-1">
                <div className="flex gap-8">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`font-semibold text-[13px] tracking-wide pb-3 px-2 transition border-b-[3px] ${activeTab === 'pending' ? 'text-gray-50 border-emerald-500' : 'text-gray-400 hover:text-gray-200 border-transparent'
                            }`}
                    >
                        PENDING ORDERS ({orders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('progress')}
                        className={`font-semibold text-[13px] tracking-wide pb-3 px-2 transition border-b-[3px] ${activeTab === 'progress' ? 'text-gray-50 border-emerald-500' : 'text-gray-400 hover:text-gray-200 border-transparent'
                            }`}
                    >
                        IN PROGRESS (2)
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`font-semibold text-[13px] tracking-wide pb-3 px-2 transition border-b-[3px] ${activeTab === 'completed' ? 'text-gray-50 border-emerald-500' : 'text-gray-400 hover:text-gray-200 border-transparent'
                            }`}
                    >
                        COMPLETED (15)
                    </button>
                </div>
                <div className="flex items-center gap-6 pb-2 text-gray-400 text-sm font-medium">
                    <button className="flex items-center gap-2 hover:text-white transition">
                        <RefreshCcw size={16} /> Refresh
                    </button>
                </div>
            </div>

            {/* Main Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">

                {/* Left side: Orders Table */}
                <div className="lg:col-span-8">
                    <div className="bg-[#1e293b] rounded-[16px] overflow-hidden border border-slate-800 h-full shadow-2xl">
                        <table className="w-full text-left text-[13px] text-gray-300 relative">
                            <thead className="bg-[#0f172a] text-gray-400 font-semibold sticky top-0">
                                <tr>
                                    <th className="font-medium px-4 py-4 pb-3">Order ID / Patient</th>
                                    <th className="font-medium px-4 py-4 pb-3">Test Request</th>
                                    <th className="font-medium px-4 py-4 pb-3 text-right">Order Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {orders.map((order, idx) => (
                                    <tr
                                        key={order.id}
                                        onClick={() => setSelectedOrder(order)}
                                        className={`transition cursor-pointer ${selectedOrder?.id === order.id ? 'bg-slate-800 border-l-[3px] border-l-emerald-500' : 'hover:bg-slate-800 border-l-[3px] border-l-transparent'
                                            }`}
                                    >
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-gray-50 flex items-center gap-2">
                                                    {order.id.slice(0, 12)}...
                                                </span>
                                                <div className="text-gray-400 flex items-center gap-2 text-[12px]"><UserCircle size={14} className="text-gray-500" /> {order.patient ? `${order.patient.firstName} ${order.patient.lastName}` : 'Unknown Patient'}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="font-medium text-gray-200">{order.testName}</div>
                                            <div className="text-[12px] text-emerald-400 mt-1">{order.visit?.doctor ? `Dr. ${order.visit.doctor.lastName}` : 'N/A'} • {order.priority || 'Routine'} Pr.</div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <span className="text-gray-300 font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right side: Actions & Details */}
                <div className="lg:col-span-4 flex flex-col gap-6">

                    {/* ENTRY ACTIONS */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-[13px] tracking-widest text-gray-50">SELECTED ORDER</h3>
                            <div className="flex gap-1">
                                <div className="w-1 h-1 rounded-full bg-gray-500"></div><div className="w-1 h-1 rounded-full bg-gray-500"></div><div className="w-1 h-1 rounded-full bg-gray-500"></div>
                            </div>
                        </div>

                        {selectedOrder && (
                            <div className="bg-white rounded-[16px] p-4 text-slate-800 shadow-xl">
                                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                                        {selectedOrder.patient?.firstName?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-[15px]">{selectedOrder.patient ? `${selectedOrder.patient.firstName} ${selectedOrder.patient.lastName}` : 'Unknown Patient'}</div>
                                        <div className="text-[12px] text-gray-500 mt-0.5">{selectedOrder.id.slice(0, 15)}... • {selectedOrder.priority || 'Routine'} Priority</div>
                                    </div>
                                </div>
                                <div className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-[8px] text-[13px] font-semibold flex items-center justify-between mb-2">
                                    {selectedOrder.testName}
                                    <FlaskConical size={16} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RESULTS EDITOR */}
                    <div className="flex-1">
                        <h3 className="font-bold text-[13px] tracking-widest text-gray-50 mb-4">CLINICAL RESULTS</h3>

                        <div className="bg-white rounded-[16px] p-4 text-slate-800 h-full flex flex-col shadow-2xl relative overflow-hidden">
                            {/* Overlay if no order selected */}
                            {!selectedOrder && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                                    <span className="font-semibold text-gray-500 text-sm">Select an order first</span>
                                </div>
                            )}

                            <div className="p-1">
                                <select className="w-full mt-2 p-3 bg-white border border-gray-200 rounded-[8px] text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer">
                                    <option>Standard Lab Report Format</option>
                                    <option>Detailed Breakdown</option>
                                    <option>Abnormalities Only</option>
                                </select>
                                <div className="pointer-events-none absolute right-[45px] mt-[-28px] text-gray-400">
                                    ↕
                                </div>
                            </div>

                            <div className="flex-1 mt-4">
                                <textarea
                                    value={resultText}
                                    onChange={(e) => setResultText(e.target.value)}
                                    className="w-full h-[180px] p-4 bg-gray-50 border border-gray-200 rounded-[8px] text-sm text-gray-700 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner"
                                    placeholder="Enter clinical lab measurements and conclusions here..."
                                ></textarea>
                            </div>

                            <div className="mt-4 pb-2">
                                <button
                                    onClick={handleCompleteOrder}
                                    disabled={processing || !resultText}
                                    className="w-full bg-[#1eab89] hover:bg-[#189173] disabled:opacity-50 text-white font-bold py-3.5 rounded-[8px] transition shadow-md flex items-center justify-center gap-2"
                                >
                                    {processing ? 'SAVING...' : 'MARK AS COMPLETED'}
                                </button>
                            </div>

                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
}
