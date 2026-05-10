'use client';
import { API_BASE } from '@/lib/api';
import { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, Download, Printer, User, Droplet, Activity, Dna, FileWarning, HeartPulse, CheckCircle2, MessageSquarePlus, Edit3 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

export default function SmartLabReport({ order, history = [] }: { order: any, history?: any[] }) {
    const [aiInterpretation, setAiInterpretation] = useState<any>(order.aiSummary || null);
    const [loadingAi, setLoadingAi] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [viewMode, setViewMode] = useState<'CLINICIAN' | 'PATIENT'>('CLINICIAN');
    const [annotations, setAnnotations] = useState<Record<string, string>>({});
    const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
    const [annotationInput, setAnnotationInput] = useState('');
    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (order.resultsPayload) {
            const initialAnns: Record<string, string> = {};
            order.resultsPayload.forEach((r: any) => {
                if (r.annotation) initialAnns[r.parameter] = r.annotation;
            });
            setAnnotations(initialAnns);
        }
    }, [order.resultsPayload]);

    const handleSaveAnnotation = async (parameter: string) => {
        const newAnnotations = { ...annotations, [parameter]: annotationInput };
        setAnnotations(newAnnotations);
        setEditingAnnotation(null);
        
        // Persist to backend
        const updatedPayload = order.resultsPayload.map((r: any) => 
            r.parameter === parameter ? { ...r, annotation: annotationInput } : r
        );
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE}/api/lab/order/${order.id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ resultsPayload: updatedPayload })
            });
        } catch (e) {
            console.error("Failed to save annotation", e);
        }
    };

    // Profile Categorizer
    const getProfileForParameter = (name: string) => {
        const l = name.toLowerCase();
        if (l.includes('hemoglobin') || l.includes('wbc') || l.includes('rbc') || l.includes('platelet') || l.includes('count') || l.includes('mcv') || l.includes('mch') || l.includes('esr') || l.includes('neutrophil') || l.includes('lymphocyte') || l.includes('monocyte') || l.includes('eosinophil') || l.includes('leukocyte') || l.includes('pcv') || l.includes('rdw') || l.includes('mentzer')) return 'BLOOD COUNTS';
        if (l.includes('cholesterol') || l.includes('hdl') || l.includes('ldl') || l.includes('triglyceride')) return 'LIPID PROFILE';
        if (l.includes('uric') || l.includes('creatinine') || l.includes('urea') || l.includes('bun')) return 'KIDNEY PROFILE';
        if (l.includes('glucose') || l.includes('hba1c') || l.includes('sugar')) return 'DIABETES MONITORING';
        if (l.includes('tsh') || l.includes('t3') || l.includes('t4')) return 'THYROID PROFILE';
        if (l.includes('sgot') || l.includes('sgpt') || l.includes('bilirubin') || l.includes('alp') || l.includes('ast') || l.includes('alt')) return 'LIVER PROFILE';
        if (l.includes('vitamin') || l.includes('b12') || l.includes('d25')) return 'VITAMIN PROFILE';
        if (l.includes('calcium') || l.includes('iron') || l.includes('magnesium') || l.includes('zinc') || l.includes('sodium') || l.includes('potassium') || l.includes('chloride')) return 'MINERAL PROFILE';
        return 'GENERAL PARAMETERS';
    };

    // Grouping Results
    const groupedResults: Record<string, any[]> = {};
    if (order.resultsPayload && Array.isArray(order.resultsPayload)) {
        order.resultsPayload.forEach((r: any) => {
            const profile = getProfileForParameter(r.parameter);
            if (!groupedResults[profile]) groupedResults[profile] = [];
            groupedResults[profile].push(r);
        });
    }

    const loadGemmaInterpretation = async () => {
        if (!order.resultsPayload || order.resultsPayload.length === 0) return;
        setLoadingAi(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/lab/interpret/${order.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                const data = await res.json();
                setAiInterpretation(data.interpretation);
            }
        } catch (error) {
            console.error('Failed to load Gemma AI interpretation', error);
        } finally {
            setLoadingAi(false);
        }
    };

    // Smart Body Map positioning configs
    const mapNodes = [
        { key: 'BLOOD COUNTS', icon: Droplet, color: 'text-rose-500', pos: 'top-12 left-8 md:top-20 md:left-12' },
        { key: 'THYROID PROFILE', icon: Dna, color: 'text-purple-500', pos: 'top-16 right-8 md:top-24 md:right-12' },
        { key: 'LIPID PROFILE', icon: HeartPulse, color: 'text-amber-500', pos: 'top-56 left-6 md:top-64 md:left-8' },
        { key: 'DIABETES MONITORING', icon: Activity, color: 'text-sky-500', pos: 'top-64 right-6 md:top-72 md:right-8' },
        { key: 'KIDNEY PROFILE', icon: Droplet, color: 'text-blue-600', pos: 'bottom-40 left-8 md:bottom-48 md:left-12' },
        { key: 'LIVER PROFILE', icon: FileWarning, color: 'text-emerald-600', pos: 'bottom-48 right-8 md:bottom-56 md:right-12' }
    ];

    const getProfileIcon = (key: string) => {
        const node = mapNodes.find(n => n.key === key);
        if (!node) return <Activity className="w-5 h-5 text-gray-400" />;
        const Icon = node.icon;
        return <Icon className={`w-5 h-5 ${node.color}`} />;
    };

    const handleDownloadPdf = async () => {
        if (!reportRef.current) return;
        setGeneratingPdf(true);
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const patientName = `${order.patient?.firstName || 'Patient'}_${order.patient?.lastName || 'Report'}`;
            pdf.save(`SmartReport_${patientName}_${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (err) {
            console.error('PDF generation failed', err);
        } finally {
            setGeneratingPdf(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const Sparkline = ({ parameter }: { parameter: string }) => {
        // Build data points for the specific parameter from history + current order
        const dataPoints = [...history].reverse().map(h => {
            const match = h.resultsPayload?.find((r: any) => r.parameter === parameter);
            return { value: match ? parseFloat(match.value) : null };
        }).filter(d => d.value !== null);

        // Add current result
        const currentMatch = order.resultsPayload?.find((r: any) => r.parameter === parameter);
        if (currentMatch) {
            dataPoints.push({ value: parseFloat(currentMatch.value) });
        }

        if (dataPoints.length < 2) return <div className="text-[10px] text-slate-400 text-center">No trend</div>;

        return (
            <div className="h-10 w-24">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dataPoints}>
                        <YAxis domain={['dataMin', 'dataMax']} hide />
                        <Line type="step" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2, fill: '#3b82f6' }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        );
    };

    const getTrafficLightColor = (isAbnormal: boolean, value: string, range: string) => {
        if (!isAbnormal) return { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-500' };
        
        // Simple heuristic for Borderline (Yellow) vs Critical (Red)
        // If it's abnormal, we check if it's way out of bounds. Without complex range parsing, we assume mostly Red.
        // Let's use red for all abnormals as safety, unless specifically coded.
        return { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-500' };
    };

    return (
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden font-sans border border-slate-200">
            {/* Action Bar — hidden during print */}
            <div className="bg-slate-100 border-b border-slate-200 p-4 flex items-center justify-between print:hidden">
                <div className="flex bg-slate-200 rounded-lg p-1">
                    <button onClick={() => setViewMode('CLINICIAN')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'CLINICIAN' ? 'bg-white shadow text-blue-900' : 'text-slate-500 hover:text-slate-700'}`}>Clinician View</button>
                    <button onClick={() => setViewMode('PATIENT')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'PATIENT' ? 'bg-white shadow text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}>Patient View</button>
                </div>
                
                <div className="flex gap-2">
                    <button
                        onClick={handleDownloadPdf}
                        disabled={generatingPdf}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow transition-colors"
                    >
                        {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {generatingPdf ? 'Generating...' : 'Download PDF'}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-slate-700 border border-slate-300 rounded-lg text-sm font-bold shadow-sm transition-colors"
                    >
                        <Printer className="w-4 h-4" /> Print
                    </button>
                    {!aiInterpretation && (
                        <button
                            onClick={loadGemmaInterpretation}
                            disabled={loadingAi}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-sm font-bold shadow transition-all ml-2"
                        >
                            {loadingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            Generate AI Smart Analysis
                        </button>
                    )}
                </div>
            </div>

            {/* Smart Report Wrapper (PDF target area) */}
            <div className="p-0 sm:p-8 bg-white" id="printable-report" ref={reportRef}>

                {/* Header Section */}
                <div className="border-b-4 border-blue-900 pb-6 mb-8 mt-4 sm:mt-0 px-6 sm:px-0 flex flex-col md:flex-row items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tight">SMART HEALTH REPORT</h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">ISO 9001:2015 CERTIFIED / Medisys Reference Labs</p>
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-10 flex border-l-[6px] border-l-blue-900">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full text-sm">
                        <div>
                            <div className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Patient Name</div>
                            <div className="font-bold text-slate-800 text-base">{order.patient?.firstName} {order.patient?.lastName}</div>
                        </div>
                        <div>
                            <div className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Patient ID / UHID</div>
                            <div className="font-bold text-slate-800 text-base">{order.patient?.uhid}</div>
                        </div>
                        <div>
                            <div className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Age / Gender</div>
                            <div className="font-bold text-slate-800 text-base">{order.patient?.age || 'N/A'} Y / {order.patient?.gender?.charAt(0) || '-'}</div>
                        </div>
                        <div>
                            <div className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Report Date</div>
                            <div className="font-bold text-slate-800 text-base">{new Date(order.updatedAt).toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Barcode</div>
                            <div className="font-mono text-slate-700">{order.barcode}</div>
                        </div>
                        <div>
                            <div className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Sample Type</div>
                            <div className="font-medium text-slate-700">Whole Blood EDTA / Serum</div>
                        </div>
                        <div className="md:col-span-2">
                            <div className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Test Performed</div>
                            <div className="font-bold text-blue-800 text-lg uppercase">{order.testName}</div>
                        </div>
                    </div>
                </div>

                {/* Patient View Specific Elements */}
                {viewMode === 'PATIENT' && (
                    <div className="mb-14">
                        <h2 className="text-2xl font-black text-emerald-700 mb-8 px-6 sm:px-0">Your Health at a Glance</h2>
                        <div className="px-6 sm:px-0 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.keys(groupedResults).map(profileKey => {
                                const abnormals = groupedResults[profileKey].filter(r => r.isAbnormal).length;
                                const total = groupedResults[profileKey].length;
                                const isPerfect = abnormals === 0;

                                return (
                                    <div key={profileKey} className={`p-6 rounded-2xl border ${isPerfect ? 'bg-emerald-50 border-emerald-100' : 'bg-orange-50 border-orange-100'}`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                {getProfileIcon(profileKey)}
                                                <h3 className={`font-bold text-lg ${isPerfect ? 'text-emerald-800' : 'text-orange-800'}`}>
                                                    {profileKey === 'KIDNEY PROFILE' ? 'Kidney Health' : profileKey === 'LIPID PROFILE' ? 'Heart Health & Cholesterol' : profileKey === 'LIVER PROFILE' ? 'Liver Health' : profileKey.replace('PROFILE', '').replace('MONITORING', '')}
                                                </h3>
                                            </div>
                                            {isPerfect ? <CheckCircle2 className="text-emerald-500" /> : <FileWarning className="text-orange-500" />}
                                        </div>
                                        <p className="text-sm text-slate-700 mb-4">
                                            {isPerfect ? 'All indicators are within the healthy range. Great job!' : `${abnormals} out of ${total} indicators need attention.`}
                                        </p>
                                        
                                        <div className="space-y-4">
                                            {groupedResults[profileKey].map((r: any, idx: number) => {
                                                const healthy = !r.isAbnormal;
                                                return (
                                                    <div key={idx}>
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span className="font-bold text-slate-700">{r.parameter}</span>
                                                            <span className="font-bold">{r.value} {r.unit}</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                                                            {/* Simplified Healthy Range Slider visualization */}
                                                            <div className={`h-full ${healthy ? 'bg-emerald-400' : 'bg-red-400'}`} style={{ width: healthy ? '50%' : '80%' }}></div>
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                                                            <span>Healthy Range: {r.range}</span>
                                                            <span className={healthy ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>{healthy ? 'Normal' : 'Action Required'}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Gemma AI Summary Block */}
                {aiInterpretation && (
                    <div className="mb-12 px-6 sm:px-0">
                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-black text-indigo-900 flex items-center gap-2">
                                    <Sparkles className="text-indigo-500" />
                                    AI Clinical Interpretation
                                </h3>
                                <span className="bg-indigo-600 text-white text-[10px] uppercase font-bold px-2 py-1 rounded tracking-wider shadow-sm">GEMMA-3N-EDGE</span>
                            </div>

                            <p className="text-slate-800 text-base leading-relaxed mb-6 font-medium italic">
                                "{aiInterpretation.clinicalSummary}"
                            </p>

                            {viewMode === 'CLINICIAN' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-5 rounded-xl shadow-sm border border-indigo-100">
                                        <h4 className="text-xs font-bold uppercase text-indigo-500 tracking-wider mb-3">Differential Analysis</h4>
                                        <ul className="space-y-3">
                                            {aiInterpretation.differentials?.map((diff: string, i: number) => (
                                                <li key={i} className="flex items-start gap-2 text-slate-700 text-sm">
                                                    <span className="text-indigo-400 font-bold mt-0.5">•</span>
                                                    <span className="leading-snug">{diff}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-white p-5 rounded-xl shadow-sm border border-indigo-100">
                                        <h4 className="text-xs font-bold uppercase text-emerald-500 tracking-wider mb-3">Recommendations</h4>
                                        <ul className="space-y-3">
                                            {aiInterpretation.recommendations?.map((rec: string, i: number) => (
                                                <li key={i} className="flex items-start gap-2 text-slate-700 text-sm">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                    <span className="leading-snug">{rec}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Clinician View Detailed Tables */}
                {viewMode === 'CLINICIAN' && (
                    <div className="px-6 sm:px-0 space-y-12">
                        <div className="border-b-4 border-slate-800 pb-2 mb-6">
                            <h2 className="text-2xl font-black text-slate-900 uppercase">Detailed Diagnostic Log</h2>
                        </div>

                        {Object.keys(groupedResults).map(profileKey => (
                            <div key={profileKey} className="mb-8 overflow-x-auto">
                                <h3 className="text-blue-900 font-bold text-lg border-b border-blue-900 inline-block pb-1 mb-4 uppercase tracking-tight">{profileKey.replace('PROFILE', '').replace('MONITORING', '')}</h3>
                                <table className="w-full text-left text-sm border-2 border-slate-900">
                                    <thead className="bg-slate-100 border-b-2 border-slate-900 text-slate-900">
                                        <tr>
                                            <th className="p-3 border-r border-slate-300 font-bold w-5 w-5"></th>
                                            <th className="p-3 border-r border-slate-300 font-bold w-1/3">Test Description</th>
                                            <th className="p-3 border-r border-slate-300 font-bold text-center w-1/6">Value(s)</th>
                                            <th className="p-3 border-r border-slate-300 font-bold text-center w-1/6">Reference Range</th>
                                            <th className="p-3 border-r border-slate-300 font-bold text-center w-1/6">Trend (Last 5)</th>
                                            <th className="p-3 font-bold text-center w-1/6 print:hidden">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupedResults[profileKey].map((r: any, idx) => {
                                            const colors = getTrafficLightColor(r.isAbnormal, r.value, r.range);
                                            return (
                                                <tr key={idx} className={`border-b border-slate-200 transition-colors ${colors.bg}`}>
                                                    <td className="p-3 border-r border-slate-300 text-center">
                                                        <div className={`w-3 h-3 rounded-full ${colors.badge} shadow-sm mx-auto`}></div>
                                                    </td>
                                                    <td className="p-3 border-r border-slate-300">
                                                        <div className="font-bold text-slate-800">{r.parameter}</div>
                                                        {annotations[r.parameter] && (
                                                            <div className="mt-2 text-xs bg-yellow-100 border-l-2 border-yellow-400 p-2 text-yellow-900 rounded-sm">
                                                                <span className="font-bold mr-1">Note:</span>
                                                                {annotations[r.parameter]}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className={`p-3 border-r border-slate-300 text-center font-bold text-base ${colors.text}`}>
                                                        {r.value} <span className="text-xs font-normal text-slate-500 ml-1">{r.unit}</span>
                                                    </td>
                                                    <td className="p-3 border-r border-slate-300 text-center text-slate-600 whitespace-nowrap">
                                                        {r.range}
                                                    </td>
                                                    <td className="p-3 border-r border-slate-300 text-center flex items-center justify-center">
                                                        <Sparkline parameter={r.parameter} />
                                                    </td>
                                                    <td className="p-3 text-center print:hidden">
                                                        {editingAnnotation === r.parameter ? (
                                                            <div className="flex flex-col gap-1">
                                                                <input 
                                                                    type="text" 
                                                                    value={annotationInput} 
                                                                    onChange={(e) => setAnnotationInput(e.target.value)} 
                                                                    className="border rounded px-1 py-0.5 text-xs w-full"
                                                                    autoFocus
                                                                />
                                                                <button onClick={() => handleSaveAnnotation(r.parameter)} className="bg-blue-600 text-white text-[10px] rounded px-2 py-0.5">Save</button>
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                onClick={() => { setEditingAnnotation(r.parameter); setAnnotationInput(annotations[r.parameter] || ''); }}
                                                                className="text-slate-400 hover:text-blue-600 transition-colors"
                                                                title="Add Note"
                                                            >
                                                                {annotations[r.parameter] ? <Edit3 className="w-4 h-4 mx-auto" /> : <MessageSquarePlus className="w-4 h-4 mx-auto" />}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ))}

                        {!order.resultsPayload && order.resultText && (
                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 whitespace-pre-wrap leading-relaxed shadow-inner">
                                {order.resultText}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Signature Box */}
                <div className="mt-16 pt-8 border-t-2 border-slate-200 px-6 sm:px-0 flex justify-between items-end">
                    <div className="text-[10px] text-slate-500 space-y-1">
                        <p><strong>Disclaimer:</strong> This is a computer-generated report. Ensure clinical correlation.</p>
                        <p><strong>Note:</strong> Out-of-bounds parameters are highlighted for distinct clinical review.</p>
                        <p className="pt-2 text-indigo-600 font-bold">Generated securely via Medisys Analytics</p>
                    </div>

                    <div className="text-center">
                        <div className="text-blue-900 font-black mb-1 cursive tracking-tighter text-2xl" style={{ fontFamily: 'Brush Script MT, cursive' }}>Medisys Auth</div>
                        <div className="border-t border-slate-400 pt-1 text-xs font-bold text-slate-800 uppercase inline-block">Authorized Signatory</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Dr. {order.visit?.doctor?.lastName || 'Pathologist'}</div>
                    </div>
                </div>

            </div>
        </div>
    );
}
