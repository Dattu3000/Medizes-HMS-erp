const fs = require('fs');

const pathCss = 'src/app/globals.css';
let cssContent = fs.readFileSync(pathCss, 'utf8');

if (!cssContent.includes('.theme-light')) {
    cssContent += `
/* Global Day/Night Shift Theme Toggle */
html.theme-light {
  filter: invert(1) hue-rotate(180deg) brightness(1.05);
  background-color: #f0f0f0; /* Provide a light bg fallback */
}

html.theme-light img,
html.theme-light video,
html.theme-light .preserve-color {
  filter: invert(1) hue-rotate(180deg);
}

html.theme-light.transition-theme,
html.theme-light.transition-theme img,
html.theme-light.transition-theme video,
html.theme-light.transition-theme .preserve-color {
  transition: filter 0.5s ease;
}

html.transition-theme {
    transition: filter 0.5s ease, background-color 0.5s ease;
}
`;
    fs.writeFileSync(pathCss, cssContent);
}

console.log('CSS updated');
