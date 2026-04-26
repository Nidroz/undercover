import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase.js";

export default function WordReveal() {
    const { code } = useParams();
    const navigate = useNavigate();
    const uid = sessionStorage.getItem("uid");

    const [player, setPlayer] = useState(null);
    const [revealed, setRevealed] = useState(false);
    const [players, setPlayers] = useState([]);
    const [room, setRoom] = useState(null);

    const showRoles = room?.showRoles ?? true;

    useEffect(() => {
        const fetch = async () => {
            const snap = await getDoc(doc(db, "rooms", code, "players", uid));
            if (snap.exists()) setPlayer(snap.data());
        };
        fetch();
    }, [code, uid]);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "rooms", code), snap => {
            if (!snap.exists()) return;
            const data = snap.data();
            setRoom(data);
            if (data.status === "game") navigate(`/game/${code}`);
        });
        return () => unsub();
    }, [code, navigate]);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "rooms", code, "players"), snap => {
            setPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [code]);

    const handleReady = async () => {
        await updateDoc(doc(db, "rooms", code, "players", uid), { ready: true });
        setRevealed(true);
        // optimistically check if all are ready
        const done = players.every(p => p.id === uid ? true : p.ready);
        if (done) await updateDoc(doc(db, "rooms", code), { status: "game" });
    };

    const readyCount = players.filter(p => p.ready).length;
    const isHost = room?.hostId === uid;
    const myReady = players.find(p => p.id === uid)?.ready ?? false;

    const roleClass = player?.role ?? "civilian";
    const ROLE_LABEL = { civilian: "Civilian", impostor: "Impostor", mrWhite: "Mr. White" };

    return (
        <div className="page">
            <p className="eyebrow fu">Your secret word</p>

            {!player ? (
                <p className="muted-text">Loading...</p>
            ) : !revealed ? (
                <>
                    {/* tap to reveal card */}
                    <div
                        className="word-reveal-card fu1"
                        style={{ cursor: "pointer", minHeight: 180, justifyContent: "center" }}
                        onClick={() => setRevealed(true)}
                    >
                        <span style={{ fontSize: 52 }}>🃏</span>
                        <p style={{ color: "var(--muted)", fontSize: 15, fontWeight: 500 }}>Tap to reveal your word</p>
                        <p style={{ color: "var(--muted2)", fontSize: 13 }}>Make sure no one else is watching</p>
                    </div>
                    <button className="btn-primary fu2" onClick={() => setRevealed(true)}>
                        👁️ Reveal my word
                    </button>
                </>
            ) : (
                <>
                    {/* word card */}
                    <div className={`word-reveal-card ${roleClass} fu1`}>
                        {showRoles && (
                            <span className={`role-pill ${roleClass}`}>{ROLE_LABEL[player.role]}</span>
                        )}
                        <span className="word-big">
                          {player.role === "mrWhite" ? "???" : player.word}
                        </span>
                        {player.role === "mrWhite" && (
                            <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", maxWidth: 240 }}>
                                You have no word. Blend in and try to guess the civilian word.
                            </p>
                        )}
                    </div>

                    {/* ready status */}
                    <div className="card fu2" style={{ textAlign: "center" }}>
                        <p className="eyebrow" style={{ marginBottom: 12 }}>
                            {readyCount} / {players.length} ready
                        </p>
                        <div className="ready-avatars">
                            {players.map(p => (
                                <span key={p.id} className={`ready-ava ${p.ready ? "done" : ""}`} title={p.name}>
                                  {p.avatar}
                                </span>
                            ))}
                        </div>
                    </div>

                    {!myReady && (
                        <button className="btn-primary fu3" onClick={handleReady}>
                            ✅ I memorized my word
                        </button>
                    )}

                    {isHost && readyCount === players.length && players.length > 0 && (
                        <button
                            className="btn-gold fu4"
                            onClick={() => updateDoc(doc(db, "rooms", code), { status: "game" })}
                        >
                            🚀 Everyone's ready — Start!
                        </button>
                    )}

                    {myReady && !(isHost && readyCount === players.length) && (
                        <p className="muted-text fu3">Waiting for others...</p>
                    )}
                </>
            )}
        </div>
    );
}