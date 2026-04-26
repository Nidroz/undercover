import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { doc, collection, onSnapshot, updateDoc, writeBatch, getDocs } from "firebase/firestore";

const WINNER_CFG = {
    civilians:    { emoji: "🎉", text: "Civilians win!",                          color: "var(--civilian)", rgb: "74,222,128" },
    impostors:    { emoji: "😈", text: "Impostors win!",                          color: "var(--impostor)", rgb: "230,57,70" },
    mrWhite:      { emoji: "👻", text: "Mr. White wins!",                         color: "var(--mrwhite)",  rgb: "167,139,250" },
    mrWhiteGuess: { emoji: "👻", text: "Impostor out — Mr. White can still win!", color: "var(--mrwhite)",  rgb: "167,139,250" },
};

export default function Result() {
    const { code } = useParams();
    const navigate = useNavigate();
    const uid = sessionStorage.getItem("uid");

    const [room, setRoom] = useState(null);
    const [players, setPlayers] = useState([]);
    const [eliminated, setEliminated] = useState(null);
    const [winner, setWinner] = useState(null);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "rooms", code), snap => {
            if (!snap.exists()) return;
            const data = snap.data();
            setRoom(data);
            // redirect everyone when host launches next round
            if (data.status === "settings") navigate(`/settings/${code}`);
            if (data.status === "reveal") navigate(`/reveal/${code}`);
            if (data.status === "lobby") navigate(`/lobby/${code}`);
        });
        return () => unsub();
    }, [code, navigate()]);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "rooms", code, "players"), snap => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setPlayers(list);

            const eliminated = list.find(p => p.id === room?.lastEliminated);
            setEliminated(eliminated ?? null);

            if (eliminated) {
                if (eliminated.role === "impostor") {
                    const mrWhite = list.find(p => p.role === "mrWhite");
                    setWinner(mrWhite?.isAlive ? "mrWhiteGuess" : "civilians");
                } else if (eliminated.role === "mrWhite") {
                    setWinner("civilians");
                } else {
                    setWinner("impostors");
                }
            }
        });
        return () => unsub();
    }, [code, room?.lastEliminated]);

    const isHost = room?.hostId === uid;
    const currentRound = room?.currentRound ?? 1;
    const totalRounds = room?.settings?.roundCount ?? 3;
    const isLastRound = currentRound >= totalRounds;
    const cfg = winner ? WINNER_CFG[winner] : null;

    const ROLE_LABEL = { civilian: "Civilian", impostor: "Impostor", mrWhite: "Mr. White" };
    const ROLE_COLOR = { civilian: "var(--civilian)", impostor: "var(--impostor)", mrWhite: "var(--mrwhite)" };

    const handleNextRound = async () => {
        const msgSnap = await getDocs(collection(db, "rooms", code, "messages"));
        const batch = writeBatch(db);
        msgSnap.docs.forEach(d => batch.delete(d.ref));
        players.forEach(p => {
            batch.update(doc(db, "rooms", code, "players", p.id), {
                isAlive: true, hasVoted: false, votedFor: null, ready: false,
            });
        });
        batch.update(doc(db, "rooms", code), { status: "settings" });
        await batch.commit();
        navigate(`/settings/${code}`);
    };

    const handleEndGame = async () => {
        await updateDoc(doc(db, "rooms", code), { status: "lobby" });
        navigate(`/lobby/${code}`);
    };

    return (
        <div className="page">
            {/* winner banner */}
            {cfg && (
                <div
                    className="winner-block fu"
                    style={{
                        background: `rgba(${cfg.rgb},0.07)`,
                        border: `1px solid rgba(${cfg.rgb},0.22)`,
                    }}
                >
                    <span className="winner-emoji">{cfg.emoji}</span>
                    <span className="winner-label" style={{ color: cfg.color }}>{cfg.text}</span>
                </div>
            )}

            {/* eliminated player */}
            {eliminated && (
                <div className="eliminated-card fu1">
                    <span className="eliminated-ava">{eliminated.avatar}</span>
                    <div className="eliminated-info">
                        <div className="eliminated-name">{eliminated.name}</div>
                        <div className="eliminated-role" style={{ color: ROLE_COLOR[eliminated.role] }}>
                            {ROLE_LABEL[eliminated.role]}
                        </div>
                    </div>
                    <span className="eliminated-tag" style={{ color: "var(--muted)" }}>Eliminated</span>
                </div>
            )}

            {/* word reveal */}
            <div className="words-grid fu2">
                <div className="word-chip">
                    <div className="word-chip-label">Civilians</div>
                    <div className="word-chip-val" style={{ color: "var(--civilian)" }}>{room?.wordPair?.civilian}</div>
                </div>
                <div className="word-chip">
                    <div className="word-chip-label">Impostor</div>
                    <div className="word-chip-val" style={{ color: "var(--impostor)" }}>{room?.wordPair?.impostor}</div>
                </div>
            </div>

            {/* all roles */}
            <div className="roles-list fu3">
                {players.map(p => (
                    <div key={p.id} className="role-row">
                        <span className="role-row-ava">{p.avatar}</span>
                        <span className="role-row-name">{p.name}{p.id === uid ? " (you)" : ""}</span>
                        <span className={`role-pill ${p.role}`}>{ROLE_LABEL[p.role]}</span>
                    </div>
                ))}
            </div>

            <p className="eyebrow fu4">Round {currentRound} / {totalRounds}</p>

            {isHost ? (
                <div className="stack fu5">
                    {!isLastRound && (
                        <button className="btn-gold" onClick={handleNextRound}>▶️ Next round</button>
                    )}
                    <button className="btn-secondary" onClick={handleEndGame}>🏠 Back to lobby</button>
                </div>
            ) : (
                <p className="muted-text fu4">Waiting for the host...</p>
            )}
        </div>
    );
}