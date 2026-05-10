const fs = require('fs');
const path = require('path');

// Fix all double-encoded UTF-8 sequences (4-byte emoji ranges and special chars)
// Strategy: decode as latin1, then re-encode properly
function fixDoubleEncodedUtf8(buf) {
    // Convert buffer to string treating each byte as latin1
    let latin1str = '';
    for (let i = 0; i < buf.length; i++) {
        latin1str += String.fromCharCode(buf[i]);
    }
    // Now encode back properly as UTF-8
    // If it was double-encoded, the latin1 string will decode to proper UTF-8
    try {
        const fixed = Buffer.from(latin1str, 'latin1').toString('utf8');
        // Verify it's valid UTF-8 by re-encoding
        const roundtrip = Buffer.from(fixed, 'utf8').toString('utf8');
        if (roundtrip === fixed) {
            return Buffer.from(fixed, 'utf8');
        }
    } catch (e) {}
    return buf;
}

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) { 
            results.push(file);
        }
    });
    return results;
}

// Test the approach on a known bad string
const testBad = Buffer.from([0xc3, 0xb0, 0xc5, 0xb8, 0xe2, 0x80, 0x9d, 0xc2, 0xa5]); // ðŸ¥ (double-encoded 🏥)
const testFixed = fixDoubleEncodedUtf8(testBad);
console.log('Test input:', testBad.toString('hex'));
console.log('Test fixed:', testFixed.toString('hex'));
console.log('Test result:', testFixed.toString('utf8'));

const srcDir = path.join(__dirname, 'frontend', 'src');
const files = walk(srcDir);
let fixedCount = 0;

files.forEach(f => {
    const buf = fs.readFileSync(f);
    
    // Check if file has any sequences that look double-encoded
    // Key pattern: 0xC3 followed by 0xB0 (ð in latin1) followed by emoji pattern
    // Also check for Ã (0xC3 0x83) patterns
    const str = buf.toString('utf8');
    
    // Heuristic: if the file contains mojibake patterns like "ðŸ" or "â€" or "â‚¹"
    // these indicate double-encoding
    const hasMojibake = str.includes('ðŸ') || str.includes('ðŸ—') || 
                        str.includes("ðŸ'") || str.includes('ðŸ¥') ||
                        str.includes('âœ') || str.includes('â€"') ||
                        str.includes('â‚¹') || str.includes('Â·') ||
                        str.includes('ðŸ"') || str.includes('â‰');
    
    if (hasMojibake) {
        const fixed = fixDoubleEncodedUtf8(buf);
        if (fixed.toString('hex') !== buf.toString('hex')) {
            fs.writeFileSync(f, fixed);
            console.log('Fixed:', path.relative(srcDir, f));
            fixedCount++;
        }
    }
});

console.log(`\nDone! Fixed ${fixedCount} files.`);
