export interface SubmitTextRequest {
  message: string;
}

export interface SubmitTextResponse {
  success: boolean;
  message: SummaryResponse;
}

export interface SummarizeTextRequest {
  text?: string;
  file: File | null;
  summaryLength: string;
  tone: string;
  format: string;
}

export interface SummaryResponse {
  summary: string | string[];
  keyInsights: string[];
  risks: string[];
  sentiment: string;
  takeaways: string[];
}
