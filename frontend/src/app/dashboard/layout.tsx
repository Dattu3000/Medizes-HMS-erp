'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Activity, LogOut, Pill, UsersRound, FilePlus2, IndianRupee, BarChart3, ShieldCheck, Wallet, Stethoscope } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            router.push('/login');
        } else {
            setLoading(false);
        }
    }, [router]);

    if (loading) return null;

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const navItems = [
        { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Patient & OPD', href: '/dashboard/patients', icon: Users },
        { name: 'Doctor\'s EHR', href: '/dashboard/ehr', icon: Stethoscope },
        { name: 'IPD / Wards', href: '/dashboard/ipd', icon: Activity },
        { name: 'Pharmacy', href: '/dashboard/pharmacy', icon: Pill },
        { name: 'Lab Reports', href: '/dashboard/lab', icon: FilePlus2 },
        { name: 'HR Module', href: '/dashboard/hr', icon: UsersRound },
        { name: 'Billing Desk', href: '/dashboard/billing', icon: Wallet },
        { name: 'Accounts', href: '/dashboard/accounts', icon: IndianRupee },
        { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
        { name: 'System Admin', href: '/dashboard/admin', icon: ShieldCheck },
    ];

    return (
        <div className="flex h-screen bg-[#0F172A]">
            {/* Sidebar */}
            <aside className="w-[240px] bg-[#020617] border-r border-[#1F2937] text-white flex flex-col z-10">
                <div className="p-6 border-b border-[#1F2937]">
                    <h1 className="text-xl font-bold tracking-wider text-blue-400">MEDISYS <span className="text-white">HMS</span></h1>
                    <p className="text-xs text-slate-400 mt-1">Hospital ERP System</p>
                </div>

                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-1 px-3">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-r-lg transition-colors border-l-[3px] ${isActive ? 'bg-[#111827] text-white border-blue-600' : 'text-slate-400 hover:bg-[#111827] hover:text-white border-transparent'}`}
                                    >
                                        <Icon size={18} />
                                        <span className="text-sm font-medium">{item.name}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="p-4 border-t border-[#1F2937]">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 w-full px-3 py-2.5 rounded-lg transition-colors"
                    >
                        <LogOut size={18} />
                        <span>Secure Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Pane */}
            <main className="flex-1 flex flex-col overflow-hidden bg-[#0F172A]">
                {/* 60px Top Bar */}
                <header className="h-[60px] border-b border-[#1F2937] bg-[#111827] flex items-center justify-between px-8 shrink-0">
                    <div className="text-sm text-gray-400 font-medium tracking-wide flex items-center gap-2">
                        <span className="text-blue-500 font-semibold">MEDISYS</span> <span className="text-gray-600">/</span> <span className="text-gray-100">DASHBOARD</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-[#0F172A]">
                            AD
                        </div>
                    </div>
                </header>

                {/* Main Dashboard Space */}
                <div className="flex-1 overflow-y-auto p-8 relative">
                    {children}
                </div>
            </main>
        </div>
    );
}
