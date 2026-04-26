import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { doc, collection, onSnapshot, updateDoc, addDoc, query, orderBy } from "firebase/firestore";

export default function Game() {
    const { code } = useParams();
    const navigate = useNavigate();
    const uid = sessionStorage.getItem("uid");
    const chatRef = useRef(null);

    const [room, setRoom] = useState(null);
    const [players, setPlayers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [myPlayer, setMyPlayer] = useState(null);
    const [wordVisible, setWordVisible] = useState(false);

    const playerOrder = room?.playerOrder ?? [];
    const currentTurnIndex = room?.currentTurnIndex ?? 0;
    const currentTurnId = playerOrder[currentTurnIndex];
    const isMyTurn = currentTurnId === uid;
    const isHost = room?.hostId === uid;

    const passTurn = async () => {
        const next = currentTurnIndex + 1;
        await updateDoc(doc(db, "rooms", code), {
            currentTurnIndex: next >= playerOrder.length ? 0 : next,
            ...(next >= playerOrder.length ? { turnRound: (room?.turnRound ?? 1) + 1 } : {}),
        });
    };

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "rooms", code), snap => {
            if (!snap.exists()) return;
            const data = snap.data();
            setRoom(data);
            if (data.status === "vote") navigate(`/vote/${code}`);
            if (data.status === "result") navigate(`/result/${code}`);
        });
        return () => unsub();
    }, [code, navigate]);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "rooms", code, "players"), snap => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setPlayers(list);
            setMyPlayer(list.find(p => p.id === uid) ?? null);
        });
        return () => unsub();
    }, [code, uid]);

    useEffect(() => {
        const unsub = onSnapshot(
            query(collection(db, "rooms", code, "messages"), orderBy("createdAt")),
            snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        );
        return () => unsub();
    }, [code]);

    // auto-scroll chat to bottom
    useEffect(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [messages]);

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

    const currentTurnPlayer = players.find(p => p.id === currentTurnId);

    return (
        <div className="game-layout">
            {/* top bar */}
            <div className="game-topbar">
                <span className="game-title">Discussion</span>
                <span className="round-pill">Round {room?.currentRound} / {room?.settings?.roundCount}</span>
                <div style={{position: "relative"}}>
                    <button
                        className="btn-icon"
                        onClick={() => setWordVisible(v => !v)}
                        style={{fontSize: 13}}
                    >
                        🃏 My word
                    </button>
                    {wordVisible && (
                        <div style={{
                            position: "absolute", top: "calc(100% + 8px)", right: 0,
                            background: "#111118", border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 14, padding: "14px 18px",
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                            zIndex: 100, minWidth: 140,
                            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                            animation: "bubbleIn 0.18s ease",
                        }}>
                          <span className={`role-pill ${myPlayer?.role}`} style={{fontSize: 10}}>
                            {myPlayer?.role === "impostor" ? "Impostor"
                                : myPlayer?.role === "mrWhite" ? "Mr. White"
                                    : "Civilian"}
                          </span>
                            <span style={{
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: 26, letterSpacing: 2, color: "var(--white)",
                            }}>
                                {myPlayer?.role === "mrWhite" ? "???" : myPlayer?.word}
                              </span>
                            <button
                                className="btn-ghost"
                                style={{fontSize: 12, padding: "4px 10px"}}
                                onClick={() => setWordVisible(false)}
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
                {isHost && (
                    <button className="btn-vote-trigger" onClick={goToVote}>🗳️ Vote</button>
                )}
            </div>

            {/* players row */}
            <div className="players-scroll">
                {players.map(p => (
                    <div key={p.id} className={`pchip ${!p.isAlive ? "dead" : ""}`}>
                        <div className={`pchip-ava ${p.id === currentTurnId && p.isAlive ? "current" : ""}`}>
                            {p.avatar}
                        </div>
                        <span className="pchip-name">{p.id === uid ? "you" : p.name}</span>
                    </div>
                ))}
            </div>

            {/* turn banner */}
            <div className={`turn-banner ${isMyTurn ? "myturn" : "waiting"}`}>
                {isMyTurn
                    ? "👉 Your turn — give a clue!"
                    : `Waiting for ${currentTurnPlayer?.avatar} ${currentTurnPlayer?.name}...`}
            </div>

            {/* chat messages */}
            <div className="chat-area" ref={chatRef}>
                {messages.map(m => (
                    <div key={m.id} className="clue-block">
                        <div className="clue-meta">
                            <span className="clue-meta-ava">{m.avatar}</span>
                            <span className={`clue-meta-name ${m.uid === uid ? "me" : ""}`}>{m.playerName}</span>
                        </div>
                        <div className={`clue-bubble ${m.uid === uid ? "me" : ""}`}>{m.text}</div>
                    </div>
                ))}
                {messages.length === 0 && (
                    <p className="muted-text" style={{ margin: "auto" }}>No clues yet — the first player starts!</p>
                )}
            </div>

            {/* input */}
            <div className="chat-bar">
                <input
                    placeholder={
                        !myPlayer?.isAlive ? "You are eliminated"
                            : !isMyTurn ? "Not your turn..."
                                : "Your clue..."
                    }
                    value={input}
                    disabled={!myPlayer?.isAlive || !isMyTurn}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMessage()}
                />
                <button className="btn-send" onClick={sendMessage} disabled={!myPlayer?.isAlive || !isMyTurn}>
                    ➤
                </button>
            </div>
        </div>
    );
}