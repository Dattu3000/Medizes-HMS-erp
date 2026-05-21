'use client';
import { useEffect, useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';

/**
 * Medisys HMS v6.0 — SecurityBoundary Component
 *
 * Renders a non-blocking alert panel when a cross-branch tenant
 * isolation violation is detected by the apiFetch() wrapper.
 *
 * Usage: Place this component once in the root layout (e.g. DashboardLayout).
 * It listens for the 'tenant-violation' custom DOM event globally.
 */
export default function SecurityBoundary() {
    const [violation, setViolation] = useState<{ url: string; message: string } | null>(null);

    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            setViolation(detail);
        };

        window.addEventListener('tenant-violation', handler);
        return () => window.removeEventListener('tenant-violation', handler);
    }, []);

    if (!violation) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#0f172a] border-2 border-red-500/40 rounded-2xl max-w-md w-full mx-4 overflow-hidden shadow-2xl shadow-red-500/10">
                {/* Header */}
                <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/20 rounded-lg">
                            <ShieldAlert size={22} className="text-red-400" />
                        </div>
                        <h2 className="text-lg font-bold text-red-400">Security Boundary Violation</h2>
                    </div>
                    <button
                        onClick={() => setViolation(null)}
                        className="text-gray-500 hover:text-white transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <p className="text-slate-300 text-sm leading-relaxed">
                        {violation.message}
                    </p>
                    <div className="bg-[#1e293b] rounded-lg p-3 text-xs font-mono text-slate-400 break-all">
                        <span className="text-red-400 font-semibold">Blocked Request:</span> {violation.url}
                    </div>
                    <p className="text-slate-500 text-xs">
                        This incident has been logged. If you believe this is an error, contact your system administrator.
                    </p>
                </div>

                {/* Footer */}
                <div className="px-6 pb-5">
                    <button
                        onClick={() => setViolation(null)}
                        className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-medium py-2.5 rounded-lg text-sm transition"
                    >
                        Acknowledged — Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
}
