const fs = require('fs');

let content = fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8');

// Insert the IoMT Gateway item into navItems
const oldStr = "{ name: 'Pharmacy', href: '/dashboard/pharmacy', icon: Pill },";
const newStr = "{ name: 'IoMT Gateway', href: '/dashboard/iot', icon: Server },\n        " + oldStr;

if (!content.includes('IoMT Gateway')) {
    content = content.replace(oldStr, newStr);
    fs.writeFileSync('src/app/dashboard/layout.tsx', content);
    console.log('Successfully updated layout.tsx');
} else {
    console.log('Already added');
}
