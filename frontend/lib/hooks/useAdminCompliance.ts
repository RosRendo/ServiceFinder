import { useAPI, useMutation } from './useAPI';

export interface ComplianceDocument {
  id: string;
  companyId: string;
  companyName: string;
  documentType: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  fileUrl: string;
  notes?: string;
}

export function useAdminCompliance() {
  const { data, loading, error, refetch } = useAPI<{ documents: ComplianceDocument[] }>('/admin/compliance');
  const { mutate, loading: actionLoading } = useMutation();

  const updateDocumentStatus = async (docId: string, status: 'approved' | 'rejected', notes?: string) => {
    return mutate(`/admin/compliance/${docId}`, { status, notes }, 'PUT');
  };

  return {
    documents: data?.documents || [],
    loading,
    error,
    refetch,
    updateDocumentStatus,
    actionLoading
  };
}
