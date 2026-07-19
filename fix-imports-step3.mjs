import fs from 'fs';
import path from 'path';

const dir = 'C:\\Users\\MahmoudSalem\\Documents\\tagat-workflow\\src\\modules\\landing\\components';
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.jsx') || file.endsWith('.tsx') || file.endsWith('.js')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix context imports
    content = content.replace(/\.\.\/\.\.\/context\//g, '../context/');
    
    // Fix i18n imports
    content = content.replace(/\.\.\/\.\.\/i18n\//g, '../i18n/');
    
    // Fix hooks imports
    content = content.replace(/\.\.\/\.\.\/hooks\.js/g, '../hooks');

    fs.writeFileSync(filePath, content);
  }
}
console.log('Fixed imports in main components directory');
