const fs = require('fs');
const path = require('path');

// Double-encoded UTF-8 sequences that need fixing
// ₹ (U+20B9) double-encoded: e2 82 b9 -> c3 a2 e2 80 9a c2 b9
// — (U+2014) double-encoded: e2 80 94 -> c3 a2 c2 80 c2 94
// ≠ (U+2260) double-encoded: e2 89 a0 -> c3 a2 c2 89 c2 a0
// ✅ (U+2705) double-encoded: e2 9c 85 -> c3 a2 c2 9c c2 85
// • (U+2022) double-encoded: e2 80 a2 -> c3 a2 c2 80 c2 a2

const replacements = [
    // Rupee symbol ₹
    [Buffer.from([0xc3, 0xa2, 0xe2, 0x80, 0x9a, 0xc2, 0xb9]), Buffer.from([0xe2, 0x82, 0xb9])],
    // Em dash — 
    [Buffer.from([0xc3, 0xa2, 0xc2, 0x80, 0xc2, 0x94]), Buffer.from([0xe2, 0x80, 0x94])],
    // En dash –
    [Buffer.from([0xc3, 0xa2, 0xc2, 0x80, 0xc2, 0x93]), Buffer.from([0xe2, 0x80, 0x93])],
    // ≠ not equal
    [Buffer.from([0xc3, 0xa2, 0xc2, 0x89, 0xc2, 0xa0]), Buffer.from([0xe2, 0x89, 0xa0])],
    // ✅ check mark
    [Buffer.from([0xc3, 0xa2, 0xc2, 0x9c, 0xc2, 0x85]), Buffer.from([0xe2, 0x9c, 0x85])],
    // ⚠️ warning (3 bytes: e2 9a a0)
    [Buffer.from([0xc3, 0xa2, 0xc2, 0x9a, 0xc2, 0xa0]), Buffer.from([0xe2, 0x9a, 0xa0])],
    // • bullet
    [Buffer.from([0xc3, 0xa2, 0xc2, 0x80, 0xc2, 0xa2]), Buffer.from([0xe2, 0x80, 0xa2])],
    // " left double quote
    [Buffer.from([0xc3, 0xa2, 0xc2, 0x80, 0xc2, 0x9c]), Buffer.from([0xe2, 0x80, 0x9c])],
    // " right double quote
    [Buffer.from([0xc3, 0xa2, 0xc2, 0x80, 0xc2, 0x9d]), Buffer.from([0xe2, 0x80, 0x9d])],
    // ✓ check
    [Buffer.from([0xc3, 0xa2, 0xc2, 0x9c, 0xc2, 0x93]), Buffer.from([0xe2, 0x9c, 0x93])],
    // → arrow
    [Buffer.from([0xc3, 0xa2, 0xc2, 0x86, 0xc2, 0x92]), Buffer.from([0xe2, 0x86, 0x92])],
];

function replaceBuffer(buf, from, to) {
    let result = Buffer.alloc(0);
    let i = 0;
    while (i < buf.length) {
        if (i + from.length <= buf.length && buf.slice(i, i + from.length).equals(from)) {
            result = Buffer.concat([result, to]);
            i += from.length;
        } else {
            result = Buffer.concat([result, buf.slice(i, i + 1)]);
            i++;
        }
    }
    return result;
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

const srcDir = path.join(__dirname, 'frontend', 'src');
const files = walk(srcDir);
let fixedCount = 0;

files.forEach(f => {
    let buf = fs.readFileSync(f);
    let original = buf.toString('hex');
    let modified = false;

    for (const [from, to] of replacements) {
        if (buf.includes(from[0])) {
            const newBuf = replaceBuffer(buf, from, to);
            if (newBuf.toString('hex') !== buf.toString('hex')) {
                buf = newBuf;
                modified = true;
            }
        }
    }

    if (modified) {
        fs.writeFileSync(f, buf);
        console.log('Fixed:', path.relative(srcDir, f));
        fixedCount++;
    }
});

console.log(`\nDone! Fixed ${fixedCount} files.`);
