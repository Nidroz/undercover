import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import {
    doc, collection, onSnapshot, updateDoc, writeBatch, getDocs,
} from "firebase/firestore";

export default function Result() {
    const { code } = useParams();
    const navigate = useNavigate();
    const uid = sessionStorage.getItem("uid");

    const [room, setRoom] = useState(null);
    const [players, setPlayers] = useState([]);
    const [eliminated, setEliminated] = useState(null);
    const [impostors, setImpostors] = useState([]);
    const [winner, setWinner] = useState(null); // "civilians" | "impostors" | "mrWhite"

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "rooms", code), (snap) => {
            if (!snap.exists()) return;
            setRoom(snap.data());
        });
        return () => unsub();
    }, [code]);

    useEffect(() => {
        const unsub = onSnapshot(
            collection(db, "rooms", code, "players"),
            (snap) => {
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setPlayers(list);

                const eliminatedId = room?.lastEliminated;
                const eliminatedPlayer = list.find(p => p.id === eliminatedId);
                setEliminated(eliminatedPlayer ?? null);

                const impostorList = list.filter(p => p.role === "impostor");
                setImpostors(impostorList);

                // determine winner
                if (eliminatedPlayer) {
                    if (eliminatedPlayer.role === "impostor") {
                        // check if mrWhite can still guess
                        const mrWhite = list.find(p => p.role === "mrWhite");
                        if (mrWhite && mrWhite.isAlive) {
                            setWinner("mrWhiteGuess");
                        } else {
                            setWinner("civilians");
                        }
                    } else if (eliminatedPlayer.role === "mrWhite") {
                        setWinner("civilians");
                    } else {
                        setWinner("impostors");
                    }
                }
            }
        );
        return () => unsub();
    }, [code, room?.lastEliminated]);

    const isHost = room?.hostId === uid;
    const currentRound = room?.currentRound ?? 1;
    const totalRounds = room?.settings?.roundCount ?? 3;
    const isLastRound = currentRound >= totalRounds;

    const handleNextRound = async () => {
        // reset messages
        const msgSnap = await getDocs(collection(db, "rooms", code, "messages"));
        const batch = writeBatch(db);
        msgSnap.docs.forEach(d => batch.delete(d.ref));

        // reset players alive status
        players.forEach(p => {
            batch.update(doc(db, "rooms", code, "players", p.id), {
                isAlive: true,
                hasVoted: false,
                votedFor: null,
                ready: false,
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

    const WINNER_MSG = {
        civilians: { emoji: "🎉", text: "Civilians have winned !", color: "#4ade80" },
        impostors: { emoji: "😈", text: "Impostors have winned !", color: "#f87171" },
        mrWhite: { emoji: "👻", text: "Mr. White have winned !", color: "#a78bfa" },
        mrWhiteGuess: { emoji: "👻", text: "Impostor is eliminated... Mr. White can still win !", color: "#a78bfa" },
    };

    const winnerInfo = winner ? WINNER_MSG[winner] : null;

    return (
        <div className="page">
            <h2>Results</h2>

            {winnerInfo && (
                <div className="winner-banner" style={{ borderColor: winnerInfo.color }}>
                    <span className="winner-emoji">{winnerInfo.emoji}</span>
                    <span style={{ color: winnerInfo.color }}>{winnerInfo.text}</span>
                </div>
            )}

            {/* eliminated player */}
            {eliminated && (
                <div className="eliminated-card">
                    <p>Player Eliminated</p>
                    <span className="avatar">{eliminated.avatar}</span>
                    <span>{eliminated.name}</span>
                    <span className="role-tag" style={{
                        color: eliminated.role === "impostor" ? "#f87171"
                            : eliminated.role === "mrWhite" ? "#a78bfa" : "#4ade80"
                    }}>
                    {eliminated.role === "impostor" ? "⚠Impostor"
                        : eliminated.role === "mrWhite" ? "Mr. White"
                            : "Civilian"}
                  </span>
                </div>
            )}

            {/* word reveal */}
            <div className="word-reveal-section">
                <p>Civilians Word : <strong>{room?.wordPair?.civilian}</strong></p>
                <p>Impostors Word : <strong>{room?.wordPair?.impostor}</strong></p>
            </div>

            {/* all roles revealed */}
            <div className="roles-list">
                {players.map(p => (
                    <div key={p.id} className="role-row">
                        <span>{p.avatar}</span>
                        <span>{p.name}</span>
                        <span className="role-tag" style={{
                            color: p.role === "impostor" ? "#f87171"
                                : p.role === "mrWhite" ? "#a78bfa" : "#4ade80"
                        }}>
                      {p.role === "impostor" ? "Impostor"
                          : p.role === "mrWhite" ? "Mr. White"
                              : "Civilian"}
                    </span>
                    </div>
                ))}
            </div>

            {/* round counter */}
            <p className="round-info">Round {currentRound} / {totalRounds}</p>

            {/* host controls */}
            {isHost && (
                <div className="btn-group">
                    {!isLastRound && (
                        <button onClick={handleNextRound}>
                            ▶️ Next Round
                        </button>
                    )}
                    <button onClick={handleEndGame} className="secondary">
                        🏠 Return to lobby
                    </button>
                </div>
            )}

            {!isHost && (
                <p className="waiting">Waiting Host...</p>
            )}
        </div>
    );
}