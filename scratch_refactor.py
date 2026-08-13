import os
import re

files_to_check = [
    "src/app/api/trades/route.ts",
    "src/app/api/behavioral/route.ts",
    "src/app/api/metrics/charts/route.ts",
    "src/app/api/trades/import/route.ts",
    "src/app/api/metrics/equity-curve/route.ts",
    "src/components/dashboard/RecentTradesTable.tsx",
    "src/components/dashboard/DailyPnlChartServer.tsx",
    "src/components/dashboard/KpiGrid.tsx",
    "src/components/dashboard/WinRateChartServer.tsx",
    "src/app/(app)/trades/page.tsx",
    "src/app/(app)/calendar/page.tsx",
    "src/app/(app)/journal/[date]/page.tsx",
]

import_statement = 'import { getActiveAccount } from "@/lib/active-account"'

# Regex to match the prisma query, tolerating whitespace and newlines
pattern = re.compile(
    r'(await\s+prisma\.tradingAccount\.findFirst\s*\(\s*\{\s*where:\s*\{\s*userId:\s*session\.user\.id,\s*isDefault:\s*true\s*\}\s*,?\s*\}\s*\))',
    re.MULTILINE
)

for filepath in files_to_check:
    full_path = os.path.join(os.getcwd(), filepath)
    if not os.path.exists(full_path):
        continue
        
    with open(full_path, 'r') as f:
        content = f.read()
        
    # Check if there's a match
    if pattern.search(content):
        # Replace
        new_content = pattern.sub('await getActiveAccount(session.user.id)', content)
        
        # Add import if missing
        if 'getActiveAccount' not in content:
            # Insert after the last import
            lines = new_content.split('\n')
            last_import_idx = -1
            for i, line in enumerate(lines):
                if line.startswith('import '):
                    last_import_idx = i
            
            if last_import_idx != -1:
                lines.insert(last_import_idx + 1, import_statement)
            else:
                lines.insert(0, import_statement)
                
            new_content = '\n'.join(lines)
            
        with open(full_path, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")
    else:
        # Some might have the query on multiple lines exactly, let's just do a simpler search
        # If it wasn't matched by the regex above, we'll notify.
        if 'isDefault: true' in content and 'tradingAccount' in content:
            print(f"Check manually: {filepath}")

