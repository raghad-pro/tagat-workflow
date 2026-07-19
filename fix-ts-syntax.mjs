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
      
      // Revert syntax errors
      content = content.replace(/console\.error\(e: any\)/g, 'console.error(e)');
      content = content.replace(/setOverrides\(data: any\)/g, 'setOverrides(data)');
      
      fs.writeFileSync(filePath, content);
    }
  }
}

walk('C:\\Users\\MahmoudSalem\\Documents\\tagat-workflow\\src\\modules\\landing');
console.log('Fixed syntax errors');
