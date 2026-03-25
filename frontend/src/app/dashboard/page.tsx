'use client';

export default function DashboardOverview() {
    return (
        <>
            <h1 className="text-3xl font-bold tracking-tight text-glass-title mb-8">Hospital Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Metric Cards */}
                <div className="liquid-glass-card p-6 rounded-xl   ">
                    <h2 className="text-sm font-medium text-glass-body mb-2">My Profile</h2>
                    <div className="text-lg font-semibold text-glass-title">EMP-0000-ADMIN</div>
                    <p className="text-sm text-emerald-600 mt-1 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online
                    </p>
                </div>

                <div className="liquid-glass-card p-6 rounded-xl    flex flex-col justify-center gap-2">
                    <h2 className="text-sm font-medium text-glass-body">Active Modules</h2>
                    <div className="flex flex-wrap gap-2">
                        <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded">OPD & Registration</span>
                        <span className="bg-sky-50 text-sky-700 text-xs font-medium px-2 py-1 rounded">IPD & Wards</span>
                        <span className="bg-emerald-50 text-emerald-700 text-xs font-medium px-2 py-1 rounded">Pharmacy</span>
                        <span className="bg-purple-50 text-purple-700 text-xs font-medium px-2 py-1 rounded">Lab Diagnostics</span>
                        <span className="bg-amber-50 text-amber-700 text-xs font-medium px-2 py-1 rounded">HR Module</span>
                        <span className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-1 rounded">Accounts & Compliance</span>
                        <span className="bg-teal-50 text-teal-700 text-xs font-medium px-2 py-1 rounded">Reports & Analytics</span>
                    </div>
                </div>

                <div className="liquid-glass-card p-6 rounded-xl    flex flex-col justify-center gap-2">
                    <h2 className="text-sm font-medium text-glass-body">System Status</h2>
                    <div className="text-emerald-500 font-bold text-sm flex items-center gap-2">
                        <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        All 8 Phases Complete Core ERP Online
                    </div>
                </div>
            </div>
        </>
    );
}
