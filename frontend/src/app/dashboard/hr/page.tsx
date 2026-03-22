'use client';

import { useState, useEffect } from 'react';
import { UsersRound, CalendarCheck, Wallet, CheckCircle2 } from 'lucide-react';

export default function HRPage() {
    const [activeTab, setActiveTab] = useState<'employees' | 'attendance' | 'payroll'>('employees');

    const [employees, setEmployees] = useState<any[]>([]);
    const [attendances, setAttendances] = useState<any[]>([]);
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [today, setToday] = useState(new Date().toISOString().split('T')[0]);
    const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1);
    const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());

    // Input states for generating payroll
    const [selectedEmpForPayroll, setSelectedEmpForPayroll] = useState<any>(null);
    const [basicSalary, setBasicSalary] = useState(0);
    const [allowances, setAllowances] = useState(0);
    const [deductions, setDeductions] = useState(0);

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        if (activeTab === 'attendance') fetchAttendance(today);
        if (activeTab === 'payroll') fetchPayroll(payrollMonth, payrollYear);
    }, [activeTab, today, payrollMonth, payrollYear]);

    const fetchEmployees = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/hr/employees', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setEmployees(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); setEmployees([]); }
    };

    const fetchAttendance = async (date: string) => {
        try {
            const res = await fetch(`http://localhost:5000/api/hr/attendance?date=${date}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setAttendances(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); setAttendances([]); }
    };

    const fetchPayroll = async (month: number, year: number) => {
        try {
            const res = await fetch(`http://localhost:5000/api/hr/payroll?month=${month}&year=${year}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setPayrolls(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); setPayrolls([]); }
    };

    const markAttendance = async (employeeId: string, status: string) => {
        setLoading(true);
        try {
            await fetch('http://localhost:5000/api/hr/attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ employeeId, status, date: today })
            });
            fetchAttendance(today);
        } catch (err) { console.error(err) }
        setLoading(false);
    };

    const getAttendanceStatusForEmployee = (empId: string) => {
        const record = attendances.find(a => a.employeeId === empId);
        return record?.status || 'UNMARKED';
    };

    const handleGeneratePayroll = async () => {
        if (!selectedEmpForPayroll) return;
        setLoading(true);
        try {
            await fetch('http://localhost:5000/api/hr/payroll', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    employeeId: selectedEmpForPayroll.id,
                    month: payrollMonth,
                    year: payrollYear,
                    basicSalary, allowances, deductions
                })
            });
            setSelectedEmpForPayroll(null);
            setBasicSalary(0); setAllowances(0); setDeductions(0);
            fetchPayroll(payrollMonth, payrollYear);
        } catch (err) { console.error(err) }
        setLoading(false);
    };

    const processPayroll = async (payrollId: string) => {
        try {
            await fetch(`http://localhost:5000/api/hr/payroll/${payrollId}/process`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            fetchPayroll(payrollMonth, payrollYear);
        } catch (err) { console.error(err) }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <UsersRound className="text-amber-500" /> Human Resources & Payroll
                </h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
                {/* Tabs */}
                <div className="flex border-b border-slate-200 bg-slate-50">
                    <button
                        onClick={() => setActiveTab('employees')}
                        className={`flex-1 py-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'employees' ? 'border-amber-500 text-amber-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        <div className="flex justify-center items-center gap-2"><UsersRound size={16} /> Employee Management</div>
                    </button>
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`flex-1 py-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'attendance' ? 'border-amber-500 text-amber-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        <div className="flex justify-center items-center gap-2"><CalendarCheck size={16} /> Daily Attendance</div>
                    </button>
                    <button
                        onClick={() => setActiveTab('payroll')}
                        className={`flex-1 py-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'payroll' ? 'border-amber-500 text-amber-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        <div className="flex justify-center items-center gap-2"><Wallet size={16} /> Payroll & Compensation</div>
                    </button>
                </div>

                <div className="p-6">

                    {/* EMPLOYEES TAB */}
                    {activeTab === 'employees' && (
                        <div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 rounded-tl-lg">Employee ID</th>
                                        <th className="p-4">Name</th>
                                        <th className="p-4">Department & Role</th>
                                        <th className="p-4">Registered On</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {employees.map(e => (
                                        <tr key={e.id} className="hover:bg-slate-50">
                                            <td className="p-4 font-semibold text-slate-700">{e.user.employeeId}</td>
                                            <td className="p-4 font-bold text-slate-900">{e.firstName} {e.lastName}</td>
                                            <td className="p-4">
                                                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs inline-block mb-1">{e.department}</span>
                                                <div className="text-xs text-slate-500">{e.designation}</div>
                                            </td>
                                            <td className="p-4 text-slate-500">{new Date(e.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                    {employees.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-400">No employees found</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ATTENDANCE TAB */}
                    {activeTab === 'attendance' && (
                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <label className="font-bold text-sm text-slate-700">Date Select:</label>
                                <input
                                    type="date"
                                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                                    value={today}
                                    onChange={e => setToday(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {employees.map(e => {
                                    const status = getAttendanceStatusForEmployee(e.id);
                                    return (
                                        <div key={e.id} className={`border rounded-xl p-4 transition shadow-sm ${status === 'PRESENT' ? 'border-emerald-200 bg-emerald-50' : status === 'ABSENT' ? 'border-rose-200 bg-rose-50' : status === 'HALF_DAY' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="font-bold text-slate-900">{e.firstName} {e.lastName}</div>
                                                    <div className="text-xs font-mono text-slate-500">{e.user.employeeId} - {e.department}</div>
                                                </div>
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' : status === 'UNMARKED' ? 'bg-slate-100 text-slate-500' : 'bg-rose-100 text-rose-700'}`}>
                                                    {status}
                                                </span>
                                            </div>

                                            <div className="flex gap-2">
                                                <button disabled={loading} onClick={() => markAttendance(e.id, 'PRESENT')} className="flex-1 bg-white border border-slate-300 hover:border-emerald-500 text-xs font-bold py-1.5 rounded transition">P</button>
                                                <button disabled={loading} onClick={() => markAttendance(e.id, 'HALF_DAY')} className="flex-1 bg-white border border-slate-300 hover:border-amber-500 text-xs font-bold py-1.5 rounded transition">HD</button>
                                                <button disabled={loading} onClick={() => markAttendance(e.id, 'ABSENT')} className="flex-1 bg-white border border-slate-300 hover:border-rose-500 text-xs font-bold py-1.5 rounded transition">A</button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* PAYROLL TAB */}
                    {activeTab === 'payroll' && (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                            {/* Generation Block */}
                            <div className="md:col-span-5 bg-slate-50 p-6 rounded-xl border border-slate-200 h-fit">
                                <h3 className="font-bold text-slate-800 mb-4 pb-2 border-b">Payroll Generator</h3>

                                <div className="flex gap-4 mb-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-semibold mb-1 text-slate-500">Month (1-12)</label>
                                        <input type="number" min="1" max="12" value={payrollMonth} onChange={(e) => setPayrollMonth(Number(e.target.value))} className="w-full text-sm border p-2 rounded" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-semibold mb-1 text-slate-500">Year</label>
                                        <input type="number" min="2020" max="2050" value={payrollYear} onChange={(e) => setPayrollYear(Number(e.target.value))} className="w-full text-sm border p-2 rounded" />
                                    </div>
                                </div>

                                <label className="block text-xs font-semibold mb-1 text-slate-500">Select Employee</label>
                                <select
                                    className="w-full text-sm border p-2 rounded bg-white mb-4"
                                    value={selectedEmpForPayroll?.id || ''}
                                    onChange={(e) => {
                                        const emp = employees.find(emp => emp.id === e.target.value);
                                        setSelectedEmpForPayroll(emp);
                                    }}
                                >
                                    <option value="">-- Employee List --</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.user.employeeId})</option>)}
                                </select>

                                {selectedEmpForPayroll && (
                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mt-2 space-y-3">
                                        <div>
                                            <label className="block text-xs font-semibold mb-1 text-slate-500">Basic Salary (₹)</label>
                                            <input type="number" value={basicSalary} onChange={e => setBasicSalary(Number(e.target.value))} className="w-full text-sm border p-2 rounded" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold mb-1 text-slate-500">Allowances (Bonus, Transport) (₹)</label>
                                            <input type="number" value={allowances} onChange={e => setAllowances(Number(e.target.value))} className="w-full text-sm border p-2 rounded" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold mb-1 text-slate-500">Deductions (TDS, EPF, LWP) (₹)</label>
                                            <input type="number" value={deductions} onChange={e => setDeductions(Number(e.target.value))} className="w-full text-sm border p-2 rounded border-rose-200 bg-rose-50" />
                                        </div>

                                        <div className="pt-2 border-t font-bold flex justify-between">
                                            <span>Net Payload:</span>
                                            <span className="text-emerald-700">₹{(basicSalary + allowances - deductions).toFixed(2)}</span>
                                        </div>

                                        <button
                                            onClick={handleGeneratePayroll}
                                            disabled={loading}
                                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded shadow transition mt-2"
                                        >
                                            Generate Payroll Slip
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Payroll Master List */}
                            <div className="md:col-span-7">
                                <h3 className="font-bold text-slate-800 mb-4 pb-2 border-b">Payroll Logs ({payrollMonth}/{payrollYear})</h3>
                                <div className="space-y-3">
                                    {payrolls.map(pr => (
                                        <div key={pr.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
                                            <div>
                                                <div className="font-bold text-slate-900">{pr.employee.firstName} {pr.employee.lastName} <span className="text-xs font-mono text-slate-500 ml-2">{pr.employee.user.employeeId}</span></div>
                                                <div className="text-sm text-slate-600 mt-1 flex gap-4">
                                                    <span>Basic: ₹{pr.basicSalary}</span>
                                                    <span className="text-rose-500">Deds: ₹{pr.deductions}</span>
                                                    <span className="font-bold text-emerald-700">Net: ₹{pr.netSalary}</span>
                                                </div>
                                            </div>
                                            <div>
                                                {pr.status === 'PENDING' ? (
                                                    <button onClick={() => processPayroll(pr.id)} className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold px-4 py-2 rounded-lg text-sm shadow-sm transition">
                                                        Execute Salary Transfer
                                                    </button>
                                                ) : (
                                                    <span className="flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 text-sm"><CheckCircle2 size={16} /> Paid</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {payrolls.length === 0 && <div className="text-center p-8 bg-slate-50 border border-slate-200 rounded text-slate-400">No payrolls generated for this period!</div>}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}
