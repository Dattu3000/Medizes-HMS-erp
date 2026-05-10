const fs = require('fs');
const path = require('path');

const replacements = {
    'Â·': '·',
    'â€¢': '•',
    'ðŸ‘‹': '👋',
    'ðŸ’°': '💰',
    'â‚¹': '₹',
    'Ã¢â€šÂ¹': '₹',
    'â€”': '—',
    'â€“': '–',
    'âœ…': '✅',
    'âš': '⚠',
    'â†’': '→'
};

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) { 
            results.push(file);
        }
    });
    return results;
}

const srcDir = path.join(__dirname, 'frontend', 'src');
const files = walk(srcDir);
let fixedCount = 0;

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let original = content;

    for (const [mojibake, correct] of Object.entries(replacements)) {
        // Global replace
        content = content.split(mojibake).join(correct);
    }

    if (content !== original) {
        fs.writeFileSync(f, content, 'utf8');
        console.log('Fixed:', path.relative(srcDir, f));
        fixedCount++;
    }
});

console.log(`\nDone! Fixed ${fixedCount} files.`);
