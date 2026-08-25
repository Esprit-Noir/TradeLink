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

replaceFile('src/app/(app)/import/page.tsx', [
  ['catch (err: any)', 'catch (err: unknown)'],
  ['"TradeLink"', '&quot;TradeLink&quot;'],
  ['"Mon compte"', '&quot;Mon compte&quot;'],
  ['"Exporter"', '&quot;Exporter&quot;']
]);

replaceFile('src/app/(app)/trades/page.tsx', [
  ['catch (err: any)', 'catch (err: unknown)']
]);

replaceFile('src/app/api/auth/register/route.ts', [
  ['catch (error: any)', 'catch (error: unknown)']
]);

replaceFile('src/app/api/metrics/charts/route.ts', [
  ['} catch (error) {', '} catch {']
]);

replaceFile('src/app/api/trades/import/route.ts', [
  ['catch (error: any)', 'catch (error: unknown)'],
  ['(trade as any).setup', '(trade as Record<string, unknown>).setup']
]);

replaceFile('src/app/api/trades/route.ts', [
  ['catch (error: any)', 'catch (error: unknown)']
]);

replaceFile('src/app/login/page.tsx', [
  ['} catch (err) {', '} catch {']
]);

replaceFile('src/app/register/page.tsx', [
  ['catch (err: any)', 'catch (err: unknown)']
]);

replaceFile('src/components/dashboard/EquityCurveChart.tsx', [
  ['(props: any)', '(props: unknown)']
]);

replaceFile('src/components/dashboard/HourHeatmap.tsx', [
  ['(props: any)', '(props: unknown)']
]);

replaceFile('src/components/dashboard/SetupBarChart.tsx', [
  ['(props: any)', '(props: unknown)']
]);

replaceFile('src/components/layout/Sidebar.tsx', [
  [', IconPlus', '']
]);

replaceFile('src/components/trades/AddTradeModal.tsx', [
  ['catch (error: any)', 'catch (error: unknown)'],
  ["aujourd'hui", "aujourd&apos;hui"],
  ['catch (err: any)', 'catch (err: unknown)']
]);

replaceFile('src/components/trades/DeleteTradeButton.tsx', [
  ['} catch (error) {', '} catch {']
]);

replaceFile('src/lib/metrics.ts', [
  ['timezone?: string', '']
]);

replaceFile('src/lib/parsers/binance.parser.ts', [
  ['const idxTotal =', '// const idxTotal =']
]);

replaceFile('src/lib/parsers/ib.parser.ts', [
  ['const REQUIRED_COLS =', '// const REQUIRED_COLS ='],
  ['const idxCurrency =', '// const idxCurrency ='],
  ['row: any', 'row: Record<string, unknown>']
]);

replaceFile('src/app/(app)/calendar/page.tsx', [
  ["l'annonce", "l&apos;annonce"],
  ["s'attendre", "s&apos;attendre"]
]);

console.log("Lint fixes applied.");
