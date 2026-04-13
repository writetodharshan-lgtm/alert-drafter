import { useEffect, useState } from "react";

const DEFAULT_DL = "";

function getGmailLink(dl, subject, body) {
  const to = dl
    .split(/[\s,;]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .join(",");
  return `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function AlertDrafter() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [dl, setDl] = useState(DEFAULT_DL);
  const [editingDl, setEditingDl] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("alert-drafter-dl");
    if (saved) setDl(saved);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("alert-drafter-dl", dl);
  }, [dl]);

  const dlList = dl.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean);

  const gold = "#c8a96e";
  const dark = "#0a0a0f";
  const card = "#13131a";
  const border = "#2a2a35";
  const textDim = "#8a8070";
  const textMid = "#a09888";
  const textLight = "#f5f0e8";

  const handleDraft = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setDraft(null);
    setError("");
    setCopied(false);
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch article.");
      setDraft(data);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const getSubject = (d) => `${d.publication}: ${d.headline}`;
  const getBody = (d) => `Date: ${d.date}\nPublication: ${d.publication}\nAuthor: ${d.author}\n${d.url}\n\n${d.headline}\n\n${d.body}`;

  const handleCopy = () => {
    if (!draft) return;
    navigator.clipboard.writeText(getBody(draft));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReset = () => { setDraft(null); setUrl(""); setError(""); };

  return (
    <div style={{ minHeight: "100vh", background: dark, fontFamily: "Georgia, serif", color: "#e8e4dc", display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 20px" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #4a4a5a; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #2a2a35; border-radius: 2px; }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "44px" }}>
        <div style={{ fontSize: "10px", letterSpacing: "5px", color: gold, textTransform: "uppercase", marginBottom: "14px" }}>Media Intelligence</div>
        <h1 style={{ fontSize: "clamp(32px, 6vw, 54px)", fontWeight: "400", marginBottom: "10px", color: textLight, letterSpacing: "-1px", lineHeight: 1 }}>Alert Drafter</h1>
        <p style={{ color: textDim, fontSize: "14px", fontStyle: "italic" }}>Paste a URL · Get a formatted email alert</p>
      </div>

      {!draft && (
        <div style={{ width: "100%", maxWidth: "700px", background: card, border: `1px solid ${border}`, borderRadius: "4px", padding: "32px" }}>
          <label style={{ fontSize: "11px", letterSpacing: "3px", color: gold, textTransform: "uppercase", display: "block", marginBottom: "12px" }}>Article URL</label>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "24px" }}>
            <input
              type="text" value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleDraft()}
              placeholder="https://..."
              style={{ flex: 1, minWidth: "220px", background: dark, border: `1px solid ${border}`, borderRadius: "2px", padding: "14px 16px", color: "#e8e4dc", fontSize: "14px", fontFamily: "monospace", outline: "none" }}
            />
            <button onClick={handleDraft} disabled={loading || !url.trim()} style={{ background: loading || !url.trim() ? border : gold, color: loading || !url.trim() ? textDim : dark, border: "none", borderRadius: "2px", padding: "14px 28px", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "Georgia, serif", fontWeight: "700", cursor: loading || !url.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
              {loading ? "Fetching..." : "Draft Alert"}
            </button>
          </div>

          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{ width: "16px", height: "16px", border: `2px solid ${border}`, borderTop: `2px solid ${gold}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
              <span style={{ fontSize: "13px", color: textDim, fontStyle: "italic" }}>Fetching full article and drafting alert...</span>
            </div>
          )}

          {error && (
            <div style={{ background: "#1a0f0f", border: "1px solid #4a2020", borderRadius: "3px", padding: "14px 18px", color: "#c87070", fontSize: "13px", marginBottom: "20px" }}>⚠ {error}</div>
          )}

          <div style={{ padding: "14px 18px", background: dark, borderLeft: `2px solid ${gold}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div style={{ fontSize: "10px", color: textDim, letterSpacing: "2px", textTransform: "uppercase" }}>Distribution List</div>
              <button onClick={() => setEditingDl(v => !v)} style={{ background: "transparent", border: "none", color: gold, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "Georgia, serif", cursor: "pointer", padding: 0 }}>
                {editingDl ? "Done" : "Edit"}
              </button>
            </div>
            {editingDl ? (
              <textarea
                value={dl}
                onChange={e => setDl(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
                rows={Math.max(3, dlList.length + 1)}
                style={{ width: "100%", background: dark, border: `1px solid ${border}`, borderRadius: "2px", padding: "10px 12px", color: "#e8e4dc", fontSize: "13px", fontFamily: "monospace", outline: "none", resize: "vertical" }}
              />
            ) : (
              dlList.length
                ? dlList.map(e => <div key={e} style={{ fontSize: "13px", color: textMid, fontFamily: "monospace" }}>{e}</div>)
                : <div style={{ fontSize: "13px", color: textDim, fontStyle: "italic" }}>No recipients — click Edit to add.</div>
            )}
          </div>
        </div>
      )}

      {draft && (
        <div style={{ width: "100%", maxWidth: "700px" }}>
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "4px 4px 0 0", padding: "20px 26px", borderBottom: `1px solid ${gold}44` }}>
            <div style={{ fontSize: "10px", color: gold, letterSpacing: "3px", textTransform: "uppercase", marginBottom: "8px" }}>Subject</div>
            <div style={{ fontSize: "15px", color: textLight, fontWeight: "600", lineHeight: 1.4 }}>{getSubject(draft)}</div>
          </div>

          <div style={{ background: card, border: `1px solid ${border}`, borderTop: "none", borderRadius: "0 0 4px 4px", padding: "26px" }}>
            <div style={{ fontSize: "10px", color: gold, letterSpacing: "3px", textTransform: "uppercase", marginBottom: "20px" }}>Email Body</div>
            <div style={{ fontFamily: "monospace", fontSize: "13px", color: textDim, lineHeight: 2 }}>Date: {draft.date}</div>
            <div style={{ fontFamily: "monospace", fontSize: "13px", color: textDim, lineHeight: 2 }}>Publication: {draft.publication}</div>
            <div style={{ fontFamily: "monospace", fontSize: "13px", color: textDim, lineHeight: 2 }}>Author: {draft.author}</div>
            <div style={{ fontFamily: "monospace", fontSize: "13px", color: gold, lineHeight: 2, marginBottom: "20px", wordBreak: "break-all" }}>{draft.url}</div>
            <div style={{ fontSize: "17px", fontWeight: "700", color: textLight, marginBottom: "20px", lineHeight: 1.4 }}>{draft.headline}</div>
            <div style={{ fontSize: "14px", color: textMid, lineHeight: 1.9, maxHeight: "320px", overflowY: "auto", whiteSpace: "pre-wrap", paddingRight: "8px" }}>{draft.body}</div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "14px", flexWrap: "wrap" }}>
            <a href={getGmailLink(dl, getSubject(draft), getBody(draft))} target="_blank" rel="noreferrer"
              style={{ flex: 2, background: gold, color: dark, borderRadius: "2px", padding: "15px 20px", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "Georgia, serif", fontWeight: "700", textAlign: "center", textDecoration: "none", display: "block" }}>
              ✉ Open in Gmail
            </a>
            <button onClick={handleCopy} style={{ flex: 1, background: "transparent", color: copied ? gold : textDim, border: `1px solid ${copied ? gold : border}`, borderRadius: "2px", padding: "15px", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "Georgia, serif", cursor: "pointer" }}>
              {copied ? "✓ Copied" : "Copy"}
            </button>
            <button onClick={handleReset} style={{ flex: 1, background: "transparent", color: textDim, border: `1px solid ${border}`, borderRadius: "2px", padding: "15px", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "Georgia, serif", cursor: "pointer" }}>
              ↩ New
            </button>
          </div>
          <div style={{ fontSize: "12px", color: textDim, fontStyle: "italic", marginTop: "10px", textAlign: "center" }}>"Open in Gmail" pre-fills subject, body & recipient — just hit Send!</div>
        </div>
      )}
    </div>
  );
}
