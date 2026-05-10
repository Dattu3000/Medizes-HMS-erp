const fs = require('fs');

let content = fs.readFileSync('src/app/dashboard/ehr/page.tsx', 'utf8');

// Add MonitorUp to imports if not there
if (!content.includes('MonitorUp')) {
    content = content.replace('Video', 'Video, MonitorUp');
}

// Ensure the buttons exist in quick actions
const oldButtonHtml = `<Pill size={14} className="text-emerald-400" /> Write Prescription
                                    </button>`;

const newButtonsHtml = `<Pill size={14} className="text-emerald-400" /> Write Prescription
                                    </button>
                                    
                                    <a href={\`/dashboard/radiology/dicom/\${selectedVisit.id}\`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-gray-300 p-2.5 rounded-lg text-[12px] font-medium transition">
                                        <MonitorUp size={14} className="text-purple-400" /> View DICOM Scans
                                    </a>

                                    {(selectedVisit.status === 'WAITING' || selectedVisit.status === 'WAITING_VIRTUAL' || selectedVisit.status === 'IN_CONSULTATION') && (
                                        <button onClick={handleStartTelemed} className="w-full flex items-center gap-2 bg-indigo-900/40 hover:bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 p-2.5 rounded-lg text-[12px] font-medium transition">
                                            <Video size={14} className="text-indigo-400" /> Start Virtual Room
                                        </button>
                                    )}`;

// Only replace if not already added
if (!content.includes('View DICOM Scans')) {
    // Normalizing newlines
    let normalizedContent = content.replace(/\r\n/g, '\n');
    let normalizedOld = oldButtonHtml.replace(/\r\n/g, '\n');
    
    normalizedContent = normalizedContent.replace(normalizedOld, newButtonsHtml);
    fs.writeFileSync('src/app/dashboard/ehr/page.tsx', normalizedContent);
}

console.log('Update Complete');
