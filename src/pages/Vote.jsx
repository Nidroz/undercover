import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { doc, collection, onSnapshot, updateDoc, writeBatch } from "firebase/firestore";

export default function Vote() {
    const { code } = useParams();
    const navigate = useNavigate();
    const uid = sessionStorage.getItem("uid");

    const [players, setPlayers] = useState([]);
    const [room, setRoom] = useState(null);
    const [myPlayer, setMyPlayer] = useState(null);
    const [selected, setSelected] = useState(null);
    const [hasVoted, setHasVoted] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "rooms", code), snap => {
            if (!snap.exists()) return;
            const data = snap.data();
            setRoom(data);
            if (data.status === "result") navigate(`/result/${code}`);
            if (data.status === "mrWhiteGuess") navigate(`/mrwhite/${code}`);
        });
        return () => unsub();
    }, [code, navigate]);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "rooms", code, "players"), snap => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setPlayers(list);
            const me = list.find(p => p.id === uid);
            setMyPlayer(me ?? null);
            setHasVoted(me?.hasVoted ?? false);

            const alive = list.filter(p => p.isAlive);
            const allVoted = alive.length > 0 && alive.every(p => p.hasVoted);
            if (allVoted) resolveVote(list);
        });
        return () => unsub();
    }, [code, uid]);

    const resolveVote = async (playerList) => {
        const counts = {};
        playerList.filter(p => p.isAlive).forEach(p => {
            if (p.votedFor) counts[p.votedFor] = (counts[p.votedFor] ?? 0) + 1;
        });
        const eliminatedId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
        if (!eliminatedId) return;

        const eliminatedPlayer = playerList.find(p => p.id === eliminatedId);
        const mrWhite = playerList.find(p => p.role === "mrWhite" && p.isAlive && p.id !== eliminatedId);

        const batch = writeBatch(db);
        batch.update(doc(db, "rooms", code, "players", eliminatedId), { isAlive: false });
        playerList.forEach(p => {
            batch.update(doc(db, "rooms", code, "players", p.id), { hasVoted: false, votedFor: null });
        });

        // if impostor eliminated, check if mrWhite can still win (i.e. is alive) -> give mrWhite a guess
        if (eliminatedPlayer?.role === "impostor" && mrWhite) {
            batch.update(doc(db, "rooms", code), { status: "mrWhiteGuess", lastEliminated: eliminatedId, mrWhiteUid: mrWhite.id });
        } else {
            batch.update(doc(db, "rooms", code), { status: "result", lastEliminated: eliminatedId });
        }

        await batch.commit();
    };

    const castVote = async () => {
        if (!selected || hasVoted || !myPlayer?.isAlive) return;
        await updateDoc(doc(db, "rooms", code, "players", uid), { hasVoted: true, votedFor: selected });
    };

    const alivePlayers = players.filter(p => p.isAlive && p.id !== uid);
    const voteCount = players.filter(p => p.isAlive && p.hasVoted).length;
    const aliveCount = players.filter(p => p.isAlive).length;
    const progress = aliveCount > 0 ? (voteCount / aliveCount) * 100 : 0;

    return (
        <div className="page">
            <div className="fu" style={{ textAlign: "center" }}>
                <p className="eyebrow">Voting phase</p>
                <h2 style={{ marginTop: 4 }}>Who's the impostor?</h2>
            </div>

            {/* vote progress */}
            <div className="card fu1" style={{ gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted)" }}>
                    <span>Votes cast</span>
                    <span>{voteCount} / {aliveCount}</span>
                </div>
                <div className="progress-bar-wrap">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {!hasVoted && myPlayer?.isAlive ? (
                <>
                    <div className="vote-grid fu2">
                        {alivePlayers.map(p => (
                            <div
                                key={p.id}
                                className={`vote-card ${selected === p.id ? "sel" : ""}`}
                                onClick={() => setSelected(p.id)}
                            >
                                <span className="vote-ava">{p.avatar}</span>
                                <span className="vote-name">{p.name}</span>
                            </div>
                        ))}
                    </div>
                    <button className="btn-primary fu3" onClick={castVote} disabled={!selected}>
                        Cast vote
                    </button>
                </>
            ) : (
                <div className="fu2" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 44 }}>✅</span>
                    <p className="muted-text">Vote cast — waiting for others...</p>
                </div>
            )}
        </div>
    );
}