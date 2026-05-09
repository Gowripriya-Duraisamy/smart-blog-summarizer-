import React, { useEffect, useState } from "react";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Box,
  Divider,
  Paper,
  Button,
} from "@mui/material";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import { SummaryResponse as SummaryResponseType } from "../../types/api";

interface Props {
  summaryData: SummaryResponseType | null;
  wordSpeed?: number;
}

const SummaryResponse: React.FC<Props> = ({ summaryData, wordSpeed = 35 }) => {
  const [animatedSummary, setAnimatedSummary] = useState("");
  const [displayedInsights, setDisplayedInsights] = useState<string[]>([]);
  const [displayedRisks, setDisplayedRisks] = useState<string[]>([]);
  const [displayedTakeaways, setDisplayedTakeaways] = useState<string[]>([]);

  useEffect(() => {
    if (!summaryData?.summary) return;

    setAnimatedSummary("");
    setDisplayedInsights([]);
    setDisplayedRisks([]);
    setDisplayedTakeaways([]);

    let wordIndex = -1;
    const rawSummary = Array.isArray(summaryData.summary)
      ? summaryData.summary.join(" ")
      : summaryData.summary || "";
    const words = rawSummary.split(/\s+/).filter(Boolean);

    const summaryInterval = setInterval(() => {
      if (wordIndex < words.length) {
        setAnimatedSummary((prev) =>
          prev ? `${prev} ${words[wordIndex]}` : words[wordIndex],
        );
        wordIndex++;
      } else {
        clearInterval(summaryInterval);

        animateList(summaryData.keyInsights || [], setDisplayedInsights, () => {
          animateList(summaryData.risks || [], setDisplayedRisks, () => {
            animateList(summaryData.takeaways || [], setDisplayedTakeaways);
          });
        });
      }
    }, wordSpeed);

    return () => clearInterval(summaryInterval);
  }, [summaryData, wordSpeed]);

  const animateList = (
    items: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    callback?: () => void,
  ) => {
    if (!items || items.length === 0) {
      callback?.();
      return;
    }

    let index = 0;

    const interval = setInterval(() => {
      if (index < items.length) {
        setter((prev) => [...prev, items[index]]);
        index++;
      } else {
        clearInterval(interval);
        callback?.();
      }
    }, 180);
  };

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
  ${summaryData.keyInsights?.map((i) => `• ${i}`).join("\n")}

  Risks:
  ${summaryData.risks?.map((r) => `• ${r}`).join("\n")}

  Takeaways:
  ${summaryData.takeaways?.map((t) => `• ${t}`).join("\n")}

  Sentiment: ${summaryData.sentiment}
    `;

    await navigator.clipboard.writeText(content);
  };

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
          Enter content, choose preferences, and click Generate Summary.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          bgcolor: "#fffaf5",
          border: "1px solid #f0d9bd",
          height: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
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
              fontWeight: 700,
              color: "#1f1f1f",
            }}
          >
            AI Generated Smart Report
          </Typography>

          <Button
            variant="outlined"
            size="small"
            startIcon={<ContentCopyIcon />}
            onClick={handleCopy}
            sx={{
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            Copy
          </Button>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* SUMMARY */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
            📌 Summary
          </Typography>

          <Typography
            variant="body1"
            sx={{
              lineHeight: 2,
              color: "#333",
              whiteSpace: "pre-wrap",
            }}
          >
            {animatedSummary}
            {animatedSummary !== summaryData.summary && (
              <span className="cursor">|</span>
            )}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* KEY INSIGHTS */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
            💡 Key Insights
          </Typography>

          {displayedInsights.length > 0 ? (
            <List dense>
              {displayedInsights.map((item, index) => (
                <ListItem key={index} disablePadding sx={{ mb: 1 }}>
                  <ListItemText
                    primary={
                      <Typography sx={{ lineHeight: 1.8 }}>• {item}</Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary">
              No insights available.
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* RISKS */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
            ⚠️ Risks
          </Typography>

          {displayedRisks.length > 0 ? (
            <List dense>
              {displayedRisks.map((risk, index) => (
                <ListItem key={index} disablePadding sx={{ mb: 1 }}>
                  <ListItemText
                    primary={
                      <Typography sx={{ lineHeight: 1.8 }}>• {risk}</Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary">
              No major risks identified.
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* TAKEAWAYS */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
            🚀 Actionable Takeaways
          </Typography>

          {displayedTakeaways.length > 0 ? (
            <List dense>
              {displayedTakeaways.map((takeaway, index) => (
                <ListItem key={index} disablePadding sx={{ mb: 1 }}>
                  <ListItemText
                    primary={
                      <Typography sx={{ lineHeight: 1.8 }}>
                        • {takeaway}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary">
              No takeaways available.
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* SENTIMENT */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            😊 Sentiment
          </Typography>

          <Chip
            label={summaryData.sentiment || "Neutral"}
            color={getSentimentColor()}
            sx={{
              fontWeight: "bold",
              fontSize: "0.95rem",
              px: 2,
            }}
          />
        </Box>
      </Paper>

      {/* CURSOR STYLE */}
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
