'use client';
import { API_BASE } from '@/lib/api';
import { useState, useRef } from 'react';
import { Sparkles, Loader2, Download, Printer, User, Droplet, Activity, Dna, FileWarning, HeartPulse, CheckCircle2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function SmartLabReport({ order }: { order: any }) {
    const [aiInterpretation, setAiInterpretation] = useState<any>(null);
    const [loadingAi, setLoadingAi] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

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
        order.resultsPayload.forEach(r => {
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
            const res = await fetch(`${API_BASE}/api/lab/ai/interpret`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ resultsPayload: order.resultsPayload })
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

    return (
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden font-sans border border-slate-200">
            {/* Action Bar â€” hidden during print */}
            <div className="bg-slate-100 border-b border-slate-200 p-4 flex items-center justify-between print:hidden">
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

                {/* Smart Body Map Summary Component */}
                <div className="mb-14">
                    <h2 className="text-2xl font-black text-blue-900 mb-8 px-6 sm:px-0">Health Summary Map</h2>
                    <div className="relative w-full max-w-4xl mx-auto h-[600px] border border-slate-100 bg-slate-50/50 rounded-3xl overflow-hidden flex items-center justify-center shadow-inner hidden md:flex">

                        {/* Human SVG Center */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                            <svg viewBox="0 0 100 250" className="h-[550px] fill-slate-700">
                                <path d="M50 0 C40 0, 35 15, 35 25 C35 32, 40 40, 50 40 C60 40, 65 32, 65 25 C65 15, 60 0, 50 0 Z M25 50 C10 55, 5 70, 5 80 C5 90, 15 130, 15 130 L25 130 C25 130, 25 70, 35 60 L65 60 C75 70, 75 130, 75 130 L85 130 C85 130, 95 90, 95 80 C95 70, 90 55, 75 50 C65 45, 55 45, 50 45 C45 45, 35 45, 25 50 Z M35 140 C25 140, 20 230, 20 240 C20 250, 35 250, 40 250 L45 240 L45 150 L55 150 L55 240 L60 250 C65 250, 80 250, 80 240 C80 230, 75 140, 65 140 C55 140, 55 130, 50 130 C45 130, 45 140, 35 140 Z" />
                            </svg>
                        </div>

                        {/* Floating Profile Cards */}
                        {Object.keys(groupedResults).map((group, idx) => {
                            const node = mapNodes.find(n => n.key === group);
                            const hasAbnormal = groupedResults[group].some(r => r.isAbnormal);

                            // Fallback rendering layout if group not in hardcoded nodes mapping
                            if (!node) return null;

                            return (
                                <div key={group} className={`absolute ${node.pos} bg-white rounded-xl shadow-lg border border-slate-200 w-56 transform transition hover:scale-105 z-10`}>
                                    <div className="flex items-center gap-2 p-2 border-b border-slate-100">
                                        {/* <Icon className={`w-5 h-5 ${node.color}`} /> */}
                                        {getProfileIcon(group)}
                                        <span className="font-black text-[11px] text-slate-700 tracking-wider">
                                            {group}
                                        </span>
                                    </div>
                                    <div className="p-3 pb-2 text-xs">
                                        <div className="flex justify-between font-bold text-slate-500 mb-1 border-b border-slate-100 pb-1">
                                            <span>Parameter</span><span>Result</span>
                                        </div>
                                        <div className="max-h-20 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                            {groupedResults[group].map((r: any) => (
                                                <div key={r.parameter} className="flex justify-between text-slate-700 truncate items-center">
                                                    <span className="truncate w-32 mr-2" title={r.parameter}>{r.parameter}</span>
                                                    <span className={`font-bold ${r.isAbnormal ? 'text-red-600 bg-red-50 px-1 rounded' : 'text-slate-800'}`}>{r.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className={`py-1.5 px-3 text-center text-xs font-bold ${hasAbnormal ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'} rounded-b-xl border-t ${hasAbnormal ? 'border-rose-200' : 'border-emerald-200'}`}>
                                        {hasAbnormal ? 'Please Watchout' : 'Everything looks good'}
                                    </div>
                                    {/* Dotted connecting line visual hack */}
                                    <div className="absolute top-1/2 left-full w-12 h-px bg-slate-300 pointer-events-none hidden md:block"></div>
                                </div>
                            );
                        })}
                    </div>
                </div>

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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-5 rounded-xl shadow-sm border border-indigo-100">
                                    <h4 className="text-xs font-bold uppercase text-indigo-500 tracking-wider mb-3">Differential Analysis</h4>
                                    <ul className="space-y-3">
                                        {aiInterpretation.differentials.map((diff: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2 text-slate-700 text-sm">
                                                <span className="text-indigo-400 font-bold mt-0.5">â€¢</span>
                                                <span className="leading-snug">{diff}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="bg-white p-5 rounded-xl shadow-sm border border-indigo-100">
                                    <h4 className="text-xs font-bold uppercase text-emerald-500 tracking-wider mb-3">Doctor Recommendations</h4>
                                    <ul className="space-y-3">
                                        {aiInterpretation.recommendations.map((rec: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2 text-slate-700 text-sm">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                <span className="leading-snug">{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* Detailed Diagnostic Tables */}
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
                                        <th className="p-3 border-r border-slate-300 font-bold w-1/2">Test Description</th>
                                        <th className="p-3 border-r border-slate-300 font-bold text-center w-1/6">Value(s)</th>
                                        <th className="p-3 border-r border-slate-300 font-bold text-center w-1/6">Unit(s)</th>
                                        <th className="p-3 font-bold text-center w-1/6">Reference Range</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupedResults[profileKey].map((r: any, idx) => (
                                        <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                                            <td className="p-3 border-r border-slate-300">
                                                <div className="font-bold text-slate-800">{r.parameter}</div>
                                                <div className="text-[10px] text-slate-500 italic mt-0.5">Automated methodology / Calculated</div>
                                            </td>
                                            <td className={`p-3 border-r border-slate-300 text-center font-bold text-base ${r.isAbnormal ? 'text-red-700 bg-red-50/50' : 'text-slate-900'}`}>
                                                {r.value}
                                            </td>
                                            <td className="p-3 border-r border-slate-300 text-center text-slate-600 font-medium">
                                                {r.unit}
                                            </td>
                                            <td className="p-3 text-center text-slate-600 whitespace-nowrap">
                                                {r.range}
                                            </td>
                                        </tr>
                                    ))}
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
