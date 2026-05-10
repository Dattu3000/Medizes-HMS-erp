const fs = require('fs');

const path = 'src/app/dashboard/layout.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add Sun, Moon to imports
if (!content.includes('Sun, Moon')) {
    content = content.replace('X, Server', 'X, Server, Sun, Moon');
}

// Add state for Theme inside DashboardLayout component
const stateHtml = `
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
`;

if (!content.includes('toggleTheme')) {
    content = content.replace('const [loading, setLoading] = useState(true);', 'const [loading, setLoading] = useState(true);\n' + stateHtml);
}

// Add Theme Toggle button next to Notification Bell
const bellHtml = `{/* Notification Bell */}`;
const themeToggleHtml = `{/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg bg-[#0F172A] hover:bg-slate-700 text-gray-400 hover:text-white transition relative preserve-color"
                            title="Toggle Day/Night Shift Mode"
                        >
                            {isDayMode ? <Moon size={18} className="text-indigo-400" /> : <Sun size={18} className="text-amber-400" />}
                        </button>
                        
                        {/* Notification Bell */}`;

if (!content.includes('toggleTheme}')) {
    content = content.replace(bellHtml, themeToggleHtml);
}

fs.writeFileSync(path, content);
console.log('Dashboard Layout Theme Toggle Added');
