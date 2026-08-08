"use client";

import React, { useEffect } from "react";

export interface LMSFileForPreview {
  id: string | number;
  name: string;
  drive_file_id?: string;
  drive_url?: string;
  youtube_url?: string;
  storage_type?: string;
  google_drive_id?: string;
  type: string;
  subject?: string | null;
  uploaded_by?: string;
  created_at?: string;
  size_bytes?: number;
}

interface FilePreviewModalProps {
  file: LMSFileForPreview;
  onClose: () => void;
}

function extractYouTubeId(file: LMSFileForPreview): string | null {
  if (file.drive_file_id && /^[a-zA-Z0-9_-]{11}$/.test(file.drive_file_id.trim())) {
    return file.drive_file_id.trim();
  }
  const candidates = [file.youtube_url, file.drive_url, file.drive_file_id];
  for (const url of candidates) {
    if (!url) continue;
    const match = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    if (match && match[1]) return match[1];
  }
  return null;
}

function getGoogleDrivePreviewUrl(file: LMSFileForPreview): string | null {
  const fileId = file.google_drive_id || file.drive_file_id;
  if (fileId && !fileId.startsWith("http") && !fileId.includes("/") && fileId.length > 15) {
    return `https://drive.google.com/file/d/${fileId.trim()}/preview`;
  }
  const url = file.drive_url || "";
  const match = url.match(/\/file\/d\/([^\/]+)/) || url.match(/[?&]id=([^&]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  if (url && (url.includes("drive.google.com") || url.includes("docs.google.com"))) {
    return url;
  }
  return null;
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  const isYouTube =
    file.storage_type === "YOUTUBE" ||
    Boolean(file.youtube_url) ||
    file.type === "Video" ||
    Boolean(
      file.drive_url &&
        (file.drive_url.includes("youtube.com") || file.drive_url.includes("youtu.be"))
    );

  const youtubeId = isYouTube ? extractYouTubeId(file) : null;
  const drivePreviewUrl = !isYouTube ? getGoogleDrivePreviewUrl(file) : null;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "960px",
          width: "94%",
          padding: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          height: "85vh",
          maxHeight: "850px",
        }}
      >
        {/* Modal Header */}
        <div
          className="modal-header"
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border)",
            background: "rgba(15, 23, 42, 0.7)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: "1.4rem" }}>{isYouTube ? "🎬" : "📄"}</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={file.name}
              >
                {file.name}
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                {file.subject && (
                  <span
                    className="badge subject-badge"
                    style={{ fontSize: "0.7rem", padding: "2px 8px" }}
                  >
                    {file.subject}
                  </span>
                )}
                <span
                  className="badge"
                  style={{
                    fontSize: "0.7rem",
                    padding: "2px 8px",
                    background: isYouTube
                      ? "rgba(239, 68, 68, 0.15)"
                      : "rgba(59, 130, 246, 0.15)",
                    color: isYouTube ? "#f87171" : "#60a5fa",
                    border: isYouTube
                      ? "1px solid rgba(239, 68, 68, 0.3)"
                      : "1px solid rgba(59, 130, 246, 0.3)",
                  }}
                >
                  {isYouTube ? "YouTube Video" : file.type || "Document"}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            style={{ marginLeft: "12px" }}
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Modal Main Content (Iframe Preview) */}
        <div
          style={{
            flex: 1,
            width: "100%",
            backgroundColor: "#0f172a",
            position: "relative",
          }}
        >
          {isYouTube ? (
            youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                title={file.name}
                style={{
                  width: "100%",
                  height: "100%",
                  border: 0,
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  color: "#94a3b8",
                }}
              >
                <span style={{ fontSize: "2.5rem" }}>⚠️</span>
                <p style={{ margin: 0 }}>Could not load video preview.</p>
              </div>
            )
          ) : drivePreviewUrl ? (
            <iframe
              src={drivePreviewUrl}
              title={file.name}
              style={{
                width: "100%",
                height: "100%",
                border: 0,
              }}
              allow="autoplay"
            />
          ) : (
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                color: "#94a3b8",
              }}
            >
              <span style={{ fontSize: "2.5rem" }}>📂</span>
              <p style={{ margin: 0 }}>Could not load file preview.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(15, 23, 42, 0.5)",
            borderTop: "1px solid var(--border)",
            fontSize: "0.82rem",
            color: "var(--text-muted)",
          }}
        >
          <div>
            {file.uploaded_by && <span>Uploaded by {file.uploaded_by}</span>}
            {file.created_at && (
              <span> {file.uploaded_by ? "· " : ""}{formatDate(file.created_at)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
