"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StorageModal from "@/app/components/StorageModal";
import UploadModal from "@/app/components/UploadModal";
import FilePreviewModal from "@/app/components/FilePreviewModal";
import ChangeSubjectModal from "@/app/components/ChangeSubjectModal";

// ── Types & Interfaces ────────────────────────────────────────────────────────
export interface LMSUser {
  id: number;
  name: string;
  email: string;
}

export interface LMSFile {
  id: number | string;
  drive_file_id: string;
  drive_url: string;
  youtube_url?: string;
  storage_type?: string;
  name: string;
  category: string;
  type: string;
  subject: string;
  uploaded_by: string;
  size_bytes: number;
  created_at: string;
}

export interface Subject {
  id: number;
  name: string;
  created_at?: string;
}

// ── Subject icon hints based on name keywords ────────────────────────────────
function getSubjectIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("network")) return "🌐";
  if (n.includes("program") || n.includes("code") || n.includes("software")) return "💻";
  if (n.includes("math")) return "📐";
  if (n.includes("system") || n.includes("info")) return "🖥️";
  if (n.includes("database") || n.includes("sql")) return "🗄️";
  if (n.includes("security")) return "🔐";
  if (n.includes("web")) return "🌍";
  if (n.includes("cloud")) return "☁️";
  if (n.includes("ai") || n.includes("machine") || n.includes("data")) return "🤖";
  if (n.includes("hand") || n.includes("book")) return "📖";
  if (n.includes("engineer")) return "⚙️";
  if (n.includes("assign")) return "📋";
  return "📚";
}

// ── Type badge colors ─────────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  PDF: { bg: "#fee2e2", text: "#b91c1c", icon: "📄" },
  Word: { bg: "#dbeafe", text: "#1d4ed8", icon: "📝" },
  PowerPoint: { bg: "#ffedd5", text: "#c2410c", icon: "📊" },
  Excel: { bg: "#dcfce7", text: "#15803d", icon: "📈" },
  Video: { bg: "#ede9fe", text: "#7c3aed", icon: "🎬" },
  Image: { bg: "#fce7f3", text: "#be185d", icon: "🖼️" },
  Assignment: { bg: "#fef9c3", text: "#a16207", icon: "📋" },
  JSON: { bg: "#fef3c7", text: "#d97706", icon: "⚙️" },
  Text: { bg: "#e0f2fe", text: "#0369a1", icon: "📜" },
  Audio: { bg: "#f3e8ff", text: "#7e22ce", icon: "🎵" },
  Archive: { bg: "#ffedd5", text: "#9a3412", icon: "📦" },
  Code: { bg: "#e0e7ff", text: "#4338ca", icon: "💻" },
  Python: { bg: "#dcfce7", text: "#166534", icon: "🐍" },
  SQL: { bg: "#cff4fc", text: "#055160", icon: "🗄️" },
  Other: { bg: "#f1f5f9", text: "#475569", icon: "📁" },
};

