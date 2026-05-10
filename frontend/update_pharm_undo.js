const fs = require('fs');

const path = 'src/app/dashboard/pharmacy/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const undoFunc = `    const handleUndoDispenseRx = async (prescriptionId: string) => {
        if (!confirm('Are you sure you want to undo this dispense?')) return;
        setDispensingId(prescriptionId);
        try {
            const res = await fetch(\`\${API_BASE}/api/pharmacy/prescriptions/undo\`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: \`Bearer \${localStorage.getItem('token')}\`
                },
                body: JSON.stringify({ prescriptionId })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Dispense undone successfully.');
                fetchPrescriptions();
                fetchInventory();
            } else {
                alert(data.message || 'Failed to undo');
            }
        } catch (err) { console.error(err); }
        finally { setDispensingId(null); }
    };
`;

if (!content.includes('handleUndoDispenseRx')) {
    content = content.replace(
        'const handleRunAISafetyCheck = async',
        undoFunc + '\n    const handleRunAISafetyCheck = async'
    );
}

const statusBadgeHtml = `<div className="text-[11px] text-gray-500">
                                                        {rx.patient?.uhid} · Dr. {rx.visit?.doctor?.lastName || '—'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">`;

const newStatusBadgeHtml = `<div className="text-[11px] text-gray-500">
                                                        {rx.patient?.uhid} · Dr. {rx.visit?.doctor?.lastName || '—'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 text-[11px]">
                                                <span className={\`px-2 py-0.5 rounded font-bold \${rx.status === 'DISPENSED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}\`}>{rx.status}</span>
                                                <div className="flex items-center gap-1.5 text-gray-500">`;

if (!content.includes('rx.status === \'DISPENSED\' ? \'bg-emerald-500/20 text-emerald-400\'')) {
    content = content.replace(statusBadgeHtml, newStatusBadgeHtml);
}

const oldButtonsHtml = `<button
                                                onClick={() => handleDispenseRx(rx.id)}
                                                disabled={dispensingId === rx.id}
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition text-[11px] uppercase tracking-wider flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle2 size={14} />
                                                {dispensingId === rx.id ? 'Dispensing...' : 'Dispense & Bill'}
                                            </button>`;

const newButtonsHtml = `{rx.status === 'PENDING' ? (
                                                <button
                                                    onClick={() => handleDispenseRx(rx.id)}
                                                    disabled={dispensingId === rx.id}
                                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition text-[11px] uppercase tracking-wider flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle2 size={14} />
                                                    {dispensingId === rx.id ? 'Dispensing...' : 'Dispense & Bill'}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleUndoDispenseRx(rx.id)}
                                                    disabled={dispensingId === rx.id}
                                                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition text-[11px] uppercase tracking-wider flex items-center justify-center gap-2"
                                                >
                                                    <AlertTriangle size={14} />
                                                    {dispensingId === rx.id ? 'Undoing...' : 'Undo Dispense'}
                                                </button>
                                            )}`;

if (content.includes('Dispense & Bill')) {
    content = content.replace(oldButtonsHtml, newButtonsHtml);
}

fs.writeFileSync(path, content);
console.log('Pharmacy UI Undo Buttons Added');
