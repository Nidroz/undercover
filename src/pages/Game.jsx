import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import {
    doc, collection, onSnapshot, updateDoc, addDoc, query, orderBy,
} from "firebase/firestore";

export default function Game() {
    const { code } = useParams();
    const navigate = useNavigate();
    const uid = sessionStorage.getItem("uid");

    const [room, setRoom] = useState(null);
    const [players, setPlayers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [myPlayer, setMyPlayer] = useState(null);

    // listen to room
    useEffect(() => {
        const unsub = onSnapshot(doc(db, "rooms", code), (snap) => {
            if (!snap.exists()) return;
            const data = snap.data();
            setRoom(data);
            if (data.status === "vote") navigate(`/vote/${code}`);
            if (data.status === "result") navigate(`/result/${code}`);
        });
        return () => unsub();
    }, [code, navigate]);

    // listen to players
    useEffect(() => {
        const unsub = onSnapshot(
            collection(db, "rooms", code, "players"),
            (snap) => {
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setPlayers(list);
                setMyPlayer(list.find(p => p.id === uid) ?? null);
            }
        );
        return () => unsub();
    }, [code, uid]);

    // listen to messages
    useEffect(() => {
        const unsub = onSnapshot(
            query(collection(db, "rooms", code, "messages"), orderBy("createdAt")),
            (snap) => {
                setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }
        );
        return () => unsub();
    }, [code]);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || !myPlayer?.isAlive) return;
        setInput("");
        await addDoc(collection(db, "rooms", code, "messages"), {
            uid,
            playerName: myPlayer.name,
            avatar: myPlayer.avatar,
            text,
            createdAt: new Date(),
        });
    };

    const goToVote = async () => {
        await updateDoc(doc(db, "rooms", code), { status: "vote" });
    };

    const isHost = room?.hostId === uid;
    const alivePlayers = players.filter(p => p.isAlive);

    return (
        <div className="page game-page">
            <div className="game-header">
                <h2>💬 Discussion</h2>
                <span className="round-badge">Round {room?.currentRound} / {room?.settings?.roundCount}</span>
            </div>

            {/* alive players */}
            <div className="players-bar">
                {players.map(p => (
                    <div key={p.id} className={`player-chip ${!p.isAlive ? "eliminated" : ""}`}>
                        <span>{p.avatar}</span>
                        <span>{p.name}</span>
                        {p.id === uid && <span className="you-badge">you</span>}
                    </div>
                ))}
            </div>

            {/* chat */}
            <div className="chat-box">
                {messages.map(m => (
                    <div key={m.id} className={`message ${m.uid === uid ? "mine" : ""}`}>
                        <span className="msg-avatar">{m.avatar}</span>
                        <div className="msg-content">
                            <span className="msg-author">{m.playerName}</span>
                            <span className="msg-text">{m.text}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* input */}
            <div className="chat-input">
                <input
                    placeholder={myPlayer?.isAlive ? "Donne un indice..." : "Vous êtes éliminé"}
                    value={input}
                    disabled={!myPlayer?.isAlive}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMessage()}
                />
                <button onClick={sendMessage} disabled={!myPlayer?.isAlive}>
                    Submit
                </button>
            </div>

            {/* host can trigger vote */}
            {isHost && (
                <button onClick={goToVote} className="vote-trigger">
                    🗳️ Pass to vote
                </button>
            )}
        </div>
    );
}