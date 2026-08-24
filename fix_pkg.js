const fs = require('fs');
let text = fs.readFileSync('package.json', 'utf8');
text = text.replace(/,\s*\}/g, '}'); // Quick fix for trailing comma
fs.writeFileSync('package.json', text);
