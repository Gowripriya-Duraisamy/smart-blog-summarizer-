export interface SummaryFormat {
  text: string;
  length: number;
  tone: string;
  format: string;
  fileName?: string;
  type: string;
}

export interface ExtractedResponse {
  type: string;
  text: string;
}
