'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Activity, LogOut, Pill, UsersRound, FilePlus2, IndianRupee, BarChart3, ShieldCheck, Wallet } from 'lucide-react';
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
        <div className="flex h-screen liquid-bg">
            {/* Sidebar */}
            <aside className="w-64 liquid-glass-card border-l-0 border-y-0 border-r border-white/10 rounded-none bg-black/40 text-white flex flex-col z-10 transition-all duration-300">
                <div className="p-6 border-b border-slate-700/50">
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
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive ? 'liquid-glass-panel text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
                                    >
                                        <Icon size={18} />
                                        <span className="text-sm font-medium">{item.name}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 text-sm text-rose-300 bg-rose-500/20 border border-rose-500/30 hover:bg-rose-500/30 w-full px-3 py-2.5 rounded-lg transition-all duration-200"
                    >
                        <LogOut size={18} />
                        <span>Secure Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Pane */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Main Dashboard Space */}

                <div className="flex-1 overflow-y-auto p-8 relative z-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
