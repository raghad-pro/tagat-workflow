import fs from 'fs';
import path from 'path';

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      content = content.replace(/\.jsx'/g, "'");
      content = content.replace(/\.jsx"/g, '"');
      content = content.replace(/\.js'/g, "'");
      content = content.replace(/\.js"/g, '"');
      fs.writeFileSync(filePath, content);
    }
  }
}

walk('C:\\Users\\MahmoudSalem\\Documents\\tagat-workflow\\src\\modules\\landing');
console.log('Removed explicit JS/JSX extensions from imports');
