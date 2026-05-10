const fs = require('fs');

let content = fs.readFileSync('src/app/dashboard/ehr/page.tsx', 'utf8');

// Add the handleUndoLab function
const undoLabFunc = `    const handleUndoLab = async (id: string) => {
        if (!confirm('Are you sure you want to undo this lab order?')) return;
        try {
            const res = await apiFetch(\`/patient/ehr/lab-order/\${id}\`, { method: 'DELETE' });
            if (res.ok) loadVisits();
            else alert('Failed to undo or it is already being processed.');
        } catch (err) { console.error(err); }
    };
`;

if (!content.includes('handleUndoLab')) {
    content = content.replace(
        'const handleOrderLab = async',
        undoLabFunc + '\n    const handleOrderLab = async'
    );
}

// Add the handleUndoRx function
const undoRxFunc = `    const handleUndoRx = async (id: string) => {
        if (!confirm('Are you sure you want to undo this prescription?')) return;
        try {
            const res = await apiFetch(\`/patient/ehr/prescription/\${id}\`, { method: 'DELETE' });
            if (res.ok) loadVisits();
            else alert('Failed to undo or it is already dispensed.');
        } catch (err) { console.error(err); }
    };
`;

if (!content.includes('handleUndoRx')) {
    content = content.replace(
        'const handleSubmitRx = async',
        undoRxFunc + '\n    const handleSubmitRx = async'
    );
}

// Add Undo button to Active Lab Orders
const labOrderHtml = `<div className="mt-2 text-right">
                                                                        <a href={\`/dashboard/lab/report/\${lo.id}\`} target="_blank" rel="noopener noreferrer" className="text-[11px] bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 px-3 py-1.5 rounded-full font-bold inline-flex items-center gap-1 transition">
                                                                            <FileText size={12} /> View Report
                                                                        </a>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-[11px] text-gray-500 mt-1">Pending</div>
                                                                )}`;
const newLabOrderHtml = `<div className="mt-2 text-right">
                                                                        <a href={\`/dashboard/lab/report/\${lo.id}\`} target="_blank" rel="noopener noreferrer" className="text-[11px] bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 px-3 py-1.5 rounded-full font-bold inline-flex items-center gap-1 transition">
                                                                            <FileText size={12} /> View Report
                                                                        </a>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex justify-end mt-2">
                                                                        <button onClick={() => handleUndoLab(lo.id)} className="text-[11px] bg-red-600/20 text-red-400 hover:bg-red-600/30 px-3 py-1 rounded-full font-bold transition">Undo</button>
                                                                    </div>
                                                                )}`;

if (content.includes('Pending</div>')) {
    content = content.replace(labOrderHtml, newLabOrderHtml);
}

// Add Undo button to Prescriptions
const rxHtml = `<StatusBadge status={rx.status} />
                                                    </div>
                                                    <div className="space-y-1">`;
const newRxHtml = `<div className="flex items-center gap-2">
                                                            {rx.status === 'PENDING' && (
                                                                <button onClick={() => handleUndoRx(rx.id)} className="text-[10px] bg-red-600/20 text-red-400 hover:bg-red-600/30 px-2 py-0.5 rounded font-bold transition">Undo</button>
                                                            )}
                                                            <StatusBadge status={rx.status} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">`;

if (!content.includes('handleUndoRx(rx.id)')) {
    content = content.replace(rxHtml, newRxHtml);
}

fs.writeFileSync('src/app/dashboard/ehr/page.tsx', content);
console.log('EHR Undo Buttons Added');
