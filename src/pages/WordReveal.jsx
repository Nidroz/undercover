import {useNavigate, useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {collection, doc, getDoc, onSnapshot, updateDoc} from "firebase/firestore";
import {db} from "../lib/firebase.js";

export default function WordReveal() {
    const { code } = useParams();
    const navigate = useNavigate();
    const uid = sessionStorage.getItem("uid");

    const [player, setPlayer] = useState(null);
    const [revealed, setRevealed] = useState(false);
    const [players, setPlayers] = useState([]);
    const [room, setRoom] = useState(null);

    // fetch current player info
    useEffect(() => {
        const fetchPlayer = async () => {
            const snap = await getDoc(doc(db, "rooms", code, "players", uid));
            if (snap.exists()) setPlayer(snap.data());
        };
        fetchPlayer();
    }, [code, uid]);

    // listen to room status → redirect when game starts
    useEffect(() => {
        const unsub = onSnapshot(doc(db, "rooms", code), (snap) => {
            if (!snap.exists()) return;
            const data = snap.data();
            setRoom(data);
            if (data.status === "game") navigate(`/game/${code}`);
        });
        return () => unsub();
    }, [code, navigate]);

    // listen to players to show ready count
    useEffect(() => {
        const unsub = onSnapshot(
            collection(db, "rooms", code, "players"),
            (snap) => {
                setPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }
        );
        return () => unsub();
    }, [code]);

    useEffect(() => {
        import("firebase/firestore").then(({ collection, onSnapshot: onSnap }) => {
            const unsub = onSnap(
                require === undefined ? null : { type: "collection" },
                () => {}
            )
        });
    }, []);

    const handleReady = async () => {
        await updateDoc(doc(db, "rooms", code, "players", uid), { ready: true });
        setRevealed(true);
        const done = players.every(p => p.id === uid ? true : p.ready);
        if (done) {
            await updateDoc(doc(db, "rooms", code), { status: "game" });
        }
    }

    const readyCount = players.filter(p => p.ready).length;
    const totalCount = players.length;
    const isHost = room?.hostId === uid;

    const ROLE_LABELS = {
        civilian: { label: "Civil", color: "#2179c1" },
        impostor: { label: "Impostor", color: "#f87171" },
        mrWhite: { label: "Mr. White", color: "#a78bfa" },
    };

    const roleInfo = player ? ROLE_LABELS[player.role] : null;

    return (
        <div className="page">
            <h2>Your secret word</h2>

            {!player ? (
                <p>Loading...</p>
            ) : !revealed ? (
                <div className="reveal-container">
                    <p className="reveal-hint">Be sure to be the only one watching your screen</p>
                    <div className="word-card hidden">
                        <span>Press to reveal</span>
                    </div>
                    <button onClick={() => setRevealed(true)} className="reveal-btn">
                        Reveal my word
                    </button>
                </div>
            ) : (
                <div className="reveal-container">
                    <div className="word-card" style={{borderColor: roleInfo?.color}}>
                        {player.role === "mrWhite" ? (
                            <span className="word-text">???</span>
                        ) : (
                            <span className="word-text">{player.word}</span>
                        )}
                        <span className="role-label" style={{color: roleInfo?.color}}>
                          {roleInfo?.label}
                        </span>
                    </div>

                    <div className="ready-status">
                        <p>{readyCount} / {totalCount} players ready</p>
                        <div className="players-ready">
                            {players.map(p => (
                                <span key={p.id} className={`player-dot ${p.ready ? "ready" : ""}`}>
                                  {p.avatar}
                                </span>
                            ))}
                        </div>
                    </div>

                    {!players.find(p => p.id === uid)?.ready && (
                        <button onClick={handleReady}>
                            I memorized my word, I'm ready !
                        </button>
                    )}

                    {isHost && readyCount === totalCount && totalCount > 0 && (
                        <button onClick={() => updateDoc(doc(db, "rooms", code), {status: "game"})} className="primary">
                            All ready — Launch !
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}