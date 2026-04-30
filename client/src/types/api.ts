export interface SubmitTextRequest {
  message: string;
}

export interface SubmitTextResponse {
  success: boolean;
  message: string;
}

export interface SummarizeTextRequest {
  text?: string;
  file: File | null;
  summaryLength: string;
  tone: string;
  format: string;
}
