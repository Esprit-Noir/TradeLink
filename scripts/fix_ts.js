const fs = require('fs');
const path = require('path');

function replaceFile(filePath, replacements) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  for (const [search, replace] of replacements) {
    content = content.replace(search, replace);
  }
  fs.writeFileSync(fullPath, content);
}

replaceFile('src/app/(app)/profile/page.tsx', [
  ['a =>', '(a: any) =>'],
  ['a =>', '(a: unknown) =>'] // In case it's different
]);

replaceFile('src/app/api/auth/register/route.ts', [
  ['(tx) =>', '(tx: any) =>'],
  ['async (tx) =>', 'async (tx: any) =>']
]);

replaceFile('src/app/api/metrics/charts/route.ts', [
  ['(t) =>', '(t: any) =>'],
  ['(tag) =>', '(tag: any) =>'],
  ['t =>', '(t: any) =>'],
  ['tag =>', '(tag: any) =>']
]);

replaceFile('src/components/dashboard/RecentTradesTable.tsx', [
  ['(t) =>', '(t: any) =>'],
  ['t =>', '(t: any) =>']
]);

const pkgPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (!pkg.scripts.postinstall) {
    pkg.scripts.postinstall = "prisma generate";
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }
}

console.log("TS fixes applied.");
