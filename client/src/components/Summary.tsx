import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { SummaryResponse as SummaryResponseType } from "../types/api";

interface Props {
  summaryData: SummaryResponseType | null;
  wordSpeed?: number;
}

const cleanQuestionTopic = (value?: string) =>
  (value || "")
    .replace(/^[\s•-]+/, "")
    .replace(/[.!?]+$/, "")
    .trim();

const shortenQuestionTopic = (value: string) =>
  value.length > 90 ? `${value.slice(0, 87)}...` : value;

const buildFallbackSuggestedQuestions = (summaryData: SummaryResponseType) => {
  const firstInsight = cleanQuestionTopic(summaryData.keyInsights?.[0]);
  const firstRisk = cleanQuestionTopic(summaryData.risks?.[0]);
  const firstTakeaway = cleanQuestionTopic(summaryData.takeaways?.[0]);

  const questions = [
    "What are the main points of this document?",
    firstInsight
      ? `Can you explain this insight: ${shortenQuestionTopic(firstInsight)}?`
      : "What are the most important insights?",
    firstRisk
      ? `Which risk needs the most attention: ${shortenQuestionTopic(firstRisk)}?`
      : "Are there any risks or concerns I should know?",
    firstTakeaway
      ? `How should I act on this takeaway: ${shortenQuestionTopic(firstTakeaway)}?`
      : "What actions should I take next?",
    "Can you summarize this in simpler terms?",
  ];

  return Array.from(new Set(questions)).slice(0, 5);
};

const getSuggestedQuestions = (summaryData: SummaryResponseType) => {
  const storedQuestions =
    summaryData.suggestedQuestions?.map(cleanQuestionTopic).filter(Boolean) ||
    [];

  return storedQuestions.length > 0
    ? storedQuestions
    : buildFallbackSuggestedQuestions(summaryData);
};

const getSummaryText = (summaryData: SummaryResponseType) =>
  (Array.isArray(summaryData.summary)
    ? summaryData.summary.join(" ")
    : summaryData.summary || ""
  )
    .replace(/\s+undefined\s*$/i, "")
    .trim();

