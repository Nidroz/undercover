import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { doc, onSnapshot, updateDoc, writeBatch } from "firebase/firestore";

export default function MrWhiteGuess() {
    const { code } = useParams();
    const navigate = useNavigate();
    const uid = sessionStorage.getItem("uid");

    const [room, setRoom] = useState(null);
    const [guess, setGuess] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [mrWhiteUid, setMrWhiteUid] = useState(null);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "rooms", code), snap => {
            if (!snap.exists()) return;
            const data = snap.data();
            setRoom(data);
            setMrWhiteUid(data.mrWhiteUid ?? null);
            if (data.status === "result") navigate(`/result/${code}`);
        });
        return () => unsub();
    }, [code, navigate]);

    const isMrWhite = uid === mrWhiteUid;
    const civilianWord = room?.wordPair.civilian ?? "";
    const isHost = room?.hostId === uid;

    const submitGuess = async () => {
        if (!guess.trim()) return;
        setSubmitted(true);
        const isCorrect = guess.trim().toLowerCase() === civilianWord.toLowerCase();
        const batch = writeBatch(db);
        batch.update(doc(db, "rooms", code), {
            status: "result",
            mrWhiteGuess: guess.trim(),
            mrWhiteWon: isCorrect,
        });
        await batch.commit();
    }

    const skipGuess = async () => {
        await updateDoc(doc(db, "rooms", code), {
            status: "result",
            mrWhiteGuess: null,
            mrWhiteWon: false,
        });
    };

    return (
        <div className="page">
            <div className="fu" style={{ textAlign: "center" }}>
                <span style={{ fontSize: 52 }}>👻</span>
                <h2 style={{ marginTop: 8 }}>Mr. White's Last Chance</h2>
                <p className="muted-text" style={{ marginTop: 6 }}>
                    The impostor is out. Mr. White gets one shot to guess the civilian word.
                </p>
            </div>

            {isMrWhite ? (
                /* mr white's input */
                !submitted ? (
                    <>
                        <div className="card fu2" style={{ textAlign: "center" }}>
                            <p className="eyebrow" style={{ marginBottom: 8 }}>Your guess</p>
                            <p className="muted-text" style={{ fontSize: 13 }}>
                                What was the civilians' secret word?
                            </p>
                        </div>

                        <div className="fu3" style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
                            <input
                                placeholder="Type your guess..."
                                value={guess}
                                onChange={e => setGuess(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && submitGuess()}
                                autoFocus
                                style={{ textAlign: "center", fontSize: 18, letterSpacing: 1 }}
                            />
                            <button className="btn-gold" onClick={submitGuess} disabled={!guess.trim()}>
                                🎯 Submit guess
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="fu2" style={{ textAlign: "center" }}>
                        <span style={{ fontSize: 44 }}>⏳</span>
                        <p className="muted-text" style={{ marginTop: 8 }}>Guess submitted, revealing results...</p>
                    </div>
                )
            ) : (
                /* everyone else waits */
                <div className="fu2" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                    <div className="spinner" />
                    <p className="muted-text">Mr. White is making their guess...</p>

                    {/* host can skip */}
                    {isHost && (
                        <button className="btn-secondary" style={{ marginTop: 8 }} onClick={skipGuess}>
                            Skip (wrong guess)
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}