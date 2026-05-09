import { styled } from "@mui/material/styles";
import { Box, Card } from "@mui/material";

export const SummaryGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: theme.spacing(3),
  marginTop: theme.spacing(2),
}));

export const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  padding: theme.spacing(3),
  boxShadow: theme.shadows[3],
}));

export const SummaryCard = styled(StyledCard)({
  backgroundColor: "#fff8f0",
});

export const InsightsCard = styled(StyledCard)({
  backgroundColor: "#f5faff",
});

export const RisksCard = styled(StyledCard)({
  backgroundColor: "#fff5f5",
});

export const TakeawaysCard = styled(StyledCard)({
  backgroundColor: "#f8fff5",
  gridColumn: "1 / -1",
});

export const SentimentCard = styled(StyledCard)({
  backgroundColor: "#f9f9ff",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
});
