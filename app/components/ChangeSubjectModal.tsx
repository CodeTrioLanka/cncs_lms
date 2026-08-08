"use client";

import React, { useState, useRef, useEffect } from "react";

export interface Subject {
  id: number;
  name: string;
}

interface ChangeSubjectModalProps {
  fileId: string;
  fileName: string;
  currentSubject: string | null;
  subjects: Subject[];
  onClose: () => void;
  onSuccess: (newSubject: string) => void;
}

export default function ChangeSubjectModal({
  fileId,
  fileName,
  currentSubject,
  subjects,
  onClose,
  onSuccess,
}: ChangeSubjectModalProps) {
  const [subjectInput, setSubjectInput]   = useState<string>(currentSubject || "");
  const [suggestions, setSuggestions]     = useState<Subject[]>([]);
  const [showSuggestions, setShowSugg]    = useState<boolean>(false);
  const [activeIndex, setActiveIndex]     = useState<number>(-1);
  const [loading, setLoading]             = useState<boolean>(false);
  const [error, setError]                 = useState<string>("");
  const [youtubeWarning, setYtWarning]    = useState<string>("");
  const wrapRef                           = useRef<HTMLDivElement>(null);

  // Close autocomplete dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowSugg(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSubjectChange(value: string) {
    setSubjectInput(value);
    setActiveIndex(-1);
    if (value.trim() === "") {
      setSuggestions([]);
      setShowSugg(false);
      return;
    }
    const filtered = subjects.filter((s) =>
      s.name.toLowerCase().includes(value.toLowerCase())
    );
    setSuggestions(filtered);
    setShowSugg(filtered.length > 0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      setSubjectInput(suggestions[activeIndex].name);
      setShowSugg(false);
      setSuggestions([]);
      setActiveIndex(-1);
    } else if (e.key === "Escape") {
      setShowSugg(false);
    }
  }

  function selectSuggestion(name: string) {
    setSubjectInput(name);
    setShowSugg(false);
    setSuggestions([]);
    setActiveIndex(-1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = subjectInput.trim();
    if (!trimmed) { setError("Please enter a subject name."); return; }
    if (trimmed.toLowerCase() === (currentSubject || "").toLowerCase()) {
      setError("This is already the current subject."); return;
    }

    setLoading(true);
    setError("");
    setYtWarning("");
    try {
      const res = await fetch("/api/files", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, newSubject: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to update subject.");
      } else if (data.youtubeMetadataError) {
        // DB subject was saved but YouTube sync failed — show warning, don't auto-close
        setYtWarning(`Subject saved in database, but YouTube metadata sync failed: ${data.youtubeMetadataError}`);
      } else {
        onSuccess(data.subject);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "var(--surface, #1e1e2e)",
          border: "1px solid rgba(99,102,241,0.3)",
          borderRadius: "16px",
          padding: "28px 28px 24px",
          width: "100%",
          maxWidth: "440px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary, #f1f5f9)" }}>
              ✏️ Change Subject
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "var(--text-muted, #94a3b8)", wordBreak: "break-all" }}>
              {fileName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-muted, #94a3b8)", fontSize: "1.3rem",
              lineHeight: 1, padding: "2px 4px", flexShrink: 0,
            }}
            title="Close"
          >×</button>
        </div>

        {currentSubject && (
          <div style={{
            fontSize: "0.78rem", color: "var(--text-muted, #94a3b8)",
            background: "rgba(255,255,255,0.04)", borderRadius: "8px",
            padding: "8px 12px",
          }}>
            Current subject: <strong style={{ color: "#a5b4fc" }}>{currentSubject}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Autocomplete Subject Input */}
          <div ref={wrapRef} style={{ position: "relative" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted, #94a3b8)", marginBottom: "6px" }}>
              New Subject *
            </label>
            <input
              type="text"
              placeholder="Type to search or enter a new subject…"
              value={subjectInput}
              onChange={(e) => handleSubjectChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => subjectInput.trim() && setShowSugg(suggestions.length > 0)}
              disabled={loading}
              autoComplete="off"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(99,102,241,0.35)",
                background: "rgba(255,255,255,0.05)",
                color: "var(--text-primary, #f1f5f9)",
                fontSize: "0.875rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {showSuggestions && (
              <ul style={{
                position: "absolute", top: "100%", left: 0, right: 0,
                zIndex: 999, margin: "2px 0 0", padding: 0, listStyle: "none",
                background: "#1e1e2e",
                border: "1px solid rgba(99,102,241,0.4)",
                borderRadius: "8px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                maxHeight: "160px", overflowY: "auto",
              }}>
                {suggestions.map((s, i) => (
                  <li
                    key={s.id}
                    onMouseDown={() => selectSuggestion(s.name)}
                    onMouseEnter={() => setActiveIndex(i)}
                    style={{
                      padding: "9px 14px",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      color: i === activeIndex ? "#fff" : "#c4c4d4",
                      background: i === activeIndex ? "rgba(99,102,241,0.35)" : "transparent",
                      borderBottom: i < suggestions.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      transition: "background 0.15s",
                    }}
                  >
                    {s.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#f87171", background: "rgba(239,68,68,0.1)", padding: "8px 12px", borderRadius: "6px" }}>
              ⚠️ {error}
            </p>
          )}

          {youtubeWarning && (
            <div style={{ margin: 0, fontSize: "0.78rem", color: "#fbbf24", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", padding: "10px 12px", borderRadius: "6px", lineHeight: 1.5 }}>
              <strong>⚠️ YouTube sync failed</strong><br />
              The subject was saved in the database, but YouTube video metadata could not be updated.<br />
              <span style={{ opacity: 0.85 }}>{youtubeWarning}</span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: "9px 18px", borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "transparent",
                color: "var(--text-muted, #94a3b8)",
                cursor: "pointer", fontSize: "0.875rem",
              }}
            >
              {youtubeWarning ? "Close Anyway" : "Cancel"}
            </button>
            {!youtubeWarning && (
              <button
                type="submit"
                disabled={loading || !subjectInput.trim()}
                style={{
                  padding: "9px 20px", borderRadius: "8px",
                  border: "none",
                  background: loading ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg,#6366f1,#818cf8)",
                  color: "#fff",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "0.875rem", fontWeight: 600,
                  transition: "opacity 0.2s",
                }}
              >
                {loading ? "Changing…" : "Change Subject"}
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}
