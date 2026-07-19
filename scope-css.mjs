import fs from 'fs';

const cssPath = 'C:\\Users\\MahmoudSalem\\Documents\\Landing-Page\\frontend\\src\\app\\globals.css';
const outPath = 'C:\\Users\\MahmoudSalem\\Documents\\tagat-workflow\\src\\modules\\landing\\styles\\landing.css';

let css = fs.readFileSync(cssPath, 'utf8');

css = css.replace(/(?:\b|^)html(?:\b|$)/g, '.landing-page-root');
css = css.replace(/(?:\b|^)body(?:\b|$)/g, '.landing-page-root');

const lines = css.split('\n');
let rootSection = [];
let scopedSection = [];
let inRoot = false;

for (let line of lines) {
    if (line.startsWith(':root') || line.startsWith('[data-theme')) {
        inRoot = true;
    }
    
    if (inRoot) {
        rootSection.push(line);
        if (line.includes('}')) {
            inRoot = false;
        }
    } else {
        scopedSection.push(line);
    }
}

fs.mkdirSync('C:\\Users\\MahmoudSalem\\Documents\\tagat-workflow\\src\\modules\\landing\\styles', { recursive: true });

const finalCss = rootSection.join('\n') + 
                 '\n.landing-page-root {\n' + 
                 scopedSection.join('\n') + 
                 '\n}\n';

fs.writeFileSync(outPath, finalCss);
console.log('CSS scoped and saved to', outPath);
