"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BaseDrawer } from '@/components/drawers/BaseDrawer';
import { StatusPill } from '@/components/admin/StatusPill';
import { Building2, FileText, CheckCircle2, XCircle, AlertTriangle, ExternalLink, Mail, Phone, MapPin, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface VerificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  company: any | null;
  onVerified: () => void;
}

const REJECT_REASONS = [
  { code: 'DOC_EXPIRED', label: 'Expired Business License or Insurance' },
  { code: 'NAME_MISMATCH', label: 'Company Name Mismatch on Documents' },
  { code: 'ILLEGIBLE_FILE', label: 'Illegible or Incomplete Documentation' },
  { code: 'INVALID_CATEGORY', label: 'Unauthorized or Unlicensed Trade Category' },
  { code: 'FAILED_BACKGROUND', label: 'Failed Regulatory / Compliance Screening' },
];

export function VerificationDrawer({
  isOpen,
  onClose,
  company,
  onVerified,
}: VerificationDrawerProps) {
  const router = useRouter();
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0].code);
  const [rejectNotes, setRejectNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !company) return null;

  const currentStatus = (company.verificationStatus || company.status || 'pending').toLowerCase();
  const isPending = currentStatus === 'pending' || currentStatus === 'pending_verification';

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await api.patch(`/admin/companies/${company.id}/verify`, {
        status: 'verified',
        verificationNotes: 'Approved during document inspection.',
      });
      toast.success(`${company.name} verified successfully`);
      onVerified();
      onClose();
    } catch {
      toast.error('Failed to verify company');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      const reasonObj = REJECT_REASONS.find((r) => r.code === rejectReason);
      const combinedNotes = `${reasonObj?.label || rejectReason}${rejectNotes ? ` - ${rejectNotes}` : ''}`;
      await api.patch(`/admin/companies/${company.id}/verify`, {
        status: 'rejected',
        rejectionReason: combinedNotes,
      });
      toast.success(`${company.name} verification rejected`);
      onVerified();
      onClose();
    } catch {
      toast.error('Failed to reject company verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseDrawer
      open={isOpen}
      onClose={onClose}
      title={company.name || 'Company Verification'}
      subtitle={`Application submitted ${company.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'recently'}`}
      badge={<StatusPill status={company.verificationStatus || company.status || 'pending'} />}
      headerActions={
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-3 text-xs font-semibold gap-1.5"
          onClick={() => {
            router.push(`/admin/companies/${company.id}`);
            onClose();
          }}
        >
          <span>Full Profile</span>
          <ExternalLink className="w-3 h-3 text-muted-foreground" />
        </Button>
      }
      footer={
        isPending ? (
          <div className="flex items-center justify-between w-full">
            <div>
              {!rejectMode ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRejectMode(true)}
                  className="h-8.5 px-3 text-xs font-semibold border-rose-500/20 text-rose-600 hover:bg-rose-500/10"
                >
                  Reject Application
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRejectMode(false)}
                  className="h-8.5 px-3 text-xs font-semibold"
                >
                  Back to Review
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {rejectMode ? (
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleReject}
                  className="h-8.5 px-4 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-2xs gap-1.5"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Confirm Rejection</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleApprove}
                  className="h-8.5 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-2xs gap-1.5"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Approve Merchant</span>
                </Button>
              )}
            </div>
          </div>
        ) : undefined
      }
      width="xl"
    >
      <div className="p-6 space-y-5 font-sans text-xs">
        {/* Rejection Form Mode */}
        {rejectMode ? (
          <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 space-y-3.5">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Specify Reason for Application Rejection</span>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Reason Code
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full text-xs rounded-xl border border-border bg-background py-2 px-3 text-foreground outline-none"
              >
                {REJECT_REASONS.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Auditor Feedback to Applicant
              </label>
              <textarea
                rows={3}
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Explain what specific corrections are required before resubmission..."
                className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground outline-none focus:border-primary placeholder:text-muted-foreground"
              />
            </div>
          </div>
        ) : (
          <>
            {/* Split Panel: Business Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl border border-border bg-card space-y-2.5">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">
                  Organization Credentials
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Legal Entity</span>
                    <span className="font-semibold text-foreground">{company.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Registration #</span>
                    <span className="font-mono font-semibold text-foreground">
                      {company.registrationNumber || company.businessNumber || 'REG-PENDING'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service Sector</span>
                    <span className="font-medium text-foreground">{company.category?.name || 'General Services'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-card space-y-2.5">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">
                  Direct Contact & Channel
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Email
                    </span>
                    <span className="font-medium text-foreground">{company.email || company.ownerEmail || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Phone
                    </span>
                    <span className="font-mono font-semibold text-foreground">{company.phone || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> City Region
                    </span>
                    <span className="font-medium text-foreground">{company.city || company.address || 'Phnom Penh'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Inspection Strip */}
            <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-2 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" /> Uploaded Proof & Credentials
              </h4>
              {company.verificationDocumentUrl || company.documentUrl ? (
                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-bold text-foreground">Commercial Business Certificate</p>
                      <p className="text-[10px] text-muted-foreground">Official Government Registration PDF/Image</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-border gap-1"
                    asChild
                  >
                    <a
                      href={company.verificationDocumentUrl || company.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span>View File</span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No digital document scan attached to this application.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </BaseDrawer>
  );
}

export default VerificationDrawer;
