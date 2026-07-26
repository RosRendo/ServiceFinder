"use client";

import { useState } from "react";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { StatusBadge } from "@/components/grid/StatusBadge";
import { BaseDrawer } from "@/components/drawers/BaseDrawer";
import { Search, ShieldAlert, CheckCircle2, XCircle, Eye } from "lucide-react";

interface DisputeRow { id: string; customer: string; company: string; service: string; amount: number; status: "open" | "resolved" | "dismissed"; reason: string; openedDate: string; evidence: string; }

function mockDispute(i: number): DisputeRow {
  const statuses = ["open", "resolved", "dismissed"] as const;
  return {
    id: `D-${String(1 + i).padStart(3, "0")}`,
    customer: ["Rendo", "Sophea", "Dara", "Tom", "Vanna"][i % 5],
    company: ["ABC Cleaning Co.", "XYZ Services", "ProFix Ltd."][i % 3],
    service: ["Deep Cleaning", "AC Repair", "Plumbing"][i % 3],
    amount: 25 + i * 12,
    status: statuses[i % 3],
    reason: ["Service not completed", "Staff was rude", "Damage to property", "Late arrival"][i % 4],
    openedDate: `Jul ${15 + (i % 10)}, 2026`,
    evidence: `Customer uploaded ${1 + (i % 3)} photo(s) as evidence.`,
  };
}
const ALL_DISPUTES: DisputeRow[] = Array.from({ length: 30 }, (_, i) => mockDispute(i));

const columns: Column<DisputeRow>[] = [
  { key: "id", header: "#ID", width: "w-20", render: (r) => <span className="text-red-400 font-mono text-xs">{r.id}</span> },
  { key: "customer", header: "Customer", sortable: true },
  { key: "company", header: "Company", sortable: true },
  { key: "service", header: "Service" },
  { key: "reason", header: "Reason", render: (r) => <span className="text-muted-foreground text-xs">{r.reason}</span> },
  { key: "amount", header: "Amount", sortable: true, render: (r) => <span className="font-medium">${r.amount}</span> },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status === "open" ? "pending" : r.status === "resolved" ? "completed" : "cancelled"} /> },
  { key: "openedDate", header: "Opened", render: (r) => <span className="text-muted-foreground text-xs">{r.openedDate}</span> },
];

export default function DisputesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [active, setActive] = useState<DisputeRow | null>(null);

  const filtered = ALL_DISPUTES.filter((d) => {
    const matchSearch = !search || [d.customer, d.company, d.id].some((v) => v.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-border bg-background">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search disputes..."
            className="w-full pl-9 pr-3 h-9 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/60" />
        </div>
        <div className="flex items-center gap-1">
          {["all", "open", "resolved", "dismissed"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? "bg-violet-500/20 text-violet-400" : "text-muted-foreground hover:bg-muted/60"}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <span className="flex items-center gap-2 h-9 px-3 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium">
          <ShieldAlert className="w-3.5 h-3.5" /> {ALL_DISPUTES.filter((d) => d.status === "open").length} Open
        </span>
      </div>
      <div className="flex-1 overflow-hidden">
        <DataGrid columns={columns} data={filtered} onRowClick={(r) => { setActive(r); setDrawerOpen(true); }} emptyMessage="No disputes found." />
      </div>
      <BaseDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={`Dispute ${active?.id}`} subtitle={`${active?.customer} vs ${active?.company}`}>
        {active && (
          <div className="p-6 space-y-5">
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Reason</p>
              <p className="text-sm text-foreground font-medium">{active.reason}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Evidence</p>
              <p className="text-sm text-muted-foreground">{active.evidence}</p>
              <div className="mt-3 flex gap-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="w-16 h-16 rounded-lg bg-muted border border-border flex items-center justify-center cursor-pointer hover:border-violet-500/50 transition-colors">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Amount Disputed</p>
              <p className="text-2xl font-bold text-foreground">${active.amount}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-sm font-medium transition-colors">
                <CheckCircle2 className="w-4 h-4" /> Refund Customer
              </button>
              <button className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-colors">
                <XCircle className="w-4 h-4" /> Dismiss Claim
              </button>
            </div>
          </div>
        )}
      </BaseDrawer>
    </div>
  );
}
