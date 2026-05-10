'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    ZoomIn, Move, Contrast, FlipHorizontal, RefreshCcw, 
    Ruler, BrainCircuit, Maximize, X, Save, CheckCircle2,
    Share2, Download, Printer, ArrowLeft, FileText
} from 'lucide-react';

export default function DicomViewer() {
    const params = useParams();
    const router = useRouter();
    const scanId = params.scanId as string;

    const [loading, setLoading] = useState(true);
    const [scanData, setScanData] = useState<any>(null);
    
    // Viewer Tools State
    const [activeTool, setActiveTool] = useState('wwwl');
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [invert, setInvert] = useState(false);
    const [aiOverlay, setAiOverlay] = useState(false);
    
    const [reportText, setReportText] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        // Mock loading DICOM series
        setTimeout(() => {
            setScanData({
                patientName: "Sarah Connor",
                uhid: "UHID-993812",
                studyDate: "2026-05-10",
                modality: "MRI",
                bodyPart: "BRAIN",
                series: [
                    { id: 's1', description: 'T1 SAG', imageCount: 24, imgUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=800' },
                    { id: 's2', description: 'T2 AXIAL', imageCount: 36, imgUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=800&sat=-100' },
                    { id: 's3', description: 'FLAIR CORONAL', imageCount: 20, imgUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=800&contrast=150' },
                ],
                activeSeriesIndex: 0
            });
            setLoading(false);
        }, 1200);
    }, [scanId]);

    const handleReset = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setInvert(false);
        setAiOverlay(false);
    };

    const handleSaveReport = () => {
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }, 1000);
    };

    if (loading) {
        return (
            <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center text-gray-400">
                <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="font-semibold tracking-wide">Initializing Medisys DICOM Viewer...</h2>
                <p className="text-sm mt-2">Loading series data from PACS</p>
            </div>
        );
    }

    const activeImage = scanData.series[scanData.activeSeriesIndex].imgUrl;

    return (
        <div className="h-screen w-full bg-[#050505] flex flex-col overflow-hidden text-gray-300 font-sans">
            
            {/* Top Toolbar */}
            <div className="h-16 bg-[#111] border-b border-white/10 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="text-white font-bold tracking-wide">{scanData.patientName}</div>
                        <div className="text-xs text-gray-500 flex gap-3">
                            <span>ID: {scanData.uhid}</span>
                            <span>{scanData.studyDate}</span>
                            <span>{scanData.modality} {scanData.bodyPart}</span>
                        </div>
                    </div>
                </div>

                {/* DICOM Tools */}
                <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg p-1 border border-white/5">
                    <ToolButton icon={<ZoomIn />} label="Zoom" active={activeTool === 'zoom'} onClick={() => {setActiveTool('zoom'); setZoom(z => z + 0.2);}} />
                    <ToolButton icon={<Move />} label="Pan" active={activeTool === 'pan'} onClick={() => setActiveTool('pan')} />
                    <ToolButton icon={<Contrast />} label="WW/WL" active={activeTool === 'wwwl'} onClick={() => setActiveTool('wwwl')} />
                    <div className="w-px h-6 bg-white/10 mx-1"></div>
                    <ToolButton icon={<FlipHorizontal />} label="Invert" active={invert} onClick={() => setInvert(!invert)} />
                    <ToolButton icon={<Ruler />} label="Measure" active={activeTool === 'measure'} onClick={() => setActiveTool('measure')} />
                    <div className="w-px h-6 bg-white/10 mx-1"></div>
                    <button 
                        onClick={() => setAiOverlay(!aiOverlay)}
                        className={`px-3 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition ${aiOverlay ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'hover:bg-white/5 text-gray-400'}`}
                    >
                        <BrainCircuit size={16} /> AI ASSIST
                    </button>
                    <ToolButton icon={<RefreshCcw />} label="Reset" active={false} onClick={handleReset} />
                </div>

                <div className="flex items-center gap-3">
                    <button className="p-2 text-gray-400 hover:text-white"><Share2 size={18} /></button>
                    <button className="p-2 text-gray-400 hover:text-white"><Download size={18} /></button>
                    <button className="p-2 text-gray-400 hover:text-white"><Printer size={18} /></button>
                    <button className="ml-2 text-gray-400 hover:text-white"><Maximize size={20} /></button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Series Thumbnails */}
                <div className="w-48 bg-[#0a0a0a] border-r border-white/5 overflow-y-auto p-2 flex flex-col gap-2 custom-scrollbar">
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-500 px-2 py-2">Series ({scanData.series.length})</div>
                    {scanData.series.map((s: any, idx: number) => (
                        <div 
                            key={s.id} 
                            onClick={() => setScanData({...scanData, activeSeriesIndex: idx})}
                            className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition ${scanData.activeSeriesIndex === idx ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-transparent hover:border-white/20'}`}
                        >
                            <img src={s.imgUrl} alt={s.description} className="w-full h-24 object-cover grayscale" />
                            <div className="absolute top-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] font-bold text-white">
                                S:{idx + 1}
                            </div>
                            <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] font-bold text-white">
                                Img: {s.imageCount}
                            </div>
                            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-2 pt-4">
                                <div className="text-[11px] text-white truncate">{s.description}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Viewport */}
                <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                    {/* Viewport Info Overlays */}
                    <div className="absolute top-4 left-4 z-10 text-[11px] text-emerald-400/70 font-mono pointer-events-none">
                        <div>Patient: {scanData.patientName}</div>
                        <div>ID: {scanData.uhid}</div>
                        <div>Study: {scanData.studyDate}</div>
                        <div>Modality: {scanData.modality}</div>
                    </div>
                    <div className="absolute top-4 right-4 z-10 text-[11px] text-emerald-400/70 font-mono text-right pointer-events-none">
                        <div>{scanData.series[scanData.activeSeriesIndex].description}</div>
                        <div>Img 12 / {scanData.series[scanData.activeSeriesIndex].imageCount}</div>
                        <div>Zoom: {(zoom * 100).toFixed(0)}%</div>
                        <div>WW: 1500 WL: 300</div>
                    </div>

                    {/* The Image */}
                    <div 
                        className="relative transition-transform duration-200"
                        style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }}
                    >
                        <img 
                            src={activeImage} 
                            alt="Scan" 
                            className={`max-w-none max-h-[90vh] object-contain transition-all duration-300 ${invert ? 'invert' : ''} grayscale`}
                        />
                        
                        {/* AI Overlay Mock */}
                        {aiOverlay && (
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-[30%] left-[45%] w-24 h-24 border-2 border-purple-500 bg-purple-500/10 rounded-full animate-pulse shadow-[0_0_20px_rgba(168,85,247,0.5)]"></div>
                                <div className="absolute top-[28%] left-[55%] bg-purple-900/80 border border-purple-500 text-white text-[10px] px-2 py-1 rounded backdrop-blur shadow-lg">
                                    <div className="font-bold flex items-center gap-1"><BrainCircuit size={10}/> AI FINDING</div>
                                    <div className="opacity-80">94% probability: Hyperintensity</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar - Report Drafting */}
                <div className="w-80 bg-[#111] border-l border-white/5 flex flex-col z-20">
                    <div className="p-4 border-b border-white/5">
                        <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                            <FileText size={16} className="text-blue-400" />
                            Radiology Report
                        </h3>
                    </div>
                    <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                        
                        {/* AI Auto-Summary */}
                        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <BrainCircuit size={14} className="text-purple-400"/>
                                <span className="text-xs font-bold text-purple-400">AI Draft Suggestion</span>
                            </div>
                            <p className="text-[12px] text-gray-300 italic">
                                "T1 and T2 weighted sequences show normal ventricular size and configuration. No evidence of acute intracranial hemorrhage. A focal 1.2cm hyperintensity is noted in the left frontal lobe..."
                            </p>
                            <button 
                                onClick={() => setReportText("T1 and T2 weighted sequences show normal ventricular size and configuration. No evidence of acute intracranial hemorrhage. A focal 1.2cm hyperintensity is noted in the left frontal lobe. Impression: Non-specific small hyperintensity, clinical correlation recommended.")}
                                className="mt-2 text-[11px] text-purple-400 font-semibold hover:text-purple-300"
                            >
                                + Insert AI Draft
                            </button>
                        </div>

                        <div className="flex flex-col flex-1">
                            <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-semibold">Findings & Impression</label>
                            <textarea 
                                value={reportText}
                                onChange={(e) => setReportText(e.target.value)}
                                className="flex-1 bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 text-sm text-gray-200 resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 custom-scrollbar"
                                placeholder="Type your radiological findings here..."
                            />
                        </div>

                    </div>
                    <div className="p-4 border-t border-white/5">
                        <button 
                            onClick={handleSaveReport}
                            disabled={saving}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
                        >
                            {saving ? (
                                'Saving...'
                            ) : saved ? (
                                <><CheckCircle2 size={18} /> Signed & Saved</>
                            ) : (
                                <><Save size={18} /> Sign & Finalize Report</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
            `}</style>
        </div>
    );
}

function ToolButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            title={label}
            className={`p-2 rounded transition-colors flex items-center justify-center ${active ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
        >
            {icon}
        </button>
    );
}
