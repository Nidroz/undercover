import { useState } from "react";
import { db } from "../lib/firebase";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import ViewSwitcher from "../components/ViewSwitcher";
import BugReport from ".//BugReport";

export default function GameViewStage({
  code, room, players, messages, myPlayer,
  currentTurnId, isMyTurn, isHost,
  showRoles, wordVisible, setWordVisible,
  view, setView,
}) {
  const uid = sessionStorage.getItem("uid");
  const [input, setInput] = useState("");
  const [showOrder, setShowOrder] = useState(true);

  const playerOrder = room?.playerOrder ?? [];
  const currentTurnIndex = room?.currentTurnIndex ?? 0;
  const ROLE_LABEL = { civilian: "Civilian", impostor: "Impostor", mrWhite: "Mr. White" };

  const lastClue = (pid) => {
    const clues = messages.filter(m => m.uid === pid);
    return clues.length ? clues[clues.length - 1].text : null;
  };

  const passTurn = async () => {
    const next = currentTurnIndex + 1;
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

  const alivePlayers = players.filter(p => p.isAlive);
  const deadPlayers  = players.filter(p => !p.isAlive);
  const frontIds = new Set([currentTurnId, uid].filter(Boolean));
  const frontPlayers = alivePlayers.filter(p => frontIds.has(p.id));
  const backPlayers  = [...alivePlayers.filter(p => !frontIds.has(p.id)), ...deadPlayers];

  const Bubble = ({ pid }) => {
    const clue = lastClue(pid);
    const isCurrent = pid === currentTurnId;
    return (
      <div style={{
        background: isCurrent ? "rgba(244,162,97,0.1)" : clue ? "var(--bg3)" : "transparent",
        border: `0.5px ${clue || isCurrent ? "solid" : "dashed"} ${isCurrent ? "rgba(244,162,97,0.45)" : "var(--border)"}`,
        borderRadius: 8, padding: "5px 10px",
        fontSize: 12, textAlign: "center",
        color: isCurrent ? "var(--gold)" : clue ? "var(--white)" : "var(--muted2)",
        maxWidth: 120, fontStyle: !clue && !isCurrent ? "italic" : "normal",
        lineHeight: 1.4, position: "relative",
        wordBreak: "break-word",
      }}>
        {isCurrent && !clue ? "typing..." : clue ?? "—"}
        <div style={{
          position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)",
          borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
          borderTop: `6px solid ${isCurrent ? "rgba(244,162,97,0.45)" : clue ? "var(--border)" : "transparent"}`,
        }} />
      </div>
    );
  };

  const Seat = ({ player, size = "sm" }) => {
    const isCurrent = player.id === currentTurnId;
    const isMe = player.id === uid;
    const sz = size === "lg" ? 68 : 48;
    const fs = size === "lg" ? 34 : 24;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
        <Bubble pid={player.id} />
        <div style={{
          width: sz, height: sz, borderRadius: "50%",
          background: "var(--bg3)",
          border: isCurrent ? "2px solid var(--gold)" : isMe ? "2px solid rgba(230,57,70,0.5)" : "1.5px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: fs,
          boxShadow: isCurrent ? "0 0 0 4px rgba(244,162,97,0.15)" : "none",
          filter: !player.isAlive ? "grayscale(1)" : "none",
          opacity: !player.isAlive ? 0.25 : 1,
          transition: "0.2s ease",
        }}>{player.avatar}</div>
        <div style={{ fontSize: size === "lg" ? 13 : 11, fontWeight: 500, color: "var(--muted)", textAlign: "center", maxWidth: sz + 24 }}>
          {isMe
            ? <><span style={{ color: "var(--white)" }}>{player.name}</span> <span style={{ color: "var(--muted2)", fontSize: 10 }}>(you)</span></>
            : player.name}
        </div>
        {!player.isAlive
          ? <span style={{ fontSize: 9, color: "var(--impostor)" }}>out</span>
          : isCurrent
            ? <span style={{ fontSize: 10, color: "var(--gold)", background: "rgba(244,162,97,0.12)", border: "1px solid rgba(244,162,97,0.25)", borderRadius: 99, padding: "2px 8px" }}>speaking</span>
            : lastClue(player.id)
              ? <span style={{ fontSize: 10, color: "var(--civilian)", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 99, padding: "2px 8px" }}>✓</span>
              : null}
      </div>
    );
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
              🗳️ Vote
            </button>
          )}
        </div>
      </div>

      {/* stage — fixed height, centered, no flex-end trick */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 48px 0", overflow: "hidden", gap: 0 }}>

        {/* back row */}
        {backPlayers.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "3rem", marginBottom: "2.5rem", flexWrap: "wrap" }}>
            {backPlayers.map(p => <Seat key={p.id} player={p} size="sm" />)}
          </div>
        )}

        {/* front row */}
        {frontPlayers.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "5rem", flexWrap: "wrap" }}>
            {frontPlayers.map(p => <Seat key={p.id} player={p} size="lg" />)}
          </div>
        )}
      </div>

      {/* timeline — fixed at bottom of stage area */}
      <div style={{ padding: "16px 48px 0", borderTop: "0.5px solid var(--border)", marginTop: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Turn order</span>
          <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Show</span>
            <div
              onClick={() => setShowOrder(v => !v)}
              style={{
                width: 32, height: 17, borderRadius: 99,
                background: showOrder ? "var(--red)" : "var(--bg3)",
                border: "1px solid var(--border2)", position: "relative",
                cursor: "pointer", transition: "0.18s ease",
                boxShadow: showOrder ? "0 0 6px var(--red-glow)" : "none",
              }}
            >
              <div style={{
                position: "absolute", width: 11, height: 11, borderRadius: "50%",
                background: "var(--white)", top: 2,
                left: showOrder ? 17 : 2, transition: "0.18s ease",
              }} />
            </div>
          </label>
        </div>
        {showOrder && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {playerOrder.map((pid, i) => {
              const p = players.find(pl => pl.id === pid);
              if (!p) return null;
              const isDone = i < currentTurnIndex;
              const isCur  = i === currentTurnIndex;
              return (
                <div key={pid} style={{ display: "flex", alignItems: "center", gap: 4, flex: i < playerOrder.length - 1 ? 1 : "0 0 auto" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", fontSize: 13,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    background: isDone ? "rgba(74,222,128,0.12)" : isCur ? "rgba(244,162,97,0.15)" : "var(--bg3)",
                    border: isDone ? "1px solid rgba(74,222,128,0.35)" : isCur ? "1px solid rgba(244,162,97,0.4)" : "1px solid var(--border)",
                    opacity: !isDone && !isCur ? 0.35 : 1,
                  }}>
                    {p.avatar}
                  </div>
                  {i < playerOrder.length - 1 && (
                    <div style={{ flex: 1, height: 1, background: isDone ? "rgba(74,222,128,0.4)" : "var(--border)", minWidth: 8 }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* bug report inline */}
      <div style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 8 }}>
        <BugReport inline />
      </div>

      {/* bottom bar */}
      <div className="chat-bar" style={{ padding: "8px 20px 16px" }}>
        <span style={{ fontSize: 12, color: "var(--muted)", flexShrink: 0, whiteSpace: "nowrap" }}>
          {players.find(p => p.id === currentTurnId)?.avatar}{" "}
          {players.find(p => p.id === currentTurnId)?.name}
        </span>
        <div style={{ width: 1, height: 18, background: "var(--border)", flexShrink: 0 }} />
        <input
          placeholder={!myPlayer?.isAlive ? "You are eliminated" : !isMyTurn ? "Not your turn..." : "Your clue..."}
          value={input}
          disabled={!myPlayer?.isAlive || !isMyTurn}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          style={{ flex: 1 }}
        />
        <button className="btn-send" onClick={sendMessage} disabled={!myPlayer?.isAlive || !isMyTurn}>➤</button>
      </div>
    </div>
  );
}