import React, { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  CloudUploadOutlined,
  DeleteOutlined,
  InfoOutlined,
  InsertDriveFileOutlined,
} from "@mui/icons-material";
import { useSubmitText } from "../hooks/useSubmitText";
import { useFormik } from "formik";
import * as Yup from "yup";
import SummaryResponse from "./Summary";
import AIChatAssistant from "./ChatAssitant";
import DocList, { DocumentItem } from "./DocList";
import { getDocumentSummary } from "../services/api";
import { SummaryResponse as SummaryResponseType } from "../types/api";

type InputMode = "text" | "file";

const DocumentAssist = () => {
  const { handleSubmit, loading, error, summary } = useSubmitText();
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [chatDocumentIds, setChatDocumentIds] = useState<string[]>([]);
  const [chatScope, setChatScope] = useState<"selected" | "all">("selected");
  const [selectedSummary, setSelectedSummary] =
    useState<SummaryResponseType | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string | undefined>();
  const [summaryLoadingDocumentId, setSummaryLoadingDocumentId] = useState<
    string | null
  >(null);
  const [summaryError, setSummaryError] = useState("");
  const [documentsRefreshKey, setDocumentsRefreshKey] = useState(0);
  const latestSummaryRequestId = useRef<string | null>(null);

  const formik = useFormik<{
    mode: InputMode;
    text: string;
    file: File | null;
    summaryLength: string;
    tone: string;
    format: string;
  }>({
    initialValues: {
      mode: "file" as InputMode,
      text: "",
      file: null as File | null,
      summaryLength: "medium",
      tone: "simple",
      format: "bullet",
    },

    validationSchema: Yup.object({
      mode: Yup.string().required(),

      text: Yup.string().when("mode", {
        is: "text",
        then: (schema) =>
          schema
            .trim()
            .required("Text is required")
            .min(10, "Minimum 10 characters"),
        otherwise: (schema) => schema.notRequired(),
      }),

      file: Yup.mixed().when("mode", {
        is: "file",
        then: (schema) =>
          schema
            .required("File is required")
            .test("fileSize", "File too large", (value: any) => {
              return value && value.size <= 5 * 1024 * 1024; // 5MB
            }),
        otherwise: (schema) => schema.notRequired(),
      }),
    }),

    onSubmit: async (values, { resetForm }) => {
      try {
        await handleSubmit(values);
        setSelectedSummary(null);
        setActiveDocumentId(undefined);
        setSummaryError("");
        setDocumentsRefreshKey((currentKey) => currentKey + 1);
        resetForm();
      } catch {
        // handled in hook
      }
    },
  });

  const handleDocumentClick = async (document: DocumentItem) => {
    try {
      setActiveDocumentId(document.id);
      setSummaryLoadingDocumentId(document.id);
      setSummaryError("");
      latestSummaryRequestId.current = document.id;

      const documentSummary = await getDocumentSummary(document.id);
      if (latestSummaryRequestId.current !== document.id) return;

      setSelectedSummary(documentSummary);
    } catch {
      if (latestSummaryRequestId.current !== document.id) return;

      setSelectedSummary(null);
      setSummaryError("Unable to load the selected document summary.");
    } finally {
      if (latestSummaryRequestId.current === document.id) {
        setSummaryLoadingDocumentId(null);
      }
    }
  };

  const displayedSummary = selectedSummary || summary;

  return (
    <Box
      sx={{
        height: "auto",
        minHeight: "100dvh",
        boxSizing: "border-box",
        background: "linear-gradient(135deg, #f8f5f0 0%, #fdfaf6 100%)",
        px: { xs: 1.5, md: 2 },
        py: { xs: 1.25, md: 1 },
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* HEADER */}
      <Box sx={{ textAlign: "center", mb: { xs: 1, md: 1 }, flexShrink: 0 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "#1f2937",
            mb: 0,
            fontSize: { xs: "1.05rem", md: "1.15rem" },
            lineHeight: 1.2,
          }}
        >
          AI Document Assistant
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            maxWidth: "700px",
            mx: "auto",
            fontSize: { xs: "0.78rem", md: "0.82rem" },
            lineHeight: 1.35,
            "@media (max-height: 760px)": {
              display: "none",
            },
          }}
        >
          Transform long blogs, reports, and articles into concise insights
          instantly.
        </Typography>
      </Box>

      {/* MAIN LAYOUT */}
      <Grid
        container
        spacing={2}
        sx={{
          maxWidth: "1740px",
          width: "100%",
          mx: "auto",
          flex: 1,
          minHeight: { xs: "auto", md: "calc(100dvh - 58px)" },
          alignItems: "stretch",
        }}
      >
        <Grid
          size={{ xs: 12, md: 2.4 }}
          sx={{
            minHeight: { xs: "auto", md: 0 },
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Paper
            component="form"
            onSubmit={formik.handleSubmit}
            elevation={0}
            sx={{
              p: 1.25,
              mb: 1,
              flexShrink: 0,
              borderRadius: 3,
              bgcolor: "#ffffff",
              border: "1px solid #e5e7eb",
              boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
            }}
          >
            <Stack spacing={0.75}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Upload Document
                </Typography>
                <Tooltip
                  title="Select a PDF, DOCX, or TXT file up to 5MB."
                  arrow
                  placement="top"
                >
                  <InfoOutlined
                    aria-label="Upload document requirements"
                    sx={{ color: "text.secondary", fontSize: 18 }}
                  />
                </Tooltip>
              </Box>

              {formik.values.file ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    minHeight: 36,
                    px: 1,
                    py: 0.5,
                    borderRadius: 2,
                    bgcolor: "#f8fafc",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <InsertDriveFileOutlined
                    sx={{ color: "#4f46e5", fontSize: 20 }}
                  />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography noWrap variant="body2" sx={{ fontWeight: 600 }}>
                      {formik.values.file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(formik.values.file.size / (1024 * 1024)).toFixed(2)} MB
                    </Typography>
                  </Box>
                  <Button
                    aria-label="Remove selected document"
                    size="small"
                    color="inherit"
                    onClick={() => formik.setFieldValue("file", null)}
                    sx={{ minWidth: 32, px: 0 }}
                  >
                    <DeleteOutlined fontSize="small" />
                  </Button>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadOutlined />}
                  sx={{
                    minHeight: 36,
                    borderRadius: 2,
                    py: 0.75,
                    borderStyle: "dashed",
                    textTransform: "none",
                    alignItems: "center",
                  }}
                >
                  Choose Document
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.doc,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const file = e.currentTarget.files?.[0] || null;
                      formik.setFieldValue("file", file);
                      formik.setFieldTouched("file", true, false);
                    }}
                  />
                </Button>
              )}

              {formik.touched.file && formik.errors.file && (
                <Alert severity="warning" sx={{ py: 0 }}>
                  {formik.errors.file}
                </Alert>
              )}

              {error && (
                <Alert severity="error" sx={{ py: 0 }}>
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                disabled={!formik.values.file || loading}
                startIcon={
                  loading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <CloudUploadOutlined />
                  )
                }
                sx={{
                  borderRadius: 2,
                  py: 0.85,
                  textTransform: "none",
                  fontWeight: 700,
                }}
              >
                {loading ? "Uploading..." : "Upload Document"}
              </Button>
            </Stack>
          </Paper>

          <DocList
            selectedDocumentIds={selectedDocumentIds}
            onSelectionChange={setSelectedDocumentIds}
            chatDocumentIds={chatDocumentIds}
            onChatSelectionChange={setChatDocumentIds}
            chatScope={chatScope}
            onChatScopeChange={setChatScope}
            activeDocumentId={activeDocumentId}
            loadingDocumentId={summaryLoadingDocumentId}
            onDocumentClick={handleDocumentClick}
            onInitialDocumentSelect={handleDocumentClick}
            refreshKey={documentsRefreshKey}
          />
        </Grid>

        {/* RIGHT PANEL */}
        <Grid
          size={{ xs: 12, md: 6.8 }}
          sx={{ minHeight: { xs: "auto", md: 0 }, display: "flex" }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 4,
              bgcolor: "#ffffff",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              border: "1px solid rgba(0,0,0,0.06)",
              height: { xs: "auto", md: "100%" },
              width: "100%",
              minHeight: { xs: 520, md: 0 },
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* HEADER */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1.5,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                }}
              >
                Document Summary
              </Typography>

              {/* {summary && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigator.clipboard.writeText()}
                  sx={{ borderRadius: 2 }}
                >
                  Copy
                </Button>
              )} */}
            </Box>

            <Divider />

            {/* OUTPUT AREA */}
            <Box
              sx={{
                mt: 2,
                flexGrow: 1,
                minHeight: { xs: 420, md: 0 },
                overflowY: "auto",
                pr: 1,
                whiteSpace: "pre-wrap",
                lineHeight: 2,
                fontSize: "1rem",
                color: "#374151",

                "&::-webkit-scrollbar": {
                  width: "8px",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#d1d5db",
                  borderRadius: "8px",
                },
              }}
            >
              {/* {summary ? (
                <>
                  {displayedSummary}
                  {summary && displayedSummary !== summary && (
                    <span className="cursor">|</span>
                  )}
                </>
              ) : (
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    color: "text.secondary",
                  }}
                >
                  <Typography variant="body1">
                    Your generated summary will appear here.
                    <br />
                    Choose your preferences and click “Generate Smart Summary”.
                  </Typography>
                </Box>
              )} */}
              {summaryLoadingDocumentId ? (
                <Box
                  sx={{
                    height: "100%",
                    minHeight: 500,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: 2,
                    color: "text.secondary",
                  }}
                >
                  <CircularProgress size={32} />
                  <Typography variant="body2">
                    Loading document summary...
                  </Typography>
                </Box>
              ) : summaryError ? (
                <Alert severity="error">{summaryError}</Alert>
              ) : (
                <SummaryResponse summaryData={displayedSummary} wordSpeed={80} />
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid
          size={{ xs: 12, md: 2.8 }}
          sx={{
            minHeight: { xs: 560, md: 0 },
            display: "flex",
            overflow: "hidden",
          }}
        >
          <AIChatAssistant
            selectedDocumentIds={chatDocumentIds}
            chatScope={chatScope}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DocumentAssist;
