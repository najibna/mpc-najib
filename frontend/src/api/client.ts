import axios from "axios";
import type {
  AnalyzeResponse,
  AnalyzedTransaction,
  UploadResponse,
} from "../types/transaction";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export const api = axios.create({ baseURL });

export async function uploadFile(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<UploadResponse>("/api/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function analyzeUpload(uploadId: string): Promise<AnalyzeResponse> {
  const { data } = await api.post<AnalyzeResponse>(`/api/analyze/${uploadId}`);
  return data;
}

export type TransactionFilters = {
  risk_category?: string;
  merchant?: string;
  country?: string;
  mcc?: string;
  search?: string;
  min_score?: number;
  sort_by?: "risk_score" | "amount" | "transaction_date";
  order?: "asc" | "desc";
};

export async function fetchTransactions(
  jobId: string,
  filters: TransactionFilters,
): Promise<AnalyzedTransaction[]> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(
      ([, v]) => v !== undefined && v !== "" && v !== null,
    ),
  );
  const { data } = await api.get<AnalyzedTransaction[]>(
    `/api/transactions/${jobId}`,
    { params },
  );
  return data;
}

export function exportUrl(jobId: string, format: "csv" | "xlsx"): string {
  return `${baseURL}/api/export/${jobId}?format=${format}&flagged_only=true`;
}
