import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { doc, collection, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase.js";

export default function Lobby() {
    const { code } = useParams();
    const navigate = useNavigate();
    const uid = sessionStorage.getItem("uid");

    const [players, setPlayers] = useState([]);
    const [room, setRoom] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const unsubRoom = onSnapshot(doc(db, "rooms", code), snap => {
            if (!snap.exists()) return;
            const data = snap.data();
            setRoom(data);
            if (data.status === "settings") navigate(`/settings/${code}`);
        });
        const unsubPlayers = onSnapshot(collection(db, "rooms", code, "players"), snap => {
            setPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => { unsubRoom(); unsubPlayers(); };
    }, [code, navigate]);

    const isHost = room?.hostId === uid;
    const link = `${window.location.origin}/join/${code}`;

    const copyLink = async () => {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
    };

    const startGame = async () => {
        if (players.length < 3) return;
        await updateDoc(doc(db, "rooms", code), { status: "settings" });
    };

    return (
        <div className="page">
            <div className="fu" style={{ textAlign: "center" }}>
                <p className="eyebrow">Waiting room</p>
                <h2 style={{ marginTop: 4 }}>Waiting for players</h2>
            </div>

            {/* room code + copy */}
            <div className="code-block fu1">
                <span className="code-letters">{code}</span>
                <button className={`btn-icon ${copied ? "done" : ""}`} onClick={copyLink}>
                    {copied ? "✓ Copied" : "Copy link"}
                </button>
            </div>

            {/* player list */}
            <div className="stack-sm fu2">
                {players.map((p, i) => (
                    <div key={p.id} className="player-row" style={{ animationDelay: `${i * 0.05}s` }}>
                        <span className="player-ava">{p.avatar}</span>
                        <span className="player-name">{p.name}</span>
                        {p.isHost && <span className="badge-host">Host</span>}
                        {p.id === uid && !p.isHost && <span className="badge-you">you</span>}
                    </div>
                ))}
            </div>

            {/* cta */}
            <div className="fu3" style={{ width: "100%" }}>
                {isHost ? (
                    <button
                        className="btn-primary"
                        onClick={startGame}
                        disabled={players.length < 3}
                    >
                        {players.length < 3
                            ? `Waiting for players (${players.length}/3)`
                            : `Start — ${players.length} players`}
                    </button>
                ) : (
                    <p className="muted-text">Waiting for the host to start...</p>
                )}
            </div>
        </div>
    );
}