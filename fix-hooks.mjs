import fs from 'fs';
import path from 'path';

const dir = 'C:\\Users\\MahmoudSalem\\Documents\\tagat-workflow\\src\\modules\\landing\\components\\new';
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.jsx')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\.\.\/hooks\.js/g, '../../hooks.js');
    fs.writeFileSync(filePath, content);
  }
}
console.log('Fixed hooks imports in new components');
