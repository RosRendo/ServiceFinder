"use client";

import { useState } from "react";
import { Zap, Plus, ToggleRight, ToggleLeft, ChevronRight, Clock, Bell, ShieldAlert, Star } from "lucide-react";
import { BaseDrawer } from "@/components/drawers/BaseDrawer";

interface Rule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  active: boolean;
  runs: number;
  lastRun: string;
  icon: React.ElementType;
  iconColor: string;
}

const INITIAL_RULES: Rule[] = [
  { id: "1", name: "Unassigned Booking Alert", trigger: "Booking unassigned for > 1 hour", action: "Send alert to Admin", active: true, runs: 84, lastRun: "2 hours ago", icon: Clock, iconColor: "text-amber-400" },
  { id: "2", name: "New Booking Notification", trigger: "New booking created", action: "Notify assigned Company", active: true, runs: 412, lastRun: "5 min ago", icon: Bell, iconColor: "text-blue-400" },
  { id: "3", name: "Dispute Freeze", trigger: "Dispute opened", action: "Freeze company payout", active: true, runs: 7, lastRun: "3 days ago", icon: ShieldAlert, iconColor: "text-red-400" },
  { id: "4", name: "Low Rating Alert", trigger: "Staff rating drops below 4.0", action: "Flag for review + notify Admin", active: false, runs: 12, lastRun: "1 week ago", icon: Star, iconColor: "text-violet-400" },
  { id: "5", name: "Auto-Complete Old Jobs", trigger: "Job in progress > 8 hours with no update", action: "Mark as completed + notify company", active: false, runs: 3, lastRun: "2 weeks ago", icon: Zap, iconColor: "text-emerald-400" },
];

export default function AutomationPage() {
  const [rules, setRules] = useState(INITIAL_RULES);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [active, setActive] = useState<Rule | null>(null);

  const toggleRule = (id: string) => setRules((prev) => prev.map((r) => r.id === id ? { ...r, active: !r.active } : r));

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-foreground">Automation Rules</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {rules.filter((r) => r.active).length} active · {rules.filter((r) => !r.active).length} inactive
          </p>
        </div>
        <button className="flex items-center gap-2 h-9 px-3 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Rule
        </button>
      </div>

      <div className="space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="bg-background border border-border rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-violet-500/30 transition-colors group"
            onClick={() => { setActive(rule); setDrawerOpen(true); }}
          >
            <div className={`w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0`}>
              <rule.icon className={`w-5 h-5 ${rule.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{rule.name}</p>
                {!rule.active && <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Inactive</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                IF <span className="text-foreground">{rule.trigger}</span> → THEN <span className="text-violet-400">{rule.action}</span>
              </p>
            </div>
            <div className="text-right shrink-0 mr-2">
              <p className="text-xs font-semibold text-foreground">{rule.runs} runs</p>
              <p className="text-[11px] text-muted-foreground">{rule.lastRun}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); toggleRule(rule.id); }}
              className="shrink-0"
            >
              {rule.active
                ? <ToggleRight className="w-7 h-7 text-emerald-400" />
                : <ToggleLeft className="w-7 h-7 text-muted-foreground/40" />
              }
            </button>
            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}

        {/* New rule placeholder */}
        <div className="border-2 border-dashed border-border rounded-xl p-6 flex items-center justify-center gap-2 cursor-pointer hover:border-violet-500/40 transition-colors group">
          <Plus className="w-4 h-4 text-muted-foreground group-hover:text-violet-400" />
          <span className="text-sm text-muted-foreground group-hover:text-foreground">Create automation rule</span>
        </div>
      </div>

      <BaseDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={active?.name ?? ""} subtitle="Automation Rule">
        {active && (
          <div className="p-6 space-y-5">
            <div className="p-4 bg-muted/50 rounded-xl space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">IF (Trigger)</p>
                <p className="text-sm text-foreground font-medium">{active.trigger}</p>
              </div>
              <div className="h-px bg-border" />
              <div>
                <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider mb-1.5">THEN (Action)</p>
                <p className="text-sm text-foreground font-medium">{active.action}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-foreground">{active.runs}</p>
                <p className="text-xs text-muted-foreground">Total Runs</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-sm font-semibold text-foreground">{active.lastRun}</p>
                <p className="text-xs text-muted-foreground">Last Run</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-foreground">Rule Active</p>
                <p className="text-xs text-muted-foreground">Enable or disable this rule</p>
              </div>
              <button onClick={() => { toggleRule(active.id); setActive((a) => a ? { ...a, active: !a.active } : a); }}>
                {active.active ? <ToggleRight className="w-7 h-7 text-emerald-400" /> : <ToggleLeft className="w-7 h-7 text-muted-foreground/40" />}
              </button>
            </div>
            <button className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors">Edit Rule Logic</button>
          </div>
        )}
      </BaseDrawer>
    </div>
  );
}
