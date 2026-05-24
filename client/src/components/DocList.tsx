// DocumentsPanel.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import {
  DescriptionOutlined,
  PictureAsPdfOutlined,
  ArticleOutlined,
  SearchOutlined,
} from "@mui/icons-material";

export interface DocumentItem {
  id: string;
  fileName: string;
  fileType: "PDF" | "DOCX" | "TXT";
  uploadedAt: string;
  size?: string;
}

interface ApiDocumentItem {
  id: string;
  displayName?: string;
  originalFileName?: string;
  sourceType?: string;
  uploadedDate?: string;
  createdAt?: string;
}

interface ApiDocumentsResponse {
  data: ApiDocumentItem[];
}

interface DocumentsPanelProps {
  selectedDocumentIds: string[];
  onSelectionChange: (ids: string[]) => void;
  chatDocumentIds: string[];
  onChatSelectionChange: (ids: string[]) => void;
  chatScope: "selected" | "all";
  onChatScopeChange: (scope: "selected" | "all") => void;
  activeDocumentId?: string;
  loadingDocumentId?: string | null;
  onDocumentClick?: (document: DocumentItem) => void;
  onInitialDocumentSelect?: (document: DocumentItem) => void;
  refreshKey?: number;
}

const getApiBaseUrl = () => (process.env.REACT_APP_API_URL || "").trim();

const toFileType = (sourceType?: string): DocumentItem["fileType"] => {
  const normalizedType = sourceType?.toUpperCase();

  if (normalizedType === "PDF" || normalizedType === "DOCX") {
    return normalizedType;
  }

  return "TXT";
};

