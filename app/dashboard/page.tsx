"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StorageModal from "@/app/components/StorageModal";
import UploadModal from "@/app/components/UploadModal";
import FilePreviewModal from "@/app/components/FilePreviewModal";

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

interface FileTypeFilterItem {
  id: string;
  label: string;
  icon: string;
  category: string;
  type?: string;
}

// ── File Types for Dashboard Filter Bar ─────────────────────────────────────────
const FILE_TYPE_FILTERS: FileTypeFilterItem[] = [
  { id: "all", label: "All Files", icon: "📁", category: "All" },
  { id: "pdf", label: "PDFs", icon: "📄", category: "Documents", type: "PDF" },
  { id: "word", label: "Word Docs", icon: "📝", category: "Documents", type: "Word" },
  { id: "ppt", label: "PowerPoint", icon: "📊", category: "Documents", type: "PowerPoint" },
  { id: "excel", label: "Excel Sheets", icon: "📈", category: "Documents", type: "Excel" },
  { id: "videos", label: "Videos", icon: "🎬", category: "Videos" },
  { id: "images", label: "Images", icon: "🖼️", category: "Images" },
  { id: "audio", label: "Audio", icon: "🎵", category: "Audio" },
  { id: "assignments", label: "Assignments", icon: "📋", category: "Assignments" },
  { id: "others", label: "Others", icon: "📦", category: "Others" },
];

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

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
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
}: {
  file: LMSFile;
  currentUser: LMSUser | null;
  onDeleteSuccess?: () => void;
  onPreviewFile?: (file: LMSFile) => void;
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

    const confirmDelete = window.confirm(`Are you sure you want to delete "${file.name}"?`);
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/files?id=${file.id}`, { method: "DELETE" });
      const data = await res.json();
      setIsDeleting(false);

      if (data.success) {
        if (onDeleteSuccess) onDeleteSuccess();
      } else {
        alert(data.error || "Failed to delete file.");
      }
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
      style={{
        opacity: isDeleting ? 0.5 : 1,
        pointerEvents: isDeleting ? "none" : "auto",
      }}
    >
      <a
        href={file.drive_url}
        onClick={handleCardClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          textDecoration: "none",
          color: "inherit",
          flex: 1,
          minWidth: 0,
        }}
      >
        <div className="file-card-icon" style={{ background: style.bg }}>
          <span>{isVideo ? "🎬" : style.icon}</span>
        </div>
        <div className="file-card-body">
          <p className="file-name">{file.name}</p>
          <div className="file-meta">
            <span className="badge" style={{ background: style.bg, color: style.text }}>
              {file.type}
            </span>
            {file.subject && (
              <span className="badge subject-badge">{file.subject}</span>
            )}
            {file.size_bytes > 0 && (
              <span className="file-size">{formatBytes(file.size_bytes)}</span>
            )}
          </div>
          <p className="file-uploader">
            Uploaded on {formatDate(file.created_at)}
          </p>
        </div>
      </a>

      <div className="file-card-actions">
        {isOwner && (
          <button
            type="button"
            className="btn-delete-file"
            title="Delete file"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "⏳" : "🗑️"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Dedicated Dashboard Page Component ─────────────────────────────────────────
export default function UserDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<LMSUser | null>(null);
  const [authChecking, setAuthCheck] = useState<boolean>(true);

  const [files, setFiles] = useState<LMSFile[]>([]);
  const [myFilesAll, setMyFilesAll] = useState<LMSFile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setModal] = useState<boolean>(false);
  const [showStorageModal, setStorageModal] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<LMSFile | null>(null);

  // Filters
  const [subFilter, setSubFilter] = useState<string>("All"); // Subject filter from Sidebar
  const [activeTypeId, setActiveTypeId] = useState<string>("all"); // File type filter from top bar
  const [catFilter, setCatFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [search, setSearch] = useState<string>("");
  const [subjectSearch, setSubjectSearch] = useState<string>(""); // Search filter for sidebar subjects

  async function checkUserAuth() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();

      if (data.success && data.user) {
        setCurrentUser(data.user);
        setAuthCheck(false);
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    }
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
    } catch (err) {
      console.error(err);
    }
  }

  async function loadAllUserFiles(email: string) {
    try {
      const res = await fetch(`/api/files?userEmail=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success) setMyFilesAll(data.files);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadFilteredUserFiles() {
    if (!currentUser) return;
    setLoading(true);

    const params = new URLSearchParams();
    params.set("userEmail", currentUser.email);

    if (subFilter !== "All") params.set("subject", subFilter);
    if (catFilter !== "All") params.set("category", catFilter);
    if (typeFilter !== "All") params.set("type", typeFilter);
    if (search.trim()) params.set("search", search.trim());

    try {
      const res = await fetch(`/api/files?${params}`);
      const data = await res.json();
      if (data.success) setFiles(data.files);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkUserAuth();
    loadSubjects();
  }, []);

  useEffect(() => {
    if (!authChecking && currentUser) {
      loadAllUserFiles(currentUser.email);
      loadFilteredUserFiles();
    }
  }, [authChecking, currentUser, subFilter, catFilter, typeFilter, search]);

  function handleSelectFileType(item: FileTypeFilterItem) {
    setActiveTypeId(item.id);
    setCatFilter(item.category);
    setTypeFilter(item.type || "All");
  }

  function countFilesForSubject(subjectName: string): number {
    if (subjectName === "All") return myFilesAll.length;
    return myFilesAll.filter(
      (f) => (f.subject || "").toLowerCase() === subjectName.toLowerCase()
    ).length;
  }

  function countFilesForType(item: FileTypeFilterItem): number {
    const matchingSubjectFiles = myFilesAll.filter(f => {
      if (subFilter === "All") return true;
      return (f.subject || "").toLowerCase() === subFilter.toLowerCase();
    });

    if (item.category === "All") return matchingSubjectFiles.length;
    if (item.id === "others" || item.category === "Others" || item.type === "Other") {
      return matchingSubjectFiles.filter(f => f.category === "Others" || f.type === "Other").length;
    }
    if (item.type) {
      return matchingSubjectFiles.filter(f => {
        const t = (f.type || "").toLowerCase();
        if (item.type === "PDF") return t.includes("pdf");
        if (item.type === "Word") return t.includes("doc") || t.includes("word") || t.includes("rtf");
        if (item.type === "PowerPoint") return t.includes("ppt") || t.includes("powerpoint") || t.includes("presentation");
        if (item.type === "Excel") return t.includes("xls") || t.includes("csv") || t.includes("excel") || t.includes("spreadsheet");
        return t.includes(item.type!.toLowerCase());
      }).length;
    }
    return matchingSubjectFiles.filter(f => f.category === item.category).length;
  }

  const totalBytes = myFilesAll.reduce((sum, f) => sum + (f.size_bytes || 0), 0);

  if (authChecking) {
    return (
      <div className="state-msg" style={{ minHeight: "100vh" }}>
        <span className="spinner" />
        <p>Authenticating Dashboard…</p>
      </div>
    );
  }

  return (
    <>
      <div className="app">
        {/* ── Header ── */}
        <header className="header">
          <div className="header-inner">
            <div className="header-brand">
              <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "12px" }}>
                <span className="header-logo">🎓</span>
                <div>
                  <h1 className="header-title">CNCS LMS</h1>
                  <p className="header-sub">Learning Management System</p>
                </div>
              </Link>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Link href="/" className="btn-clear" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                🏠 Home
              </Link>

              {currentUser && (
                <div className="user-badge">
                  <div className="user-avatar">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
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

        {/* ── User Overview Stats Banner ── */}
        <div style={{ background: "rgba(26,29,39,0.8)", borderBottom: "1px solid var(--border)", padding: "20px 24px" }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #818cf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", fontWeight: "700", color: "#fff" }}>
                {currentUser?.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--text-primary)" }}>
                  {currentUser?.name}&apos;s Dashboard
                </h2>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Subject-wise overview of your uploaded files
                </p>
              </div>
            </div>

            {/* Quick Stats Pills */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", padding: "8px 16px", borderRadius: "10px", textAlign: "center" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "#a5b4fc", display: "block" }}>{myFilesAll.length}</span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Files Uploaded</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", padding: "8px 16px", borderRadius: "10px", textAlign: "center" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "#34d399", display: "block" }}>{formatBytes(totalBytes)}</span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Storage Used</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Dashboard Body (Subject Sidebar + Files Content) ── */}
        <div className="dashboard-body">
          {/* Left Subject Sidebar */}
          <aside className="sidebar">
            <h2 className="sidebar-title">My Subjects</h2>

            {/* Sidebar Subject Search */}
            <div style={{ padding: "0 4px", marginBottom: "4px" }}>
              <div className="search-wrap" style={{ minWidth: "100%" }}>
                <span className="search-icon" style={{ fontSize: "0.8rem", left: "10px" }}>🔍</span>
                <input
                  className="search-input"
                  placeholder="Search my subjects…"
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  style={{ fontSize: "0.8rem", padding: "6px 8px 6px 30px", borderRadius: "8px" }}
                />
              </div>
            </div>

            <nav className="sidebar-nav">
              {/* All Subjects Option */}
              {(!subjectSearch || "all my subjects".includes(subjectSearch.toLowerCase())) && (
                <button
                  type="button"
                  className={`sidebar-item ${subFilter === "All" ? "active" : ""}`}
                  onClick={() => setSubFilter("All")}
                >
                  <span className="sidebar-item-label">
                    <span className="sidebar-icon">📚</span>
                    <span>All My Subjects</span>
                  </span>
                  <span className="sidebar-count">{countFilesForSubject("All")}</span>
                </button>
              )}

              {/* Dynamic Subject Items */}
              {subjects
                .filter((s) => s.name.toLowerCase().includes(subjectSearch.toLowerCase()))
                .map((s) => {
                  const isActive = subFilter.toLowerCase() === s.name.toLowerCase();
                  const icon = getSubjectIcon(s.name);
                  const count = countFilesForSubject(s.name);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`sidebar-item ${isActive ? "active" : ""}`}
                      onClick={() => setSubFilter(s.name)}
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

          {/* Main Content Area */}
          <div className="main-content-area">
            {/* Top Filter Bar (Search + File Type Pills) */}
            <div className="filter-bar">
              <div className="filter-inner">
                <div className="search-wrap">
                  <span className="search-icon">🔍</span>
                  <input
                    className="search-input"
                    placeholder="Search my files…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {/* File Type Filter Pills */}
                <div className="subject-filters-bar">
                  <span className="subject-filter-label">File Type:</span>
                  {FILE_TYPE_FILTERS.map((item) => {
                    const isActive = activeTypeId === item.id;
                    const count = countFilesForType(item);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`subject-pill ${isActive ? "active" : ""}`}
                        onClick={() => handleSelectFileType(item)}
                      >
                        <span>{item.icon}</span>
                        {item.label}
                        <span className="subject-pill-count">{count}</span>
                      </button>
                    );
                  })}
                </div>

                {(subFilter !== "All" || activeTypeId !== "all" || search) && (
                  <button
                    className="btn-clear"
                    onClick={() => {
                      setSubFilter("All");
                      setActiveTypeId("all");
                      setCatFilter("All");
                      setTypeFilter("All");
                      setSearch("");
                    }}
                  >
                    ✕ Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* File Grid */}
            <main className="main">
              {loading ? (
                <div className="state-msg">
                  <span className="spinner" />
                  <p>Loading your files…</p>
                </div>
              ) : files.length === 0 ? (
                <div className="state-msg">
                  <span style={{ fontSize: "3rem" }}>📂</span>
                  <p>No files uploaded in this subject yet. Click &quot;Upload File&quot; to add your first file!</p>
                </div>
              ) : activeTypeId === "all" ? (
                <>
                  <p className="results-count">
                    {files.length} file{files.length !== 1 ? "s" : ""} {subFilter !== "All" && `in ${subFilter}`}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "32px", width: "100%" }}>
                    {Object.entries(
                      files.reduce((acc, file) => {
                        let cat = file.category || "Others";
                        if (cat === "Documents") cat = "PDF";
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(file);
                        return acc;
                      }, {} as Record<string, LMSFile[]>)
                    ).map(([category, catFiles]) => (
                      <div key={category} className="file-category-section">
                        <h3 style={{ marginBottom: "16px", fontSize: "1.2rem", fontWeight: "600", color: "var(--text-primary)", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
                          {category}
                        </h3>
                        <div className="file-grid">
                          {catFiles.map((f) => (
                            <FileCard
                              key={f.id}
                              file={f}
                              currentUser={currentUser}
                              onDeleteSuccess={() => {
                                if (currentUser) loadAllUserFiles(currentUser.email);
                                loadFilteredUserFiles();
                              }}
                              onPreviewFile={(targetFile) => setPreviewFile(targetFile)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="results-count">
                    {files.length} file{files.length !== 1 ? "s" : ""} {subFilter !== "All" && `in ${subFilter}`}
                  </p>
                  <div className="file-grid">
                    {files.map((f) => (
                      <FileCard
                        key={f.id}
                        file={f}
                        currentUser={currentUser}
                        onDeleteSuccess={() => {
                          if (currentUser) loadAllUserFiles(currentUser.email);
                          loadFilteredUserFiles();
                        }}
                        onPreviewFile={(targetFile) => setPreviewFile(targetFile)}
                      />
                    ))}
                  </div>
                </>
              )}
            </main>
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

      {/* Upload Modal */}
      {showModal && (
        <UploadModal
          subjects={subjects}
          defaultUploaderEmail={currentUser?.email || ""}
          onClose={() => setModal(false)}
          onSuccess={() => {
            if (currentUser) loadAllUserFiles(currentUser.email);
            loadFilteredUserFiles();
            loadSubjects();
          }}
        />
      )}
      {/* Storage Modal */}
      {showStorageModal && (
        <StorageModal onClose={() => setStorageModal(false)} />
      )}
      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </>
  );
}
