const fs = require('fs');
const file = 'd:/FOR RENDO (ONLY )/Personal Project/Service_Finder/frontend/app/admin/companies/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove the stray AreaChart fragment
// Using a regex to carefully match and remove the specific stray lines.
content = content.replace(/\s*\/>\s*<Area type="monotone" dataKey="revenue"[^>]+>\s*<\/AreaChart>\s*<\/ResponsiveContainer>\s*<\/div>/, '');

// 2. Add back the Finance tab right before the Logs tab if missing
const logsTab = `                            <TabsContent value="logs" className="m-0 space-y-6">`;
const financeTab = `                            {/* --- TAB: FINANCE --- */}
                            <TabsContent value="finance" className="m-0 space-y-6">
                                <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden p-12 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-4 border border-border">
                                        <DollarSign className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-black text-foreground mb-1">No Financial Data</h3>
                                    <p className="text-sm text-muted-foreground max-w-sm">This company has not processed any payouts or transactions yet. Once bookings are completed, financial logs will appear here.</p>
                                </div>
                            </TabsContent>\n\n`;

if (!content.includes('value="finance"')) {
    content = content.replace(logsTab, financeTab + logsTab);
}

fs.writeFileSync(file, content);
console.log('Fixed file');