const SummaryResponse: React.FC<Props> = ({ summaryData, wordSpeed = 35 }) => {
  const [animatedSummary, setAnimatedSummary] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (!summaryData?.summary) return;

    setAnimatedSummary("");
    setActiveTab(0);

    const rawSummary = getSummaryText(summaryData);
    const words = rawSummary.split(/\s+/).filter(Boolean);
    let wordIndex = 0;

    if (words.length === 0) return;

    const summaryInterval = setInterval(() => {
      if (wordIndex < words.length) {
        setAnimatedSummary(words.slice(0, wordIndex + 1).join(" "));
        wordIndex++;
      } else {
        clearInterval(summaryInterval);
      }
    }, wordSpeed);

    return () => clearInterval(summaryInterval);
  }, [summaryData, wordSpeed]);

  const getSentimentColor = (): "success" | "error" | "warning" => {
    switch (summaryData?.sentiment?.toLowerCase()) {
      case "positive":
        return "success";
      case "negative":
        return "error";
      default:
        return "warning";
    }
  };

  const handleCopy = async () => {
    if (!summaryData) return;

    const content = `
Summary:
${Array.isArray(summaryData.summary) ? summaryData.summary.join("\n") : summaryData.summary}

Key Insights:
${summaryData.keyInsights?.map((i) => `- ${i}`).join("\n")}

Risks:
${summaryData.risks?.map((r) => `- ${r}`).join("\n")}

Takeaways:
${summaryData.takeaways?.map((t) => `- ${t}`).join("\n")}

Suggested Questions:
${getSuggestedQuestions(summaryData)
  .map((question) => `- ${question}`)
  .join("\n")}

Sentiment: ${summaryData.sentiment}
    `;

    await navigator.clipboard.writeText(content);
  };

  const renderList = (items: string[] | undefined, emptyText: string) =>
    items && items.length > 0 ? (
      <List dense disablePadding>
        {items.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ mb: 1 }}>
            <ListItemText
              primary={<Typography sx={{ lineHeight: 1.8 }}>- {item}</Typography>}
            />
          </ListItem>
        ))}
      </List>
    ) : (
      <Typography color="text.secondary">{emptyText}</Typography>
    );

  if (!summaryData) {
    return (
      <Box
        sx={{
          height: "100%",
          minHeight: 500,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          color: "text.secondary",
          px: 4,
        }}
      >
        <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
          Your AI-generated smart report will appear here.
          <br />
          Upload a document to generate a summary.
        </Typography>
      </Box>
    );
  }

  const suggestedQuestions = getSuggestedQuestions(summaryData);
  const rawSummary = getSummaryText(summaryData);
  const isSummaryComplete = animatedSummary === rawSummary;

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: 4,
          bgcolor: "#fffaf5",
          border: "1px solid #f0d9bd",
          minHeight: "100%",
        }}
      >
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 2,
            bgcolor: "#fffaf5",
            pt: 0.5,
            pb: 1,
          }}
        >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            mb: 1.25,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#1f1f1f" }}>
            AI Generated Smart Report
          </Typography>

          <Button
            variant="outlined"
            size="small"
            startIcon={<ContentCopyIcon />}
            onClick={handleCopy}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Copy
          </Button>
        </Box>

        <Divider sx={{ mb: 1 }} />

        <Tabs
          value={activeTab}
          onChange={(_, nextTab) => setActiveTab(nextTab)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 0,
            borderBottom: "1px solid #e5e7eb",
            minHeight: 36,
            "& .MuiTab-root": {
              minHeight: 36,
              textTransform: "none",
              fontWeight: 700,
              px: 2,
            },
          }}
        >
          <Tab label="Summary" />
          <Tab label="Key Insights" />
          <Tab label="Takeaways" />
          <Tab label="Risks" />
        </Tabs>
        </Box>

        {activeTab === 0 && (
          <Box sx={{ pt: 2.5 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                Summary
              </Typography>

              <Typography
                variant="body1"
                sx={{ lineHeight: 2, color: "#333", whiteSpace: "pre-wrap" }}
              >
                {animatedSummary}
                {!isSummaryComplete && (
                  <span className="cursor">|</span>
                )}
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Suggested Questions
              </Typography>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {suggestedQuestions.map((question) => (
                  <Button
                    key={question}
                    variant="outlined"
                    size="small"
                    onClick={() => navigator.clipboard.writeText(question)}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      justifyContent: "flex-start",
                      maxWidth: "100%",
                      whiteSpace: "normal",
                      textAlign: "left",
                    }}
                  >
                    {question}
                  </Button>
                ))}
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Sentiment
              </Typography>
              <Chip
                label={summaryData.sentiment || "Neutral"}
                color={getSentimentColor()}
                sx={{ fontWeight: "bold", fontSize: "0.95rem", px: 2 }}
              />
            </Box>
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ pt: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Key Insights
            </Typography>
            {renderList(summaryData.keyInsights, "No insights available.")}
          </Box>
        )}

        {activeTab === 2 && (
          <Box sx={{ pt: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Actionable Takeaways
            </Typography>
            {renderList(summaryData.takeaways, "No takeaways available.")}
          </Box>
        )}

        {activeTab === 3 && (
          <Box sx={{ pt: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Risks
            </Typography>
            {renderList(summaryData.risks, "No major risks identified.")}
          </Box>
        )}
      </Paper>

      <style>
        {`
          .cursor {
            display: inline-block;
            margin-left: 2px;
            animation: blink 1s infinite;
            font-weight: bold;
          }

          @keyframes blink {
            50% {
              opacity: 0;
            }
          }
        `}
      </style>
    </>
  );
};

export default SummaryResponse;
