import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
    doc, collection, onSnapshot, updateDoc,
} from "firebase/firestore";
import {db} from "../lib/firebase.js";

export default function Lobby() {
    const { code } = useParams();
    const navigate = useNavigate();
    const uid = sessionStorage.getItem("uid");

    const [players, setPlayers] = useState([]);
    const [room, setRoom] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const roomRef = doc(db, "rooms", code);
        const unsubRoom = onSnapshot(roomRef, snap => {
            if (!snap.exists()) return;
            const data = snap.data();
            setRoom(data);
            // redirect when host starts
            if (data.status === "settings") navigate(`/settings/${code}`);
        });

        const playersRef = collection(db, "rooms", code, "players");
        const unsubPlayers = onSnapshot(playersRef, snap => {
            setPlayers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => { unsubRoom(); unsubPlayers(); };
    }, [code, navigate]);

    const isHost = room?.hostId === uid;
    const link = `${window.location.origin}/join/${code}`;
    const copyLink = async () => {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const startGame = async () => {
        if (players.length < 3) return alert("At least 3 players are required to start the game");
        const roomRef = doc(db, "rooms", code);
        await updateDoc(doc(db, "rooms", code), { status: "settings" });
    }

    return (
        <div className="page">
            <h2>Waiting Room</h2>

            <div className="room-code">
                <span>Code : <strong>{code}</strong></span>
                <button onClick={copyLink} className="small">
                    {copied ? "Copied" : "Copy link"}
                </button>
            </div>

            <div className="players-list">
                {players.map(p => (
                    <div key={p.id} className="player-card">
                        <span className="avatar">{p.avatar}</span>
                        <span>{p.name}</span>
                        {p.isHost && <span className="badge">Host</span>}
                    </div>
                ))}
            </div>

            {isHost ? (
                <button onClick={startGame} disabled={players.length < 3}>
                    Start the game ({players.length} players)
                </button>
            ) : (
                <p className="waiting">Waiting host...</p>
            )}
        </div>
    );
}