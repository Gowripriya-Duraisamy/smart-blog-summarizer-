import axios from "axios";
import { SubmitTextRequest, SubmitTextResponse } from "../types/api";

const apiClient = axios.create({
  baseURL: "http://localhost:5000",
  headers: {
    Accept: "application/json",
  },
});

export const submitText = async (
  payload: SubmitTextRequest | FormData,
): Promise<SubmitTextResponse> => {
  const response = await apiClient.post("/api/summary", payload);
  return response.data;
};
