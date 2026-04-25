import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom, joinRoom } from "../lib/room";

export default function Home() {
    const navigate = useNavigate();const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [mode, setMode] = useState(null); // "create" | "join"
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) return setError("Enter your pseudo");
        setLoading(true);
        try {
            const room = await createRoom(name);
            // store uid in sessionStorage so we know who we are
            sessionStorage.setItem("uid", room.uid);
            navigate(`/lobby/${room.code}`);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        } finally {
            setLoading(false);
        }
    }

    const handleJoin = async () => {
        if (!name.trim()) return setError("Enter your pseudo");
        if (!code.trim()) return setError("Enter the room code");
        setLoading(true);
        try {
            const room = await joinRoom(code, name.trim());
            sessionStorage.setItem("uid", room.uid);
            navigate(`/lobby/${room.code}`);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="page">
            <h1>🕵️ UNDERCOVER GAME</h1>
            <p className="subtitle">Game of words and lies</p>

            {!mode && (
                <div className="btn-group">
                    <button onClick={() => setMode("create")}>Create a party</button>
                    <button onClick={() => setMode("join")} className="secondary">Join</button>
                </div>
            )}

            {mode && (
                <div className="form">
                    <input
                        placeholder="Your pseudo"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        maxLength={16}
                    />
                    {mode === "join" && (
                        <input
                            placeholder="Room Code"
                            value={code}
                            onChange={e => setCode(e.target.value.toUpperCase())}
                            maxLength={6}
                        />
                    )}
                    {error && <p className="error">{error}</p>}
                    <button onClick={mode === "create" ? handleCreate : handleJoin} disabled={loading}>
                        {loading ? "..." : mode === "create" ? "Create" : "Join"}
                    </button>
                    <button className="secondary" onClick={() => {
                        setMode(null);
                        setError("");
                    }}>
                        Retour
                    </button>
                </div>
            )}
        </div>
    );
}
