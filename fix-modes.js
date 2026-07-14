const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    let filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath);
    } else if (filepath.endsWith('.tsx')) {
      let content = fs.readFileSync(filepath, 'utf8');
      if (content.includes('mode: "onTouched"')) {
        content = content.replace(/mode:\s*"onTouched"/g, 'mode: "onSubmit"');
        fs.writeFileSync(filepath, content, 'utf8');
        console.log('Fixed', filepath);
      }
    }
  });
}

walk('./src');
