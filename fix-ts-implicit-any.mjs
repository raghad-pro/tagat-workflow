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
      
      // Fix e in functions e.g. async function onSubmit(e) -> async function onSubmit(e: any)
      content = content.replace(/\(e\)/g, '(e: any)');
      // Fix implicit any in parameters like (entries) =>
      content = content.replace(/\(entries\)/g, '(entries: any)');
      // Fix implicit any in item =>
      content = content.replace(/\(item\)/g, '(item: any)');
      content = content.replace(/item =>/g, '(item: any) =>');
      content = content.replace(/\(p\)/g, '(p: any)');
      content = content.replace(/p =>/g, '(p: any) =>');
      content = content.replace(/\(err\)/g, '(err: any)');
      content = content.replace(/err =>/g, '(err: any) =>');
      content = content.replace(/\(data\)/g, '(data: any)');
      content = content.replace(/data =>/g, '(data: any) =>');
      content = content.replace(/\(r\)/g, '(r: any)');
      content = content.replace(/r =>/g, '(r: any) =>');
      
      // Look for other (word) =>
      content = content.replace(/\(([a-zA-Z0-9_]+)\) =>/g, '($1: any) =>');
      
      fs.writeFileSync(filePath, content);
    }
  }
}

walk('C:\\Users\\MahmoudSalem\\Documents\\tagat-workflow\\src\\modules\\landing');
console.log('Fixed implicit any parameters');
