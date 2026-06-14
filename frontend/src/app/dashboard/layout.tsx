'use client';
import { API_BASE } from '@/lib/api';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Activity, LogOut, Pill, UsersRound, FilePlus2, IndianRupee, BarChart3, ShieldCheck, Wallet, Stethoscope, Bell, AlertTriangle, X, Server, Sun, Moon, FileText } from 'lucide-react';
import Link from 'next/link';
import SecurityBoundary from '@/components/SecurityBoundary';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);

    const [isDayMode, setIsDayMode] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            setIsDayMode(true);
            document.documentElement.classList.add('theme-light');
        }
        document.documentElement.classList.add('transition-theme');
    }, []);

    const toggleTheme = () => {
        setIsDayMode(!isDayMode);
        if (!isDayMode) {
            document.documentElement.classList.add('theme-light');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.classList.remove('theme-light');
            localStorage.setItem('theme', 'dark');
        }
    };


    // Notifications
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifPanel, setShowNotifPanel] = useState(false);

    // Treasury Alert
    const [treasuryAlert, setTreasuryAlert] = useState<'NORMAL' | 'WARNING' | 'CRITICAL'>('NORMAL');

    const fetchTreasuryAlert = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch(`${API_BASE}/api/v1/analytics/predictive-tax`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setTreasuryAlert(data.data.treasuryAlertLevel);
                }
            }
        } catch (err) { /* silent */ }
    }, []);

    const fetchNotifications = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch(`${API_BASE}/api/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setNotifications(await res.json());
        } catch (err) { /* silent */ }
    }, []);

    const markNotifRead = async (id: string) => {
        try {
            await fetch(`${API_BASE}/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            fetchNotifications();
        } catch (err) { /* silent */ }
    };

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            router.push('/login');
        } else {
            setLoading(false);
            fetchNotifications();
            fetchTreasuryAlert();
            const interval = setInterval(() => {
                fetchNotifications();
                fetchTreasuryAlert();
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [router, fetchNotifications, fetchTreasuryAlert]);

    if (loading) return null;

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const navItems = [
        { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Patient & OPD', href: '/dashboard/patients', icon: Users },
        { name: 'Doctor\'s EHR', href: '/dashboard/ehr', icon: Stethoscope },
        { name: 'IPD / Wards', href: '/dashboard/ipd', icon: Activity },
        { name: 'IoMT Gateway', href: '/dashboard/iot', icon: Server },
        { name: 'Pharmacy', href: '/dashboard/pharmacy', icon: Pill },
        { name: 'Lab Reports', href: '/dashboard/lab', icon: FilePlus2 },
        { name: 'HR Module', href: '/dashboard/hr', icon: UsersRound },
        { name: 'Billing Desk', href: '/dashboard/billing', icon: Wallet },
        { name: 'Claims & TPA', href: '/dashboard/claims', icon: FileText },
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
                        {/* Treasury Alert Badge */}
                        {treasuryAlert !== 'NORMAL' && (
                            <div className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-2 animate-pulse ${
                                treasuryAlert === 'CRITICAL' 
                                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]' 
                                    : 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                            }`}>
                                <AlertTriangle size={14} />
                                {treasuryAlert === 'CRITICAL' ? 'CRITICAL CASH EXPOSURE' : 'TREASURY WARNING'}
                            </div>
                        )}
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg bg-[#0F172A] hover:bg-slate-700 text-gray-400 hover:text-white transition relative preserve-color"
                            title="Toggle Day/Night Shift Mode"
                        >
                            {isDayMode ? <Moon size={18} className="text-indigo-400" /> : <Sun size={18} className="text-amber-400" />}
                        </button>
                        
                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifPanel(!showNotifPanel)}
                                className="p-2 rounded-lg bg-[#0F172A] hover:bg-slate-700 text-gray-400 hover:text-white transition relative"
                            >
                                <Bell size={18} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>
                            {showNotifPanel && (
                                <div className="absolute right-0 top-11 w-[380px] bg-[#111827] border border-slate-700 rounded-xl shadow-2xl z-50 max-h-[420px] flex flex-col overflow-hidden">
                                    <div className="p-3 border-b border-slate-800 flex items-center justify-between shrink-0">
                                        <span className="text-[13px] font-bold text-gray-200">Notifications</span>
                                        <button onClick={() => setShowNotifPanel(false)}><X size={14} className="text-gray-500 hover:text-white" /></button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-gray-500 text-[13px]">No notifications</div>
                                        ) : notifications.slice(0, 20).map(n => (
                                            <div key={n.id} onClick={() => markNotifRead(n.id)}
                                                className={`p-3 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800/50 transition ${!n.isRead ? 'bg-blue-500/5' : ''}`}>
                                                <div className="flex items-start gap-2">
                                                    {n.priority === 'CRITICAL'
                                                        ? <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
                                                        : <Bell size={14} className="text-blue-400 mt-0.5 shrink-0" />
                                                    }
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[12px] font-semibold text-gray-200 truncate">{n.title}</div>
                                                        <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.body}</div>
                                                        <div className="text-[10px] text-gray-600 mt-1">{new Date(n.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                                    </div>
                                                    {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
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

            {/* v6.0 Security Boundary — Tenant Isolation Violation Handler */}
            <SecurityBoundary />
        </div>
    );
}
