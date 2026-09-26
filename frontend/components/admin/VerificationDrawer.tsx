"use client";

import React, { useState } from 'react';
import { SlideoverDrawer } from '@/components/admin/SlideoverDrawer';
import { StatusPill } from '@/components/admin/StatusPill';
import { Building2, FileText, CheckCircle2, XCircle, AlertTriangle, ExternalLink, Mail, Phone, MapPin, Calendar, Loader2 } from 'lucide-react';
import api from '@/lib/api/client';
import { toast } from 'sonner';

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
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0].code);
  const [rejectNotes, setRejectNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !company) return null;

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await api.patch(`/admin/companies/${company.id}/verify`, {
        status: 'verified',
        verificationNotes: 'Approved during superadmin document inspection.',
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
    <SlideoverDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={company.name || 'Company Verification'}
      subtitle={`Application submitted ${company.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'recently'}`}
      badge={<StatusPill status={company.verificationStatus || company.status || 'pending'} />}
      width="xl"
      footer={{
        primaryAction: rejectMode
          ? {
              label: isSubmitting ? 'Rejecting...' : 'Confirm Rejection',
              onClick: handleReject,
              isLoading: isSubmitting,
              variant: 'danger',
            }
          : {
              label: isSubmitting ? 'Approving...' : 'Approve Provider',
              onClick: handleApprove,
              isLoading: isSubmitting,
              variant: 'success',
            },
        secondaryAction: {
          label: rejectMode ? 'Back to Overview' : 'Close',
          onClick: rejectMode ? () => setRejectMode(false) : onClose,
        },
        additionalControls: !rejectMode && (
          <button
            type="button"
            onClick={() => setRejectMode(true)}
            className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-100 transition"
          >
            Reject with Reason
          </button>
        ),
      }}
    >
      <div className="space-y-6 text-sm">
        {/* Rejection Form Mode */}
        {rejectMode ? (
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 space-y-4">
            <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Provide Authority Reason for Rejection</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Standard Reason Code
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-3 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#0A192F] focus:outline-none"
              >
                {REJECT_REASONS.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Detailed Feedback to Provider
              </label>
              <textarea
                rows={3}
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Explain what specific corrections are required before resubmission..."
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#0A192F] focus:outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
        ) : (
          <>
            {/* Split Panel: Business Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Organization Credentials
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Legal Entity</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{company.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Registration #</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {company.registrationNumber || company.businessNumber || 'REG-PENDING'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">City / Province</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{company.city || 'Phnom Penh'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Category</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{company.category || 'Home Services'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Contact Information
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{company.email || company.owner?.email || 'No email registered'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{company.phone || company.owner?.phone || 'No phone registered'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{company.address || 'Address pending'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Inspection Panel */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Submitted Verification Documents
              </h4>
              {company.documents && company.documents.length > 0 ? (
                <div className="space-y-2">
                  {company.documents.map((doc: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-[#0A192F] dark:text-sky-400" />
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {doc.title || doc.name || `Document #${idx + 1}`}
                          </p>
                          <p className="text-[11px] text-slate-400">{doc.type || 'Government ID / License'}</p>
                        </div>
                      </div>
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                  Business license uploaded upon initial onboarding.
                  {company.businessLicenseUrl && (
                    <a
                      href={company.businessLicenseUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-[#0A192F] dark:text-sky-400 font-semibold hover:underline"
                    >
                      <span>View Primary License Attachment</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </SlideoverDrawer>
  );
}

export default VerificationDrawer;
