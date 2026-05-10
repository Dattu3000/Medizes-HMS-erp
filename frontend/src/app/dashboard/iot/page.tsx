'use client';
import { useState, useEffect } from 'react';
import { API_BASE } from '@/lib/api';
import { 
    Activity, Server, Wifi, WifiOff, AlertTriangle, 
    HeartPulse, Thermometer, ShieldAlert, Zap, 
    RefreshCcw, Settings2, Download
} from 'lucide-react';

const API = `${API_BASE}/api`;

function getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
}

function apiFetch(path: string, opts: RequestInit = {}) {
    return fetch(`${API}${path}`, {
        ...opts,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`,
            ...opts.headers
        }
    });
}

// Simulated Live Data Stream for aesthetic purposes
const generateMockVitals = () => {
    return {
        id: Math.random().toString(36).substring(7),
        deviceId: `DEV-${Math.floor(Math.random() * 900) + 100}`,
        bedNo: `B-${Math.floor(Math.random() * 20) + 1}`,
        spo2: Math.floor(Math.random() * 10) + 90,
        hr: Math.floor(Math.random() * 60) + 60,
        temp: (97 + Math.random() * 4).toFixed(1),
        timestamp: new Date().toLocaleTimeString(),
    };
};

export default function IoTDashboard() {
    const [devices, setDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [liveStream, setLiveStream] = useState<any[]>([]);
    const [sendingSimulation, setSendingSimulation] = useState(false);

    // Initial Load
    useEffect(() => {
        loadDevices();
    }, []);

    const loadDevices = async () => {
        try {
            setLoading(true);
            const res = await apiFetch('/iot/devices');
            if (res.ok) {
                const data = await res.json();
                setDevices(data);
            }
        } catch (err) {
            console.error('Error loading devices:', err);
        } finally {
            setLoading(false);
        }
    };

    // Simulate Live WebSockets / MQTT Stream
    useEffect(() => {
        const interval = setInterval(() => {
            setLiveStream(prev => [generateMockVitals(), ...prev].slice(0, 8));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleInjectCriticalVitals = async () => {
        setSendingSimulation(true);
        try {
            // Pick the first active device to send vitals for
            const device = devices.find(d => d.status === 'ACTIVE');
            if (!device) {
                alert("No active devices found. Please register one first.");
                setSendingSimulation(false);
                return;
            }

            // Sending critical NEWS2 vitals
            await apiFetch('/iot/vitals', {
                method: 'POST',
                body: JSON.stringify({
                    deviceMac: device.macAddress,
                    vitals: {
                        spo2: 88, // Score 3
                        heartRate: 140, // Score 3
                        temperature: 39.5, // Score 2
                        bloodPressure: "90/60", // Systolic 90 = Score 3
                        respiratoryRate: 26 // Score 3
                        // Total NEWS2 >= 7 (CRITICAL)
                    }
                })
            });
            
            // Just for visual effect in UI
            alert('Critical vitals injected. EWS engine has triggered RRT Notification!');
        } catch (err) {
            console.error(err);
        } finally {
            setSendingSimulation(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#050505] text-gray-200">
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-[#0a0a0a] flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                        <Activity className="text-emerald-400" size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-wide">IoMT Gateway</h1>
                        <p className="text-xs text-emerald-500 font-mono flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            MQTT Broker Online • HL7/FHIR Sync Active
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={loadDevices} className="bg-[#111] hover:bg-[#1a1a1a] border border-white/10 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition">
                        <RefreshCcw size={16} /> Sync Network
                    </button>
                    <button className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition">
                        <Settings2 size={16} /> Gateway Config
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
                
                {/* Top Metrics Row */}
                <div className="grid grid-cols-4 gap-4 shrink-0">
                    <MetricCard 
                        title="Active Sensors" 
                        value={devices.filter(d => d.status === 'ACTIVE').length.toString()} 
                        total={`/ ${devices.length}`} 
                        icon={<Server size={18} className="text-blue-400"/>} 
                        trend="+2 today"
                    />
                    <MetricCard 
                        title="Network Ping" 
                        value="12" 
                        total="ms" 
                        icon={<Wifi size={18} className="text-emerald-400"/>} 
                        trend="Stable"
                    />
                    <MetricCard 
                        title="Data Packets" 
                        value="1.4M" 
                        total="/hr" 
                        icon={<Zap size={18} className="text-amber-400"/>} 
                        trend="High throughput"
                    />
                    <MetricCard 
                        title="EWS Critical Alerts" 
                        value="2" 
                        total="Active" 
                        icon={<AlertTriangle size={18} className="text-red-400"/>} 
                        trend="Requires immediate RRT"
                        alert={true}
                    />
                </div>

                {/* Dashboard Grid */}
                <div className="flex-1 grid grid-cols-12 gap-6 min-h-[400px]">
                    
                    {/* Left - Ward Bed Matrix */}
                    <div className="col-span-8 bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 flex flex-col relative overflow-hidden">
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
                        
                        <div className="flex items-center justify-between mb-6 z-10">
                            <div>
                                <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider">Ward 3A Matrix (Cardiology)</h3>
                                <p className="text-xs text-gray-500 mt-1">Real-time patient EWS monitoring</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-semibold">
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Normal (0-2)</span>
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Med (3-4)</span>
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span> Critical (7+)</span>
                            </div>
                        </div>

                        {/* Matrix Grid */}
                        <div className="flex-1 grid grid-cols-4 gap-4 z-10">
                            {/* Static mock data for UI visual impact */}
                            {[
                                { bed: '3A-01', status: 'normal', spo2: 98, hr: 72 },
                                { bed: '3A-02', status: 'normal', spo2: 96, hr: 84 },
                                { bed: '3A-03', status: 'med', spo2: 93, hr: 105 },
                                { bed: '3A-04', status: 'normal', spo2: 99, hr: 65 },
                                { bed: '3A-05', status: 'critical', spo2: 88, hr: 142 }, // Pulse Red indicator
                                { bed: '3A-06', status: 'offline', spo2: null, hr: null },
                                { bed: '3A-07', status: 'normal', spo2: 97, hr: 78 },
                                { bed: '3A-08', status: 'normal', spo2: 95, hr: 80 },
                            ].map((bed) => (
                                <div key={bed.bed} className={`rounded-xl p-4 border transition-all duration-300 ${
                                    bed.status === 'normal' ? 'bg-[#111] border-emerald-500/20 hover:border-emerald-500/40' :
                                    bed.status === 'med' ? 'bg-amber-950/20 border-amber-500/30' :
                                    bed.status === 'critical' ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)] ring-1 ring-red-500/30' :
                                    'bg-gray-900/50 border-white/5 opacity-60'
                                }`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="font-mono font-bold text-sm">{bed.bed}</div>
                                        {bed.status === 'offline' ? <WifiOff size={14} className="text-gray-600"/> : <Activity size={14} className={
                                            bed.status === 'critical' ? 'text-red-400 animate-pulse' : 
                                            bed.status === 'med' ? 'text-amber-400' : 'text-emerald-400'
                                        }/>}
                                    </div>
                                    
                                    {bed.status !== 'offline' ? (
                                        <div className="flex justify-between mt-auto">
                                            <div>
                                                <div className="text-[10px] text-gray-500 uppercase font-semibold">SpO2</div>
                                                <div className={`text-lg font-bold ${bed.spo2! < 92 ? 'text-red-400' : 'text-white'}`}>{bed.spo2}%</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] text-gray-500 uppercase font-semibold">HR</div>
                                                <div className={`text-lg font-bold ${bed.hr! > 120 ? 'text-red-400' : 'text-white'}`}>{bed.hr}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-600 text-center mt-4">Sensor Offline</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right - Live Data Stream */}
                    <div className="col-span-4 bg-[#0a0a0a] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-gradient-to-r from-blue-900/10 to-transparent flex justify-between items-center">
                            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                                <Zap size={14}/> MQTT Live Feed
                            </h3>
                            <span className="flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-2 font-mono text-[11px] custom-scrollbar">
                            {liveStream.map((log, i) => (
                                <div key={log.id} className="p-2 border-b border-white/5 hover:bg-white/5 transition flex items-center gap-3" style={{ opacity: 1 - (i * 0.1) }}>
                                    <div className="text-gray-500 w-16">{log.timestamp}</div>
                                    <div className="text-blue-400 w-12">{log.bedNo}</div>
                                    <div className="flex-1 text-gray-300">
                                        <span className="text-emerald-400">SpO2:{log.spo2}</span> | 
                                        <span className="text-red-400 ml-1">HR:{log.hr}</span> | 
                                        <span className="text-amber-400 ml-1">T:{log.temp}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Inject Critical Alert Simulation Tool */}
                        <div className="p-4 border-t border-white/5 bg-[#111]">
                            <h4 className="text-xs text-gray-400 font-bold uppercase mb-2">Simulate AI EWS Trigger</h4>
                            <p className="text-[10px] text-gray-500 mb-3 leading-tight">
                                Inject a payload with CRITICAL NEWS2 vitals to trigger the AI-driven Rapid Response Team (RRT) alert via the backend.
                            </p>
                            <button 
                                onClick={handleInjectCriticalVitals}
                                disabled={sendingSimulation}
                                className="w-full bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <ShieldAlert size={14} /> {sendingSimulation ? 'Injecting Payload...' : 'Trigger Critical Vitals Payload'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Device Registry Table */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden mt-2">
                    <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#111]">
                        <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider">Registered Medical Devices</h3>
                        <button className="text-xs text-gray-400 flex items-center gap-1 hover:text-white"><Download size={14}/> Export CSV</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="text-xs text-gray-500 uppercase bg-[#0a0a0a] border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4">Device ID / Type</th>
                                    <th className="px-6 py-4">MAC Address</th>
                                    <th className="px-6 py-4">Assigned Ward</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Last Sync</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} className="text-center py-8">Loading registry...</td></tr>
                                ) : devices.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-8 text-gray-600">No devices registered in database.</td></tr>
                                ) : devices.map(d => (
                                    <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-200">{d.deviceType}</div>
                                            <div className="text-xs">{d.id.substring(0,8)}...</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">{d.macAddress}</td>
                                        <td className="px-6 py-4">{d.ward?.name || 'Unassigned'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${d.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                                                {d.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs">{new Date(d.lastSync).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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

function MetricCard({ title, value, total, icon, trend, alert = false }: any) {
    return (
        <div className={`bg-[#0a0a0a] border ${alert ? 'border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-white/5'} rounded-2xl p-5 relative overflow-hidden`}>
            <div className="flex justify-between items-start mb-2">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</div>
                <div className={`p-2 rounded-lg ${alert ? 'bg-red-500/10' : 'bg-white/5'}`}>{icon}</div>
            </div>
            <div className="flex items-end gap-1 mb-1">
                <div className={`text-3xl font-bold ${alert ? 'text-red-400' : 'text-gray-100'}`}>{value}</div>
                <div className="text-gray-500 font-semibold mb-1">{total}</div>
            </div>
            <div className={`text-[11px] font-semibold ${alert ? 'text-red-500/70' : 'text-emerald-500/70'}`}>{trend}</div>
        </div>
    );
}
