import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";

export type MigrationRowStatus =
  | "pending"
  | "valid"
  | "invalid"
  | "migrated"
  | "skipped"
  | "failed";

export interface MigrationSummary {
  total: number;
  valid: number;
  invalid: number;
  migrated?: number;
  skipped?: number;
  failed?: number;
  existing?: number;
  wallet_total?: number;
}

export interface MigrationPreviewRow {
  row_number: number;
  status: MigrationRowStatus;
  action: "create" | "skip" | "error";
  errors: string[];
  warnings: string[];
  data: MigrationUserPayload;
}

export interface MigrationPreview {
  summary: MigrationSummary;
  rows: MigrationPreviewRow[];
}

export interface MigrationImportResult {
  batch_id: string;
  summary: MigrationSummary;
  rows: MigrationPreviewRow[];
}

export interface MigrationBatch {
  id: string;
  name: string;
  source: string;
  status: "draft" | "running" | "completed" | "completed_with_errors" | "failed";
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  migrated_rows: number;
  skipped_rows: number;
  failed_rows: number;
  wallet_total: number;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface MigrationBatchDetail extends MigrationBatch {
  rows: Array<{
    id: string;
    row_number: number;
    legacy_user_id: string | null;
    email: string | null;
    phone: string | null;
    status: MigrationRowStatus;
    action: string | null;
    message: string | null;
    raw_payload: MigrationUserPayload | null;
    created_user_id: string | null;
    created_at: string;
  }>;
}

export interface MigrationUserPayload {
  legacy_user_id?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  wallet_balance?: number | string;
  role?: "user" | "moderator" | "admin" | "";
  virtual_account_number?: string;
  virtual_account_bank?: string;
  virtual_account_name?: string;
  old_created_at?: string;
}

export interface MigrationSearchResult {
  user_id: string;
  legacy_user_id: string | null;
  email: string;
  full_name: string | null;
  phone: string | null;
  wallet_balance: number;
  migration_status: string | null;
  invite_sent_at: string | null;
  migrated_at: string | null;
}

export interface MigrationInviteResult {
  user_id: string;
  email: string;
  invite_sent_at: string;
  reset_code?: string;
}

export function useMigrationBatches() {
  return useQuery({
    queryKey: ["admin-migration-batches"],
    queryFn: () => api.get<MigrationBatch[]>("/admin/migrations/batches"),
  });
}

export function useMigrationBatch(batchId: string | null) {
  return useQuery({
    queryKey: ["admin-migration-batch", batchId],
    queryFn: () => api.get<MigrationBatchDetail>(`/admin/migrations/batches/${batchId}`),
    enabled: !!batchId,
  });
}

export function useMigrationSearch(query: string) {
  return useQuery({
    queryKey: ["admin-migration-search", query],
    queryFn: () =>
      api.get<MigrationSearchResult[]>(
        `/admin/migrations/users/search?q=${encodeURIComponent(query)}`,
      ),
    enabled: query.trim().length >= 2,
  });
}

export function useAdminMigrations() {
  const queryClient = useQueryClient();

  const dryRun = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.upload<MigrationPreview>("/admin/migrations/users/dry-run", formData);
    },
  });

  const importRows = useMutation({
    mutationFn: ({
      rows,
      batchName,
      sendInvites,
    }: {
      rows: MigrationUserPayload[];
      batchName: string;
      sendInvites: boolean;
    }) =>
      api.post<MigrationImportResult>("/admin/migrations/users/import", {
        rows,
        batch_name: batchName,
        send_invites: sendInvites,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-migration-batches"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const migrateIndividual = useMutation({
    mutationFn: ({
      user,
      sendInvite,
    }: {
      user: MigrationUserPayload;
      sendInvite: boolean;
    }) =>
      api.post<MigrationImportResult>("/admin/migrations/users/individual", {
        user,
        send_invite: sendInvite,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-migration-batches"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const sendInvite = useMutation({
    mutationFn: (userId: string) =>
      api.post<MigrationInviteResult>(
        `/admin/migrations/users/${userId}/send-invite`,
        {},
      ),
  });

  return { dryRun, importRows, migrateIndividual, sendInvite };
}
