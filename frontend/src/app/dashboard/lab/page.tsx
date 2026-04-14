'use client';

import { useState, useEffect } from 'react';
import {
    RefreshCcw, UserCircle, FlaskConical, CheckCircle2, Play, Box
} from 'lucide-react';

export default function LabOrderManagement() {
    const [activeTab, setActiveTab] = useState('pending');
    const [orders, setOrders] = useState<any[]>([]);
    const [catalog, setCatalog] = useState<any[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

    // Legacy results
    const [resultText, setResultText] = useState("");

    // Dynamic array results
    const [resultsPayload, setResultsPayload] = useState<Record<string, number>>({});

    const [processing, setProcessing] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadOrdersAndCatalog = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const [ordersRes, catalogRes] = await Promise.all([
                fetch('http://localhost:5000/api/lab/orders', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:5000/api/lab/catalog', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (ordersRes.ok && catalogRes.ok) {
                const ordersData = await ordersRes.json();
                const catalogData = await catalogRes.json();
                setOrders(ordersData);
                setCatalog(catalogData);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrdersAndCatalog();
    }, []);

    const filteredOrders = orders.filter(o => {
        if (activeTab === 'pending') return o.sampleStatus === 'PENDING';
        if (activeTab === 'collected') return o.sampleStatus === 'COLLECTED';
        if (activeTab === 'analysis') return o.sampleStatus === 'IN_ANALYSIS' && o.status !== 'RESULT_ENTERED';
        if (activeTab === 'completed') return o.status === 'RESULT_ENTERED';
        return true;
    });

    const handleUpdateSample = async (newSampleStatus: string) => {
        if (!selectedOrder) return;
        setProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/lab/order/${selectedOrder.id}/sample`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sampleStatus: newSampleStatus })
            });

            if (res.ok) {
                const updated = await res.json();
                setOrders(orders.map(o => o.id === selectedOrder.id ? updated.order : o));
                setSelectedOrder(updated.order);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    const handleCompleteOrder = async (catalogEntry: any) => {
        if (!selectedOrder) return;
        setProcessing(true);
        try {
            const token = localStorage.getItem('token');

            // Format results payload if parameters exist
            let formattedPayload = undefined;
            if (catalogEntry?.parameters && Array.isArray(catalogEntry.parameters)) {
                formattedPayload = catalogEntry.parameters.map((p: any) => {
                    const val = resultsPayload[p.name];
                    const isAbnormal = val < (p.criticalMin || 0) || val > (p.criticalMax || 9999);
                    return {
                        parameter: p.name,
                        value: val,
                        unit: p.unit,
                        range: p.range,
                        isAbnormal
                    };
                });
            }

            const res = await fetch(`http://localhost:5000/api/lab/order/${selectedOrder.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'RESULT_ENTERED',
                    resultText,
                    resultsPayload: formattedPayload
                })
            });

            if (res.ok) {
                await loadOrdersAndCatalog();
                setSelectedOrder(null);
                setResultsPayload({});
                setResultText("");
                alert("Lab Result saved successfully.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    const getCatalogEntry = (testName: string) => {
        return catalog.find(c => c.testName === testName);
    };

    return (
        <div className="p-8 h-full flex flex-col max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-[24px] font-bold text-gray-50 uppercase tracking-tight mb-2 flex items-center gap-3">
                        <FlaskConical className="text-emerald-500" /> LAB ORDER MANAGEMENT
                    </h2>
                    <p className="text-gray-400 text-sm">Sample Tracking & Result Validation Pipeline</p>
                </div>
            </div>

            {/* Tabs & Controls */}
            <div className="flex items-center justify-between border-b border-slate-800 mb-8 pb-1">
                <div className="flex gap-8 overflow-x-auto">
                    {[
                        { id: 'pending', label: 'PRE-COLLECTION', metric: orders.filter(o => o.sampleStatus === 'PENDING').length },
                        { id: 'collected', label: 'SAMPLES IN TRANSIT', metric: orders.filter(o => o.sampleStatus === 'COLLECTED').length },
                        { id: 'analysis', label: 'IN ANALYSIS', metric: orders.filter(o => o.sampleStatus === 'IN_ANALYSIS' && o.status !== 'RESULT_ENTERED').length },
                        { id: 'completed', label: 'COMPLETED REPORTS', metric: orders.filter(o => o.status === 'RESULT_ENTERED').length },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setSelectedOrder(null); }}
                            className={`font-semibold text-[13px] tracking-wide pb-3 px-2 transition border-b-[3px] whitespace-nowrap ${activeTab === tab.id ? 'text-gray-50 border-emerald-500' : 'text-gray-400 hover:text-gray-200 border-transparent'}`}
                        >
                            {tab.label} ({tab.metric})
                        </button>
                    ))}
                </div>
                <button onClick={loadOrdersAndCatalog} className="flex items-center gap-2 text-gray-400 hover:text-white transition whitespace-nowrap">
                    <RefreshCcw size={16} /> Refresh
                </button>
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
                {/* Left: Queue */}
                <div className="lg:col-span-4 bg-[#1e293b] rounded-[16px] border border-slate-800 flex flex-col overflow-hidden">
                    <div className="p-4 bg-[#0f172a] border-b border-slate-800 flex items-center justify-between">
                        <span className="font-semibold text-gray-400 text-sm">{activeTab.toUpperCase()} QUEUE</span>
                        <span className="bg-slate-800 text-gray-300 text-[11px] px-2 py-1 rounded font-bold">{filteredOrders.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {filteredOrders.length === 0 && <div className="text-gray-500 text-sm text-center py-8">No orders in this queue.</div>}
                        {filteredOrders.map(order => (
                            <div
                                key={order.id}
                                onClick={() => { setSelectedOrder(order); setResultsPayload({}); setResultText(""); }}
                                className={`p-4 rounded-xl cursor-pointer border ${selectedOrder?.id === order.id ? 'bg-slate-800 border-emerald-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-emerald-400 font-bold text-[13px] uppercase">{order.testName}</span>
                                    {order.barcode && <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-gray-400 font-mono">{order.barcode}</span>}
                                </div>
                                <div className="flex items-center gap-2 text-[12px] text-gray-300">
                                    <UserCircle size={14} className="text-gray-500" />
                                    <span className="font-medium">{order.patient?.firstName} {order.patient?.lastName}</span>
                                </div>
                                <div className="text-[11px] text-gray-500 mt-2">
                                    Ordered: {new Date(order.createdAt).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Workspace */}
                <div className="lg:col-span-8 bg-[#1e293b] rounded-[16px] border border-slate-800 flex flex-col overflow-hidden relative">
                    {!selectedOrder ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <FlaskConical size={48} className="mb-4 text-slate-700" />
                            <p>Select an order from the queue to process</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full overflow-y-auto">
                            {/* Selected Header */}
                            <div className="p-6 border-b border-slate-800 bg-[#0f172a]/50">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-50">{selectedOrder.patient?.firstName} {selectedOrder.patient?.lastName}</h3>
                                        <p className="text-sm text-gray-400 mt-1">UHID: {selectedOrder.patient?.uhid} • Dr. {selectedOrder.visit?.doctor?.lastName}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-emerald-400">{selectedOrder.testName}</div>
                                        {selectedOrder.barcode && <div className="text-sm font-mono text-gray-500 mt-1">{selectedOrder.barcode}</div>}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 flex-1">
                                {/* Workflow Steps */}
                                {selectedOrder.status !== 'RESULT_ENTERED' && (
                                    <div className="mb-8 bg-slate-900 border border-slate-800 rounded-xl p-6">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Sample Progression</h4>
                                        <div className="flex gap-4">
                                            <button
                                                disabled={selectedOrder.sampleStatus !== 'PENDING' || processing}
                                                onClick={() => handleUpdateSample('COLLECTED')}
                                                className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 font-bold text-sm transition ${selectedOrder.sampleStatus === 'PENDING' ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg' : 'bg-slate-800 text-gray-500'}`}
                                            >
                                                <Box size={16} /> 1. Accept Sample
                                            </button>
                                            <button
                                                disabled={selectedOrder.sampleStatus !== 'COLLECTED' || processing}
                                                onClick={() => handleUpdateSample('IN_ANALYSIS')}
                                                className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 font-bold text-sm transition ${selectedOrder.sampleStatus === 'COLLECTED' ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg' : 'bg-slate-800 text-gray-500'}`}
                                            >
                                                <Play size={16} /> 2. Begin Analysis
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Results Entry Form */}
                                {selectedOrder.sampleStatus === 'IN_ANALYSIS' && selectedOrder.status !== 'RESULT_ENTERED' && (
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Result Data Entry</h4>

                                        {getCatalogEntry(selectedOrder.testName)?.parameters ? (
                                            <div className="bg-white rounded-xl overflow-hidden shadow-2xl mb-6">
                                                <table className="w-full text-left text-sm text-slate-800">
                                                    <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                                                        <tr>
                                                            <th className="p-4 font-bold">Parameter</th>
                                                            <th className="p-4 font-bold w-[180px]">Result Value</th>
                                                            <th className="p-4 font-bold">Unit</th>
                                                            <th className="p-4 font-bold">Reference Range</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {(getCatalogEntry(selectedOrder.testName)?.parameters as any[]).map(p => {
                                                            const val = resultsPayload[p.name];
                                                            const isHigh = val !== undefined && val > (p.criticalMax || 9999);
                                                            const isLow = val !== undefined && val < (p.criticalMin || 0);
                                                            return (
                                                                <tr key={p.name} className={isHigh || isLow ? 'bg-red-50' : ''}>
                                                                    <td className="p-4 font-medium">{p.name}</td>
                                                                    <td className="p-4">
                                                                        <input
                                                                            type="number"
                                                                            value={resultsPayload[p.name] || ''}
                                                                            onChange={e => setResultsPayload({ ...resultsPayload, [p.name]: parseFloat(e.target.value) })}
                                                                            className={`w-full p-2 border rounded focus:outline-none focus:ring-2 ${isHigh || isLow ? 'border-red-300 ring-red-200 text-red-700 font-bold' : 'border-slate-300 ring-blue-100 text-slate-800'}`}
                                                                            placeholder="0.00"
                                                                        />
                                                                        {(isHigh || isLow) && <div className="text-[10px] font-bold text-red-600 mt-1 uppercase">{isHigh ? 'High' : 'Low'} Flag triggered</div>}
                                                                    </td>
                                                                    <td className="p-4 text-slate-500">{p.unit}</td>
                                                                    <td className="p-4 text-slate-500">{p.range}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="mb-6">
                                                <textarea
                                                    value={resultText}
                                                    onChange={(e) => setResultText(e.target.value)}
                                                    className="w-full h-[140px] p-4 bg-slate-900 border border-slate-700 rounded-xl text-sm text-gray-200 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner"
                                                    placeholder="Enter clinical lab measurements and conclusions here..."
                                                ></textarea>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => handleCompleteOrder(getCatalogEntry(selectedOrder.testName))}
                                            disabled={processing}
                                            className="w-full bg-[#1eab89] hover:bg-[#189173] disabled:opacity-50 text-white font-bold py-4 rounded-xl transition shadow-md flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 size={18} /> {processing ? 'SAVING...' : 'FINALIZE & GENERATE REPORT'}
                                        </button>
                                    </div>
                                )}

                                {/* Completed Report View */}
                                {selectedOrder.status === 'RESULT_ENTERED' && (
                                    <div className="bg-white rounded-xl p-6 shadow-2xl relative text-slate-800">
                                        <div className="absolute top-0 right-0 rounded-bl-xl bg-emerald-500 text-white text-xs font-bold px-4 py-2">
                                            VERIFIED REPORT
                                        </div>
                                        <h3 className="text-xl font-bold mb-6 text-slate-900">Laboratory Results</h3>

                                        {selectedOrder.resultsPayload ? (
                                            <table className="w-full text-left text-sm mb-6 border border-slate-200">
                                                <thead className="bg-slate-100">
                                                    <tr>
                                                        <th className="p-3 border-b border-slate-200">Test Parameter</th>
                                                        <th className="p-3 border-b border-slate-200 font-bold">Result</th>
                                                        <th className="p-3 border-b border-slate-200 text-xs text-slate-500">Ref. Range</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(selectedOrder.resultsPayload as any[]).map(r => (
                                                        <tr key={r.parameter} className="border-b border-slate-100">
                                                            <td className="p-3">{r.parameter}</td>
                                                            <td className={`p-3 font-bold ${r.isAbnormal ? 'text-red-600' : 'text-slate-800'}`}>
                                                                {r.value} {r.unit} {r.isAbnormal && '⚠️'}
                                                            </td>
                                                            <td className="p-3 text-slate-500">{r.range}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="p-4 bg-slate-50 text-slate-700 rounded-lg whitespace-pre-wrap">{selectedOrder.resultText}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
