'use client';

export default function DashboardOverview() {
    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-[24px] font-semibold text-gray-50 tracking-tight">Hospital Overview</h1>
                <div className="flex items-center gap-3">
                    <button className="bg-[#1e293b] border border-slate-700 text-sm px-4 py-2 rounded-[8px] text-gray-300 hover:text-white transition">Export PDF</button>
                    <button className="bg-emerald-500 hover:bg-emerald-600 text-sm px-4 py-2 rounded-[8px] text-white font-bold transition">Generate Report</button>
                </div>
            </div>

            {/* 4 Cards Grid - IMAGE G REPLICA */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                <div className="bg-[#1e293b] p-5 rounded-[16px] border border-slate-800 shadow-xl flex flex-col justify-between h-32 relative overflow-hidden group hover:border-slate-600 transition">
                    <div className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Total Patients</div>
                    <div className="text-3xl font-bold text-gray-50 mt-2">1,248</div>
                    <div className="text-emerald-400 text-xs font-semibold mt-1 flex items-center gap-1">+12.5% vs last month</div>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition duration-500"></div>
                </div>

                <div className="bg-[#1e293b] p-5 rounded-[16px] border border-slate-800 shadow-xl flex flex-col justify-between h-32 relative overflow-hidden group hover:border-slate-600 transition">
                    <div className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Active Staff</div>
                    <div className="text-3xl font-bold text-gray-50 mt-2">342</div>
                    <div className="text-emerald-400 text-xs font-semibold mt-1 flex items-center gap-1">+2.4% vs last month</div>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition duration-500"></div>
                </div>

                <div className="bg-[#1e293b] p-5 rounded-[16px] border border-slate-800 shadow-xl flex flex-col justify-between h-32 relative overflow-hidden group hover:border-slate-600 transition">
                    <div className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Available Beds</div>
                    <div className="text-3xl font-bold text-gray-50 mt-2">84 <span className="text-sm font-medium text-gray-500">/ 250</span></div>
                    <div className="text-red-400 text-xs font-semibold mt-1 flex items-center gap-1">-5 limit threshold</div>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition duration-500"></div>
                </div>

                <div className="bg-[#1e293b] p-5 rounded-[16px] border border-slate-800 shadow-xl flex flex-col justify-between h-32 relative overflow-hidden group hover:border-slate-600 transition">
                    <div className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Est. Revenue</div>
                    <div className="text-3xl font-bold text-gray-50 mt-2">₹12.4M</div>
                    <div className="text-emerald-400 text-xs font-semibold mt-1 flex items-center gap-1">+18.2% vs last month</div>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition duration-500"></div>
                </div>

            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Graph */}
                <div className="lg:col-span-2 bg-[#1e293b] p-6 rounded-[16px] border border-slate-800 shadow-xl">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-bold text-gray-50 text-[15px]">Patient Flow Dynamics</h3>
                        <div className="flex gap-2 text-xs">
                            <span className="flex items-center gap-1 text-blue-400 font-medium"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Inpatient</span>
                            <span className="flex items-center gap-1 text-emerald-400 font-medium ml-3"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Outpatient</span>
                        </div>
                    </div>

                    {/* Simulated SVG Graph mimicking Image G */}
                    <div className="h-64 w-full relative border-l border-b border-slate-700/50">
                        <svg className="w-full h-full" preserveAspectRatio="none">
                            {/* Grid lines */}
                            <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" opacity="0.3"></line>
                            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" opacity="0.3"></line>
                            <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" opacity="0.3"></line>

                            {/* Blue Line (Inpatient) */}
                            <path d="M0,150 C50,130 100,160 150,110 C200,60 250,90 300,70 C350,50 400,100 450,40 C500,-20 550,50 600,20 L600,256 L0,256 Z" fill="url(#blue-gradient)" opacity="0.2" className="vector-path-anim"></path>
                            <path d="M0,150 C50,130 100,160 150,110 C200,60 250,90 300,70 C350,50 400,100 450,40 C500,-20 550,50 600,20" fill="none" stroke="#3b82f6" strokeWidth="3" className="vector-path-anim-stroke"></path>

                            {/* Emerald Line (Outpatient) */}
                            <path d="M0,200 C50,220 100,180 150,190 C200,200 250,140 300,150 C350,160 400,100 450,120 C500,140 550,90 600,80" fill="none" stroke="#10b981" strokeWidth="3" className="vector-path-anim-stroke-alt"></path>

                            <defs>
                                <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8"></stop>
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"></stop>
                                </linearGradient>
                            </defs>
                        </svg>

                        <div className="absolute -bottom-6 w-full flex justify-between text-[11px] text-gray-500 font-medium">
                            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                        </div>
                    </div>
                </div>

                {/* Secondary Donut/Composition */}
                <div className="lg:col-span-1 bg-[#1e293b] p-6 rounded-[16px] border border-slate-800 shadow-xl">
                    <h3 className="font-bold text-gray-50 text-[15px] mb-8">Department Load</h3>
                    <div className="flex flex-col items-center justify-center relative">
                        <div className="w-40 h-40 rounded-full border-[14px] border-slate-800 relative">
                            {/* CSS Conic gradient simulation for Donut */}
                            <div className="absolute inset-[-14px] rounded-full border-[14px] border-blue-500" style={{ clipPath: 'polygon(50% 50%, 50% 0, 100% 0, 100% 50%)' }}></div>
                            <div className="absolute inset-[-14px] rounded-full border-[14px] border-emerald-500" style={{ clipPath: 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%, 0 100%)' }}></div>
                            <div className="absolute inset-[-14px] rounded-full border-[14px] border-purple-500" style={{ clipPath: 'polygon(50% 50%, 0 100%, 0 0, 50% 0)' }}></div>
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-gray-50 block">85%</span>
                            <span className="text-[10px] uppercase tracking-wider text-gray-400">Total Utilization</span>
                        </div>
                    </div>
                    <div className="mt-8 space-y-3">
                        <div className="flex justify-between text-sm"><span className="text-blue-400 font-medium line-clamp-1 flex gap-2"><div className="w-3 h-3 rounded-md bg-blue-500 mt-0.5"></div>Cardiology</span> <span className="text-gray-300 font-semibold">32%</span></div>
                        <div className="flex justify-between text-sm"><span className="text-emerald-400 font-medium line-clamp-1 flex gap-2"><div className="w-3 h-3 rounded-md bg-emerald-500 mt-0.5"></div>Orthopedics</span> <span className="text-gray-300 font-semibold">45%</span></div>
                        <div className="flex justify-between text-sm"><span className="text-purple-400 font-medium line-clamp-1 flex gap-2"><div className="w-3 h-3 rounded-md bg-purple-500 mt-0.5"></div>Neurology</span> <span className="text-gray-300 font-semibold">23%</span></div>
                    </div>
                </div>

            </div>

        </div>
    );
}
