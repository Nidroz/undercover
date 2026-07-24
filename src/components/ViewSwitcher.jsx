// view switcher component — shown in game topbar on desktop only
export default function ViewSwitcher({ view, setView }) {
  const options = [
    { id: "chat",  label: "💬" },
    { id: "table", label: "⬡" },
    { id: "stage", label: "🎭" },
  ];

  return (
    <div style={{
      display: "flex",
      background: "var(--bg3)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      padding: 3,
      gap: 2,
    }}>
      {options.map(o => (
        <button
          key={o.id}
          title={o.id === "chat" ? "Chat view" : o.id === "table" ? "Round table" : "Stage view"}
          onClick={() => setView(o.id)}
          style={{
            background: view === o.id ? "var(--red)" : "transparent",
            border: "none",
            borderRadius: 7,
            padding: "5px 10px",
            fontSize: 14,
            cursor: "pointer",
            transition: "0.15s ease",
            boxShadow: view === o.id ? "0 0 8px var(--red-glow)" : "none",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}