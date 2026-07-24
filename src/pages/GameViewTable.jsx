import { useState } from "react";
import { db } from "../lib/firebase";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import ViewSwitcher from "../components/ViewSwitcher";
import BugReport from "./BugReport";

const splitPlayers = (players) => {
  const alive = players.filter(p => p.isAlive);
  const dead  = players.filter(p => !p.isAlive);
  const all   = [...alive, ...dead];
  const mid   = Math.ceil(all.length / 2);
  return { left: all.slice(0, mid), right: all.slice(mid) };
};

const PlayerCol = ({ list, currentTurnId, uid, cluesFor  }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", padding: "2px 0", scrollbarWidth: "thin", scrollbarColor: "var(--border) transparent" }}>
      {list.map(p => {
        const clues = cluesFor(p.id);
        const isCurrent = p.id === currentTurnId && p.isAlive;
        const isMe = p.id === uid;
        return (
          <div key={p.id} style={{
            borderRadius: 10,
            border: `0.5px solid ${isCurrent ? "rgba(244,162,97,0.45)" : "var(--border)"}`,
            background: isCurrent ? "rgba(244,162,97,0.06)" : "var(--bg2)",
            overflow: "hidden",
            opacity: !p.isAlive ? 0.3 : 1,
            filter: !p.isAlive ? "grayscale(1)" : "none",
            transition: "0.18s ease",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 12px" }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "var(--bg3)",
                border: `0.5px solid ${isCurrent ? "rgba(244,162,97,0.5)" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 19, flexShrink: 0,
                boxShadow: isCurrent ? "0 0 0 2px rgba(244,162,97,0.18)" : "none",
              }}>{p.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--white)" }}>{p.name}</span>
                  {isMe && <span style={{ fontSize: 10, color: "var(--muted)", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 5px" }}>you</span>}
                </div>
                {!p.isAlive && <div style={{ fontSize: 10, color: "var(--impostor)", marginTop: 1 }}>eliminated</div>}
              </div>
              {isCurrent && (
                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--gold)", background: "rgba(244,162,97,0.12)", border: "1px solid rgba(244,162,97,0.3)", borderRadius: 99, padding: "2px 8px", flexShrink: 0 }}>
                  speaking
                </span>
              )}
              {!isCurrent && clues.length > 0 && (
                <span style={{ fontSize: 10, color: "var(--civilian)", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 99, padding: "2px 8px", flexShrink: 0 }}>✓</span>
              )}
            </div>
            <div style={{ borderTop: "0.5px solid var(--border)", maxHeight: 120, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "var(--border) transparent" }}>
              {clues.length === 0 ? (
                <div style={{ padding: "6px 12px 6px 56px", fontSize: 12, color: "var(--muted2)", fontStyle: "italic" }}>
                  {isCurrent ? "typing..." : "no clue yet"}
                </div>
              ) : clues.map((c, i) => (
                <div key={c.id} style={{ padding: "6px 12px 6px 56px", display: "flex", alignItems: "baseline", gap: 6, borderBottom: i < clues.length - 1 ? "0.5px solid var(--border)" : "none" }}>
                  {clues.length > 1 && <span style={{ fontSize: 10, color: "var(--muted)", flexShrink: 0 }}>#{i + 1}</span>}
                  <span style={{ fontSize: 13, color: "var(--white)" }}>{c.text}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

export default function GameViewTable({
  code, room, players, messages, myPlayer,
  currentTurnId, isMyTurn, isHost,
  showRoles, wordVisible, setWordVisible,
  view, setView,
}) {
  const uid = sessionStorage.getItem("uid");
  const [input, setInput] = useState("");
  const { left, right } = splitPlayers(players);
  const ROLE_LABEL = { civilian: "Civilian", impostor: "Impostor", mrWhite: "Mr. White" };

  const cluesFor = (pid) => messages.filter(m => m.uid === pid);

  const passTurn = async () => {
    const playerOrder = room?.playerOrder ?? [];
    const idx = room?.currentTurnIndex ?? 0;
    const next = idx + 1;
    await updateDoc(doc(db, "rooms", code), {
      currentTurnIndex: next >= playerOrder.length ? 0 : next,
      ...(next >= playerOrder.length ? { turnRound: (room?.turnRound ?? 1) + 1 } : {}),
    });
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !myPlayer?.isAlive || !isMyTurn) return;
    setInput("");
    await addDoc(collection(db, "rooms", code, "messages"), {
      uid, playerName: myPlayer.name, avatar: myPlayer.avatar,
      text, createdAt: new Date(),
    });
    await passTurn();
  };

  const goToVote = async () => {
    await updateDoc(doc(db, "rooms", code), { status: "vote" });
  };


  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh" }}>

      {/* topbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 20px", borderBottom: "0.5px solid var(--border)", flexShrink: 0 }}>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 1.5, color: "var(--white)" }}>Discussion</span>
        <span style={{ fontSize: 11, color: "var(--muted)", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 99, padding: "3px 10px" }}>
          Round {room?.currentRound} / {room?.settings?.roundCount}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <button className="btn-icon" onClick={() => setWordVisible(v => !v)} style={{ fontSize: 12 }}>
              👁️ My word
            </button>
            {wordVisible && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                background: "var(--bg2)", border: "1px solid var(--border2)",
                borderRadius: 14, padding: "14px 18px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                zIndex: 100, minWidth: 140, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              }}>
                {showRoles && myPlayer?.role && (
                  <span className={`role-pill ${myPlayer.role}`} style={{ fontSize: 10 }}>{ROLE_LABEL[myPlayer.role]}</span>
                )}
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 2, color: "var(--white)" }}>
                  {myPlayer?.role === "mrWhite" ? "???" : myPlayer?.word}
                </span>
                <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => setWordVisible(false)}>Close</button>
              </div>
            )}
          </div>
          <ViewSwitcher view={view} setView={setView} />
          {isHost && (
            <button className="btn-primary" style={{ padding: "7px 14px", fontSize: 12, width: "auto" }} onClick={goToVote}>
              🗳️ Pass to vote
            </button>
          )}
        </div>
      </div>

      {/* main grid */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 176px 1fr", gap: 0, overflow: "hidden", padding: "12px 16px 0", columnGap: 12 }}>
        <PlayerCol list={left} currentTurnId={currentTurnId} uid={uid} cluesFor={cluesFor} />

        {/* center */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "2px 0" }}>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Round</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: "var(--white)", letterSpacing: 2, lineHeight: 1 }}>
              {room?.currentRound} <span style={{ color: "var(--muted)", fontSize: 16 }}>/ {room?.settings?.roundCount}</span>
            </div>
          </div>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Speaking now</div>
            {(() => {
              const cp = players.find(p => p.id === currentTurnId);
              return cp ? (
                <>
                  <div style={{ fontSize: 24 }}>{cp.avatar}</div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "var(--white)", marginTop: 4 }}>{cp.name}</div>
                </>
              ) : <div style={{ color: "var(--muted)", fontSize: 12 }}>—</div>;
            })()}
          </div>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Alive</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: "var(--white)" }}>
              {players.filter(p => p.isAlive).length} <span style={{ color: "var(--muted)", fontSize: 12 }}>/ {players.length}</span>
            </div>
          </div>
        </div>

        <PlayerCol list={right} currentTurnId={currentTurnId} uid={uid} cluesFor={cluesFor} />
      </div>

      {/* bug report above input */}
      <div style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 6 }}>
        <BugReport inline />
      </div>

      {/* input bar */}
      <div className="chat-bar" style={{ padding: "8px 16px 16px" }}>
        <input
          placeholder={!myPlayer?.isAlive ? "You are eliminated" : !isMyTurn ? "Not your turn..." : "Your clue..."}
          value={input}
          disabled={!myPlayer?.isAlive || !isMyTurn}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
        />
        <button className="btn-send" onClick={sendMessage} disabled={!myPlayer?.isAlive || !isMyTurn}>➤</button>
      </div>
    </div>
  );
}