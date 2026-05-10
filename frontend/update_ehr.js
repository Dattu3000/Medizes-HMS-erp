const fs = require('fs');

let content = fs.readFileSync('src/app/dashboard/ehr/page.tsx', 'utf8');

content = content.replace(
    "'WAITING': 'bg-amber-500/15 text-amber-400 border-amber-500/20',",
    "'WAITING': 'bg-amber-500/15 text-amber-400 border-amber-500/20',\n        'WAITING_VIRTUAL': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',"
);

content = content.replace('ArrowRightLeft, Send', 'ArrowRightLeft, Send, Video');

content = content.replace(
    'const handleCompleteVisit = async () => {',
    `const handleStartTelemed = async () => {
        if (!selectedVisit) return;
        try {
            const res = await apiFetch('/telemed/session', {
                method: 'POST', body: JSON.stringify({ visitId: selectedVisit.id })
            });
            if (res.ok) {
                const data = await res.json();
                window.open(data.session.meetingLink, '_blank');
                loadVisits();
            } else {
                alert('Failed to start telemedicine session');
            }
        } catch (err) { console.error(err); }
    };

    const handleCompleteVisit = async () => {`
);

content = content.replace(
    "v.status === 'WAITING'",
    "(v.status === 'WAITING' || v.status === 'WAITING_VIRTUAL')"
);

const oldPillButton = `<Pill size={14} className="text-emerald-400" /> Write Prescription
                                    </button>`;
const newPillButton = `${oldPillButton}
                                    {(selectedVisit.status === 'WAITING' || selectedVisit.status === 'WAITING_VIRTUAL' || selectedVisit.status === 'IN_CONSULTATION') && (
                                        <button onClick={handleStartTelemed} className="w-full flex items-center gap-2 bg-indigo-900/40 hover:bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 p-2.5 rounded-lg text-[12px] font-medium transition">
                                            <Video size={14} className="text-indigo-400" /> Start Virtual Room
                                        </button>
                                    )}`;

content = content.replace(oldPillButton, newPillButton);

fs.writeFileSync('src/app/dashboard/ehr/page.tsx', content);
console.log('Done');
