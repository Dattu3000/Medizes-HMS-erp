'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [employeeId, setEmployeeId] = useState('');
    const [password, setPassword] = useState('');
    const [otpMode, setOtpMode] = useState(false);
    const [otp, setOtp] = useState('');
    const [tempToken, setTempToken] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (!otpMode) {
                // Step 1: Login with Employee ID and Password
                const res = await fetch('http://localhost:5000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ employeeId, password }),
                });

                const data = await res.json();

                if (!res.ok) throw new Error(data.message || 'Login failed');

                if (data.otpRequired) {
                    setOtpMode(true);
                    setTempToken(data.tempToken);
                } else {
                    localStorage.setItem('token', data.token);
                    router.push('/dashboard');
                }
            } else {
                // Step 2: Verify OTP
                const res = await fetch('http://localhost:5000/api/auth/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tempToken, token: otp }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'OTP Verification failed');

                localStorage.setItem('token', data.token);
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center animated-bg relative">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] z-0 pointer-events-none" />
            <div className="w-full max-w-md p-8 glass-panel rounded-2xl shadow-2xl z-10 mx-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent tracking-tight">Medisys HMS</h1>
                    <p className="text-slate-600 font-medium mt-2">Hospital ERP System Access</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    {!otpMode ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID</label>
                                <input
                                    type="text"
                                    value={employeeId}
                                    onChange={(e) => setEmployeeId(e.target.value)}
                                    className="w-full px-4 py-2 bg-white/50 border border-slate-200/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm outline-none backdrop-blur-sm"
                                    placeholder="EMP-2026-XXXX"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 bg-white/50 border border-slate-200/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm outline-none backdrop-blur-sm"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Enter 2FA Code</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full px-4 py-2 bg-white/50 border border-slate-200/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-center tracking-widest text-lg shadow-sm outline-none backdrop-blur-sm"
                                placeholder="000000"
                                maxLength={6}
                                required
                            />
                            <p className="text-xs text-slate-500 mt-2 text-center">Open your authenticator app to view the code.</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold py-2.5 rounded-lg transition-all shadow-md transform hover:-translate-y-0.5"
                    >
                        {otpMode ? 'Verify & Login' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
