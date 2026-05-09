import { useState } from "react";
import { submitText } from "../services/api";
import { SummarizeTextRequest, SummaryResponse } from "../types/api";

export const useSubmitText = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);

  const handleSubmit = async (values: SummarizeTextRequest) => {
    if (!values.file && (!values.text || !values.text.trim())) {
      setError("Text or file is required");
      throw new Error("Text or file is required");
    }

    try {
      setLoading(true);
      setError(null);

      if (values.file) {
        const formData = new FormData();
        formData.append("file", values.file);
        formData.append("length", values.summaryLength);
        formData.append("tone", values.tone);
        formData.append("format", values.format);
        const response = await submitText(formData);
        console.log("API response:", response);
        console.log(
          "Extracted summary from response:",
          response.message.summary,
        );
        setSummary(response.message);
      } else {
        const payload = { message: values.text!.trim(), ...values };
        const response = await submitText(payload);
        setSummary(response.message);
      }
    } catch (err) {
      setError("Failed to submit. Try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { handleSubmit, loading, error, summary };
};
