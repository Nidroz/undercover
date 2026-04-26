import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom, joinRoom } from "../lib/room";

const AVATARS = ["🦊","🐼","🐸","🦁","🐯","🐺","🦝","🐻","🐨","🦄","🐙","🦋","🐵","🐧","🦆","🐮","🐷","🐹","🐭","🦈"];

export default function Home() {
    const navigate = useNavigate();
    const [mode, setMode] = useState(null);
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [avatar, setAvatar] = useState("🦊");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const joinCode = params.get("join");
        if (joinCode) { setCode(joinCode.toUpperCase()); setMode("join"); }
    }, []);

    const handle = async () => {
        if (!name.trim()) return setError("Enter your username");
        if (mode === "join" && !code.trim()) return setError("Enter the room code");
        setLoading(true);
        setError("");
        try {
            if (mode === "create") {
                const room = await createRoom(name.trim(), avatar);
                sessionStorage.setItem("uid", room.uid);
                navigate(`/lobby/${room.code}`);
            } else {
                const room = await joinRoom(code, name.trim(), avatar);
                sessionStorage.setItem("uid", room.uid);
                navigate(`/lobby/${room.code}`);
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            {/* logo */}
            <div className="fu" style={{ textAlign: "center" }}>
                <h1>UNDER<span className="accent">COVER</span></h1>
                <p className="eyebrow" style={{ marginTop: 10 }}>The game of words and lies</p>
            </div>

            {/* home buttons */}
            {!mode && (
                <div className="stack fu1">
                    <button className="btn-primary" onClick={() => setMode("create")}>Create a game</button>
                    <button className="btn-secondary" onClick={() => setMode("join")}>Join a game</button>
                </div>
            )}

            {/* form */}
            {mode && (
                <div className="stack">
                    <div className="fu1">
                        <input
                            placeholder="Your username"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            maxLength={16}
                            onKeyDown={e => e.key === "Enter" && handle()}
                            autoFocus
                        />
                    </div>

                    {mode === "join" && (
                        <div className="fu2">
                            <input
                                placeholder="Room code"
                                value={code}
                                onChange={e => setCode(e.target.value.toUpperCase())}
                                maxLength={6}
                                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 6, textAlign: "center" }}
                            />
                        </div>
                    )}

                    {/* avatar picker */}
                    <div className="card fu3">
                        <p className="eyebrow" style={{ marginBottom: 12 }}>Choose your avatar</p>
                        <div className="avatar-grid">
                            {AVATARS.map(a => (
                                <button
                                    key={a}
                                    className={`avatar-btn ${avatar === a ? "active" : ""}`}
                                    onClick={() => setAvatar(a)}
                                >
                                    {a}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && <p className="err fu">{error}</p>}

                    <div className="stack fu4">
                        <button className="btn-primary" onClick={handle} disabled={loading}>
                            {loading ? "..." : mode === "create" ? "Create game" : "Join"}
                        </button>
                        <button className="btn-ghost" onClick={() => { setMode(null); setError(""); }}>
                            ← Back
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}