// ── File Type Cards Definition ──────────────────────────────────────────────
const FILE_TYPE_CARDS = [
  { id: "all", label: "All Files", icon: "📁", category: "All", type: "All", grad: "linear-gradient(135deg,#6366f1,#818cf8)", glow: "rgba(99,102,241,0.35)" },
  { id: "pdf", label: "PDFs", icon: "📄", category: "Documents", type: "PDF", grad: "linear-gradient(135deg,#ef4444,#f87171)", glow: "rgba(239,68,68,0.35)" },
  { id: "word", label: "Word Docs", icon: "📝", category: "Documents", type: "Word", grad: "linear-gradient(135deg,#0ea5e9,#38bdf8)", glow: "rgba(14,165,233,0.35)" },
  { id: "ppt", label: "PowerPoint", icon: "📊", category: "Documents", type: "PowerPoint", grad: "linear-gradient(135deg,#f97316,#fb923c)", glow: "rgba(249,115,22,0.35)" },
  { id: "excel", label: "Excel Sheets", icon: "📈", category: "Documents", type: "Excel", grad: "linear-gradient(135deg,#10b981,#34d399)", glow: "rgba(16,185,129,0.35)" },
  { id: "video", label: "Videos", icon: "🎬", category: "Videos", type: "All", grad: "linear-gradient(135deg,#8b5cf6,#a78bfa)", glow: "rgba(139,92,246,0.35)" },
  { id: "image", label: "Images", icon: "🖼️", category: "Images", type: "All", grad: "linear-gradient(135deg,#ec4899,#f472b6)", glow: "rgba(236,72,153,0.35)" },
  { id: "audio", label: "Audio", icon: "🎵", category: "Audio", type: "All", grad: "linear-gradient(135deg,#a855f7,#c084fc)", glow: "rgba(168,85,247,0.35)" },
  { id: "assign", label: "Assignments", icon: "📋", category: "Assignments", type: "All", grad: "linear-gradient(135deg,#f59e0b,#fbbf24)", glow: "rgba(245,158,11,0.35)" },
  { id: "other", label: "Others", icon: "📦", category: "Others", type: "All", grad: "linear-gradient(135deg,#14b8a6,#2dd4bf)", glow: "rgba(20,184,166,0.35)" },
];

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ── File Card ─────────────────────────────────────────────────────────────────
function FileCard({
  file,
  currentUser,
  onDeleteSuccess,
  onPreviewFile,
  onChangeSubject,
}: {
  file: LMSFile;
  currentUser: LMSUser | null;
  onDeleteSuccess?: () => void;
  onPreviewFile?: (file: LMSFile) => void;
  onChangeSubject?: (file: LMSFile) => void;
}) {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const style = TYPE_COLORS[file.type] || { bg: "#e2e8f0", text: "#334155", icon: "📄" };

  const isVideo =
    file.storage_type === "YOUTUBE" ||
    Boolean(file.youtube_url) ||
    file.type === "Video" ||
    Boolean(
      file.drive_url &&
        (file.drive_url.includes("youtube.com") || file.drive_url.includes("youtu.be"))
    );

  const isOwner =
    currentUser &&
    file.uploaded_by &&
    file.uploaded_by.trim().toLowerCase() === currentUser.email.trim().toLowerCase();

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Delete "${file.name}"?`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/files?id=${file.id}`, { method: "DELETE" });
      const data = await res.json();
      setIsDeleting(false);
      if (data.success) { if (onDeleteSuccess) onDeleteSuccess(); }
      else alert(data.error || "Failed to delete file.");
    } catch (err: unknown) {
      setIsDeleting(false);
      alert(err instanceof Error ? err.message : "Error deleting file.");
    }
  }

  function handleCardClick(e: React.MouseEvent) {
    if (onPreviewFile) {
      e.preventDefault();
      onPreviewFile(file);
    }
  }

  return (
    <div
      className="file-card"
      style={{ opacity: isDeleting ? 0.5 : 1, pointerEvents: isDeleting ? "none" : "auto" }}
    >
      <a
        href={file.drive_url}
        onClick={handleCardClick}
        style={{ display: "flex", alignItems: "center", gap: "14px", textDecoration: "none", color: "inherit", flex: 1, minWidth: 0 }}
      >
        <div className="file-card-icon" style={{ background: style.bg }}>
          <span>{isVideo ? "🎬" : style.icon}</span>
        </div>
        <div className="file-card-body">
          <p className="file-name">{file.name}</p>
          <div className="file-meta">
            <span className="badge" style={{ background: style.bg, color: style.text }}>{file.type}</span>
            {file.subject && <span className="badge subject-badge">{file.subject}</span>}
            {file.size_bytes > 0 && <span className="file-size">{formatBytes(file.size_bytes)}</span>}
          </div>
          <p className="file-uploader">by {file.uploaded_by} · {formatDate(file.created_at)}</p>
        </div>
      </a>
      <div className="file-card-actions">
        {isOwner && (
          <button
            type="button"
            className="btn-delete-file"
            title="Change subject"
            style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (onChangeSubject) onChangeSubject(file); }}
          >
            ✏️
          </button>
        )}
        {isOwner && (
          <button type="button" className="btn-delete-file" title="Delete file" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "⏳" : "🗑️"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Home Page ────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<LMSUser | null>(null);
  const [authChecking, setAuthCheck] = useState<boolean>(true);

  const [allFiles, setAllFiles] = useState<LMSFile[]>([]);
  const [files, setFiles] = useState<LMSFile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showModal, setModal] = useState<boolean>(false);
  const [showStorageModal, setStorageModal] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<LMSFile | null>(null);
  const [changeSubjectFile, setChangeSubjectFile] = useState<LMSFile | null>(null);

  // ── View state: "cards" = File Type Cards grid, "files" = filtered file view ──
  const [view, setView] = useState<"cards" | "files">("cards");
  const [sidebarSubject, setSidebarSubject] = useState<string>("All"); // Active subject in sidebar ("All" or subject name)
  const [activeTypeId, setActiveType] = useState<string>("all");  // Active file type card/filter
  const [search, setSearch] = useState<string>("");
  const [subjectSearch, setSubjectSearch] = useState<string>(""); // Search filter for sidebar subjects

  // ── Auth ──────────────────────────────────────────────────────────────────
  async function checkUserAuth() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success && data.user) { setCurrentUser(data.user); setAuthCheck(false); }
      else router.push("/login");
    } catch { router.push("/login"); }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function loadSubjects() {
    try {
      const res = await fetch("/api/subjects");
      const data = await res.json();
      if (data.success) setSubjects(data.subjects);
    } catch (err) { console.error(err); }
  }

  async function loadAllFiles() {
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      if (data.success) setAllFiles(data.files);
    } catch (err) { console.error(err); }
  }

  async function loadFilteredFiles(subject: string, typeId: string, searchQ: string) {
    setLoading(true);
    const params = new URLSearchParams();
    if (subject && subject !== "All") params.set("subject", subject);
    const ft = FILE_TYPE_CARDS.find(f => f.id === typeId);
    if (ft && ft.category !== "All") params.set("category", ft.category);
    if (ft && ft.type !== "All") params.set("type", ft.type);
    if (searchQ.trim()) params.set("search", searchQ.trim());
    try {
      const res = await fetch(`/api/files?${params}`);
      const data = await res.json();
      if (data.success) setFiles(data.files);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    checkUserAuth();
    loadSubjects();
    loadAllFiles();
  }, []);

  useEffect(() => {
    if (view === "files") {
      loadFilteredFiles(sidebarSubject, activeTypeId, search);
    }
  }, [view, sidebarSubject, activeTypeId, search]);

  // ── Open a File Type card ─────────────────────────────────────────────────
  function openFileType(typeId: string) {
    setActiveType(typeId);
    setSearch("");
    setView("files");
  }

  function goBackToCards() {
    setView("cards");
    setActiveType("all");
    setSearch("");
    setFiles([]);
  }

  // ── Helper: Count files matching subject + file type card ──────────────────
  function countForFileTypeCard(ft: typeof FILE_TYPE_CARDS[0]): number {
    return allFiles.filter(f => {
      // Check subject match first
      if (sidebarSubject !== "All" && (f.subject || "").toLowerCase() !== sidebarSubject.toLowerCase()) {
        return false;
      }
      // Check file type category/type match
      if (ft.category === "All") return true;
      if (ft.type !== "All") return (f.type || "").toLowerCase().includes(ft.type.toLowerCase());
      return (f.category || "") === ft.category;
    }).length;
  }

  // ── Helper: Count files for subject in sidebar ──────────────────────────────
  function countForSubjectSidebar(subjectName: string): number {
    if (subjectName === "All") return allFiles.length;
    return allFiles.filter(f => (f.subject || "").toLowerCase() === subjectName.toLowerCase()).length;
  }

  if (authChecking) {
    return (
      <div className="state-msg" style={{ minHeight: "100vh" }}>
        <span className="spinner" />
        <p>Authenticating…</p>
      </div>
    );
  }

  const activeFileTypeObj = FILE_TYPE_CARDS.find(ft => ft.id === activeTypeId) || FILE_TYPE_CARDS[0];

  return (
    <>
      <div className="app">
        {/* ── Header ── */}
        <header className="header">
          <div className="header-inner">
            <div className="header-brand">
              <span className="header-logo">🎓</span>
              <div>
                <h1 className="header-title">CNCS LMS</h1>
                <p className="header-sub">Learning Management System</p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {currentUser && (
                <div
                  className="user-badge"
                  onClick={() => router.push("/dashboard")}
                  style={{ cursor: "pointer" }}
                  title="My Dashboard"
                >
                  <div className="user-avatar">{currentUser.name.charAt(0).toUpperCase()}</div>
                  <div className="user-info">
                    <span className="user-name">{currentUser.name}</span>
                    <span className="user-email">{currentUser.email}</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="btn-clear"
                onClick={() => setStorageModal(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                ☁️ Drive Storage
              </button>

              <button className="btn-primary" onClick={() => setModal(true)}>
                ⬆️ Upload File
              </button>

              <button type="button" className="btn-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* MAIN BODY: SUBJECT SIDEBAR + CONTENT                               */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="subj-page">
          <div className="dashboard-body" style={{ flex: 1 }}>

            {/* ── SIDEBAR: SUBJECTS ── */}
            <aside className="sidebar">
              <h2 className="sidebar-title">Subjects</h2>
              
              {/* Sidebar Subject Search */}
              <div style={{ padding: "0 4px", marginBottom: "4px" }}>
                <div className="search-wrap" style={{ minWidth: "100%" }}>
                  <span className="search-icon" style={{ fontSize: "0.8rem", left: "10px" }}>🔍</span>
                  <input
                    className="search-input"
                    placeholder="Search subjects…"
                    value={subjectSearch}
                    onChange={(e) => setSubjectSearch(e.target.value)}
                    style={{ fontSize: "0.8rem", padding: "6px 8px 6px 30px", borderRadius: "8px" }}
                  />
                </div>
              </div>

              <nav className="sidebar-nav">
                {/* All Subjects Item */}
                {(!subjectSearch || "all subjects".includes(subjectSearch.toLowerCase())) && (
                  <button
                    type="button"
                    className={`sidebar-item ${sidebarSubject === "All" ? "active" : ""}`}
                    onClick={() => {
                      setSidebarSubject("All");
                      setView("cards");
                      setActiveType("all");
                      setSearch("");
                    }}
                  >
                    <span className="sidebar-item-label">
                      <span className="sidebar-icon">📚</span>
                      <span>All Subjects</span>
                    </span>
                    <span className="sidebar-count">{countForSubjectSidebar("All")}</span>
                  </button>
                )}

                {/* Individual Subjects */}
                {subjects
                  .filter((s) => s.name.toLowerCase().includes(subjectSearch.toLowerCase()))
                  .map((s) => {
                    const icon = getSubjectIcon(s.name);
                    const count = countForSubjectSidebar(s.name);
                    const isActive = sidebarSubject.toLowerCase() === s.name.toLowerCase();
                    return (
                      <button
                        key={s.id}
                        type="button"
                        className={`sidebar-item ${isActive ? "active" : ""}`}
                        onClick={() => {
                          setSidebarSubject(s.name);
                          setView("cards");
                          setActiveType("all");
                          setSearch("");
                        }}
                      >
                        <span className="sidebar-item-label">
                          <span className="sidebar-icon">{icon}</span>
                          <span>{s.name}</span>
                        </span>
                        <span className="sidebar-count">{count}</span>
                      </button>
                    );
                  })}
              </nav>
            </aside>

            {/* ── MAIN CONTENT AREA ── */}
            <div className="main-content-area">

              {/* ══════════════════════════════════════════════════════════════ */}
              {/* VIEW 1 — File Types Card Grid                                  */}
              {/* ══════════════════════════════════════════════════════════════ */}
              {view === "cards" && (
                <div className="subj-grid-wrap">
                  <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <h2 style={{ fontSize: "1.4rem", fontWeight: "800", color: "var(--text-primary)" }}>
                        File Categories & Types
                      </h2>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        {sidebarSubject === "All"
                          ? "Showing file types across all subjects"
                          : `Showing file types for subject: ${sidebarSubject}`}
                      </p>
                    </div>
                  </div>

                  <div className="subj-grid">
                    {FILE_TYPE_CARDS.map((ft) => {
                      const count = countForFileTypeCard(ft);
                      return (
                        <button
                          key={ft.id}
                          type="button"
                          className="subj-card"
                          style={{ "--subj-glow": ft.glow, "--subj-grad": ft.grad } as React.CSSProperties}
                          onClick={() => openFileType(ft.id)}
                        >
                          <div className="subj-card-icon-wrap" style={{ background: ft.grad }}>
                            <span className="subj-card-icon">{ft.icon}</span>
                          </div>
                          <div className="subj-card-body">
                            <p className="subj-card-name">{ft.label}</p>
                            <p className="subj-card-count">{count} file{count !== 1 ? "s" : ""}</p>
                          </div>
                          <span className="subj-card-arrow">→</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════ */}
              {/* VIEW 2 — Files for Selected File Type & Subject                 */}
              {/* ══════════════════════════════════════════════════════════════ */}
              {view === "files" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  {/* File Type & Subject Banner */}
                  <div className="subj-banner">
                    <div className="subj-banner-inner">
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div className="subj-banner-icon">
                          <span style={{ fontSize: "1.6rem" }}>{activeFileTypeObj.icon}</span>
                        </div>
                        <div>
                          <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "2px" }}>
                            {sidebarSubject === "All" ? "All Subjects" : `Subject: ${sidebarSubject}`}
                          </p>
                          <h2 className="subj-banner-title">{activeFileTypeObj.label}</h2>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Filter bar (search + file type quick pills) */}
                  <div className="filter-bar">
                    <div className="filter-inner" style={{ alignItems: "center" }}>
                      <div className="search-wrap">
                        <span className="search-icon">🔍</span>
                        <input
                          className="search-input"
                          placeholder={`Search ${activeFileTypeObj.label} in ${sidebarSubject}…`}
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </div>
                      {search && (
                        <button className="btn-clear" onClick={() => setSearch("")}>✕ Clear</button>
                      )}
                    </div>
                  </div>

                  {/* File Grid Content */}
                  <main className="main">
                    {loading ? (
                      <div className="state-msg">
                        <span className="spinner" />
                        <p>Loading files…</p>
                      </div>
                    ) : files.length === 0 ? (
                      <div className="state-msg">
                        <span style={{ fontSize: "3rem" }}>📂</span>
                        <p>No files found for <strong>{activeFileTypeObj.label}</strong> {sidebarSubject !== "All" && `in ${sidebarSubject}`}. Try changing filters or uploading a file!</p>
                      </div>
                    ) : (
                      <>
                        <p className="results-count">
                          {files.length} file{files.length !== 1 ? "s" : ""} found for <strong style={{ color: "var(--text-primary)" }}>{activeFileTypeObj.label}</strong> {sidebarSubject !== "All" && `in ${sidebarSubject}`}
                        </p>
                        <div className="file-grid">
                          {files.map((f) => (
                            <FileCard
                              key={f.id}
                              file={f}
                              currentUser={currentUser}
                              onDeleteSuccess={() => {
                                loadAllFiles();
                                loadFilteredFiles(sidebarSubject, activeTypeId, search);
                              }}
                              onPreviewFile={(targetFile) => setPreviewFile(targetFile)}
                              onChangeSubject={(targetFile) => setChangeSubjectFile(targetFile)}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </main>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Page Footer ── */}
        <footer className="app-footer">
          <div className="app-footer-inner">
            <div>
              © 2026 design and develop by{" "}
              <a href="https://www.codetriolanka.lk/" target="_blank" rel="noopener noreferrer" className="app-footer-link">
                CodeTrioLanka
              </a>
              . All rights reserved.
            </div>
            <div>
              Core Developer is{" "}
              <a href="https://www.codetriolanka.lk/team/chalana-jayod" target="_blank" rel="noopener noreferrer" className="app-footer-dev">
                CJ
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* Modals */}
      {showModal && (
        <UploadModal
          subjects={subjects}
          defaultUploaderEmail={currentUser?.email || ""}
          onClose={() => setModal(false)}
          onSuccess={() => {
            loadAllFiles();
            loadSubjects();
            if (view === "files") loadFilteredFiles(sidebarSubject, activeTypeId, search);
          }}
        />
      )}
      {showStorageModal && (
        <StorageModal onClose={() => setStorageModal(false)} />
      )}
      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
      {changeSubjectFile && (
        <ChangeSubjectModal
          fileId={String(changeSubjectFile.id)}
          fileName={changeSubjectFile.name}
          currentSubject={changeSubjectFile.subject || null}
          subjects={subjects}
          onClose={() => setChangeSubjectFile(null)}
          onSuccess={(newSubject) => {
            // Update the subject in both lists without a full reload
            const updater = (f: LMSFile) =>
              String(f.id) === String(changeSubjectFile.id) ? { ...f, subject: newSubject } : f;
            setFiles((prev) => prev.map(updater));
            setAllFiles((prev) => prev.map(updater));
            loadSubjects();
            setChangeSubjectFile(null);
          }}
        />
      )}
    </>
  );
}