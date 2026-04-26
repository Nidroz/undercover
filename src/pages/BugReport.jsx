import { useState } from "react";

const REPO_URL = "https://github.com/Nidroz/undercover";

const LABELS = encodeURIComponent("bug");

function buildIssueUrl(title, body) {
    const t = encodeURIComponent(`[BUG] ${title}`);
    const b = encodeURIComponent(body);
    return `${REPO_URL}/issues/new?labels=${LABELS}&title=${t}&body=${b}`;
}

export default function BugReport() {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");

    const submit = () => {
        if (!title.trim()) return;
        const body = `**Description:**\n${desc}\n\n**URL:** ${window.location.href}\n**Browser:** ${navigator.userAgent}`;
        window.open(buildIssueUrl(title, body), "_blank");
        setOpen(false);
        setTitle("");
        setDesc("");
    };

    return (
        <>
            {/* floating trigger button */}
            <button
                onClick={() => setOpen(true)}
                style={{
                    position: "fixed",
                    bottom: 20,
                    right: 20,
                    zIndex: 9000,
                    background: "rgba(18,18,24,0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    backdropFilter: "blur(12px)",
                    color: "rgba(238,234,227,0.5)",
                    borderRadius: 99,
                    padding: "8px 14px",
                    fontSize: 12,
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "0.18s ease",
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.color = "rgba(238,234,227,0.9)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.color = "rgba(238,234,227,0.5)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                }}
            >
                🐛 Report a bug
            </button>

            {/* modal overlay */}
            {open && (
                <div
                    onClick={e => e.target === e.currentTarget && setOpen(false)}
                    style={{
                        position: "fixed", inset: 0, zIndex: 9001,
                        background: "rgba(0,0,0,0.6)",
                        backdropFilter: "blur(4px)",
                        display: "flex", alignItems: "flex-end", justifyContent: "center",
                        padding: "0 16px 24px",
                        animation: "fadeIn 0.18s ease",
                    }}
                >
                    <div style={{
                        background: "#111118",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 20,
                        padding: 24,
                        width: "100%",
                        maxWidth: 420,
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                        animation: "slideUp 0.22s cubic-bezier(0.4,0,0.2,1)",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 22, letterSpacing: 1.5,
                  color: "#eeeae3",
              }}>
                🐛 Report a bug
              </span>
                            <button
                                onClick={() => setOpen(false)}
                                style={{
                                    background: "none", border: "none",
                                    color: "rgba(238,234,227,0.4)", fontSize: 20,
                                    cursor: "pointer", lineHeight: 1,
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <input
                            placeholder="Short description of the bug"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            style={{
                                background: "#18181f", border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: 12, color: "#eeeae3",
                                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                                padding: "12px 14px", outline: "none", width: "100%",
                            }}
                            onFocus={e => e.target.style.borderColor = "rgba(230,57,70,0.4)"}
                            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                        />

                        <textarea
                            placeholder="What happened? Steps to reproduce..."
                            value={desc}
                            onChange={e => setDesc(e.target.value)}
                            rows={4}
                            style={{
                                background: "#18181f", border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: 12, color: "#eeeae3",
                                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                                padding: "12px 14px", outline: "none", width: "100%",
                                resize: "none",
                            }}
                            onFocus={e => e.target.style.borderColor = "rgba(230,57,70,0.4)"}
                            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                        />

                        <p style={{ fontSize: 12, color: "rgba(238,234,227,0.3)", marginTop: -4 }}>
                            Opens a pre-filled GitHub issue in a new tab.
                        </p>

                        <button
                            onClick={submit}
                            disabled={!title.trim()}
                            style={{
                                background: title.trim() ? "#e63946" : "rgba(230,57,70,0.2)",
                                color: title.trim() ? "#fff" : "rgba(255,255,255,0.3)",
                                border: "none", borderRadius: 12,
                                padding: "13px 20px", fontFamily: "'DM Sans', sans-serif",
                                fontSize: 14, fontWeight: 600, cursor: title.trim() ? "pointer" : "not-allowed",
                                transition: "0.18s ease",
                                boxShadow: title.trim() ? "0 4px 16px rgba(230,57,70,0.3)" : "none",
                            }}
                        >
                            Open GitHub issue →
                        </button>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
        </>
    );
}