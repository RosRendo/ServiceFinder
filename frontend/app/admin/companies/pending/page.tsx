"use client"
import { useState } from "react";
import { Search, Check, X, Eye } from "lucide-react";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const pendingCompanies = [
  {
    id: "1",
    name: "GreenClean Express",
    email: "contact@greenclean.com",
    location: "Boston, MA",
    submittedAt: "Dec 28, 2025",
    status: "pending" as const,
    documents: 3,
  },
  {
    id: "2",
    name: "Crystal Clear Services",
    email: "info@crystalclear.com",
    location: "Denver, CO",
    submittedAt: "Dec 27, 2025",
    status: "pending" as const,
    documents: 4,
  },
  {
    id: "3",
    name: "QuickClean Pro",
    email: "hello@quickclean.com",
    location: "Phoenix, AZ",
    submittedAt: "Dec 26, 2025",
    status: "pending" as const,
    documents: 2,
  },
];

export default function PendingCompaniesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<typeof pendingCompanies[0] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredCompanies = pendingCompanies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApprove = (company: typeof pendingCompanies[0]) => {
    toast.success(`${company.name} has been approved!`);
    setDialogOpen(false);
  };

  const handleReject = (company: typeof pendingCompanies[0]) => {
    toast.error(`${company.name} has been rejected.`);
    setDialogOpen(false);
  };

  const columns = [
    {
      key: "name",
      label: "Company",
      render: (item: typeof pendingCompanies[0]) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 rounded-lg">
            <AvatarFallback className="rounded-lg bg-warning/10 text-warning text-sm font-medium">
              {item.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground">{item.email}</p>
          </div>
        </div>
      ),
    },
    { key: "location", label: "Location" },
    { key: "submittedAt", label: "Submitted" },
    {
      key: "documents",
      label: "Documents",
      render: (item: typeof pendingCompanies[0]) => (
        <span className="font-medium">{item.documents} files</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (item: typeof pendingCompanies[0]) => <StatusBadge status={item.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (item: typeof pendingCompanies[0]) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCompany(item);
              setDialogOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-success hover:bg-success/10 hover:text-success"
            onClick={(e) => {
              e.stopPropagation();
              handleApprove(item);
            }}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleReject(item);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: "w-32",
    },
  ];

  return (
    <div className="space-y-6">

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search pending companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={filteredCompanies} />

      {/* Review Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
            <DialogDescription>
              Review the company application details before approving or rejecting.
            </DialogDescription>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-warning/10 text-warning text-xl font-medium">
                    {selectedCompany.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedCompany.name}</h3>
                  <p className="text-muted-foreground">{selectedCompany.email}</p>
                </div>
              </div>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span>{selectedCompany.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted</span>
                  <span>{selectedCompany.submittedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Documents</span>
                  <span>{selectedCompany.documents} files uploaded</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => selectedCompany && handleReject(selectedCompany)}
              className="text-destructive hover:bg-destructive/10"
            >
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button onClick={() => selectedCompany && handleApprove(selectedCompany)}>
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