const fetchDocuments = async (search = ""): Promise<DocumentItem[]> => {
  const apiBaseUrl = getApiBaseUrl();
  const params = new URLSearchParams({
    limit: "50",
  });

  if (search.trim()) {
    params.set("search", search.trim());
  }

  const response = await fetch(`${apiBaseUrl}/api/documents?${params}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch documents");
  }

  const result = (await response.json()) as ApiDocumentsResponse;

  return (result.data || []).map((doc) => ({
    id: doc.id,
    fileName: doc.displayName || doc.originalFileName || "Untitled document",
    fileType: toFileType(doc.sourceType),
    uploadedAt: doc.uploadedDate || doc.createdAt || "",
  }));
};

const getFileIcon = (type: DocumentItem["fileType"]) => {
  switch (type) {
    case "PDF":
      return <PictureAsPdfOutlined sx={{ color: "#ef4444", fontSize: 22 }} />;
    case "DOCX":
      return <ArticleOutlined sx={{ color: "#2563eb", fontSize: 22 }} />;
    default:
      return <DescriptionOutlined sx={{ color: "#6b7280", fontSize: 22 }} />;
  }
};

export default function DocumentsPanel({
  selectedDocumentIds,
  onSelectionChange,
  chatDocumentIds,
  onChatSelectionChange,
  chatScope,
  onChatScopeChange,
  activeDocumentId,
  loadingDocumentId,
  onDocumentClick,
  onInitialDocumentSelect,
  refreshKey = 0,
}: DocumentsPanelProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [chatDocuments, setChatDocuments] = useState<DocumentItem[]>([]);
  const [documentSearch, setDocumentSearch] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatError, setChatError] = useState("");
  const initialDocumentSelected = useRef(false);

  const loadDocuments = async (search = documentSearch) => {
    try {
      setLoading(true);
      setError("");

      const data = await fetchDocuments(search);
      setDocuments(data);

      if (
        !initialDocumentSelected.current &&
        !search.trim() &&
        data.length > 0
      ) {
        initialDocumentSelected.current = true;
        onInitialDocumentSelect?.(data[0]);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load documents.");
    } finally {
      setLoading(false);
    }
  };

  const loadChatDocuments = async (search = chatSearch) => {
    try {
      setChatLoading(true);
      setChatError("");

      const data = await fetchDocuments(search);
      setChatDocuments(data);
    } catch (err) {
      console.error(err);
      setChatError("Unable to load chat documents.");
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadDocuments(documentSearch);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [documentSearch, refreshKey]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadChatDocuments(chatSearch);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [chatSearch, refreshKey]);

  const handleDocumentClick = (doc: DocumentItem) => {
    onDocumentClick?.(doc);
    onSelectionChange([doc.id]);
  };

  const toggleChatDocument = (documentId: string) => {
    const selected = chatDocumentIds.includes(documentId);

    if (selected) {
      onChatSelectionChange(chatDocumentIds.filter((id) => id !== documentId));
    } else {
      onChatSelectionChange([...chatDocumentIds, documentId]);
    }
  };

  return (
    <Box
      sx={{
        height: { xs: "auto", md: "100%" },
        minHeight: { xs: 520, md: 0 },
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #e5e7eb",
        bgcolor: "#ffffff",
      }}
    >
      <Box sx={{ px: 1.5, pt: 1.25, pb: 0.75 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>
          Documents ({documents.length})
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Search documents..."
          value={documentSearch}
          onChange={(event) => setDocumentSearch(event.target.value)}
          slotProps={{
            input: {
              startAdornment: <SearchOutlined sx={{ color: "#64748b", mr: 1 }} />,
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              bgcolor: "#ffffff",
            },
          }}
        />
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          minHeight: { xs: 280, md: 0 },
          overflowY: "auto",
          px: 0.75,
          pb: 0.75,
        }}
      >
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ m: 1 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && documents.length === 0 && (
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              textAlign: "center",
              m: 1,
              borderStyle: "dashed",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {documentSearch.trim()
                ? "No matching documents found."
                : "No documents found."}
            </Typography>
          </Paper>
        )}

        {!loading && !error && documents.length > 0 && (
          <List disablePadding>
            {documents.map((doc) => {
              const selected = selectedDocumentIds.includes(doc.id);
              const active = activeDocumentId === doc.id;
              const loadingSummary = loadingDocumentId === doc.id;

              return (
                <ListItemButton
                  key={doc.id}
                  selected={active || selected}
                  onClick={() => handleDocumentClick(doc)}
                  sx={{
                    mb: 0.4,
                    mx: 0.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: active ? "#4f46e5" : "transparent",
                    bgcolor: active || selected ? "#f5f3ff" : "transparent",
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {loadingSummary ? (
                      <CircularProgress size={20} />
                    ) : (
                      getFileIcon(doc.fileType)
                    )}
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Typography
                        noWrap
                        sx={{ variant: "body2", fontWeight: 600 }}
                      >
                        {doc.fileName}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {doc.fileType}
                        {doc.size ? ` • ${doc.size}` : ""}
                      </Typography>
                    }
                  />
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Box>

      <Divider />

      <Box sx={{ p: 1.25, bgcolor: "#ffffff", flexShrink: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            mb: 0.75,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Choose for Chat ({chatDocumentIds.length})
          </Typography>

          <Button
            size="small"
            disabled={chatDocumentIds.length === 0}
            onClick={() => onChatSelectionChange([])}
            sx={{ minWidth: "auto", textTransform: "none" }}
          >
            Clear
          </Button>
        </Box>

        <TextField
          fullWidth
          size="small"
          placeholder="Search chat documents..."
          value={chatSearch}
          onChange={(event) => setChatSearch(event.target.value)}
          slotProps={{
            input: {
              startAdornment: <SearchOutlined sx={{ color: "#64748b", mr: 1 }} />,
            },
          }}
          sx={{
            mb: 0.75,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              bgcolor: "#ffffff",
            },
          }}
        />

        <Box
          sx={{
            maxHeight: 150,
            overflowY: "auto",
            pr: 0.5,
          }}
        >
          {chatLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={22} />
            </Box>
          ) : chatError ? (
            <Alert severity="error" sx={{ my: 1 }}>
              {chatError}
            </Alert>
          ) : chatDocuments.length === 0 ? (
            <Typography variant="caption" color="text.secondary">
              {chatSearch.trim()
                ? "No matching documents found."
                : "Upload documents to select them for chat."}
            </Typography>
          ) : (
            chatDocuments.map((doc) => {
              const checked = chatDocumentIds.includes(doc.id);

              return (
                <Box
                  key={doc.id}
                  onClick={() => toggleChatDocument(doc.id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: 0.5,
                    py: 0.35,
                    borderRadius: 1.5,
                    cursor: "pointer",
                    bgcolor: checked ? "#f5f3ff" : "transparent",
                    "&:hover": {
                      bgcolor: checked ? "#ede9fe" : "#f8fafc",
                    },
                  }}
                >
                  <Checkbox
                    checked={checked}
                    size="small"
                    onClick={(event) => event.stopPropagation()}
                    onChange={() => toggleChatDocument(doc.id)}
                    sx={{ p: 0.25 }}
                  />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography noWrap variant="body2" sx={{ fontWeight: 600 }}>
                      {doc.fileName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {doc.fileType}
                    </Typography>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>

        <Divider sx={{ my: 1 }} />

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>
          Chat Scope
        </Typography>
        <Select
          fullWidth
          size="small"
          value={chatScope}
          onChange={(event) =>
            onChatScopeChange(event.target.value as "selected" | "all")
          }
          sx={{
            borderRadius: 2,
            bgcolor: "#ffffff",
            fontWeight: 600,
          }}
        >
          <MenuItem value="selected">
            Selected Documents ({chatDocumentIds.length})
          </MenuItem>
          <MenuItem value="all">Entire DB Search</MenuItem>
        </Select>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 0.75 }}
        >
          {chatScope === "selected"
            ? "Ask questions about the checked documents."
            : "Search across all indexed documents."}
        </Typography>
      </Box>
    </Box>
  );
}
