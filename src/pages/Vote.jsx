import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import {
    doc, collection, onSnapshot, updateDoc, writeBatch,
} from "firebase/firestore";

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
        const unsub = onSnapshot(doc(db, "rooms", code), async (snap) => {
            if (!snap.exists()) return;
            const data = snap.data();
            setRoom(data);
            if (data.status === "result") navigate(`/result/${code}`);
        });
        return () => unsub();
    }, [code, navigate]);

    useEffect(() => {
        const unsub = onSnapshot(
            collection(db, "rooms", code, "players"),
            (snap) => {
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setPlayers(list);
                const me = list.find(p => p.id === uid);
                setMyPlayer(me ?? null);
                setHasVoted(me?.hasVoted ?? false);

                // check if all alive players voted → resolve
                const alive = list.filter(p => p.isAlive);
                const allVoted = alive.length > 0 && alive.every(p => p.hasVoted);
                if (allVoted) resolveVote(list);
            }
        );
        return () => unsub();
    }, [code, uid]);

    const resolveVote = async (playerList) => {
        // count votes
        const counts = {};
        playerList.filter(p => p.isAlive).forEach(p => {
            if (p.votedFor) counts[p.votedFor] = (counts[p.votedFor] ?? 0) + 1;
        });

        // find most voted
        const eliminated = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
        if (!eliminated) return;

        const batch = writeBatch(db);

        // eliminate player
        const eliminateRef = doc(db, "rooms", code, "players", eliminated);
        batch.update(eliminateRef, { isAlive: false });

        // reset votes
        playerList.forEach(p => {
            batch.update(doc(db, "rooms", code, "players", p.id), {
                hasVoted: false,
                votedFor: null,
            });
        });

        batch.update(doc(db, "rooms", code), {
            status: "result",
            lastEliminated: eliminated,
        });

        await batch.commit();
    };

    const castVote = async () => {
        if (!selected || hasVoted || !myPlayer?.isAlive) return;
        await updateDoc(doc(db, "rooms", code, "players", uid), {
            hasVoted: true,
            votedFor: selected,
        });
    };

    const alivePlayers = players.filter(p => p.isAlive && p.id !== uid);
    const voteCount = players.filter(p => p.isAlive && p.hasVoted).length;
    const aliveCount = players.filter(p => p.isAlive).length;

    return (
        <div className="page">
            <h2>🗳️ Vote</h2>
            <p>Who is the impostor ?</p>

            <p className="vote-count">{voteCount} / {aliveCount} votes</p>

            {!hasVoted && myPlayer?.isAlive ? (
                <>
                    <div className="vote-list">
                        {alivePlayers.map(p => (
                            <div
                                key={p.id}
                                className={`vote-card ${selected === p.id ? "selected" : ""}`}
                                onClick={() => setSelected(p.id)}
                            >
                                <span className="avatar">{p.avatar}</span>
                                <span>{p.name}</span>
                            </div>
                        ))}
                    </div>
                    <button onClick={castVote} disabled={!selected}>
                        Vote
                    </button>
                </>
            ) : (
                <p className="waiting">Vote saved, waiting for others...</p>
            )}
        </div>
    );
}