import React from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Grid,
  Paper,
  FormControl,
  Divider,
} from "@mui/material";
import { useSubmitText } from "../../hooks/useSubmitText";
import { useFormik } from "formik";
import * as Yup from "yup";
import SummaryResponse from "./Summary";

type InputMode = "text" | "file";

const TextForm = () => {
  const { handleSubmit, loading, summary } = useSubmitText();

  const formik = useFormik<{
    mode: InputMode;
    text: string;
    file: File | null;
    summaryLength: string;
    tone: string;
    format: string;
  }>({
    initialValues: {
      mode: "text" as InputMode,
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
        handleSubmit(values);
        resetForm();
      } catch {
        // handled in hook
      }
    },
  });

  // =============================
  // PREMIUM UI UPGRADE (MUI + FORMIIK)
  // Focus:
  // 1. Better background
  // 2. Sticky left panel
  // 3. Scrollable right panel
  // 4. Improved header
  // 5. Better cards
  // 6. Modern buttons
  // =============================

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8f5f0 0%, #fdfaf6 100%)",
        px: { xs: 2, md: 6 },
        py: 4,
      }}
    >
      {/* HEADER */}
      <Box sx={{ textAlign: "center", mb: 5 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            color: "#1f2937",
            mb: 1,
          }}
        >
          Smart Blog Summarizer
        </Typography>

        <Typography
          variant="subtitle1"
          sx={{
            color: "text.secondary",
            maxWidth: "700px",
            mx: "auto",
          }}
        >
          Transform long blogs, reports, and articles into concise insights
          instantly.
        </Typography>
      </Box>

      {/* MAIN LAYOUT */}
      <Grid
        container
        spacing={3}
        sx={{
          maxWidth: "1500px",
          mx: "auto",
          alignItems: "flex-start",
        }}
      >
        {/* LEFT PANEL */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              bgcolor: "#ffffff",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              border: "1px solid rgba(0,0,0,0.06)",
              position: "sticky",
              top: 20,
            }}
          >
            <Box
              component="form"
              onSubmit={formik.handleSubmit}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              {/* SECTION TITLE */}
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                }}
              >
                Provide content to summarize
              </Typography>

              {/* MODE */}
              <FormControl>
                <Typography variant="subtitle1" gutterBottom>
                  Input Source
                </Typography>
                <RadioGroup
                  row
                  name="mode"
                  value={formik.values.mode}
                  onChange={formik.handleChange}
                >
                  <FormControlLabel
                    value="text"
                    control={<Radio />}
                    label="Enter Text"
                  />
                  <FormControlLabel
                    value="file"
                    control={<Radio />}
                    label="Upload File"
                  />
                </RadioGroup>
              </FormControl>

              <Divider />

              {/* SUMMARY SETTINGS */}
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                }}
              >
                Summary Preferences
              </Typography>

              {/* LENGTH */}
              <FormControl>
                <Typography variant="subtitle1" gutterBottom>
                  Summary Length
                </Typography>
                <RadioGroup
                  row
                  name="summaryLength"
                  value={formik.values.summaryLength}
                  onChange={formik.handleChange}
                >
                  <FormControlLabel
                    value="short"
                    control={<Radio />}
                    label="Short"
                  />
                  <FormControlLabel
                    value="medium"
                    control={<Radio />}
                    label="Medium"
                  />
                  <FormControlLabel
                    value="long"
                    control={<Radio />}
                    label="Long"
                  />
                </RadioGroup>
              </FormControl>

              {/* TONE */}
              <FormControl>
                <Typography variant="subtitle1" gutterBottom>
                  Tone Style
                </Typography>
                <RadioGroup
                  row
                  name="tone"
                  value={formik.values.tone}
                  onChange={formik.handleChange}
                >
                  <FormControlLabel
                    value="simple"
                    control={<Radio />}
                    label="Simple"
                  />
                  <FormControlLabel
                    value="professional"
                    control={<Radio />}
                    label="Professional"
                  />
                </RadioGroup>
              </FormControl>

              {/* FORMAT */}
              <FormControl>
                <Typography variant="subtitle1" gutterBottom>
                  Output Format
                </Typography>
                <RadioGroup
                  row
                  name="format"
                  value={formik.values.format}
                  onChange={formik.handleChange}
                >
                  <FormControlLabel
                    value="bullet"
                    control={<Radio />}
                    label="Bullet Points"
                  />
                  <FormControlLabel
                    value="paragraph"
                    control={<Radio />}
                    label="Brief Paragraph"
                  />
                </RadioGroup>
              </FormControl>

              {/* TEXT MODE */}
              {formik.values.mode === "text" && (
                <Box sx={{ position: "relative" }}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={10}
                    maxRows={18}
                    value={formik.values.text}
                    onChange={formik.handleChange("text")}
                    placeholder="Paste your article, blog, notes, or report here..."
                    variant="outlined"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        alignItems: "flex-start",
                        p: 2,
                        lineHeight: 1.8,
                        bgcolor: "#fafafa",
                      },
                    }}
                  />

                  {/* CHARACTER COUNT */}
                  <Typography
                    variant="caption"
                    sx={{
                      position: "absolute",
                      bottom: 12,
                      right: 14,
                      color: "text.secondary",
                      bgcolor: "rgba(255,255,255,0.8)",
                      px: 1,
                      borderRadius: 1,
                    }}
                  >
                    {formik.values.text.length} characters
                  </Typography>
                </Box>
              )}

              {/* FILE MODE */}
              {formik.values.mode === "file" && (
                <Button
                  variant="outlined"
                  component="label"
                  sx={{
                    borderRadius: 3,
                    py: 2,
                    borderStyle: "dashed",
                  }}
                >
                  {formik.values.file
                    ? formik.values.file.name
                    : "Drag & Drop or Choose File"}
                  <input
                    type="file"
                    hidden
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const file = e.currentTarget.files?.[0] || null;
                      formik.setFieldValue("file", file);
                    }}
                  />
                </Button>
              )}

              {/* SUBMIT BUTTON */}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{
                  mt: 2,
                  py: 1.6,
                  borderRadius: 3,
                  fontWeight: 600,
                  fontSize: "1rem",
                  textTransform: "none",
                  bgcolor: "#d97706",
                  "&:hover": {
                    bgcolor: "#b45309",
                  },
                }}
              >
                {loading ? "Generating..." : "Generate Smart Summary"}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* RIGHT PANEL */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              bgcolor: "#ffffff",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              border: "1px solid rgba(0,0,0,0.06)",
              height: "80vh",
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
                mb: 2,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                }}
              >
                Summary Output
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
                mt: 3,
                flexGrow: 1,
                overflowY: "auto",
                pr: 2,
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
              <SummaryResponse summaryData={summary} wordSpeed={80} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TextForm;
