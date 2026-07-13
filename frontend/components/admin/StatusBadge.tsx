import { cn } from "@/lib/utils";

type Status = "active" | "pending" | "inactive" | "approved" | "rejected";

interface StatusBadgeProps {
  status: Status;
}

const statusStyles: Record<Status, string> = {
  active: "bg-success/10 text-success border-success/20",
  approved: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  inactive: "bg-muted text-muted-foreground border-muted-foreground/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels: Record<Status, string> = {
  active: "Active",
  approved: "Approved",
  pending: "Pending",
  inactive: "Inactive",
  rejected: "Rejected",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status]
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
