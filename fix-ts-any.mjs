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
      
      // Fix implicit any in components e.g. function AppProvider({ initialTheme, children }) => function AppProvider({ initialTheme, children }: any)
      content = content.replace(/function (\w+)\(({\s*[^}]+\s*})\)/g, 'function $1($2: any)');
      // Fix arrow functions e.g. const LogoMark = ({ size = 30 }) => => const LogoMark = ({ size = 30 }: any) => 
      content = content.replace(/const (\w+) = \(({\s*[^}]+\s*})\) =>/g, 'const $1 = ($2: any) =>');
      // Fix function parameters without destructuring e.g. function persist(key, value) => function persist(key: any, value: any)
      content = content.replace(/function persist\(key, value\)/g, 'function persist(key: any, value: any)');
      content = content.replace(/function getCookie\(key\)/g, 'function getCookie(key: any)');
      content = content.replace(/function applyTheme\(theme\)/g, 'function applyTheme(theme: any)');
      content = content.replace(/export function mergeContent\(base, over\)/g, 'export function mergeContent(base: any, over: any)');
      content = content.replace(/function merge\(a, b\)/g, 'function merge(a: any, b: any)');
      content = content.replace(/const ReducedMotionContext = createContext\(false\)/g, 'const ReducedMotionContext = createContext<any>(false)');
      content = content.replace(/const AppContext = createContext\(null\)/g, 'const AppContext = createContext<any>(null)');
      
      fs.writeFileSync(filePath, content);
    }
  }
}

walk('C:\\Users\\MahmoudSalem\\Documents\\tagat-workflow\\src\\modules\\landing');
console.log('Added :any types to suppress TypeScript errors');
