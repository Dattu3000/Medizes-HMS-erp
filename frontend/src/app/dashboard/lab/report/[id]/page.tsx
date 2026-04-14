'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Download, AlertTriangle, Printer } from 'lucide-react';

export default function StandaloneLabReport() {
    const params = useParams();
    const router = useRouter();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // AI State
    const [aiInterpretation, setAiInterpretation] = useState<any>(null);
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`http://localhost:5000/api/lab/report/${params.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setReport(await res.json());
                } else {
                    alert('Failed to load report');
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) fetchReport();
    }, [params.id]);

    const handleGenerateAI = async () => {
        if (!report?.order?.resultsPayload) return;
        setAiLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/lab/ai/interpret`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ resultsPayload: report.order.resultsPayload })
            });
            const data = await res.json();
            if (res.ok && data.interpretation) {
                setAiInterpretation(data.interpretation);
            } else {
                alert('Analysis failed: ' + data.message);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setAiLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-800">Loading Report Data...</div>;
    if (!report || !report.order) return <div className="min-h-screen flex items-center justify-center text-red-600">Report not found.</div>;

    const { order, catalog } = report;
    const { patient, visit } = order;

    const hasCritical = order.resultsPayload ? order.resultsPayload.some((r: any) => r.isAbnormal) : false;

    return (
        <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
            {/* Action Bar (Hidden when printing) */}
            <div className="w-full max-w-4xl flex items-center justify-between mb-6 print:hidden">
                <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-800 font-semibold px-4 py-2">&larr; Back to System</button>
                <div className="flex gap-4">
                    <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow">
                        <Printer size={18} /> Print Report
                    </button>
                </div>
            </div>

            {/* A4 Printable Sheet */}
            <div className="w-full max-w-4xl bg-white shadow-2xl overflow-hidden print:shadow-none print:max-w-none print:w-[100%]" style={{ minHeight: '29.7cm' }}>
                {/* Header Header */}
                <div className="bg-slate-900 text-white p-8 flexitems-center justify-between print:bg-white print:text-slate-900 print:border-b-2 print:border-slate-800">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Medisys<span className="text-blue-500 font-light">HMS</span></h1>
                        <p className="text-sm mt-1 opacity-80 font-mono">LABORATORY REPORT</p>
                    </div>
                    <div className="text-right text-sm">
                        <div>123 Healthcare Blvd, Medical City</div>
                        <div>Phone: 1-800-MEDISYS</div>
                        <div>Email: labs@medisyshms.com</div>
                    </div>
                </div>

                <div className="p-8">
                    {/* Patient Infobox */}
                    <div className="border-2 border-slate-200 rounded-lg p-5 mb-8 flex flex-wrap gap-8">
                        <div className="flex-1 min-w-[200px]">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Patient Details</p>
                            <p className="text-lg font-bold text-slate-800 mt-1">{patient.firstName} {patient.lastName}</p>
                            <p className="text-sm text-slate-600">UHID: {patient.uhid}</p>
                            <p className="text-sm text-slate-600">{patient.age}Y / {patient.gender}</p>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Report Details</p>
                            <p className="text-sm text-slate-800 mt-1 font-semibold">Test: {order.testName}</p>
                            <p className="text-sm text-slate-800">Report ID: <span className="font-mono">{order.id.slice(0, 8).toUpperCase()}</span></p>
                            <p className="text-sm text-slate-800">Collection Date: {order.collectedAt ? new Date(order.collectedAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Referred By</p>
                            <p className="text-sm text-slate-800 mt-1 font-semibold">Dr. {visit?.doctor?.lastName || 'Unknown'}</p>
                            <p className="text-sm text-slate-600">Department: {catalog?.department || 'General'}</p>
                        </div>
                    </div>

                    {/* Critical Warning Alert */}
                    {hasCritical && (
                        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4 flex items-start gap-4">
                            <AlertTriangle size={24} className="text-red-500 shrink-0" />
                            <div>
                                <h4 className="font-bold">CRITICAL VALUES DETECTED</h4>
                                <p className="text-sm mt-1">One or more parameters in this test have returned values significantly outside the normal reference range. Immediate medical correlation is advised.</p>
                            </div>
                        </div>
                    )}

                    {/* AI Interpretation Box */}
                    {aiInterpretation ? (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8 mt-4 print:border-purple-300">
                            <div className="flex items-center gap-3 mb-4 border-b border-purple-200 pb-3">
                                <div className="bg-purple-600 text-white p-2 rounded-full"><AlertTriangle size={18} /></div>
                                <div>
                                    <h4 className="font-bold text-purple-900 text-lg">AI Virtual Pathologist Summary</h4>
                                    <p className="text-xs text-purple-700">Automated Clinical Correlation</p>
                                </div>
                            </div>

                            <div className="space-y-4 text-sm text-purple-900">
                                <div>
                                    <span className="font-bold uppercase tracking-wider text-[11px] text-purple-600">Clinical Summary</span>
                                    <p className="mt-1 font-medium leading-relaxed">{aiInterpretation.clinicalSummary}</p>
                                </div>

                                {aiInterpretation.differentials.length > 0 && (
                                    <div>
                                        <span className="font-bold uppercase tracking-wider text-[11px] text-purple-600">Potential Differentials</span>
                                        <ul className="list-disc pl-5 mt-1 space-y-1 font-medium">
                                            {aiInterpretation.differentials.map((d: string, i: number) => <li key={i}>{d}</li>)}
                                        </ul>
                                    </div>
                                )}

                                {aiInterpretation.recommendations.length > 0 && (
                                    <div>
                                        <span className="font-bold uppercase tracking-wider text-[11px] text-purple-600">Suggested Follow-Up</span>
                                        <ul className="list-disc pl-5 mt-1 space-y-1 font-medium">
                                            {aiInterpretation.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="mb-8 print:hidden flex justify-end">
                            <button onClick={handleGenerateAI} disabled={aiLoading || !order.resultsPayload} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-md transition">
                                <AlertTriangle size={16} /> {aiLoading ? 'Synthesizing Pathological Data...' : 'Generate AI Clinical Summary'}
                            </button>
                        </div>
                    )}

                    {/* Results Table */}
                    <div className="mb-12">
                        <h3 className="text-xl font-bold text-slate-800 border-b-2 border-slate-200 pb-2 mb-4 uppercase">{order.testName} Results</h3>

                        {order.resultsPayload && Array.isArray(order.resultsPayload) ? (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr>
                                        <th className="border-b-2 border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700 w-1/3">TEST PARAMETER</th>
                                        <th className="border-b-2 border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700">OBSERVED VALUE</th>
                                        <th className="border-b-2 border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700">UNIT</th>
                                        <th className="border-b-2 border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700">REFERENCE RANGE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.resultsPayload.map((r: any, i: number) => (
                                        <tr key={i} className={r.isAbnormal ? 'bg-red-50' : 'even:bg-slate-50/50'}>
                                            <td className="border-b border-slate-100 p-4 font-semibold text-slate-700">{r.parameter}</td>
                                            <td className="border-b border-slate-100 p-4">
                                                <span className={`text-lg font-bold ${r.isAbnormal ? 'text-red-600' : 'text-slate-800'}`}>
                                                    {r.value} {r.isAbnormal && <span className="ml-2 text-sm">⚠️ High/Low</span>}
                                                </span>
                                            </td>
                                            <td className="border-b border-slate-100 p-4 text-slate-500">{r.unit}</td>
                                            <td className="border-b border-slate-100 p-4 text-slate-500">{r.range}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            // Legacy format
                            <div className="bg-slate-50 border border-slate-200 p-6 rounded-lg text-slate-800 whitespace-pre-wrap">
                                {order.resultText}
                            </div>
                        )}
                    </div>

                    {/* Signatures */}
                    <div className="mt-20 pt-8 border-t border-slate-200 flex justify-between">
                        <div className="text-center">
                            <div className="w-48 border-b border-slate-400 mb-2"></div>
                            <p className="text-sm font-bold text-slate-700">Verified By (Lab Technician)</p>
                            <p className="text-xs text-slate-500 mt-1">{new Date(order.updatedAt).toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                            <div className="w-48 border-b border-slate-400 mb-2"></div>
                            <p className="text-sm font-bold text-slate-700">Lab Director Signature</p>
                        </div>
                    </div>

                    {/* Footer Warning */}
                    <div className="mt-12 text-[10px] text-slate-400 text-center uppercase tracking-wider">
                        <p>This is a digitally verified report generated by Medisys HMS. Physical signature not strictly required.</p>
                        <p>End of Report</p>
                    </div>

                </div>
            </div>
        </div>
    );
}

