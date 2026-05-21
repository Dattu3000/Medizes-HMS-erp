'use client';
import { useEffect, useState } from 'react';
import { API_BASE } from '@/lib/api';

interface Forecast {
    id: number;
    department: string;
    predictedCensus: number;
    requiredStaffRatio: number;
    confidenceInterval: number;
}

export default function DemandPipeline() {
    const [forecasts, setForecasts] = useState<Forecast[]>([]);

    useEffect(() => {
        const fetchDemand = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE}/api/hr/analytics/demand-forecast`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setForecasts(data);
                }
            } catch (err) {
                console.error('Error fetching demand forecast', err);
            }
        };
        fetchDemand();
    }, []);

    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-xl font-bold tracking-tight mb-2">Demand Pipeline</h2>
            {forecasts.map(f => (
                <div key={f.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-lg">{f.department}</h3>
                        <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">
                            {(f.confidenceInterval * 100).toFixed(0)}% Confidence
                        </span>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm text-slate-400 mb-1">
                                <span>Predicted Census Surge</span>
                                <span>{f.predictedCensus} Pts</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min((f.predictedCensus / 150) * 100, 100)}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm text-slate-400 mb-1">
                                <span>Required Staffing Ratio</span>
                                <span>1:{f.requiredStaffRatio}</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Math.min((f.requiredStaffRatio / 5) * 100, 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
